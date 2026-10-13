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
import { Avatar } from "@/components/ui/atoms/avatar";
import { Badge } from "@/components/ui/atoms/badge";
import { Button } from "@/components/ui/atoms/button";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { ErrorState, StateMessage } from "@/components/ui/molecules/state-message";
import { ConfirmDialog } from "@/components/ui/organisms/confirm-dialog";
import { ROLE_LABELS } from "@/features/auth/permissions";
import type { User } from "@/features/auth/types";
import { cn } from "@/lib/utils/cn";
import { useCanManageUsers, useUserManagement } from "../hooks/use-user-management";
import { UserFormDialog } from "./user-form-dialog";

export function UserManagement() {
  if (!useCanManageUsers()) {
    return (
      <StateMessage
        icon={<NoSymbolIcon aria-hidden="true" />}
        title="دسترسی ندارید"
        description="مدیریت کاربران فقط برای مالک سیستم در دسترس است."
      />
    );
  }
  return <UserManagementContent />;
}

function UserManagementContent() {
  const m = useUserManagement();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">کاربران</h1>
          <p className="mt-1 text-sm text-ink-muted">ایجاد کاربر، تغییر نقش و غیرفعال‌سازی حساب‌ها.</p>
        </div>
        <Button onClick={m.openCreate}>
          <UserPlusIcon className="size-4" aria-hidden="true" />
          کاربر جدید
        </Button>
      </div>

      {m.view === "loading" ? (
        <div className="space-y-2" role="status" aria-label="در حال بارگذاری کاربران">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : m.view === "error" ? (
        <ErrorState message={m.errorMessage ?? ""} onRetry={m.retry} />
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
              {m.rows.map(({ user, isSelf }) => {
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
                            <button type="button" className={itemClass} onClick={() => m.openEdit(user)}>
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
                                  onClick={() => m.askDisable(user)}
                                >
                                  <LockClosedIcon className="size-4" aria-hidden="true" />
                                  غیرفعال‌سازی
                                </button>
                              ) : (
                                <button type="button" className={itemClass} onClick={() => m.activate(user)}>
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

      <UserFormDialog open={m.formOpen} user={m.editingUser} isSelf={m.editingSelf} onClose={m.closeDialog} />
      <ConfirmDialog
        open={m.disableOpen}
        title="غیرفعال‌سازی کاربر"
        message={
          <>
            «<strong className="font-semibold text-ink">{m.selectedUser?.fullName}</strong>» دیگر نمی‌تواند وارد شود و
            نشست‌های فعلی او باید توسط سرور باطل شود. هر زمان می‌توانید دوباره او را فعال کنید.
          </>
        }
        confirmLabel="غیرفعال‌سازی"
        loading={m.updating}
        onConfirm={m.confirmDisable}
        onClose={m.closeDialog}
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
