"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/organisms/toaster";
import { useSessionUser } from "@/features/auth/hooks/use-session";
import { canManageUsers } from "@/features/auth/permissions";
import type { User } from "@/features/auth/types";
import { toApiError } from "@/lib/http/errors";
import { useUpdateUser, useUsers } from "./use-users";

type DialogKind = "create" | "edit" | "disable";
export type UsersView = "loading" | "error" | "ready";

const TOGGLE_ERRORS = { 400: "این تغییر مجاز نیست. آخرین مالک فعال را نمی‌توان غیرفعال کرد." };

/** UI gate only; the backend enforces owner-only access to `/users`. */
export function useCanManageUsers() {
  return canManageUsers(useSessionUser().role);
}

export function useUserManagement() {
  const me = useSessionUser();
  const toast = useToast();
  const users = useUsers();
  const update = useUpdateUser();

  // `open` is separate from the target so dialog content stays rendered during the close transition.
  const [dialog, setDialog] = useState<{ kind: DialogKind; user?: User }>({ kind: "create" });
  const [open, setOpen] = useState(false);
  const show = (kind: DialogKind, user?: User) => {
    setDialog({ kind, user });
    setOpen(true);
  };
  const close = () => setOpen(false);

  const setActive = (user: User, isActive: boolean) => {
    if (update.isPending) return;
    update.mutate(
      { id: user.id, payload: { isActive } },
      {
        onSuccess: () => {
          toast("success", isActive ? `«${user.fullName}» فعال شد.` : `«${user.fullName}» غیرفعال شد.`);
          close();
        },
        onError: (error) => toast("error", toApiError(error, TOGGLE_ERRORS).message),
      },
    );
  };

  const view: UsersView = users.isPending ? "loading" : users.isError ? "error" : "ready";

  return {
    view,
    errorMessage: users.error ? toApiError(users.error).message : null,
    retry: () => void users.refetch(),
    rows: (users.data ?? []).map((user) => ({ user, isSelf: user.id === me.id })),
    selectedUser: dialog.user,
    formOpen: open && (dialog.kind === "create" || dialog.kind === "edit"),
    editingUser: dialog.kind === "edit" ? dialog.user : undefined,
    editingSelf: dialog.user?.id === me.id,
    disableOpen: open && dialog.kind === "disable",
    updating: update.isPending,
    openCreate: () => show("create"),
    openEdit: (user: User) => show("edit", user),
    askDisable: (user: User) => show("disable", user),
    activate: (user: User) => setActive(user, true),
    confirmDisable: () => dialog.user && setActive(dialog.user, false),
    closeDialog: close,
  };
}
