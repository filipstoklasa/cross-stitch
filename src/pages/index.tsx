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
    <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-card px-2">
      <span
        className="flex h-5 w-5 items-center justify-center rounded border border-border text-[11px] font-semibold text-white"
        style={{ backgroundColor: marker.color }}
      >
        {marker.symbol}
      </span>
      <span className="tnum hidden text-xs text-muted-foreground sm:inline">
        {marker.color}
      </span>
    </div>
  );
};

const App = () => (
  <ViewportProvider>
    <main className="flex h-[100dvh] flex-col bg-background">
      <header className="z-10 flex shrink-0 items-center gap-2 border-b border-border bg-card px-3 py-2">
        <ControlsDrawer />
        <Scale />
        <ActiveMarker />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>
      <div className="relative flex-1 overflow-hidden">
        <Canvas />
      </div>
    </main>
  </ViewportProvider>
);

export default App;
