import { type ChangeEvent, type PropsWithChildren, useRef } from "react";
import { Button } from "@/components/ui/button";

interface FileButtonProps {
  onChange: (file: File) => void;
  accept?: string;
  testId?: string;
}

export const FileButton = ({
  children,
  accept,
  testId,
  onChange,
}: PropsWithChildren<FileButtonProps>) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        {children}
      </Button>
      <input
        data-testid={testId || "file-input"}
        ref={inputRef}
        hidden
        type="file"
        accept={accept}
        onChange={({ target: { files } }: ChangeEvent<HTMLInputElement>) => {
          if (files?.[0]) onChange(files[0]);
        }}
      />
    </>
  );
};
