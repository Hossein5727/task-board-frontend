import { http } from "@/lib/http/client";
import type { Task, TaskPayload } from "../types";

export const taskKeys = {
  all: ["tasks"] as const,
  list: () => [...taskKeys.all, "list"] as const,
  detail: (id: string) => [...taskKeys.all, "detail", id] as const,
  /** Mutation key shared by create/update so dialogs can block closing mid-save. */
  save: ["tasks", "save"] as const,
};

export async function listTasks(): Promise<Task[]> {
  const { data } = await http.get<Task[]>("/todos");
  return data;
}

export async function getTask(id: string): Promise<Task> {
  const { data } = await http.get<Task>(`/todos/${encodeURIComponent(id)}`);
  return data;
}

export async function createTask(payload: TaskPayload): Promise<Task> {
  const { data } = await http.post<Task>("/todos", payload);
  return data;
}

export async function updateTask(id: string, payload: Partial<TaskPayload>): Promise<Task> {
  const { data } = await http.patch<Task>(`/todos/${encodeURIComponent(id)}`, payload);
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  await http.delete(`/todos/${encodeURIComponent(id)}`);
}
