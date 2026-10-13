"use client";

import { XMarkIcon } from "@heroicons/react/20/solid";
import { Button } from "@/components/ui/atoms/button";
import { SelectField, type SelectOption } from "@/components/ui/molecules/select-field";
import { useTaskFiltersBar } from "../hooks/use-task-filters-bar";
import type { UserSummary } from "../types";
import { ALL, type StatusFilter, type TaskFilters } from "../utils/task-filters";
import { statusOptions, withAvatars } from "./task-meta";

const statusFilterOptions: SelectOption<StatusFilter>[] = [{ value: ALL, label: "همهٔ وضعیت‌ها" }, ...statusOptions];

interface TaskFiltersBarProps {
  filters: TaskFilters;
  assignees: UserSummary[];
  currentUserId: string;
  onChange: (filters: TaskFilters) => void;
}

export function TaskFiltersBar(props: TaskFiltersBarProps) {
  const { assigneeOptions, active, setStatus, setAssignee, clear } = useTaskFiltersBar(props);

  return (
    <div role="search" aria-label="فیلتر وظایف" className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <SelectField
        label="وضعیت"
        className="sm:w-48"
        value={props.filters.status}
        onChange={setStatus}
        options={statusFilterOptions}
      />
      <SelectField
        label="مسئول"
        className="sm:w-56"
        value={props.filters.assignee}
        onChange={setAssignee}
        options={withAvatars(assigneeOptions)}
      />
      {active && (
        <Button variant="ghost" onClick={clear} className="self-start sm:self-auto">
          <XMarkIcon className="size-4" aria-hidden="true" />
          حذف فیلترها
        </Button>
      )}
    </div>
  );
}
