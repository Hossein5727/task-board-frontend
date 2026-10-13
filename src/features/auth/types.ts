export type Role = "owner" | "manager" | "member";

/** Provisional shape of `GET /auth/me` and items of `GET /users` (see README → Backend contract). */
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
