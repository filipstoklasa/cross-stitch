import { Canvas } from "@/features/canvas/canvas";
import { ControlsDrawer } from "@/features/controls-drawer/controls-drawer";
import { Scale } from "@/features/scale";
import { ThemeToggle } from "@/features/theme-toggle";
import { ViewportProvider } from "@/features/canvas/viewport";
import { useConfig } from "@/global-context/config/config";

const ActiveMarker = () => {
  const {
    config: { marker },
  } = useConfig();
  return (
    <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-card px-2 shadow-sm">
      <span
        className="flex h-5 w-5 items-center justify-center rounded border border-border text-[11px] font-semibold"
        style={{ backgroundColor: marker.color, color: "#fff" }}
      >
        {marker.symbol}
      </span>
      <span className="tnum text-xs text-muted-foreground">{marker.color}</span>
    </div>
  );
};

const App = () => (
  <ViewportProvider>
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-background">
      <Canvas />
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-lg border border-border bg-card/80 p-1.5 shadow-sm backdrop-blur">
        <ControlsDrawer />
        <Scale />
        <ActiveMarker />
        <ThemeToggle />
      </div>
    </main>
  </ViewportProvider>
);

export default App;
