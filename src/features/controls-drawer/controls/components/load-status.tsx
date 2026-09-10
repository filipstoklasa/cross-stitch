import {
  type Config,
  useSaveLocalConfig,
  validateConfig,
} from "@/hooks/use-save-config";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CANVAS_STATE } from "@/features/canvas/canvas.constants";
import { FileButton } from "@/components/file-button";
import { getBase64 } from "../utils/get-base64";
import { getText } from "@/features/controls-drawer/controls/utils/get-text";
import { toast } from "sonner";
import { useConfig } from "@/global-context/config/config";
import { useDrawer } from "@/components/drawer/drawer.context";

export const LoadStatusControls = () => {
  const { onClose } = useDrawer();
  const { setConfig } = useConfig();
  const { getLocalConfig, setLocalConfig } = useSaveLocalConfig();
  const [isConfigAvailable, setIsConfigAvailable] = useState(false);

  const loadConfig = useCallback(
    (inputConfig: Config | undefined) => {
      try {
        if (!validateConfig.isValidSync(inputConfig)) {
          throw new Error("Saved schema has error");
        }

        const { initialState, ...config } = inputConfig || {};

        CANVAS_STATE.clear();

        if (initialState) {
          for (const coords in initialState) {
            CANVAS_STATE.set(coords, initialState[coords]);
          }
        }

        setConfig(config);
        onClose();
      } catch {
        toast.error("Failed loading configuration from browser storage.");
        setLocalConfig(undefined);
      }
    },
    [setConfig, setLocalConfig, onClose],
  );

  const loadFileConfig = (file: File) => {
    getText(file, (value) => {
      const { marker, initialState, width, height, squareSize } = JSON.parse(
        value as string,
      ) as Config;
      loadConfig({ marker, initialState, width, height, squareSize });
    });
  };

  const onInputChange = (file: File) => {
    getBase64(file, (source) => {
      if (source) setConfig({ pattern: source.toString() });
    });
    onClose();
  };

  useEffect(() => {
    setIsConfigAvailable(!!getLocalConfig());
  }, [getLocalConfig]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">Input</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!isConfigAvailable}
          onClick={() => loadConfig(getLocalConfig())}
        >
          Browser config
        </Button>
        <FileButton accept=".json" testId="file-config" onChange={loadFileConfig}>
          File config
        </FileButton>
        <FileButton
          testId="background-pattern"
          accept=".png,.jpg,.webp"
          onChange={onInputChange}
        >
          Background pattern
        </FileButton>
      </div>
    </div>
  );
};
