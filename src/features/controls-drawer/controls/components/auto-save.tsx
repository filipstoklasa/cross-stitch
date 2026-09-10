import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CANVAS_STATE } from "@/features/canvas/canvas.constants";
import { InfoIcon } from "@/components/icons";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useConfig } from "@/global-context/config/config";
import { useSaveLocalConfig } from "@/hooks/use-save-config";

export const AutoSaveControls = () => {
  const { setLocalConfig } = useSaveLocalConfig();
  const {
    config: { autoSafeMode, marker, width, height, squareSize },
    setConfig,
  } = useConfig();

  const setAutoSaveMode = (checked: boolean) => {
    setConfig({ autoSafeMode: checked });
    setLocalConfig({
      marker,
      width,
      height,
      squareSize,
      initialState: Object.fromEntries(CANVAS_STATE),
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="auto-save"
        checked={!!autoSafeMode}
        onCheckedChange={setAutoSaveMode}
      />
      <Label htmlFor="auto-save" className="text-foreground">
        Auto save mode
      </Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" aria-label="Auto save mode info">
            <InfoIcon className="text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" align="start">
          Every change is saved to browser storage and can be loaded later with
          the &quot;Browser config&quot; input.
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
