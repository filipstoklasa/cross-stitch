import { CopyIcon, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { CANVAS_STATE } from "@/features/canvas/canvas.constants";
import type { Marker } from "@/global-context/config/config.types";
import { toast } from "sonner";
import { useConfig } from "@/global-context/config/config";

const ColorRow = ({ marker }: { marker: Marker }) => {
  const { color, symbol } = marker;
  const { setConfig } = useConfig();

  const onCopy = async () => {
    await navigator.clipboard.writeText(color);
    toast.success(`Color ${color} copied to clipboard`);
  };

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-2">
        <span
          className="h-5 w-5 shrink-0 rounded-full border border-border"
          style={{ backgroundColor: color }}
        />
        <span className="tnum text-muted-foreground">{color}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-5 text-center font-medium">{symbol}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="select color"
          onClick={() => setConfig({ marker })}
        >
          <PlusIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="copy color"
          onClick={onCopy}
        >
          <CopyIcon />
        </Button>
      </div>
    </div>
  );
};

export const ColorsControls = () => {
  const markers = [
    ...new Map(
      Array.from(CANVAS_STATE.values(), (m) => [`${m.color}-${m.symbol}`, m]),
    ).values(),
  ];

  if (!markers.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">Used colors</p>
      {markers.map((marker) => (
        <ColorRow key={`${marker.color}-${marker.symbol}`} marker={marker} />
      ))}
    </div>
  );
};
