import type { Metadata } from "next";
import { UserManagement } from "@/features/users/components/user-management";

export const metadata: Metadata = { title: "کاربران" };
// Entry is gated on the client-side session check (SessionGate), so it is not instant by design.
export const instant = false;

export default function UsersPage() {
  return <UserManagement />;
}
