"use client";

import { TASK_STATUSES } from "../schemas/task-schema";
import type { Task, TaskStatus } from "../types";

export type TaskAction = { type: "view" | "edit" | "delete" } | { type: "move"; status: TaskStatus };

export function useTaskCard(task: Task, onAction: (task: Task, action: TaskAction) => void) {
  return {
    titleId: `task-${task.id}-title`,
    isDone: task.status === "done",
    otherStatuses: TASK_STATUSES.filter((status) => status !== task.status),
    act: (action: TaskAction) => onAction(task, action),
  };
}
