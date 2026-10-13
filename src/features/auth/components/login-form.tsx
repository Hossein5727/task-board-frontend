"use client";

import { Button } from "@/components/ui/atoms/button";
import { FormAlert } from "@/components/ui/molecules/form-alert";
import { TextField } from "@/components/ui/molecules/text-field";
import { useLoginForm } from "../hooks/use-login-form";

export function LoginForm() {
  const { register, errors, onSubmit, submitting, sessionExpired, errorMessage } = useLoginForm();

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
      <Button type="submit" className="w-full" loading={submitting}>
        ورود
      </Button>
    </form>
  );
}
