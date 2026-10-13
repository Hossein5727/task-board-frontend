"use client";

import { createContext, useContext } from "react";
import { Spinner } from "@/components/ui/atoms/spinner";
import { ErrorState } from "@/components/ui/molecules/state-message";
import { getStatus, toApiError } from "@/lib/http/errors";
import { useCurrentUser } from "../hooks/use-session";
import type { User } from "../types";

const SessionContext = createContext<User | null>(null);

/**
 * Renders children only once `/auth/me` confirms a session. A 401 that survives the refresh attempt
 * triggers the global session-expired redirect (see Providers), so here we just show a pending state.
 */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const { data: user, error, refetch } = useCurrentUser();

  if (user) return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;

  if (error && getStatus(error) !== 401) {
    return (
      <main className="mx-auto max-w-md px-4 py-24">
        <ErrorState message={toApiError(error).message} onRetry={() => refetch()} />
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center gap-2 text-sm text-ink-muted" role="status">
      <Spinner className="size-5 text-brand-700" />
      در حال بررسی نشست…
    </div>
  );
}

export function useSessionUser(): User {
  const user = useContext(SessionContext);
  if (!user) throw new Error("useSessionUser must be used inside SessionGate");
  return user;
}
