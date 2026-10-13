"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKeys, fetchCurrentUser, login, logout } from "../api/auth-api";

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    // Drop anything cached from a previous session before loading the new identity.
    onSuccess: () => queryClient.clear(),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    // Hard navigation also discards router cache and routes kept alive by <Activity>.
    onSettled: () => {
      queryClient.clear();
      window.location.replace("/login");
    },
  });
}
