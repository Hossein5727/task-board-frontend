"use client";

import { PencilSquareIcon, TrashIcon } from "@heroicons/react/20/solid";
import dynamic from "next/dynamic";
import { Avatar } from "@/components/ui/atoms/avatar";
import { Button } from "@/components/ui/atoms/button";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { FormAlert } from "@/components/ui/molecules/form-alert";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/organisms/modal";
import { toApiError } from "@/lib/http/errors";
import { useTask } from "../hooks/use-tasks";
import type { Task } from "../types";
import { DueDateBadge, PriorityBadge, StatusBadge } from "./task-meta";

const RichTextViewer = dynamic(
  () => import("@/components/ui/organisms/rich-text/rich-text-viewer").then((m) => m.RichTextViewer),
  { ssr: false, loading: () => <Skeleton className="h-16" /> },
);

interface TaskDetailsDialogProps {
  open: boolean;
  task?: Task;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskDetailsDialog({ open, task, canDelete, onClose, onEdit, onDelete }: TaskDetailsDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={task?.title ?? ""} size="lg">
      {task && <TaskDetails initial={task} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />}
    </Modal>
  );
}

function TaskDetails({
  initial,
  canDelete,
  onEdit,
  onDelete,
}: {
  initial: Task;
  canDelete: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  // Fetch the single task so the dialog reflects the latest server state, showing list data meanwhile.
  const { data: task = initial, error } = useTask(initial.id, initial);

  return (
    <>
      <ModalBody className="space-y-5">
        {error && <FormAlert>{toApiError(error).message}</FormAlert>}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-zinc-50 p-4 text-sm ring-1 ring-line sm:grid-cols-3">
          <Detail label="وضعیت">
            <StatusBadge status={task.status} />
          </Detail>
          <Detail label="اولویت">
            <PriorityBadge priority={task.priority} />
          </Detail>
          <Detail label="سررسید">
            {task.dueDate ? <DueDateBadge dueDate={task.dueDate} done={task.status === "done"} /> : "—"}
          </Detail>
          <Detail label="مسئول">
            {task.assignee ? (
              <span className="flex items-center gap-1.5">
                <Avatar name={task.assignee.fullName} />
                {task.assignee.fullName}
              </span>
            ) : (
              <span className="text-ink-subtle">بدون مسئول</span>
            )}
          </Detail>
          {task.createdBy && <Detail label="ایجادکننده">{task.createdBy.fullName}</Detail>}
        </dl>
        <section aria-labelledby="task-description-heading">
          <h3 id="task-description-heading" className="mb-2 text-sm font-semibold text-ink">
            توضیحات
          </h3>
          <RichTextViewer value={task.description} />
        </section>
      </ModalBody>
      <ModalFooter>
        <Button onClick={() => onEdit(task)}>
          <PencilSquareIcon className="size-4" aria-hidden="true" />
          ویرایش
        </Button>
        {canDelete && (
          <Button variant="secondary" className="text-rose-700" onClick={() => onDelete(task)}>
            <TrashIcon className="size-4" aria-hidden="true" />
            حذف
          </Button>
        )}
      </ModalFooter>
    </>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-ink-subtle">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}
