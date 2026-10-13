import type { JSONContent } from "@tiptap/react";
import { z } from "zod";
import { sanitizeDoc } from "@/lib/tiptap/document";
import type { Task, TaskPayload } from "../types";

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export const UNASSIGNED = "unassigned";

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "عنوان وظیفه را وارد کنید.").max(200, "عنوان حداکثر ۲۰۰ کاراکتر است."),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  assigneeId: z.string(),
  dueDate: z
    .string()
    .refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))), "تاریخ معتبر نیست."),
  description: z.custom<JSONContent>(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export function toFormValues(task?: Task): TaskFormValues {
  return {
    title: task?.title ?? "",
    status: task?.status ?? "todo",
    priority: task?.priority ?? "medium",
    assigneeId: task?.assigneeId ?? UNASSIGNED,
    dueDate: task?.dueDate?.slice(0, 10) ?? "",
    description: sanitizeDoc(task?.description),
  };
}

export function toPayload(values: TaskFormValues): TaskPayload {
  return {
    title: values.title,
    status: values.status,
    priority: values.priority,
    assigneeId: values.assigneeId === UNASSIGNED ? null : values.assigneeId,
    dueDate: values.dueDate || null,
    description: sanitizeDoc(values.description),
  };
}
