import type { TaskPriority, TaskStatus } from "./types";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "برای انجام",
  in_progress: "در حال انجام",
  done: "انجام‌شده",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "اولویت کم",
  medium: "اولویت متوسط",
  high: "اولویت بالا",
};
