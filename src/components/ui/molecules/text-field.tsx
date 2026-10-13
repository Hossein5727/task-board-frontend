import { Description, Field, Input, Label } from "@headlessui/react";
import { controlClass } from "../atoms/control-styles";
import { cn } from "@/lib/utils/cn";

type TextFieldProps = React.ComponentProps<"input"> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({ label, error, hint, className, ...inputProps }: TextFieldProps) {
  return (
    <Field className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-sm font-medium text-ink">{label}</Label>
      <Input invalid={Boolean(error)} className={controlClass} {...inputProps} />
      {hint && !error && <Description className="text-xs text-ink-subtle">{hint}</Description>}
      {error && (
        <Description className="text-xs font-medium text-rose-700" role="alert">
          {error}
        </Description>
      )}
    </Field>
  );
}
