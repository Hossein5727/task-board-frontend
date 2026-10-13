import { http } from "@/lib/http/client";
import type { LoginCredentials, User } from "../types";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export async function login(credentials: LoginCredentials): Promise<void> {
  await http.post("/auth/login", credentials);
}

export async function logout(): Promise<void> {
  await http.post("/auth/logout");
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await http.get<User>("/auth/me");
  return data;
}
