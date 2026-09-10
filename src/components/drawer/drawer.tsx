import {
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useState,
} from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DrawerContext } from "./drawer.context";
import { MenuIcon } from "@/components/icons";
import { Separator } from "@/components/ui/separator";

interface DrawerProps {
  header?: ReactNode;
  footer?: ReactNode;
}

export const Drawer = ({
  children,
  header,
  footer,
}: PropsWithChildren<DrawerProps>) => {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  return (
    <DrawerContext.Provider value={{ open, setOpen, onClose }}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            data-testid="menu-button"
            aria-label="menu"
          >
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent aria-describedby={undefined}>
          {header && (
            <SheetHeader>
              <SheetTitle>{header}</SheetTitle>
            </SheetHeader>
          )}
          {header && <Separator />}
          <div className="flex-1">{children}</div>
          {footer && (
            <SheetFooter>
              <Separator />
              {footer}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </DrawerContext.Provider>
  );
};
