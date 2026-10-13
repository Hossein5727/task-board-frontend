import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  CheckCircleIcon,
  EllipsisHorizontalCircleIcon,
  MinusIcon,
  PlayCircleIcon,
} from "@heroicons/react/20/solid";
import { Avatar } from "@/components/ui/atoms/avatar";
import { Badge } from "@/components/ui/atoms/badge";
import type { SelectOption } from "@/components/ui/molecules/select-field";
import { cn } from "@/lib/utils/cn";
import { PRIORITY_LABELS, STATUS_LABELS } from "../constants";
import type { PersonOption, TaskPriority, TaskStatus } from "../types";
import { formatDueDate, isOverdue } from "../utils/dates";

// Every status/priority is shown with an icon and text, never color alone.
export const STATUS_META: Record<TaskStatus, { label: string; icon: typeof CheckCircleIcon; tone: string; dot: string }> = {
  todo: { label: STATUS_LABELS.todo, icon: EllipsisHorizontalCircleIcon, tone: "text-zinc-600", dot: "bg-zinc-400" },
  in_progress: { label: STATUS_LABELS.in_progress, icon: PlayCircleIcon, tone: "text-amber-700", dot: "bg-amber-500" },
  done: { label: STATUS_LABELS.done, icon: CheckCircleIcon, tone: "text-emerald-700", dot: "bg-emerald-500" },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; icon: typeof ArrowUpIcon; className: string }> = {
  low: { label: PRIORITY_LABELS.low, icon: ArrowDownIcon, className: "bg-zinc-50 text-zinc-700 ring-zinc-200" },
  medium: { label: PRIORITY_LABELS.medium, icon: MinusIcon, className: "bg-sky-50 text-sky-800 ring-sky-200" },
  high: { label: PRIORITY_LABELS.high, icon: ArrowUpIcon, className: "bg-rose-50 text-rose-800 ring-rose-200" },
};

export const withAvatars = (options: PersonOption[]): SelectOption<string>[] =>
  options.map(({ avatarName, ...option }) => ({
    ...option,
    icon: avatarName ? <Avatar name={avatarName} /> : undefined,
  }));

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