import {
  type PropsWithChildren,
  createContext,
  useContext,
  useState,
} from "react";

export interface ZoomApi {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

const noop = () => {};
const DEFAULT: ZoomApi = { zoom: 1, zoomIn: noop, zoomOut: noop, reset: noop };

const ViewportContext = createContext<{
  api: ZoomApi;
  publish: (api: ZoomApi) => void;
}>({ api: DEFAULT, publish: noop });

export const ViewportProvider = ({ children }: PropsWithChildren) => {
  const [api, publish] = useState<ZoomApi>(DEFAULT);
  return (
    <ViewportContext.Provider value={{ api, publish }}>
      {children}
    </ViewportContext.Provider>
  );
};

/** Toolbar reads the live zoom + controls. */
export const useZoom = () => useContext(ViewportContext).api;
/** Canvas publishes its viewport controls. */
export const usePublishZoom = () => useContext(ViewportContext).publish;
