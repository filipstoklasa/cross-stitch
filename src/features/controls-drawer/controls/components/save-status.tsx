import { Button } from "@/components/ui/button";
import { CANVAS_STATE } from "@/features/canvas/canvas.constants";
import { printScene } from "@/features/controls-drawer/controls/utils/print-scene";
import { renderFullImage } from "@/features/canvas/renderer";
import { saveFile } from "@/features/controls-drawer/controls/utils/save-file";
import { toast } from "sonner";
import { useConfig } from "@/global-context/config/config";
import { useSaveLocalConfig } from "@/hooks/use-save-config";

export const SaveStatusControls = () => {
  const { config } = useConfig();
  const { setLocalConfig } = useSaveLocalConfig();

  const withState = () => ({
    ...config,
    initialState: Object.fromEntries(CANVAS_STATE),
  });

  const saveStatus = () => {
    setLocalConfig(withState());
    toast.success("Status successfully saved to browser storage.");
  };

  const onSave = () => {
    const data =
      "data:application/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(withState()));
    saveFile(data, `config_${new Date().toISOString()}.json`);
  };

  const onPrint = () =>
    printScene(renderFullImage(config, CANVAS_STATE));

  const onPrintCanvas = () =>
    saveFile(renderFullImage(config, CANVAS_STATE, "image/png"), "canvas.png");

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">Output</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={saveStatus}>
          Save to browser
        </Button>
        <Button variant="outline" size="sm" onClick={onSave}>
          Save as file
        </Button>
        <Button variant="outline" size="sm" onClick={onPrint}>
          Print grid
        </Button>
        <Button variant="outline" size="sm" onClick={onPrintCanvas}>
          Print canvas
        </Button>
      </div>
    </div>
  );
};
