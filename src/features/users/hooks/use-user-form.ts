"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/organisms/toaster";
import type { User } from "@/features/auth/types";
import { toApiError } from "@/lib/http/errors";
import { createUserSchema, editUserSchema, type CreateUserValues, type EditUserValues } from "../schemas/user-schema";
import { useCreateUser, useUpdateUser } from "./use-users";

const USER_ERRORS = {
  409: "کاربری با این ایمیل وجود دارد.",
  400: "تغییر انجام نشد. توجه کنید که آخرین مالک فعال را نمی‌توان غیرفعال کرد یا نقش او را تغییر داد.",
};

export function useCreateUserForm(onDone: () => void) {
  const toast = useToast();
  const create = useCreateUser();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: "", email: "", password: "", role: "member" },
  });

  const onSubmit = handleSubmit((values) => {
    if (create.isPending) return;
    create.mutate(values, {
      onSuccess: () => {
        toast("success", "کاربر ایجاد شد.");
        onDone();
      },
    });
  });

  return {
    register,
    control,
    errors,
    onSubmit,
    pending: create.isPending,
    errorMessage: create.error ? toApiError(create.error, USER_ERRORS).message : null,
  };
}

export function useEditUserForm(user: User, onDone: () => void) {
  const toast = useToast();
  const update = useUpdateUser();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { fullName: user.fullName, role: user.role },
  });

  const onSubmit = handleSubmit((values) => {
    if (update.isPending) return;
    // Send only changed fields so a name edit can never accidentally touch the role.
    const payload = {
      ...(dirtyFields.fullName && { fullName: values.fullName }),
      ...(dirtyFields.role && { role: values.role }),
    };
    if (!Object.keys(payload).length) return onDone();
    update.mutate(
      { id: user.id, payload },
      {
        onSuccess: () => {
          toast("success", "اطلاعات کاربر ذخیره شد.");
          onDone();
        },
      },
    );
  });

  return {
    register,
    control,
    errors,
    onSubmit,
    pending: update.isPending,
    errorMessage: update.error ? toApiError(update.error, USER_ERRORS).message : null,
  };
}
