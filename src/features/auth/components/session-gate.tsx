"use client";

import { Spinner } from "@/components/ui/atoms/spinner";
import { ErrorState } from "@/components/ui/molecules/state-message";
import { SessionContext } from "../hooks/use-session";
import { useSessionGate } from "../hooks/use-session-gate";

/** Renders children only once `/auth/me` confirms a session. */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const { user, errorMessage, retry } = useSessionGate();

  if (user) return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;

  if (errorMessage) {
    return (
      <main className="mx-auto max-w-md px-4 py-24">
        <ErrorState message={errorMessage} onRetry={retry} />
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
