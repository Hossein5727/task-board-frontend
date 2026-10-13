"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { toApiError } from "@/lib/http/errors";
import { loginSchema, type LoginFormValues } from "../schemas/login-schema";
import { useLogin } from "./use-session";

const LOGIN_ERRORS = {
  401: "ایمیل یا رمز عبور نادرست است.",
  403: "حساب کاربری شما غیرفعال است. با مالک سیستم تماس بگیرید.",
};

export function useLoginForm() {
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

  return {
    register,
    errors,
    onSubmit,
    // Stays busy after success until the redirect lands, preventing a second submit.
    submitting: login.isPending || login.isSuccess,
    sessionExpired: searchParams.get("reason") === "expired" && !login.error,
    errorMessage: login.error ? toApiError(login.error, LOGIN_ERRORS).message : null,
  };
}
