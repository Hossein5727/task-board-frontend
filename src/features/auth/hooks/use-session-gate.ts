"use client";

import { getStatus, toApiError } from "@/lib/http/errors";
import { useCurrentUser } from "./use-session";

/**
 * A 401 that survives the refresh attempt triggers the global session-expired redirect (see Providers),
 * so it stays in the pending state here instead of showing an error.
 */
export function useSessionGate() {
  const { data: user, error, refetch } = useCurrentUser();
  return {
    user,
    errorMessage: error && getStatus(error) !== 401 ? toApiError(error).message : null,
    retry: () => void refetch(),
  };
}
