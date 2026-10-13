import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  CheckCircleIcon,
  EllipsisHorizontalCircleIcon,
  MinusIcon,
  PlayCircleIcon,
} from "@heroicons/react/20/solid";
import { Badge } from "@/components/ui/atoms/badge";
import type { SelectOption } from "@/components/ui/molecules/select-field";
import { cn } from "@/lib/utils/cn";
import type { TaskPriority, TaskStatus } from "../types";
import { formatDueDate, isOverdue } from "../utils/dates";

// Every status/priority is shown with an icon and text, never color alone.
export const STATUS_META: Record<TaskStatus, { label: string; icon: typeof CheckCircleIcon; tone: string; dot: string }> = {
  todo: { label: "برای انجام", icon: EllipsisHorizontalCircleIcon, tone: "text-zinc-600", dot: "bg-zinc-400" },
  in_progress: { label: "در حال انجام", icon: PlayCircleIcon, tone: "text-amber-700", dot: "bg-amber-500" },
  done: { label: "انجام‌شده", icon: CheckCircleIcon, tone: "text-emerald-700", dot: "bg-emerald-500" },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; icon: typeof ArrowUpIcon; className: string }> = {
  low: { label: "اولویت کم", icon: ArrowDownIcon, className: "bg-zinc-50 text-zinc-700 ring-zinc-200" },
  medium: { label: "اولویت متوسط", icon: MinusIcon, className: "bg-sky-50 text-sky-800 ring-sky-200" },
  high: { label: "اولویت بالا", icon: ArrowUpIcon, className: "bg-rose-50 text-rose-800 ring-rose-200" },
};

export const statusOptions: SelectOption<TaskStatus>[] = (Object.keys(STATUS_META) as TaskStatus[]).map((value) => {
  const { label, icon: Icon, tone } = STATUS_META[value];
  return { value, label, icon: <Icon className={cn("size-4", tone)} aria-hidden="true" /> };
});

export const priorityOptions: SelectOption<TaskPriority>[] = (Object.keys(PRIORITY_META) as TaskPriority[]).map(
  (value) => {
    const { label, icon: Icon } = PRIORITY_META[value];
    return { value, label, icon: <Icon className="size-4 text-ink-subtle" aria-hidden="true" /> };
  },
);

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, icon: Icon, tone } = STATUS_META[status];
  return (
    <Badge className={cn("bg-surface ring-line", tone)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { label, icon: Icon, className } = PRIORITY_META[priority];
  return (
    <Badge className={className}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </Badge>
  );
}

export function DueDateBadge({ dueDate, done }: { dueDate: string; done: boolean }) {
  const overdue = !done && isOverdue(dueDate);
  return (
    <Badge className={overdue ? "bg-rose-50 text-rose-800 ring-rose-200" : "bg-surface text-ink-muted ring-line"}>
      <CalendarIcon className="size-3.5" aria-hidden="true" />
      <span className="sr-only">سررسید:</span>
      {formatDueDate(dueDate)}
      {overdue && <span>(گذشته)</span>}
    </Badge>
  );
}