import { createContext, useContext } from "react";

interface DrawerState {
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: () => void;
}

export const DrawerContext = createContext<DrawerState>({
  open: false,
  setOpen: () => {},
  onClose: () => {},
});

export const useDrawer = () => useContext(DrawerContext);
