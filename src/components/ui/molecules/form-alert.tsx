import { ExclamationCircleIcon, InformationCircleIcon } from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils/cn";

const TONES = {
  error: { className: "bg-rose-50 text-rose-900 ring-rose-200", icon: ExclamationCircleIcon, role: "alert" },
  info: { className: "bg-amber-50 text-amber-900 ring-amber-200", icon: InformationCircleIcon, role: "status" },
} as const;

export function FormAlert({ tone = "error", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  const { className, icon: Icon, role } = TONES[tone];
  return (
    <p role={role} className={cn("flex gap-2 rounded-lg p-3 text-sm leading-6 ring-1", className)}>
      <Icon className="mt-1 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
