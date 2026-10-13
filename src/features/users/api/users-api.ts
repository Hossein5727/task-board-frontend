import type { User } from "@/features/auth/types";
import { http } from "@/lib/http/client";
import type { CreateUserPayload, UpdateUserPayload } from "../types";

export const userKeys = {
  all: ["users"] as const,
  list: () => [...userKeys.all, "list"] as const,
};

export async function listUsers(): Promise<User[]> {
  const { data } = await http.get<User[]>("/users");
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await http.post<User>("/users", payload);
  return data;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const { data } = await http.patch<User>(`/users/${encodeURIComponent(id)}`, payload);
  return data;
}
