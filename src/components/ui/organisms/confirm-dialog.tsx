"use client";

import { Button } from "../atoms/button";
import { Modal, ModalBody, ModalFooter } from "./modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, loading, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title} size="sm" role="alertdialog">
      <ModalBody>
        <div className="text-sm leading-7 text-ink-muted">{message}</div>
      </ModalBody>
      <ModalFooter>
        <Button variant="danger" loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        {/* Focus starts on the safe action. */}
        <Button variant="secondary" onClick={onClose} disabled={loading} autoFocus>
          انصراف
        </Button>
      </ModalFooter>
    </Modal>
  );
}
