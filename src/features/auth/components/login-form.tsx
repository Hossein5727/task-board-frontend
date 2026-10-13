"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/atoms/button";
import { FormAlert } from "@/components/ui/molecules/form-alert";
import { TextField } from "@/components/ui/molecules/text-field";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { toApiError } from "@/lib/http/errors";
import { useLogin } from "../hooks/use-session";
import { loginSchema, type LoginFormValues } from "../schemas/login-schema";

const LOGIN_ERRORS = {
  401: "ایمیل یا رمز عبور نادرست است.",
  403: "حساب کاربری شما غیرفعال است. با مالک سیستم تماس بگیرید.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: () => router.replace(safeNextPath(searchParams.get("next"))),
    }),
  );

  const sessionExpired = searchParams.get("reason") === "expired" && !login.error;
  const errorMessage = login.error ? toApiError(login.error, LOGIN_ERRORS).message : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {sessionExpired && <FormAlert tone="info">برای ادامه، لطفاً دوباره وارد حساب کاربری خود شوید.</FormAlert>}
      {errorMessage && <FormAlert>{errorMessage}</FormAlert>}
      <TextField
        label="ایمیل"
        type="email"
        dir="ltr"
        autoComplete="username"
        inputMode="email"
        placeholder="name@company.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label="رمز عبور"
        type="password"
        dir="ltr"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" className="w-full" loading={login.isPending || login.isSuccess}>
        ورود
      </Button>
    </form>
  );
}
