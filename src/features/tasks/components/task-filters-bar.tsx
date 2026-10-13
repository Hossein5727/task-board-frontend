"use client";

import { XMarkIcon } from "@heroicons/react/20/solid";
import { Avatar } from "@/components/ui/atoms/avatar";
import { Button } from "@/components/ui/atoms/button";
import { SelectField, type SelectOption } from "@/components/ui/molecules/select-field";
import { UNASSIGNED } from "../schemas/task-schema";
import type { UserSummary } from "../types";
import { ALL, type StatusFilter, type TaskFilters } from "../utils/task-filters";
import { statusOptions } from "./task-meta";

interface TaskFiltersBarProps {
  filters: TaskFilters;
  assignees: UserSummary[];
  currentUserId: string;
  onChange: (filters: TaskFilters) => void;
}

export function TaskFiltersBar({ filters, assignees, currentUserId, onChange }: TaskFiltersBarProps) {
  const statusFilterOptions: SelectOption<StatusFilter>[] = [{ value: ALL, label: "همهٔ وضعیت‌ها" }, ...statusOptions];
  const assigneeOptions: SelectOption<string>[] = [
    { value: ALL, label: "همهٔ افراد" },
    { value: UNASSIGNED, label: "بدون مسئول" },
    ...assignees.map((person) => ({
      value: person.id,
      label: person.id === currentUserId ? `${person.fullName} (من)` : person.fullName,
      icon: <Avatar name={person.fullName} />,
    })),
  ];
  // A shared link may point at someone this user cannot see; keep the selection representable.
  if (!assigneeOptions.some((o) => o.value === filters.assignee)) {
    assigneeOptions.push({ value: filters.assignee, label: "کاربر نامشخص" });
  }

  const active = filters.status !== ALL || filters.assignee !== ALL;

  return (
    <div role="search" aria-label="فیلتر وظایف" className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <SelectField
        label="وضعیت"
        className="sm:w-48"
        value={filters.status}
        onChange={(status) => onChange({ ...filters, status })}
        options={statusFilterOptions}
      />
      <SelectField
        label="مسئول"
        className="sm:w-56"
        value={filters.assignee}
        onChange={(assignee) => onChange({ ...filters, assignee })}
        options={assigneeOptions}
      />
      {active && (
        <Button variant="ghost" onClick={() => onChange({ status: ALL, assignee: ALL })} className="self-start sm:self-auto">
          <XMarkIcon className="size-4" aria-hidden="true" />
          حذف فیلترها
        </Button>
      )}
    </div>
  );
}
