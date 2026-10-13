import type { Role } from "./types";

// UX only: these checks hide controls the backend would reject anyway. NestJS remains the authority.

export const ROLE_LABELS: Record<Role, string> = {
  owner: "مالک",
  manager: "مدیر",
  member: "عضو",
};

export const canManageUsers = (role: Role) => role === "owner";

export const canAssignToOthers = (role: Role) => role !== "member";
