import { AppShell } from "@/components/layout/app-shell";
import { SessionGate } from "@/features/auth/components/session-gate";

// Private data is fetched client-side through the same-origin proxy, so nothing user-specific
// is ever part of the prerendered shell or a shared cache.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGate>
      <AppShell>{children}</AppShell>
    </SessionGate>
  );
}
