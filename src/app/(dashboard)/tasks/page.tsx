import type { Metadata } from "next";
import { Suspense } from "react";
import { TaskBoard } from "@/features/tasks/components/task-board";

export const metadata: Metadata = { title: "وظایف" };
// Entry is gated on the client-side session check (SessionGate), so it is not instant by design.
export const instant = false;

export default function TasksPage() {
  // Suspense is required because the board reads filters from the URL (useSearchParams).
  return (
    <Suspense>
      <TaskBoard />
    </Suspense>
  );
}
