import { AutoSaveControls } from "./components/auto-save";
import { ColorsControls } from "./components/colors";
import { DimensionsControls } from "./components/dimensions";
import { LoadStatusControls } from "./components/load-status";
import { SaveStatusControls } from "./components/save-status";
import { Separator } from "@/components/ui/separator";

export const Controls = () => (
  <div className="flex flex-col gap-4">
    <DimensionsControls />
    <Separator />
    <ColorsControls />
    <LoadStatusControls />
    <Separator />
    <SaveStatusControls />
    <Separator />
    <AutoSaveControls />
  </div>
);
