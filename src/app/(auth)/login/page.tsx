import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/ui/atoms/logo";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "ورود" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Logo className="mb-8" />
        <h1 className="text-xl font-bold text-ink">ورود به حساب کاربری</h1>
        <p className="mt-1.5 mb-8 text-sm text-ink-muted">برای مدیریت وظایف تیم، با ایمیل و رمز عبور خود وارد شوید.</p>
        <div className="rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-line">
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-xs leading-6 text-ink-subtle">
          حساب کاربری فقط توسط مالک سیستم ایجاد می‌شود. در صورت نیاز با مالک تیم تماس بگیرید.
        </p>
      </div>
    </main>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
      <Skeleton className="h-10" />
    </div>
  );
}
