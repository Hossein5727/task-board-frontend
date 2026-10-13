import type { User } from "@/features/auth/types";
import type { Task } from "../types";

/** UX only — mirrors the spec ("members cannot delete other users' tasks"); NestJS enforces it. */
export const canDeleteTask = (user: User, task: Task) => user.role !== "member" || task.createdById === user.id;
