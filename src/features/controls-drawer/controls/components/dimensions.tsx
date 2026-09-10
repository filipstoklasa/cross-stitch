import type { Dimensions, Marker } from "@/global-context/config/config.types";
import { ColorButton } from "@/components/color-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SQUARE_SIZES } from "../controls.constants";
import { Select } from "@/components/select";
import { getDimensions } from "@/features/controls-drawer/controls/utils/get-dimensions";
import { useConfig } from "@/global-context/config/config";

export const DimensionsControls = () => {
  const {
    config: { squareSize, width, height, marker },
    setConfig,
  } = useConfig();

  const setDimensions =
    (prop: keyof Dimensions) => (value: string | number) => {
      setConfig({ [prop]: Number(value), scale: 1 });
    };

  const setMarker = (prop: keyof Marker) => (value: string) => {
    setConfig({ marker: { ...marker, [prop]: value } });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Width"
          testId="scene-width-input"
          value={width}
          options={getDimensions(squareSize)}
          onChange={setDimensions("width")}
        />
        <Select
          label="Height"
          testId="scene-height-input"
          value={height}
          options={getDimensions(squareSize)}
          onChange={setDimensions("height")}
        />
      </div>
      <div className="flex items-end gap-3">
        <Select
          label="Square size"
          testId="square-size-input"
          value={squareSize}
          options={SQUARE_SIZES}
          onChange={setDimensions("squareSize")}
        />
        <Field label="Marker" className="w-16 shrink-0">
          {(id) => (
            <Input
              id={id}
              className="tnum text-center"
              maxLength={1}
              value={marker.symbol}
              onChange={({ target: { value } }) => setMarker("symbol")(value)}
            />
          )}
        </Field>
        <ColorButton color={marker.color} onChange={setMarker("color")} />
      </div>
    </div>
  );
};
