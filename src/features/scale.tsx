import { MinusIcon, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useZoom } from "@/features/canvas/viewport";

export const Scale = () => {
  const { zoom, zoomIn, zoomOut } = useZoom();

  return (
    <div className="flex items-center rounded-md border border-input bg-card shadow-sm">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="scale-down"
        data-testid="scale-down"
        onClick={zoomOut}
      >
        <MinusIcon />
      </Button>
      <span
        data-testid="scale-value"
        className="tnum w-14 select-none text-center text-xs text-muted-foreground"
      >
        {Math.round(zoom * 100)}%
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="scale-up"
        data-testid="scale-up"
        onClick={zoomIn}
      >
        <PlusIcon />
      </Button>
    </div>
  );
};
