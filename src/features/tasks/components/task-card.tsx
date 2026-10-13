"use client";

import { Menu, MenuButton, MenuItem, MenuItems, MenuSeparator } from "@headlessui/react";
import { ArrowsRightLeftIcon, EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/20/solid";
import { Avatar } from "@/components/ui/atoms/avatar";
import { cn } from "@/lib/utils/cn";
import type { Task, TaskStatus } from "../types";
import { DueDateBadge, PriorityBadge, STATUS_META } from "./task-meta";

export type TaskAction = { type: "view" | "edit" | "delete" } | { type: "move"; status: TaskStatus };

interface TaskCardProps {
  task: Task;
  canDelete: boolean;
  onAction: (task: Task, action: TaskAction) => void;
}

const itemClass =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-ink data-focus:bg-zinc-100 data-disabled:opacity-50";

export function TaskCard({ task, canDelete, onAction }: TaskCardProps) {
  const titleId = `task-${task.id}-title`;
  const otherStatuses = (Object.keys(STATUS_META) as TaskStatus[]).filter((s) => s !== task.status);

  return (
    <article
      aria-labelledby={titleId}
      className="relative rounded-xl bg-surface p-3.5 shadow-xs ring-1 ring-line transition-shadow focus-within:ring-brand-200 hover:shadow-sm"
    >
      <div className="flex items-start gap-2">
        <h3 id={titleId} className="min-w-0 flex-1 text-sm leading-6 font-semibold text-ink">
          <button
            type="button"
            onClick={() => onAction(task, { type: "view" })}
            className="text-start break-words hover:text-brand-700 focus-visible:outline-offset-4"
          >
            {task.title}
          </button>
        </h3>
        <Menu>
          <MenuButton
            aria-label={`گزینه‌های وظیفهٔ «${task.title}»`}
            className="-me-1.5 -mt-1 grid size-8 shrink-0 place-items-center rounded-md text-ink-subtle hover:bg-zinc-100 hover:text-ink data-open:bg-zinc-100"
          >
            <EllipsisVerticalIcon className="size-4" aria-hidden="true" />
          </MenuButton>
          <MenuItems
            anchor="bottom end"
            transition
            className="z-40 w-52 rounded-xl bg-surface p-1 shadow-lg ring-1 ring-line [--anchor-gap:4px] focus:outline-none transition duration-100 ease-out data-closed:opacity-0"
          >
            <MenuItem>
              <button type="button" className={itemClass} onClick={() => onAction(task, { type: "view" })}>
                <EyeIcon className="size-4 text-ink-subtle" aria-hidden="true" />
                مشاهده
              </button>
            </MenuItem>
            <MenuItem>
              <button type="button" className={itemClass} onClick={() => onAction(task, { type: "edit" })}>
                <PencilSquareIcon className="size-4 text-ink-subtle" aria-hidden="true" />
                ویرایش
              </button>
            </MenuItem>
            <MenuSeparator className="my-1 h-px bg-line" />
            {otherStatuses.map((status) => (
              <MenuItem key={status}>
                <button type="button" className={itemClass} onClick={() => onAction(task, { type: "move", status })}>
                  <ArrowsRightLeftIcon className="size-4 text-ink-subtle" aria-hidden="true" />
                  انتقال به «{STATUS_META[status].label}»
                </button>
              </MenuItem>
            ))}
            {canDelete && (
              <>
                <MenuSeparator className="my-1 h-px bg-line" />
                <MenuItem>
                  <button
                    type="button"
                    className={cn(itemClass, "text-rose-700 data-focus:bg-rose-50")}
                    onClick={() => onAction(task, { type: "delete" })}
                  >
                    <TrashIcon className="size-4" aria-hidden="true" />
                    حذف
                  </button>
                </MenuItem>
              </>
            )}
          </MenuItems>
        </Menu>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && <DueDateBadge dueDate={task.dueDate} done={task.status === "done"} />}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-line pt-2.5 text-xs text-ink-muted">
        {task.assignee ? (
          <>
            <Avatar name={task.assignee.fullName} />
            <span className="truncate">
              <span className="sr-only">مسئول: </span>
              {task.assignee.fullName}
            </span>
          </>
        ) : (
          <span className="text-ink-subtle">بدون مسئول</span>
        )}
      </div>
    </article>
  );
}
