"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ArrowRightStartOnRectangleIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { Avatar } from "@/components/ui/atoms/avatar";
import { useLogout } from "../hooks/use-session";
import { ROLE_LABELS } from "../permissions";
import { useSessionUser } from "./session-gate";

export function UserMenu() {
  const user = useSessionUser();
  const logout = useLogout();

  return (
    <Menu>
      <MenuButton className="flex items-center gap-2 rounded-lg p-1 pe-2 text-sm hover:bg-zinc-100 data-open:bg-zinc-100">
        <Avatar name={user.fullName} size="md" />
        <span className="hidden max-w-36 truncate font-medium text-ink sm:block">{user.fullName}</span>
        <span className="sr-only sm:hidden">منوی حساب کاربری</span>
        <ChevronDownIcon className="size-4 text-ink-subtle" aria-hidden="true" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        transition
        className="z-40 w-60 rounded-xl bg-surface p-1 shadow-lg ring-1 ring-line [--anchor-gap:6px] focus:outline-none transition duration-100 ease-out data-closed:opacity-0"
      >
        <div className="border-b border-line px-3 py-2.5">
          <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
          <p className="truncate text-xs text-ink-muted" dir="ltr">
            {user.email}
          </p>
          <p className="mt-1 text-xs text-ink-subtle">نقش: {ROLE_LABELS[user.role]}</p>
        </div>
        <MenuItem>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-700 data-focus:bg-rose-50"
          >
            <ArrowRightStartOnRectangleIcon className="size-4 rotate-180" aria-hidden="true" />
            {logout.isPending ? "در حال خروج…" : "خروج از حساب"}
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
