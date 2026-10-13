import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { ToastProvider } from "@/components/ui/organisms/toaster";
import { authKeys } from "@/features/auth/api/auth-api";
import { SessionGate } from "@/features/auth/components/session-gate";
import type { User } from "@/features/auth/types";
import type { Task } from "@/features/tasks/types";

export const owner: User = { id: "u-owner", email: "owner@example.com", fullName: "سارا مالکی", role: "owner", isActive: true };
export const manager: User = { id: "u-manager", email: "manager@example.com", fullName: "مهدی مدیری", role: "manager", isActive: true };
export const member: User = { id: "u-member", email: "member@example.com", fullName: "نگار عضوی", role: "member", isActive: true };

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "طراحی صفحهٔ ورود",
    status: "todo",
    priority: "medium",
    assigneeId: null,
    assignee: null,
    dueDate: null,
    description: { type: "doc", content: [{ type: "paragraph" }] },
    createdById: owner.id,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

export function httpError(status: number) {
  const config = { headers: new AxiosHeaders() };
  const response = { status, statusText: "", data: {}, headers: {}, config } as AxiosResponse;
  return new AxiosError(`HTTP ${status}`, "ERR_BAD_RESPONSE", config, null, response);
}

/** Renders inside the real providers; pass `user` to start with an authenticated session. */
export function renderWithProviders(ui: React.ReactElement, { user }: { user?: User } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  if (user) queryClient.setQueryData(authKeys.me, user);
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{user ? <SessionGate>{ui}</SessionGate> : ui}</ToastProvider>
    </QueryClientProvider>,
  );
  return { ...result, queryClient };
}
