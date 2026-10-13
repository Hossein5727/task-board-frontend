"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/api/auth-api";
import { taskKeys } from "@/features/tasks/api/tasks-api";
import { createUser, listUsers, updateUser, userKeys } from "../api/users-api";
import type { UpdateUserPayload } from "../types";

export function useUsers({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: userKeys.list(), queryFn: listUsers, enabled });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.list() }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => updateUser(id, payload),
    // Names/roles appear on tasks and in the session, so refresh everything that may embed them.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: userKeys.list() }),
        queryClient.invalidateQueries({ queryKey: authKeys.me }),
        queryClient.invalidateQueries({ queryKey: taskKeys.all }),
      ]),
  });
}
