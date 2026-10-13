"use client";

import { UNASSIGNED } from "../schemas/task-schema";
import type { PersonOption, UserSummary } from "../types";
import { ALL, type StatusFilter, type TaskFilters } from "../utils/task-filters";

interface Options {
  filters: TaskFilters;
  assignees: UserSummary[];
  currentUserId: string;
  onChange: (filters: TaskFilters) => void;
}

export function useTaskFiltersBar({ filters, assignees, currentUserId, onChange }: Options) {
  const assigneeOptions: PersonOption[] = [
    { value: ALL, label: "همهٔ افراد" },
    { value: UNASSIGNED, label: "بدون مسئول" },
    ...assignees.map((person) => ({
      value: person.id,
      label: person.id === currentUserId ? `${person.fullName} (من)` : person.fullName,
      avatarName: person.fullName,
    })),
  ];
  // A shared link may point at someone this user cannot see; keep the selection representable.
  if (!assigneeOptions.some((o) => o.value === filters.assignee)) {
    assigneeOptions.push({ value: filters.assignee, label: "کاربر نامشخص" });
  }

  return {
    assigneeOptions,
    active: filters.status !== ALL || filters.assignee !== ALL,
    setStatus: (status: StatusFilter) => onChange({ ...filters, status }),
    setAssignee: (assignee: string) => onChange({ ...filters, assignee }),
    clear: () => onChange({ status: ALL, assignee: ALL }),
  };
}
