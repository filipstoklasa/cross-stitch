import { CANVAS_STATE, ERASER } from "./canvas.constants";
import type { Marker } from "@/global-context/config/config.types";

const sameMarker = (a: Marker | undefined, b: Marker) =>
  !!a && a.color === b.color && a.symbol === b.symbol;

export const RULER = 24; // screen px reserved for the top/left rulers

export const getScene = () =>
  document.getElementById("scene") as HTMLCanvasElement;

export const getCoordsId = (x: number, y: number) => `${x}-${y}`;

const pad = (s: string) => s.padStart(2, "0");

export const invertColor = (hex: string): string => {
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (hex.length === 3) hex = hex.replace(/./g, "$&$&");
  if (hex.length !== 6) throw new Error("Invalid HEX color.");
  const inv = [0, 2, 4].map((i) =>
    pad((255 - parseInt(hex.slice(i, i + 2), 16)).toString(16)),
  );
  return "#" + inv.join("");
};

export interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
}

export interface GridConfig {
  width: number;
  height: number;
  squareSize: number;
}

export interface Theme {
  canvasBg: string;
  gridLine: string;
  gridLineMajor: string;
  rulerText: string;
  rulerBg: string;
}

export const readTheme = (): Theme => {
  const s = getComputedStyle(document.body);
  const v = (name: string, fallback: string) =>
    s.getPropertyValue(name).trim() || fallback;
  return {
    canvasBg: v("--canvas-bg", "#ffffff"),
    gridLine: v("--grid-line", "#d8d6ce"),
    gridLineMajor: v("--grid-line-major", "#9c9a90"),
    rulerText: v("--ruler-text", "#6b7280"),
    rulerBg: v("--card", "#ffffff"),
  };
};

const FONT_STACK = () =>
  getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";

/** grid px under a screen point, or null if outside the grid area. */
export const cellIdAt = (
  clientX: number,
  clientY: number,
  { width, height, squareSize }: GridConfig,
  { zoom, panX, panY }: Viewport,
) => {
  const { left, top } = getScene().getBoundingClientRect();
  const wx = (clientX - left - RULER - panX) / zoom;
  const wy = (clientY - top - RULER - panY) / zoom;
  if (wx < 0 || wy < 0 || wx >= width || wy >= height) return null;
  const col = Math.floor(wx / squareSize);
  const row = Math.floor(wy / squareSize);
  return getCoordsId(col * squareSize, row * squareSize);
};

/**
 * Apply a paint action to CANVAS_STATE. Mirrors the old fillRect toggle logic:
 * first touch paints, dragging over a new/different cell paints, a plain click
 * on an existing cell erases. Returns true if the state changed.
 */
export const paintCell = (
  id: string | null,
  marker: Marker,
  isDragging: boolean,
) => {
  if (!id) return false;
  if (!CANVAS_STATE.has(id)) {
    CANVAS_STATE.set(id, marker);
    return true;
  }
  if (isDragging) {
    if (sameMarker(CANVAS_STATE.get(id), marker)) return false;
    CANVAS_STATE.set(id, marker);
    return true;
  }
  CANVAS_STATE.delete(id);
  return true;
};

const drawSymbol = (
  ctx: CanvasRenderingContext2D,
  symbol: string,
  color: string,
  cx: number,
  cy: number,
  cellPx: number,
) => {
  ctx.font = `${Math.round(cellPx * 0.7)}px ${FONT_STACK()}`;
  ctx.fillStyle = invertColor(color);
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(symbol, cx, cy);
};

interface RenderOpts {
  ctx: CanvasRenderingContext2D;
  cssW: number;
  cssH: number;
  dpr: number;
  config: GridConfig;
  viewport: Viewport;
  theme: Theme;
  cells: Map<string, Marker>;
}

