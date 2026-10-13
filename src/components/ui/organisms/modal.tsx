"use client";

import { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { Button } from "../atoms/button";
import { cn } from "@/lib/utils/cn";

const SIZES = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl" } as const;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: keyof typeof SIZES;
  role?: "dialog" | "alertdialog";
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, description, size = "md", role = "dialog", children }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} role={role} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-zinc-900/40 transition-opacity duration-150 data-closed:opacity-0"
      />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center sm:items-center sm:p-4">
          <DialogPanel
            transition
            className={cn(
              "w-full rounded-t-2xl bg-surface shadow-xl ring-1 ring-line transition duration-150 ease-out data-closed:translate-y-2 data-closed:opacity-0 sm:rounded-2xl",
              SIZES[size],
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold text-ink">{title}</DialogTitle>
                {description && <Description className="mt-1 text-sm text-ink-muted">{description}</Description>}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="بستن" className="-me-2 -mt-1">
                <XMarkIcon className="size-5" aria-hidden="true" />
              </Button>
            </div>
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

export function ModalBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-line bg-zinc-50/60 px-5 py-3 sm:flex-row sm:justify-start rounded-b-2xl">
      {children}
    </div>
  );
}
