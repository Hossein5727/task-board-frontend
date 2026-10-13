"use client";

import { toApiError } from "@/lib/http/errors";
import type { Task } from "../types";
import { useTask } from "./use-tasks";

/** Fetches the single task so the dialog reflects the latest server state, showing list data meanwhile. */
export function useTaskDetails(initial: Task) {
  const { data: task = initial, error } = useTask(initial.id, initial);
  return {
    task,
    isDone: task.status === "done",
    errorMessage: error ? toApiError(error).message : null,
  };
}
