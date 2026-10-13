import type { Role } from "@/features/auth/types";

/** Provisional request bodies for `POST /users` and `PATCH /users/:id`. */
export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  role: Exclude<Role, "owner">;
}

export interface UpdateUserPayload {
  fullName?: string;
  role?: Role;
  isActive?: boolean;
}
