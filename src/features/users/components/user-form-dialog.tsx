"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/atoms/button";
import { FormAlert } from "@/components/ui/molecules/form-alert";
import { SelectField, type SelectOption } from "@/components/ui/molecules/select-field";
import { TextField } from "@/components/ui/molecules/text-field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/organisms/modal";
import { useToast } from "@/components/ui/organisms/toaster";
import { ROLE_LABELS } from "@/features/auth/permissions";
import type { Role, User } from "@/features/auth/types";
import { toApiError } from "@/lib/http/errors";
import { useCreateUser, useUpdateUser } from "../hooks/use-users";
import {
  createUserSchema,
  editUserSchema,
  type CreateUserValues,
  type EditUserValues,
} from "../schemas/user-schema";

const USER_ERRORS = {
  409: "کاربری با این ایمیل وجود دارد.",
  400: "تغییر انجام نشد. توجه کنید که آخرین مالک فعال را نمی‌توان غیرفعال کرد یا نقش او را تغییر داد.",
};

const roleOptions = <R extends Role>(roles: R[]): SelectOption<R>[] =>
  roles.map((value) => ({ value, label: ROLE_LABELS[value] }));

interface UserFormDialogProps {
  open: boolean;
  user?: User;
  isSelf: boolean;
  onClose: () => void;
}

export function UserFormDialog({ open, user, isSelf, onClose }: UserFormDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={user ? "ویرایش کاربر" : "کاربر جدید"}>
      {user ? (
        <EditUserForm key={user.id} user={user} isSelf={isSelf} onDone={onClose} />
      ) : (
        <CreateUserForm onDone={onClose} />
      )}
    </Modal>
  );
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
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

  return (
    <form onSubmit={onSubmit} noValidate>
      <ModalBody className="space-y-4">
        {create.error && <FormAlert>{toApiError(create.error, USER_ERRORS).message}</FormAlert>}
        <TextField label="نام و نام خانوادگی" autoFocus error={errors.fullName?.message} {...register("fullName")} />
        <TextField
          label="ایمیل"
          type="email"
          dir="ltr"
          autoComplete="off"
          error={errors.email?.message}
          {...register("email")}
        />
        <TextField
          label="رمز عبور اولیه"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          hint="حداقل ۸ کاراکتر. آن را از راهی امن به کاربر اطلاع دهید."
          error={errors.password?.message}
          {...register("password")}
        />
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <SelectField
              label="نقش"
              value={field.value}
              onChange={field.onChange}
              options={roleOptions(["manager", "member"])}
            />
          )}
        />
      </ModalBody>
      <ModalFooter>
        <Button type="submit" loading={create.isPending}>
          ایجاد کاربر
        </Button>
        <Button variant="secondary" onClick={onDone} disabled={create.isPending}>
          انصراف
        </Button>
      </ModalFooter>
    </form>
  );
}

function EditUserForm({ user, isSelf, onDone }: { user: User; isSelf: boolean; onDone: () => void }) {
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

  return (
    <form onSubmit={onSubmit} noValidate>
      <ModalBody className="space-y-4">
        {update.error && <FormAlert>{toApiError(update.error, USER_ERRORS).message}</FormAlert>}
        <TextField label="نام و نام خانوادگی" autoFocus error={errors.fullName?.message} {...register("fullName")} />
        <TextField label="ایمیل" value={user.email} dir="ltr" disabled readOnly hint="ایمیل قابل تغییر نیست." />
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <SelectField
              label="نقش"
              value={field.value}
              onChange={field.onChange}
              options={roleOptions(["owner", "manager", "member"])}
              disabled={isSelf}
              hint={isSelf ? "نقش خودتان را نمی‌توانید از اینجا تغییر دهید." : undefined}
            />
          )}
        />
      </ModalBody>
      <ModalFooter>
        <Button type="submit" loading={update.isPending}>
          ذخیرهٔ تغییرات
        </Button>
        <Button variant="secondary" onClick={onDone} disabled={update.isPending}>
          انصراف
        </Button>
      </ModalFooter>
    </form>
  );
}