"use client";

import dynamic from "next/dynamic";
import { useId } from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/atoms/button";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { DatePickerField } from "@/components/ui/molecules/date-picker-field";
import { FormAlert } from "@/components/ui/molecules/form-alert";
import { SelectField } from "@/components/ui/molecules/select-field";
import { TextField } from "@/components/ui/molecules/text-field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/organisms/modal";
import { useTaskForm, useTaskFormDialog } from "../hooks/use-task-form";
import type { Task } from "../types";
import { priorityOptions, statusOptions, withAvatars } from "./task-meta";

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
  const { close } = useTaskFormDialog(onClose);
  return (
    <Modal
      open={open}
      onClose={close}
      title={task ? "ویرایش وظیفه" : "وظیفهٔ جدید"}
      description={task ? undefined : "جزئیات وظیفه را وارد کنید. فقط عنوان الزامی است."}
      size="lg"
    >
      <TaskForm key={task?.id ?? "new"} task={task} onDone={onClose} />
    </Modal>
  );
}

function TaskForm({ task, onDone }: { task?: Task; onDone: () => void }) {
  const { isEdit, register, control, errors, onSubmit, pending, errorMessage, assigneeOptions, canAssign } = useTaskForm(
    task,
    onDone,
  );
  const descriptionLabelId = useId();

  return (
    <form onSubmit={onSubmit} noValidate>
      <ModalBody className="space-y-5">
        {errorMessage && <FormAlert>{errorMessage}</FormAlert>}
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
                options={withAvatars(assigneeOptions)}
                hint={canAssign ? undefined : "اعضا فقط می‌توانند وظیفه را به خودشان واگذار کنند."}
              />
            )}
          />
          <Controller
            control={control}
            name="dueDate"
            render={({ field }) => (
              <DatePickerField
                label="تاریخ سررسید"
                value={field.value}
                onChange={field.onChange}
                hint="اختیاری"
                error={errors.dueDate?.message}
              />
            )}
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
          {isEdit ? "ذخیرهٔ تغییرات" : "ایجاد وظیفه"}
        </Button>
        <Button variant="secondary" onClick={onDone} disabled={pending}>
          انصراف
        </Button>
      </ModalFooter>
    </form>
  );
}
