"use client";

import { ClipboardDocumentListIcon, FunnelIcon, PlusIcon } from "@heroicons/react/20/solid";
import { Button } from "@/components/ui/atoms/button";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { ErrorState, StateMessage } from "@/components/ui/molecules/state-message";
import { ConfirmDialog } from "@/components/ui/organisms/confirm-dialog";
import { cn } from "@/lib/utils/cn";
import { useTaskBoard } from "../hooks/use-task-board";
import { TASK_STATUSES } from "../schemas/task-schema";
import { TaskCard } from "./task-card";
import { TaskDetailsDialog } from "./task-details-dialog";
import { TaskFiltersBar } from "./task-filters-bar";
import { TaskFormDialog } from "./task-form-dialog";
import { STATUS_META } from "./task-meta";

const faNumber = new Intl.NumberFormat("fa-IR");

export function TaskBoard() {
  const board = useTaskBoard();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">وظایف</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {board.isMember ? "وظایفی که ایجاد کرده‌اید یا به شما واگذار شده است." : "همهٔ وظایف تیم."}
          </p>
        </div>
        <Button onClick={board.openCreate}>
          <PlusIcon className="size-4" aria-hidden="true" />
          وظیفهٔ جدید
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-surface p-4 ring-1 ring-line sm:flex-row sm:items-end sm:justify-between">
        <TaskFiltersBar
          filters={board.filters}
          assignees={board.assignees}
          currentUserId={board.user.id}
          onChange={board.setFilters}
        />
        {board.visibleCount !== null && (
          <p aria-live="polite" className="text-xs text-ink-subtle">
            {faNumber.format(board.visibleCount)} وظیفه
          </p>
        )}
      </div>

      {board.view === "loading" && <BoardSkeleton />}
      {board.view === "error" && <ErrorState message={board.errorMessage ?? ""} onRetry={board.retry} />}
      {board.view === "empty" && (
        <StateMessage
          icon={<ClipboardDocumentListIcon aria-hidden="true" />}
          title="هنوز وظیفه‌ای ثبت نشده است"
          description="اولین وظیفه را ایجاد کنید تا کار تیم را پیگیری کنید."
          action={<Button onClick={board.openCreate}>ایجاد وظیفه</Button>}
        />
      )}
      {board.view === "no-matches" && (
        <StateMessage
          icon={<FunnelIcon aria-hidden="true" />}
          title="وظیفه‌ای با این فیلترها پیدا نشد"
          description="فیلترها را تغییر دهید یا حذف کنید."
          action={
            <Button variant="secondary" size="sm" onClick={board.clearFilters}>
              حذف فیلترها
            </Button>
          }
        />
      )}
      {board.view === "board" && (
        <div className={cn("grid items-start gap-4", board.multiColumn && "lg:grid-cols-3")}>
          {board.columns.map(({ status, tasks }) => {
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
                  <ul className={cn("grid gap-2.5", !board.multiColumn && "sm:grid-cols-2 xl:grid-cols-3")}>
                    {tasks.map((task) => (
                      <li key={task.id}>
                        <TaskCard task={task} canDelete={board.canDelete(task)} onAction={board.onAction} />
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

      <TaskFormDialog open={board.formOpen} task={board.editingTask} onClose={board.closeDialog} />
      <TaskDetailsDialog
        open={board.detailsOpen}
        task={board.selectedTask}
        canDelete={board.selectedTask ? board.canDelete(board.selectedTask) : false}
        onClose={board.closeDialog}
        onEdit={board.openEdit}
        onDelete={board.openDelete}
      />
      <ConfirmDialog
        open={board.deleteOpen}
        title="حذف وظیفه"
        message={
          <>
            وظیفهٔ «<strong className="font-semibold text-ink">{board.selectedTask?.title}</strong>» برای همیشه حذف
            می‌شود. این کار قابل بازگشت نیست.
          </>
        }
        confirmLabel="حذف وظیفه"
        loading={board.deleting}
        onConfirm={board.confirmDelete}
        onClose={board.closeDialog}
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
