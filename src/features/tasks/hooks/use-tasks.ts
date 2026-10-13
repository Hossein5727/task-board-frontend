"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSessionUser } from "@/features/auth/components/session-gate";
import { canAssignToOthers } from "@/features/auth/permissions";
import { useUsers } from "@/features/users/hooks/use-users";
import { createTask, deleteTask, getTask, listTasks, taskKeys, updateTask } from "../api/tasks-api";
import type { Task, TaskPayload, UserSummary } from "../types";

export function useTasks() {
  return useQuery({ queryKey: taskKeys.list(), queryFn: listTasks });
}

export function useTask(id: string, placeholder?: Task) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => getTask(id),
    placeholderData: placeholder,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.save,
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.list() }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.save,
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TaskPayload> }) => updateTask(id, payload),
    onSuccess: (task) => {
      queryClient.setQueryData(taskKeys.detail(task.id), task);
      return queryClient.invalidateQueries({ queryKey: taskKeys.list() });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: taskKeys.list() });
    },
  });
}

/**
 * People who can appear as assignees. `GET /users` is owner-only per the spec, so for managers it may
 * return 403; we then fall back to assignees already visible on tasks plus the current user.
 */
export function useAssignees(): UserSummary[] {
  const me = useSessionUser();
  const users = useUsers({ enabled: canAssignToOthers(me.role) });
  const tasks = useTasks();

  return useMemo(() => {
    const byId = new Map<string, UserSummary>([[me.id, { id: me.id, fullName: me.fullName, email: me.email }]]);
    users.data?.forEach((u) => u.isActive && byId.set(u.id, { id: u.id, fullName: u.fullName, email: u.email }));
    tasks.data?.forEach((t) => t.assignee && !byId.has(t.assignee.id) && byId.set(t.assignee.id, t.assignee));
    return [...byId.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, "fa"));
  }, [me, users.data, tasks.data]);
}
