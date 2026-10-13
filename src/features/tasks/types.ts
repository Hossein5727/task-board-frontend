import type { JSONContent } from "@tiptap/react";
import type { User } from "@/features/auth/types";

export type TaskStatus = "todo" | "in_progress" | "done";
/** Provisional: the spec requires a priority but does not define its values. */
export type TaskPriority = "low" | "medium" | "high";

export type UserSummary = Pick<User, "id" | "fullName" | "email">;

/** Select option for a person; the UI renders an avatar when `avatarName` is set. */
export interface PersonOption {
  value: string;
  label: string;
  avatarName?: string;
}

/** Provisional shape of `GET /todos` items and `GET /todos/:id` (see README → Backend contract). */
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assignee: UserSummary | null;
  /** ISO date (`YYYY-MM-DD` or full ISO timestamp). */
  dueDate: string | null;
  /** TipTap JSON document (jsonb). */
  description: JSONContent;
  createdById: string;
  createdBy?: UserSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPayload {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  dueDate: string | null;
  description: JSONContent;
}
