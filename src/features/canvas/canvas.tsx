import {
  RULER,
  cellIdAt,
  paintCell,
  readTheme,
  renderGrid,
} from "./renderer";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { CANVAS_STATE } from "./canvas.constants";
import { useConfig } from "@/global-context/config/config";
import { usePublishZoom } from "./viewport";
import { useSaveLocalConfig } from "@/hooks/use-save-config";
import { useTheme } from "next-themes";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 16;
const ZOOM_STEP = 1.25;
const PAN_MARGIN = 48;

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pan = useRef({ x: 0, y: 0 });
  const painting = useRef(false);
  const lastCell = useRef<string | null>(null);
  const panningPointer = useRef<number | null>(null);
  const lastPt = useRef({ x: 0, y: 0 });
  const spaceDown = useRef(false);
  const frame = useRef(0);
  const pendingCenter = useRef(true);

  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { resolvedTheme } = useTheme();
  const publishZoom = usePublishZoom();

  const { config } = useConfig();
  const { width, height, squareSize, autoSafeMode, marker, pattern } = config;
  const { setLocalConfig } = useSaveLocalConfig();

  const grid = { width, height, squareSize };
  const gridRef = useRef(grid);
  gridRef.current = grid;
  const markerRef = useRef(marker);
  markerRef.current = marker;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const cssW = wrap.clientWidth;
    const cssH = wrap.clientHeight;
    if (cssW === 0 || cssH === 0) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(cssW * dpr)) canvas.width = Math.round(cssW * dpr);
    if (canvas.height !== Math.round(cssH * dpr)) canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderGrid({
      ctx,
      cssW,
      cssH,
      dpr,
      config: gridRef.current,
      viewport: { zoom, panX: pan.current.x, panY: pan.current.y },
      theme: readTheme(),
      cells: CANVAS_STATE,
    });
  }, [zoom]);

  const requestDraw = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      draw();
    });
  }, [draw]);

  const clampPan = useCallback(
    (z: number) => {
      const gw = width * z;
      const gh = height * z;
      const viewW = size.w - RULER;
      const viewH = size.h - RULER;
      pan.current.x = clamp(pan.current.x, PAN_MARGIN - gw, viewW - PAN_MARGIN);
      pan.current.y = clamp(pan.current.y, PAN_MARGIN - gh, viewH - PAN_MARGIN);
    },
    [width, height, size],
  );

  const centerView = useCallback(
    (z: number) => {
      const viewW = size.w - RULER;
      const viewH = size.h - RULER;
      pan.current = {
        x: width * z < viewW ? (viewW - width * z) / 2 : 0,
        y: height * z < viewH ? (viewH - height * z) / 2 : 0,
      };
    },
    [width, height, size],
  );

  const zoomAt = useCallback(
    (nextZoom: number, clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const wx = (px - RULER - pan.current.x) / zoom;
      const wy = (py - RULER - pan.current.y) / zoom;
      pan.current.x = px - RULER - wx * z;
      pan.current.y = py - RULER - wy * z;
      clampPan(z);
      setZoom(z);
    },
    [zoom, clampPan],
  );

  const zoomAtCenter = useCallback(
    (factor: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      zoomAt(zoom * factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
    },
    [zoom, zoomAt],
  );

  // publish zoom controls to the toolbar
  useEffect(() => {
    publishZoom({
      zoom,
      zoomIn: () => zoomAtCenter(ZOOM_STEP),
      zoomOut: () => zoomAtCenter(1 / ZOOM_STEP),
      reset: () => {
        pendingCenter.current = true;
        centerView(1);
        setZoom(1);
        requestDraw();
      },
    });
  }, [zoom, zoomAtCenter, centerView, requestDraw, publishZoom]);

  // reset + centre the view when the grid dimensions change (and once the
  // container size is first known)
  useEffect(() => {
    pendingCenter.current = true;
    setZoom(1);
  }, [width, height, squareSize]);

  useEffect(() => {
    if (size.w === 0) return;
    if (pendingCenter.current) {
      pendingCenter.current = false;
      centerView(1);
    } else {
      clampPan(zoom);
    }
    requestDraw();
  }, [size, zoom, centerView, clampPan, requestDraw]);

  // redraw on any dependency change (config identity covers cell/pattern edits)
  useEffect(requestDraw, [requestDraw, config, resolvedTheme, size]);

  // observe container size
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: wrap.clientWidth, h: wrap.clientHeight });
    });
    ro.observe(wrap);
    setSize({ w: wrap.clientWidth, h: wrap.clientHeight });
    return () => ro.disconnect();
  }, []);

  // wheel zoom (non-passive so we can preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(zoom * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [zoom, zoomAt]);

  // spacebar = temporary pan mode
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceDown.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceDown.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const autosave = useCallback(() => {
    if (!autoSafeMode) return;
    setLocalConfig({
      marker: markerRef.current,
      width,
      height,
      squareSize,
      initialState: Object.fromEntries(CANVAS_STATE),
    });
  }, [autoSafeMode, width, height, squareSize, setLocalConfig]);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (panningPointer.current !== null) {
        pan.current.x += clientX - lastPt.current.x;
        pan.current.y += clientY - lastPt.current.y;
        lastPt.current = { x: clientX, y: clientY };
        clampPan(zoom);
        requestDraw();
        return;
      }
      if (!painting.current) return;
      const id = cellIdAt(clientX, clientY, gridRef.current, {
        zoom,
        panX: pan.current.x,
        panY: pan.current.y,
      });
      if (id && id !== lastCell.current) {
        lastCell.current = id;
        if (paintCell(id, markerRef.current, true)) {
          requestDraw();
          autosave();
        }
      }
    },
    [zoom, clampPan, requestDraw, autosave],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (e.button === 1 || spaceDown.current) {
      panningPointer.current = e.pointerId;
      lastPt.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (e.button !== 0) return;
    painting.current = true;
    const id = cellIdAt(e.clientX, e.clientY, gridRef.current, {
      zoom,
      panX: pan.current.x,
      panY: pan.current.y,
    });
    lastCell.current = id;
    if (paintCell(id, markerRef.current, false)) {
      requestDraw();
      autosave();
    }
  };

  const endInteraction = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    painting.current = false;
    panningPointer.current = null;
    lastCell.current = null;
  };

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full touch-none overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundColor: pattern ? undefined : "var(--canvas-bg)",
        backgroundImage: pattern ? `url(${pattern})` : undefined,
      }}
    >
      <canvas
        ref={canvasRef}
        id="scene"
        data-testid="scene"
        className="absolute inset-0 h-full w-full cursor-crosshair"
        onPointerDown={onPointerDown}
        onPointerMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
      />
    </div>
  );
};
