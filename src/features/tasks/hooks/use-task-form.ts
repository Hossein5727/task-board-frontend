"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMutating } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/organisms/toaster";
import { useSessionUser } from "@/features/auth/hooks/use-session";
import { canAssignToOthers } from "@/features/auth/permissions";
import { toApiError } from "@/lib/http/errors";
import { taskKeys } from "../api/tasks-api";
import { taskFormSchema, toFormValues, toPayload, UNASSIGNED, type TaskFormValues } from "../schemas/task-schema";
import type { PersonOption, Task } from "../types";
import { useAssignees, useCreateTask, useUpdateTask } from "./use-tasks";

/** Closing is ignored while a save is in flight so the user sees its result. */
export function useTaskFormDialog(onClose: () => void) {
  const saving = useIsMutating({ mutationKey: taskKeys.save }) > 0;
  return { close: saving ? () => {} : onClose };
}

export function useTaskForm(task: Task | undefined, onDone: () => void) {
  const me = useSessionUser();
  const toast = useToast();
  const assignees = useAssignees();
  const create = useCreateTask();
  const update = useUpdateTask();
  const pending = create.isPending || update.isPending;
  const mutationError = create.error ?? update.error;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({ resolver: zodResolver(taskFormSchema), defaultValues: toFormValues(task) });

  const canAssign = canAssignToOthers(me.role);
  const assigneeOptions: PersonOption[] = [
    { value: UNASSIGNED, label: "بدون مسئول" },
    ...assignees
      .filter((person) => canAssign || person.id === me.id)
      .map((person) => ({
        value: person.id,
        label: person.id === me.id ? `${person.fullName} (من)` : person.fullName,
        avatarName: person.fullName,
      })),
  ];
  // Keep the current assignee selectable (e.g. a disabled user) so editing never silently reassigns.
  if (task?.assignee && !assigneeOptions.some((o) => o.value === task.assignee?.id)) {
    assigneeOptions.push({ value: task.assignee.id, label: task.assignee.fullName });
  }

  const onSubmit = handleSubmit((values) => {
    if (pending) return;
    const payload = toPayload(values);
    const onSuccess = () => {
      toast("success", task ? "تغییرات وظیفه ذخیره شد." : "وظیفه ایجاد شد.");
      onDone();
    };
    if (task) update.mutate({ id: task.id, payload }, { onSuccess });
    else create.mutate(payload, { onSuccess });
  });

  return {
    isEdit: Boolean(task),
    register,
    control,
    errors,
    onSubmit,
    pending,
    errorMessage: mutationError ? toApiError(mutationError).message : null,
    assigneeOptions,
    canAssign,
  };
}
