"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/organisms/toaster";
import { useSessionUser } from "@/features/auth/hooks/use-session";
import { toApiError } from "@/lib/http/errors";
import { STATUS_LABELS } from "../constants";
import { TASK_STATUSES } from "../schemas/task-schema";
import type { Task, TaskStatus } from "../types";
import { canDeleteTask } from "../utils/permissions";
import { ALL, filterTasks, parseFilters, type TaskFilters } from "../utils/task-filters";
import type { TaskAction } from "./use-task-card";
import { useAssignees, useDeleteTask, useTasks, useUpdateTask } from "./use-tasks";

type DialogKind = "create" | "edit" | "view" | "delete";
export type BoardView = "loading" | "error" | "empty" | "no-matches" | "board";

export function useTaskBoard() {
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
  const hasFilters = filters.status !== ALL || filters.assignee !== ALL;

  const visible = useMemo(
    () => filterTasks(tasksQuery.data ?? [], filters, user),
    [tasksQuery.data, filters, user],
  );
  const statuses: TaskStatus[] = filters.status === ALL ? [...TASK_STATUSES] : [filters.status];
  const columns = statuses.map((status) => ({ status, tasks: visible.filter((t) => t.status === status) }));

  const view: BoardView = tasksQuery.isPending
    ? "loading"
    : tasksQuery.isError
      ? "error"
      : tasksQuery.data.length === 0
        ? "empty"
        : visible.length === 0 && hasFilters
          ? "no-matches"
          : "board";

  const onAction = (task: Task, action: TaskAction) => {
    if (action.type !== "move") return show(action.type, task);
    updateTask.mutate(
      { id: task.id, payload: { status: action.status } },
      {
        onSuccess: () => toast("success", `وظیفه به «${STATUS_LABELS[action.status]}» منتقل شد.`),
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

  return {
    user,
    isMember: user.role === "member",
    view,
    errorMessage: tasksQuery.error ? toApiError(tasksQuery.error).message : null,
    retry: () => void tasksQuery.refetch(),
    visibleCount: tasksQuery.data ? visible.length : null,
    columns,
    multiColumn: columns.length > 1,
    filters,
    setFilters,
    clearFilters: () => setFilters({ status: ALL, assignee: ALL }),
    assignees,
    canDelete: (task: Task) => canDeleteTask(user, task),
    onAction,
    openCreate: () => show("create"),
    openEdit: (task: Task) => show("edit", task),
    openDelete: (task: Task) => show("delete", task),
    closeDialog: close,
    selectedTask: dialog.task,
    formOpen: open && (dialog.kind === "create" || dialog.kind === "edit"),
    editingTask: dialog.kind === "edit" ? dialog.task : undefined,
    detailsOpen: open && dialog.kind === "view",
    deleteOpen: open && dialog.kind === "delete",
    deleting: deleteTask.isPending,
    confirmDelete,
  };
}
