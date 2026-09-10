import { type ChangeEvent, useRef } from "react";
import { cn } from "@/lib/utils";

interface ColorButtonProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

// Swatch that opens the native colour picker.
export const ColorButton = ({ color, onChange, className }: ColorButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      aria-label="Marker colour"
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-input shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      <input
        ref={inputRef}
        value={color}
        type="color"
        onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
          onChange(value)
        }
      />
    </button>
  );
};
