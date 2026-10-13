import { cn } from "@/lib/utils/cn";
import { Spinner } from "./spinner";

const VARIANTS = {
  primary: "bg-brand-700 text-white shadow-sm hover:bg-brand-800 disabled:bg-brand-700/60",
  secondary: "bg-surface text-ink ring-1 ring-inset ring-line shadow-sm hover:bg-zinc-50 disabled:text-ink-subtle",
  ghost: "text-ink-muted hover:bg-zinc-100 hover:text-ink disabled:text-ink-subtle",
  danger: "bg-rose-700 text-white shadow-sm hover:bg-rose-800 disabled:bg-rose-700/60",
} as const;

const SIZES = {
  sm: "h-8 gap-1.5 px-2.5 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
  icon: "size-9 justify-center",
} as const;

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
