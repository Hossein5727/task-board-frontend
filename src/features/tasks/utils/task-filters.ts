import type { User } from "@/features/auth/types";
import { TASK_STATUSES, UNASSIGNED } from "../schemas/task-schema";
import type { Task, TaskStatus } from "../types";

export const ALL = "all";
export type StatusFilter = TaskStatus | typeof ALL;
/** `all`, `unassigned`, or a user id. */
export type AssigneeFilter = string;

export interface TaskFilters {
  status: StatusFilter;
  assignee: AssigneeFilter;
}

export function parseFilters(params: URLSearchParams): TaskFilters {
  const status = params.get("status");
  return {
    status: TASK_STATUSES.includes(status as TaskStatus) ? (status as TaskStatus) : ALL,
    assignee: params.get("assignee") || ALL,
  };
}

/**
 * Client-side filtering over the list the backend already authorized.
 * shortcut: no server-side filter params until the backend contract defines them; switch `listTasks`
 * to pass `status`/`assigneeId` once it does.
 */
export function filterTasks(tasks: Task[], filters: TaskFilters, user: User): Task[] {
  return tasks.filter((task) => {
    // Defense in depth only; NestJS must already exclude these for members.
    if (user.role === "member" && task.createdById !== user.id && task.assigneeId !== user.id) return false;
    if (filters.status !== ALL && task.status !== filters.status) return false;
    if (filters.assignee === UNASSIGNED) return task.assigneeId === null;
    if (filters.assignee !== ALL) return task.assigneeId === filters.assignee;
    return true;
  });
}
