import { cn } from "@/lib/utils/cn";

const SIZES = { sm: "size-6 text-[11px]", md: "size-8 text-sm" } as const;

export function Avatar({ name, size = "sm", className }: { name: string; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-800",
        SIZES[size],
        className,
      )}
    >
      {name.trim().charAt(0) || "؟"}
    </span>
  );
}
