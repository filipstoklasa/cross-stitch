type CanvasState = Map<string, Marker>;

export interface Marker {
  color: string;
  symbol: string;
}

export interface Dimensions {
  width: number;
  height: number;
  squareSize: number;
  marker: Marker;
  scale: number;
}

export interface DefaultConfig extends Dimensions {
  initialState?: CanvasState;
  pattern?: string;
  autoSafeMode?: boolean;
}

export interface ConfigContextState {
  config: DefaultConfig;
  setConfig: (config: Partial<DefaultConfig>) => void;
}
