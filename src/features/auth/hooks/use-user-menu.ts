"use client";

import { ROLE_LABELS } from "../permissions";
import { useLogout, useSessionUser } from "./use-session";

export function useUserMenu() {
  const user = useSessionUser();
  const logout = useLogout();
  return {
    user,
    roleLabel: ROLE_LABELS[user.role],
    loggingOut: logout.isPending,
    logout: () => logout.mutate(),
  };
}
