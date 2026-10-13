"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { authKeys, fetchCurrentUser, login, logout } from "../api/auth-api";
import type { User } from "../types";

/** Provided by `SessionGate` once `/auth/me` confirms a session. */
export const SessionContext = createContext<User | null>(null);

export function useSessionUser(): User {
  const user = useContext(SessionContext);
  if (!user) throw new Error("useSessionUser must be used inside SessionGate");
  return user;
}

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