/** Full viewport render. Only visible cells are touched. */
export const renderGrid = ({
  ctx,
  cssW,
  cssH,
  dpr,
  config,
  viewport,
  theme,
  cells,
}: RenderOpts) => {
  const { width, height, squareSize: sq } = config;
  const { zoom, panX, panY } = viewport;
  const cellPx = sq * zoom;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // reset every frame; work in CSS px
  ctx.clearRect(0, 0, cssW, cssH);

  const sx = (wx: number) => RULER + wx * zoom + panX;
  const sy = (wy: number) => RULER + wy * zoom + panY;

  // visible cell range
  const cols = Math.floor(width / sq);
  const rows = Math.floor(height / sq);
  const colStart = Math.max(0, Math.floor((-RULER - panX) / cellPx));
  const colEnd = Math.min(cols, Math.ceil((cssW - RULER - panX) / cellPx));
  const rowStart = Math.max(0, Math.floor((-RULER - panY) / cellPx));
  const rowEnd = Math.min(rows, Math.ceil((cssH - RULER - panY) / cellPx));

  // Canvas stays transparent so a background pattern (set on the wrapper) can
  // show through where cells aren't painted. Clip drawing to the grid area.
  ctx.save();
  ctx.beginPath();
  ctx.rect(RULER, RULER, cssW - RULER, cssH - RULER);
  ctx.clip();

  ctx.imageSmoothingEnabled = false;

  // filled cells
  const showSymbols = cellPx >= 8;
  for (let c = colStart; c < colEnd; c++) {
    for (let r = rowStart; r < rowEnd; r++) {
      const marker = cells.get(getCoordsId(c * sq, r * sq));
      if (!marker?.color || marker.color === ERASER.color) continue;
      const x = Math.round(sx(c * sq));
      const y = Math.round(sy(r * sq));
      const w = Math.round(sx((c + 1) * sq)) - x;
      const h = Math.round(sy((r + 1) * sq)) - y;
      ctx.fillStyle = marker.color;
      ctx.fillRect(x, y, w, h);
      if (showSymbols && marker.symbol) {
        drawSymbol(ctx, marker.symbol, marker.color, x + w / 2, y + h / 2, cellPx);
      }
    }
  }

  // grid lines — batched, snapped to device pixels, minor + major passes
  if (cellPx >= 4) {
    const line = (pass: "minor" | "major") => {
      ctx.beginPath();
      for (let c = colStart; c <= colEnd; c++) {
        if ((pass === "major") !== (c % 10 === 0)) continue;
        const x = Math.round(sx(c * sq)) + 0.5;
        ctx.moveTo(x, Math.max(RULER, sy(0)));
        ctx.lineTo(x, Math.min(cssH, sy(height)));
      }
      for (let r = rowStart; r <= rowEnd; r++) {
        if ((pass === "major") !== (r % 10 === 0)) continue;
        const y = Math.round(sy(r * sq)) + 0.5;
        ctx.moveTo(Math.max(RULER, sx(0)), y);
        ctx.lineTo(Math.min(cssW, sx(width)), y);
      }
      ctx.strokeStyle = pass === "major" ? theme.gridLineMajor : theme.gridLine;
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    line("minor");
    line("major");
  }
  ctx.restore();

  // rulers
  drawRulers(ctx, { cssW, cssH, colStart, colEnd, rowStart, rowEnd, sq, sx, sy, cellPx, theme });
};

const drawRulers = (
  ctx: CanvasRenderingContext2D,
  o: {
    cssW: number;
    cssH: number;
    colStart: number;
    colEnd: number;
    rowStart: number;
    rowEnd: number;
    sq: number;
    sx: (n: number) => number;
    sy: (n: number) => number;
    cellPx: number;
    theme: Theme;
  },
) => {
  const { cssW, cssH, colStart, colEnd, rowStart, rowEnd, sq, sx, sy, cellPx, theme } = o;
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = theme.rulerBg;
  ctx.fillRect(0, 0, cssW, RULER);
  ctx.fillRect(0, 0, RULER, cssH);
  ctx.beginPath();
  ctx.strokeStyle = theme.gridLine;
  ctx.lineWidth = 1;
  ctx.moveTo(0, RULER + 0.5);
  ctx.lineTo(cssW, RULER + 0.5);
  ctx.moveTo(RULER + 0.5, 0);
  ctx.lineTo(RULER + 0.5, cssH);
  ctx.stroke();

  const step = cellPx >= 34 ? 1 : cellPx >= 14 ? 5 : 10;
  ctx.fillStyle = theme.rulerText;
  ctx.textBaseline = "middle";
  ctx.font = `11px ${FONT_STACK()}`;

  ctx.textAlign = "center";
  for (let c = colStart; c < colEnd; c++) {
    const n = c + 1;
    if (n % step !== 0 && n !== 1) continue;
    const cx = sx(c * sq) + cellPx / 2;
    if (cx < RULER || cx > cssW) continue;
    ctx.font = `${n % 10 === 0 ? "600 " : ""}11px ${FONT_STACK()}`;
    ctx.fillText(String(n), cx, RULER / 2);
  }
  for (let r = rowStart; r < rowEnd; r++) {
    const n = r + 1;
    if (n % step !== 0 && n !== 1) continue;
    const cy = sy(r * sq) + cellPx / 2;
    if (cy < RULER || cy > cssH) continue;
    ctx.font = `${n % 10 === 0 ? "600 " : ""}11px ${FONT_STACK()}`;
    ctx.fillText(String(n), RULER / 2, cy);
  }
};

/** Render the whole pattern at 1:1 (no rulers) to an offscreen canvas. */
export const renderFullImage = (
  config: GridConfig,
  cells: Map<string, Marker>,
  mime?: string,
) => {
  const { width, height, squareSize: sq } = config;
  const off = document.createElement("canvas");
  off.width = width;
  off.height = height;
  const ctx = off.getContext("2d")!;
  ctx.fillStyle = readTheme().canvasBg;
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;

  for (const [id, marker] of cells) {
    if (!marker?.color || marker.color === ERASER.color) continue;
    const [x, y] = id.split("-").map(Number);
    ctx.fillStyle = marker.color;
    ctx.fillRect(x, y, sq, sq);
    if (marker.symbol) drawSymbol(ctx, marker.symbol, marker.color, x + sq / 2, y + sq / 2, sq);
  }

  ctx.strokeStyle = readTheme().gridLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += sq) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }
  for (let y = 0; y <= height; y += sq) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }
  ctx.stroke();
  return off.toDataURL(mime);
};
