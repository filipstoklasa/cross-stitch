import { afterEach, expect, test, vi } from "vitest";
import { cellIdAt, invertColor, paintCell, renderGrid } from "../renderer";
import { CANVAS_STATE } from "../canvas.constants";

type Calls = Record<string, unknown[][]>;

const makeCtx = () => {
  const calls: Calls = {};
  const proxy = new Proxy(
    {},
    {
      get:
        (_t, prop: string) =>
        (...args: unknown[]) => {
          (calls[prop] ||= []).push(args);
        },
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx: proxy, calls };
};

const baseArgs = () => ({
  ...makeCtx(),
  cssW: 400,
  cssH: 300,
  dpr: 2,
  config: { width: 4000, height: 4000, squareSize: 20 },
  viewport: { zoom: 1, panX: 0, panY: 0 },
  theme: {
    canvasBg: "#fff",
    gridLine: "#ccc",
    gridLineMajor: "#999",
    rulerText: "#666",
    rulerBg: "#fff",
  },
  cells: new Map(),
});

afterEach(() => {
  CANVAS_STATE.clear();
  vi.restoreAllMocks();
});

test("renderGrid resets the transform every frame with dpr scaling", () => {
  const args = baseArgs();
  renderGrid(args);
  expect(args.calls.setTransform[0]).toEqual([2, 0, 0, 2, 0, 0]);
});

test("renderGrid only paints cells inside the viewport", () => {
  const args = baseArgs();
  // one cell on screen, one far outside the 400x300 viewport
  args.cells.set("0-0", { color: "#ff0000", symbol: "A" });
  args.cells.set("3980-3980", { color: "#00ff00", symbol: "B" });
  renderGrid(args);
  const fills = args.calls.fillRect as number[][];
  // the on-screen cell is painted at the RULER offset...
  expect(fills.some((f) => f[0] === 24 && f[2] === 20 && f[3] === 20)).toBe(true);
  // ...the off-screen cell (world ~3980) is culled, never drawn
  expect(fills.some((f) => f[0] > 1000)).toBe(false);
});

test("cellIdAt maps screen point to grid id and rejects outside points", () => {
  vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue(
    { left: 0, top: 0 } as DOMRect,
  );
  document.body.innerHTML = '<canvas id="scene"></canvas>';
  const cfg = { width: 200, height: 200, squareSize: 20 };
  const vp = { zoom: 1, panX: 0, panY: 0 };
  // point at screen (24+50, 24+50) -> world (50,50) -> col/row 2 -> "40-40"
  expect(cellIdAt(74, 74, cfg, vp)).toBe("40-40");
  expect(cellIdAt(0, 0, cfg, vp)).toBeNull();
});

test("paintCell: paint, drag-repaint, click-to-erase", () => {
  const red = { color: "#ff0000", symbol: "A" };
  expect(paintCell("0-0", red, false)).toBe(true); // first paint
  expect(paintCell("0-0", red, true)).toBe(false); // drag over same -> no-op
  expect(paintCell("0-0", red, false)).toBe(true); // click again -> erase
  expect(CANVAS_STATE.has("0-0")).toBe(false);
});

test("invertColor", () => {
  expect(invertColor("#000000")).toBe("#ffffff");
  expect(invertColor("#fff")).toBe("#000000");
});
