import { Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/select";
import type { ReactNode } from "react";

type SelectValue = string | number;

interface SelectItem {
  key: string | number;
  value: SelectValue;
}

export interface SelectProps {
  label: ReactNode;
  value: SelectValue;
  options: SelectItem[];
  onChange: (value: SelectValue) => void;
  testId?: string;
}

export const Select = ({
  label,
  value,
  options,
  onChange,
  testId,
}: SelectProps) => (
  <Field label={label}>
    {(id) => (
      <NativeSelect
        id={id}
        data-testid={testId}
        value={value}
        onChange={({ target }) => onChange(target.value)}
      >
        {options.map(({ key, value }) => (
          <option key={value} value={value}>
            {key}
          </option>
        ))}
      </NativeSelect>
    )}
  </Field>
);
