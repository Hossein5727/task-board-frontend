"use client";

import { Description, Field, Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { controlClass } from "../atoms/control-styles";
import { cn } from "@/lib/utils/cn";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SelectOption<T>>;
  error?: string;
  disabled?: boolean;
  hint?: string;
  className?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  error,
  disabled,
  hint,
  className,
}: SelectFieldProps<T>) {
  const selected = options.find((option) => option.value === value);

  return (
    <Field disabled={disabled} className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-sm font-medium text-ink">{label}</Label>
      <Listbox value={value} onChange={onChange} invalid={Boolean(error)}>
        <ListboxButton className={cn(controlClass, "flex items-center justify-between gap-2 text-start")}>
          <span className="flex min-w-0 items-center gap-2">
            {selected?.icon}
            <span className="truncate">{selected?.label ?? "انتخاب کنید"}</span>
          </span>
          <ChevronUpDownIcon className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
        </ListboxButton>
        <ListboxOptions
          anchor="bottom start"
          transition
          className="z-50 max-h-64 w-(--button-width) min-w-44 overflow-y-auto rounded-lg bg-surface p-1 shadow-lg ring-1 ring-line [--anchor-gap:4px] focus:outline-none transition duration-100 ease-out data-closed:opacity-0"
        >
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className="group flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink data-focus:bg-brand-50 data-selected:font-semibold"
            >
              <CheckIcon className="invisible size-4 shrink-0 text-brand-700 group-data-selected:visible" aria-hidden="true" />
              {option.icon}
              <span className="truncate">{option.label}</span>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
      {hint && !error && <Description className="text-xs text-ink-subtle">{hint}</Description>}
      {error && (
        <Description className="text-xs font-medium text-rose-700" role="alert">
          {error}
        </Description>
      )}
    </Field>
  );
}
