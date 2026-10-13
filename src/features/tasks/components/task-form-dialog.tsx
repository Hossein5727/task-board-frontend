"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMutating } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useId } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Avatar } from "@/components/ui/atoms/avatar";
import { Button } from "@/components/ui/atoms/button";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { FormAlert } from "@/components/ui/molecules/form-alert";
import { SelectField, type SelectOption } from "@/components/ui/molecules/select-field";
import { TextField } from "@/components/ui/molecules/text-field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/organisms/modal";
import { useToast } from "@/components/ui/organisms/toaster";
import { useSessionUser } from "@/features/auth/components/session-gate";
import { canAssignToOthers } from "@/features/auth/permissions";
import { toApiError } from "@/lib/http/errors";
import { taskKeys } from "../api/tasks-api";
import { useAssignees, useCreateTask, useUpdateTask } from "../hooks/use-tasks";
import { taskFormSchema, toFormValues, toPayload, UNASSIGNED, type TaskFormValues } from "../schemas/task-schema";
import type { Task } from "../types";
import { formatDueDate } from "../utils/dates";
import { priorityOptions, statusOptions } from "./task-meta";

// TipTap is the heaviest dependency; load it only when a form is opened.
const RichTextEditor = dynamic(
  () => import("@/components/ui/organisms/rich-text/rich-text-editor").then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-lg" /> },
);

interface TaskFormDialogProps {
  open: boolean;
  task?: Task;
  onClose: () => void;
}

export function TaskFormDialog({ open, task, onClose }: TaskFormDialogProps) {
  const saving = useIsMutating({ mutationKey: taskKeys.save }) > 0;
  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={task ? "ویرایش وظیفه" : "وظیفهٔ جدید"}
      description={task ? undefined : "جزئیات وظیفه را وارد کنید. فقط عنوان الزامی است."}
      size="lg"
    >
      <TaskForm key={task?.id ?? "new"} task={task} onDone={onClose} />
    </Modal>
  );
}

function TaskForm({ task, onDone }: { task?: Task; onDone: () => void }) {
  const me = useSessionUser();
  const toast = useToast();
  const assignees = useAssignees();
  const create = useCreateTask();
  const update = useUpdateTask();
  const descriptionLabelId = useId();
  const pending = create.isPending || update.isPending;
  const mutationError = create.error ?? update.error;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({ resolver: zodResolver(taskFormSchema), defaultValues: toFormValues(task) });

  const canAssign = canAssignToOthers(me.role);
  const assigneeOptions: SelectOption<string>[] = [
    { value: UNASSIGNED, label: "بدون مسئول" },
    ...assignees
      .filter((person) => canAssign || person.id === me.id)
      .map((person) => ({
        value: person.id,
        label: person.id === me.id ? `${person.fullName} (من)` : person.fullName,
        icon: <Avatar name={person.fullName} />,
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

  const dueDate = useWatch({ control, name: "dueDate" });

  return (
    <form onSubmit={onSubmit} noValidate>
      <ModalBody className="space-y-5">
        {mutationError && <FormAlert>{toApiError(mutationError).message}</FormAlert>}
        <TextField label="عنوان" autoFocus error={errors.title?.message} {...register("title")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SelectField label="وضعیت" value={field.value} onChange={field.onChange} options={statusOptions} />
            )}
          />
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <SelectField label="اولویت" value={field.value} onChange={field.onChange} options={priorityOptions} />
            )}
          />
          <Controller
            control={control}
            name="assigneeId"
            render={({ field }) => (
              <SelectField
                label="مسئول"
                value={field.value}
                onChange={field.onChange}
                options={assigneeOptions}
                hint={canAssign ? undefined : "اعضا فقط می‌توانند وظیفه را به خودشان واگذار کنند."}
              />
            )}
          />
          <TextField
            label="تاریخ سررسید"
            type="date"
            dir="ltr"
            hint={dueDate ? formatDueDate(dueDate) : "اختیاری"}
            error={errors.dueDate?.message}
            {...register("dueDate")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span id={descriptionLabelId} className="text-sm font-medium text-ink">
            توضیحات
          </span>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <RichTextEditor value={field.value} onChange={field.onChange} labelledBy={descriptionLabelId} />
            )}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="submit" loading={pending}>
          {task ? "ذخیرهٔ تغییرات" : "ایجاد وظیفه"}
        </Button>
        <Button variant="secondary" onClick={onDone} disabled={pending}>
          انصراف
        </Button>
      </ModalFooter>
    </form>
  );
}
