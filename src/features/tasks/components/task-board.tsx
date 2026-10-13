"use client";

import { ClipboardDocumentListIcon, FunnelIcon, PlusIcon } from "@heroicons/react/20/solid";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/atoms/button";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { ErrorState, StateMessage } from "@/components/ui/molecules/state-message";
import { ConfirmDialog } from "@/components/ui/organisms/confirm-dialog";
import { useToast } from "@/components/ui/organisms/toaster";
import { useSessionUser } from "@/features/auth/components/session-gate";
import { toApiError } from "@/lib/http/errors";
import { cn } from "@/lib/utils/cn";
import { useAssignees, useDeleteTask, useTasks, useUpdateTask } from "../hooks/use-tasks";
import { TASK_STATUSES } from "../schemas/task-schema";
import type { Task, TaskStatus } from "../types";
import { canDeleteTask } from "../utils/permissions";
import { ALL, filterTasks, parseFilters, type TaskFilters } from "../utils/task-filters";
import { TaskCard, type TaskAction } from "./task-card";
import { TaskDetailsDialog } from "./task-details-dialog";
import { TaskFiltersBar } from "./task-filters-bar";
import { TaskFormDialog } from "./task-form-dialog";
import { STATUS_META } from "./task-meta";

type DialogKind = "create" | "edit" | "view" | "delete";

const faNumber = new Intl.NumberFormat("fa-IR");

export function TaskBoard() {
  const user = useSessionUser();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tasksQuery = useTasks();
  const assignees = useAssignees();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // `open` is separate from the target so dialog content stays rendered during the close transition.
  const [dialog, setDialog] = useState<{ kind: DialogKind; task?: Task }>({ kind: "create" });
  const [open, setOpen] = useState(false);
  const show = (kind: DialogKind, task?: Task) => {
    setDialog({ kind, task });
    setOpen(true);
  };
  const close = () => setOpen(false);

  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const setFilters = (next: TaskFilters) => {
    const params = new URLSearchParams();
    if (next.status !== ALL) params.set("status", next.status);
    if (next.assignee !== ALL) params.set("assignee", next.assignee);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const visible = useMemo(
    () => filterTasks(tasksQuery.data ?? [], filters, user),
    [tasksQuery.data, filters, user],
  );

  const onAction = (task: Task, action: TaskAction) => {
    if (action.type !== "move") return show(action.type, task);
    updateTask.mutate(
      { id: task.id, payload: { status: action.status } },
      {
        onSuccess: () => toast("success", `وظیفه به «${STATUS_META[action.status].label}» منتقل شد.`),
        onError: (error) => toast("error", toApiError(error).message),
      },
    );
  };

  const confirmDelete = () => {
    const task = dialog.task;
    if (!task || deleteTask.isPending) return;
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast("success", "وظیفه حذف شد.");
        close();
      },
      onError: (error) => toast("error", toApiError(error).message),
    });
  };

  const columns: TaskStatus[] = filters.status === ALL ? [...TASK_STATUSES] : [filters.status];
  const hasFilters = filters.status !== ALL || filters.assignee !== ALL;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">وظایف</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {user.role === "member" ? "وظایفی که ایجاد کرده‌اید یا به شما واگذار شده است." : "همهٔ وظایف تیم."}
          </p>
        </div>
        <Button onClick={() => show("create")}>
          <PlusIcon className="size-4" aria-hidden="true" />
          وظیفهٔ جدید
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-surface p-4 ring-1 ring-line sm:flex-row sm:items-end sm:justify-between">
        <TaskFiltersBar filters={filters} assignees={assignees} currentUserId={user.id} onChange={setFilters} />
        {tasksQuery.data && (
          <p aria-live="polite" className="text-xs text-ink-subtle">
            {faNumber.format(visible.length)} وظیفه
          </p>
        )}
      </div>

      {tasksQuery.isPending ? (
        <BoardSkeleton />
      ) : tasksQuery.isError ? (
        <ErrorState message={toApiError(tasksQuery.error).message} onRetry={() => tasksQuery.refetch()} />
      ) : tasksQuery.data.length === 0 ? (
        <StateMessage
          icon={<ClipboardDocumentListIcon aria-hidden="true" />}
          title="هنوز وظیفه‌ای ثبت نشده است"
          description="اولین وظیفه را ایجاد کنید تا کار تیم را پیگیری کنید."
          action={<Button onClick={() => show("create")}>ایجاد وظیفه</Button>}
        />
      ) : visible.length === 0 && hasFilters ? (
        <StateMessage
          icon={<FunnelIcon aria-hidden="true" />}
          title="وظیفه‌ای با این فیلترها پیدا نشد"
          description="فیلترها را تغییر دهید یا حذف کنید."
          action={
            <Button variant="secondary" size="sm" onClick={() => setFilters({ status: ALL, assignee: ALL })}>
              حذف فیلترها
            </Button>
          }
        />
      ) : (
        <div className={cn("grid items-start gap-4", columns.length > 1 && "lg:grid-cols-3")}>
          {columns.map((status) => {
            const tasks = visible.filter((t) => t.status === status);
            const { label, dot } = STATUS_META[status];
            const headingId = `column-${status}`;
            return (
              <section
                key={status}
                aria-labelledby={headingId}
                className="rounded-2xl bg-zinc-100/70 p-2.5 ring-1 ring-line/60"
              >
                <h2 id={headingId} className="flex items-center gap-2 px-1.5 pt-1 pb-3 text-sm font-semibold text-ink">
                  <span className={cn("size-2 rounded-full", dot)} aria-hidden="true" />
                  {label}
                  <span className="rounded-full bg-surface px-2 text-xs font-medium text-ink-muted ring-1 ring-line">
                    {faNumber.format(tasks.length)}
                  </span>
                </h2>
                {tasks.length ? (
                  <ul className={cn("grid gap-2.5", columns.length === 1 && "sm:grid-cols-2 xl:grid-cols-3")}>
                    {tasks.map((task) => (
                      <li key={task.id}>
                        <TaskCard task={task} canDelete={canDeleteTask(user, task)} onAction={onAction} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-ink-subtle">
                    وظیفه‌ای در این ستون نیست.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}

      <TaskFormDialog
        open={open && (dialog.kind === "create" || dialog.kind === "edit")}
        task={dialog.kind === "edit" ? dialog.task : undefined}
        onClose={close}
      />
      <TaskDetailsDialog
        open={open && dialog.kind === "view"}
        task={dialog.task}
        canDelete={dialog.task ? canDeleteTask(user, dialog.task) : false}
        onClose={close}
        onEdit={(task) => show("edit", task)}
        onDelete={(task) => show("delete", task)}
      />
      <ConfirmDialog
        open={open && dialog.kind === "delete"}
        title="حذف وظیفه"
        message={
          <>
            وظیفهٔ «<strong className="font-semibold text-ink">{dialog.task?.title}</strong>» برای همیشه حذف می‌شود. این
            کار قابل بازگشت نیست.
          </>
        }
        confirmLabel="حذف وظیفه"
        loading={deleteTask.isPending}
        onConfirm={confirmDelete}
        onClose={close}
      />
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3" role="status" aria-label="در حال بارگذاری وظایف">
      {TASK_STATUSES.map((status) => (
        <div key={status} className="space-y-2.5 rounded-2xl bg-zinc-100/70 p-2.5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
