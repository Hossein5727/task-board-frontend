import { ViewColumnsIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils/cn";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-brand-700 text-white shadow-sm">
        <ViewColumnsIcon className="size-4.5" aria-hidden="true" />
      </span>
      {showText && <span className="text-sm font-bold tracking-tight text-ink">تخته وظایف</span>}
    </span>
  );
}
