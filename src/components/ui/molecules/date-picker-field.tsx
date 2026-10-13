"use client";

import { Description, Field, Input, Label } from "@headlessui/react";
import { CalendarIcon, XMarkIcon } from "@heroicons/react/20/solid";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { useRef, useState } from "react";
import DatePicker, { type DateObject, type DatePickerRef } from "react-multi-date-picker";
import { dateToIsoDate, isoDateToDate } from "@/lib/dates/iso-date";
import { usePointerDownOutside } from "@/lib/hooks/use-pointer-down-outside";
import { cn } from "@/lib/utils/cn";
import { controlClass } from "../atoms/control-styles";

interface DatePickerFieldProps {
  label: string;
  /** Gregorian `YYYY-MM-DD`, or "" when empty. Shown and picked in the Persian calendar. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

const OPEN_KEYS = new Set(["Enter", " ", "ArrowDown"]);

export function DatePickerField({ label, value, onChange, error, hint, disabled, className }: DatePickerFieldProps) {
  const pickerRef = useRef<DatePickerRef>(null);
  const [open, setOpen] = useState(false);
  // The library's own outside-click check uses a bubbling `click`, which Headless UI and TipTap can swallow.
  usePointerDownOutside(pickerRef, open, () => pickerRef.current?.closeCalendar());

  return (
    <Field disabled={disabled} className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-sm font-medium text-ink">{label}</Label>
      <div className="relative">
        {/* Not portaled: a portaled calendar would count as an outside click for the surrounding Dialog. */}
        <DatePicker
          ref={pickerRef}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          value={isoDateToDate(value)}
          onChange={(date: DateObject | null) => onChange(date ? dateToIsoDate(date.toDate()) : "")}
          calendar={persian}
          locale={persian_fa}
          onOpenPickNewDate={false}
          calendarPosition="bottom-right"
          containerClassName="w-full"
          className="rmdp-brand"
          disabled={disabled}
          render={(displayValue, openCalendar) => (
            <Input
              readOnly
              value={displayValue}
              placeholder="انتخاب تاریخ"
              invalid={Boolean(error)}
              onClick={openCalendar}
              onKeyDown={(event) => {
                if (!OPEN_KEYS.has(event.key)) return;
                event.preventDefault();
                openCalendar();
              }}
              className={cn(controlClass, "cursor-pointer pe-16")}
            />
          )}
        />
        <div className="absolute inset-y-0 end-0 flex items-center gap-0.5 pe-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label={`پاک کردن ${label}`}
              className="grid size-6 place-items-center rounded text-ink-subtle hover:bg-zinc-100 hover:text-ink"
            >
              <XMarkIcon className="size-4" aria-hidden="true" />
            </button>
          )}
          <CalendarIcon className="pointer-events-none size-4 text-ink-subtle" aria-hidden="true" />
        </div>
      </div>
      {hint && !error && <Description className="text-xs text-ink-subtle">{hint}</Description>}
      {error && (
        <Description className="text-xs font-medium text-rose-700" role="alert">
          {error}
        </Description>
      )}
    </Field>
  );
}
