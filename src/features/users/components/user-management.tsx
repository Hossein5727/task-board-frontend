"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  EllipsisVerticalIcon,
  LockClosedIcon,
  LockOpenIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  UserPlusIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";
import { Avatar } from "@/components/ui/atoms/avatar";
import { Badge } from "@/components/ui/atoms/badge";
import { Button } from "@/components/ui/atoms/button";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { ErrorState, StateMessage } from "@/components/ui/molecules/state-message";
import { ConfirmDialog } from "@/components/ui/organisms/confirm-dialog";
import { useToast } from "@/components/ui/organisms/toaster";
import { useSessionUser } from "@/features/auth/components/session-gate";
import { canManageUsers, ROLE_LABELS } from "@/features/auth/permissions";
import type { User } from "@/features/auth/types";
import { toApiError } from "@/lib/http/errors";
import { cn } from "@/lib/utils/cn";
import { useUpdateUser, useUsers } from "../hooks/use-users";
import { UserFormDialog } from "./user-form-dialog";

type DialogKind = "create" | "edit" | "disable";

const TOGGLE_ERRORS = { 400: "این تغییر مجاز نیست. آخرین مالک فعال را نمی‌توان غیرفعال کرد." };

export function UserManagement() {
  const me = useSessionUser();
  if (!canManageUsers(me.role)) {
    return (
      <StateMessage
        icon={<NoSymbolIcon aria-hidden="true" />}
        title="دسترسی ندارید"
        description="مدیریت کاربران فقط برای مالک سیستم در دسترس است."
      />
    );
  }
  return <UserManagementContent me={me} />;
}

function UserManagementContent({ me }: { me: User }) {
  const toast = useToast();
  const users = useUsers();
  const update = useUpdateUser();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">کاربران</h1>
          <p className="mt-1 text-sm text-ink-muted">ایجاد کاربر، تغییر نقش و غیرفعال‌سازی حساب‌ها.</p>
        </div>
        <Button onClick={() => show("create")}>
          <UserPlusIcon className="size-4" aria-hidden="true" />
          کاربر جدید
        </Button>
      </div>

      {users.isPending ? (
        <div className="space-y-2" role="status" aria-label="در حال بارگذاری کاربران">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : users.isError ? (
        <ErrorState message={toApiError(users.error).message} onRetry={() => users.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-xl bg-surface ring-1 ring-line">
          <table className="w-full text-sm">
            <caption className="sr-only">فهرست کاربران</caption>
            <thead className="border-b border-line bg-zinc-50 text-xs text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-start font-medium">
                  کاربر
                </th>
                <th scope="col" className="hidden px-4 py-2.5 text-start font-medium sm:table-cell">
                  نقش
                </th>
                <th scope="col" className="hidden px-4 py-2.5 text-start font-medium sm:table-cell">
                  وضعیت
                </th>
                <th scope="col" className="w-12 px-4 py-2.5">
                  <span className="sr-only">عملیات</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.data.map((user) => {
                const isSelf = user.id === me.id;
                return (
                  <tr key={user.id} className={cn(!user.isActive && "bg-zinc-50/70")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.fullName} size="md" className={cn(!user.isActive && "opacity-50")} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">
                            {user.fullName}
                            {isSelf && <span className="ms-1 text-xs font-normal text-ink-subtle">(شما)</span>}
                          </p>
                          <p className="truncate text-xs text-ink-muted" dir="ltr">
                            {user.email}
                          </p>
                          <div className="mt-1.5 flex gap-1.5 sm:hidden">
                            <RoleBadge user={user} />
                            <StatusBadge active={user.isActive} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <RoleBadge user={user} />
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <StatusBadge active={user.isActive} />
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Menu>
                        <MenuButton
                          aria-label={`گزینه‌های کاربر «${user.fullName}»`}
                          className="grid size-8 place-items-center rounded-md text-ink-subtle hover:bg-zinc-100 hover:text-ink data-open:bg-zinc-100"
                        >
                          <EllipsisVerticalIcon className="size-4" aria-hidden="true" />
                        </MenuButton>
                        <MenuItems
                          anchor="bottom end"
                          transition
                          className="z-40 w-48 rounded-xl bg-surface p-1 shadow-lg ring-1 ring-line [--anchor-gap:4px] focus:outline-none transition duration-100 ease-out data-closed:opacity-0"
                        >
                          <MenuItem>
                            <button type="button" className={itemClass} onClick={() => show("edit", user)}>
                              <PencilSquareIcon className="size-4 text-ink-subtle" aria-hidden="true" />
                              ویرایش
                            </button>
                          </MenuItem>
                          {!isSelf && (
                            <MenuItem>
                              {user.isActive ? (
                                <button
                                  type="button"
                                  className={cn(itemClass, "text-rose-700 data-focus:bg-rose-50")}
                                  onClick={() => show("disable", user)}
                                >
                                  <LockClosedIcon className="size-4" aria-hidden="true" />
                                  غیرفعال‌سازی
                                </button>
                              ) : (
                                <button type="button" className={itemClass} onClick={() => setActive(user, true)}>
                                  <LockOpenIcon className="size-4 text-ink-subtle" aria-hidden="true" />
                                  فعال‌سازی
                                </button>
                              )}
                            </MenuItem>
                          )}
                        </MenuItems>
                      </Menu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <UserFormDialog
        open={open && (dialog.kind === "create" || dialog.kind === "edit")}
        user={dialog.kind === "edit" ? dialog.user : undefined}
        isSelf={dialog.user?.id === me.id}
        onClose={close}
      />
      <ConfirmDialog
        open={open && dialog.kind === "disable"}
        title="غیرفعال‌سازی کاربر"
        message={
          <>
            «<strong className="font-semibold text-ink">{dialog.user?.fullName}</strong>» دیگر نمی‌تواند وارد شود و
            نشست‌های فعلی او باید توسط سرور باطل شود. هر زمان می‌توانید دوباره او را فعال کنید.
          </>
        }
        confirmLabel="غیرفعال‌سازی"
        loading={update.isPending}
        onConfirm={() => dialog.user && setActive(dialog.user, false)}
        onClose={close}
      />
    </div>
  );
}

const itemClass =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-ink data-focus:bg-zinc-100";

function RoleBadge({ user }: { user: User }) {
  return (
    <Badge
      className={
        user.role === "owner" ? "bg-brand-50 text-brand-800 ring-brand-200" : "bg-surface text-ink-muted ring-line"
      }
    >
      {ROLE_LABELS[user.role]}
    </Badge>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge className="bg-emerald-50 text-emerald-800 ring-emerald-200">
      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      فعال
    </Badge>
  ) : (
    <Badge className="bg-zinc-100 text-zinc-700 ring-zinc-300">
      <span className="size-1.5 rounded-full bg-zinc-400" aria-hidden="true" />
      غیرفعال
    </Badge>
  );
}
