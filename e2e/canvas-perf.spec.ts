import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { expect, test } from "@playwright/test";

/**
 * Canvas rendering performance baseline / eval.
 *
 * Measures user-observable canvas cost so it survives the renderer refactor
 * (still a 2D context, still drives paint/redraw):
 *   - fullRedrawMs   time spent in 2D-context calls for one full scene redraw
 *   - paintAllCellsMs wall time to drag-paint every cell of the grid
 *
 * Baseline lives in e2e/canvas-perf.baseline.json. Regenerate with:
 *   PERF_BASELINE=update yarn e2e canvas-perf
 * Otherwise each timing must stay within TOLERANCE x baseline.
 */

// Use the Chrome already installed on the machine — no bundled-browser download.
test.use({ channel: "chrome" });

const BASELINE_PATH = join(__dirname, "canvas-perf.baseline.json");
const LATEST_PATH = join(__dirname, "../test-results/canvas-perf.latest.json");
const TOLERANCE = 1.5;
const UPDATE = process.env.PERF_BASELINE === "update";

const CONFIGS = [
  { name: "default_500_sq20", square: "20", w: "500", h: "500" },
  { name: "medium_1000_sq20", square: "20", w: "1000", h: "1000" },
  { name: "large_1500_sq10", square: "10", w: "1500", h: "1500" },
];

// Injected before the app loads: wraps the 2D context so every draw call is
// timestamped, and exposes a synchronous serpentine drag-paint over the grid.
const INSTRUMENT = () => {
  const wrapped = new WeakMap<object, unknown>();
  let marks: number[] = [];
  let recording = false;
  const orig = HTMLCanvasElement.prototype.getContext as (
    ...a: unknown[]
  ) => unknown;
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    ...args: unknown[]
  ) {
    const ctx = orig.apply(this, args) as object | null;
    if (args[0] !== "2d" || !ctx) return ctx;
    if (wrapped.has(ctx)) return wrapped.get(ctx);
    const proxy = new Proxy(ctx, {
      get(target, prop, recv) {
        const val = Reflect.get(target, prop, recv);
        if (typeof val !== "function") return val;
        return (...cargs: unknown[]) => {
          const r = (val as (...a: unknown[]) => unknown).apply(target, cargs);
          if (recording) marks.push(performance.now());
          return r;
        };
      },
      set(target, prop, value) {
        Reflect.set(target, prop, value);
        return true;
      },
    });
    wrapped.set(ctx, proxy);
    return proxy;
  } as typeof HTMLCanvasElement.prototype.getContext;

  const summary = () => {
    if (marks.length < 2) return { ops: marks.length, spanMs: 0 };
    return {
      ops: marks.length,
      spanMs: +(marks[marks.length - 1] - marks[0]).toFixed(2),
    };
  };

  (window as unknown as { __perf: unknown }).__perf = {
    start() {
      marks = [];
      recording = true;
    },
    stop() {
      recording = false;
      return summary();
    },
    // Drag-paint every on-screen cell once, synchronously, no test-runner IPC.
    // Sweeps the canvas's on-screen box in `squareSize`-px steps (≈ one grid
    // cell per step at 100% zoom) — implementation-agnostic.
    paintAllCells(squareSize: number) {
      const cv = document.getElementById("scene") as HTMLCanvasElement;
      const r = cv.getBoundingClientRect();
      const cols = Math.max(1, Math.floor(r.width / squareSize));
      const rows = Math.max(1, Math.floor(r.height / squareSize));
      const fire = (type: string, x: number, y: number) =>
        cv.dispatchEvent(
          new (type === "mousemove" ? MouseEvent : PointerEvent)(type, {
            clientX: x,
            clientY: y,
            bubbles: true,
          }),
        );
      fire("pointerdown", r.left + squareSize / 2, r.top + squareSize / 2);
      marks = [];
      recording = true;
      const t0 = performance.now();
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          fire(
            "mousemove",
            r.left + col * squareSize + squareSize / 2,
            r.top + row * squareSize + squareSize / 2,
          );
        }
      }
      const wallMs = +(performance.now() - t0).toFixed(2);
      recording = false;
      fire("pointerup", r.left, r.top);
      return { cells: cols * rows, wallMs, ...summary() };
    },
  };
};

type Metrics = Record<
  string,
  {
    cells: number;
    fullRedrawMs: number;
    fullRedrawOps: number;
    paintAllCellsMs: number;
    paintPerCellUs: number;
  }
>;

test("canvas render performance", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(INSTRUMENT);

  const results: Metrics = {};
  let env: Record<string, unknown> = {};

  for (const c of CONFIGS) {
    await page.goto("http://localhost:3000/");
    await page.getByTestId("menu-button").click();
    await page.getByTestId("square-size-input").selectOption(c.square);
    await page.getByTestId("scene-width-input").selectOption(c.w);
    await page.getByTestId("scene-height-input").selectOption(c.h);
    await page.keyboard.press("Escape");
    await page.getByText("Canvas configuration").waitFor({ state: "hidden" });

    const paint = await page.evaluate(
      (sq) =>
        (
          window as unknown as {
            __perf: { paintAllCells(s: number): Record<string, number> };
          }
        ).__perf.paintAllCells(sq),
      Number(c.square),
    );

    await page.evaluate(() =>
      (window as unknown as { __perf: { start(): void } }).__perf.start(),
    );
    await page.getByTestId("scale-up").click();
    await page.waitForTimeout(400);
    const redraw = await page.evaluate(() =>
      (
        window as unknown as {
          __perf: { stop(): { ops: number; spanMs: number } };
        }
      ).__perf.stop(),
    );

    results[c.name] = {
      cells: paint.cells,
      fullRedrawMs: redraw.spanMs,
      fullRedrawOps: redraw.ops,
      paintAllCellsMs: paint.wallMs,
      paintPerCellUs: +((paint.wallMs / paint.cells) * 1000).toFixed(1),
    };

    if (!env.dpr) {
      env = await page.evaluate(() => ({
        dpr: window.devicePixelRatio,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        ua: navigator.userAgent,
      }));
    }
  }

  const run = { env, results, at: new Date().toISOString() };
  mkdirSync(dirname(LATEST_PATH), { recursive: true });
  writeFileSync(LATEST_PATH, JSON.stringify(run, null, 2));
  // eslint-disable-next-line no-console
  console.table(results);

  if (UPDATE || !existsSync(BASELINE_PATH)) {
    writeFileSync(BASELINE_PATH, JSON.stringify(run, null, 2));
    test.info().annotations.push({
      type: "perf-baseline",
      description: `written ${BASELINE_PATH}`,
    });
    return;
  }

  const base = JSON.parse(readFileSync(BASELINE_PATH, "utf8")).results as Metrics;
  for (const name of Object.keys(results)) {
    for (const metric of ["fullRedrawMs", "paintAllCellsMs", "paintPerCellUs"] as const) {
      const now = results[name][metric];
      const ceil = base[name][metric] * TOLERANCE;
      expect
        .soft(now, `${name}.${metric}: ${now} vs baseline ${base[name][metric]} (x${TOLERANCE} = ${ceil.toFixed(1)})`)
        .toBeLessThanOrEqual(ceil);
    }
  }
});
