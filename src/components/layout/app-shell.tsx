"use client";

import { RectangleStackIcon, UsersIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/atoms/logo";
import { useSessionUser } from "@/features/auth/components/session-gate";
import { UserMenu } from "@/features/auth/components/user-menu";
import { canManageUsers } from "@/features/auth/permissions";
import { cn } from "@/lib/utils/cn";

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useSessionUser();
  const pathname = usePathname();

  const links = [
    { href: "/tasks", label: "وظایف", icon: RectangleStackIcon },
    ...(canManageUsers(user.role) ? [{ href: "/users", label: "کاربران", icon: UsersIcon }] : []),
  ];

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        پرش به محتوای اصلی
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <Link href="/tasks" aria-label="تخته وظایف — صفحهٔ اصلی" className="rounded-lg">
            <Logo className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
          </Link>
          <nav aria-label="ناوبری اصلی" className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-brand-50 text-brand-800" : "text-ink-muted hover:bg-zinc-100 hover:text-ink",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="ms-auto">
            <UserMenu />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
