"use client";

import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/atoms/button";
import { FormAlert } from "@/components/ui/molecules/form-alert";
import { SelectField, type SelectOption } from "@/components/ui/molecules/select-field";
import { TextField } from "@/components/ui/molecules/text-field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/organisms/modal";
import { ROLE_LABELS } from "@/features/auth/permissions";
import type { Role, User } from "@/features/auth/types";
import { useCreateUserForm, useEditUserForm } from "../hooks/use-user-form";

const roleOptions = <R extends Role>(roles: R[]): SelectOption<R>[] =>
  roles.map((value) => ({ value, label: ROLE_LABELS[value] }));
const createRoleOptions = roleOptions(["manager", "member"]);
const editRoleOptions = roleOptions(["owner", "manager", "member"]);

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
  const { register, control, errors, onSubmit, pending, errorMessage } = useCreateUserForm(onDone);

  return (
    <form onSubmit={onSubmit} noValidate>
      <ModalBody className="space-y-4">
        {errorMessage && <FormAlert>{errorMessage}</FormAlert>}
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
            <SelectField label="نقش" value={field.value} onChange={field.onChange} options={createRoleOptions} />
          )}
        />
      </ModalBody>
      <ModalFooter>
        <Button type="submit" loading={pending}>
          ایجاد کاربر
        </Button>
        <Button variant="secondary" onClick={onDone} disabled={pending}>
          انصراف
        </Button>
      </ModalFooter>
    </form>
  );
}

function EditUserForm({ user, isSelf, onDone }: { user: User; isSelf: boolean; onDone: () => void }) {
  const { register, control, errors, onSubmit, pending, errorMessage } = useEditUserForm(user, onDone);

  return (
    <form onSubmit={onSubmit} noValidate>
      <ModalBody className="space-y-4">
        {errorMessage && <FormAlert>{errorMessage}</FormAlert>}
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
              options={editRoleOptions}
              disabled={isSelf}
              hint={isSelf ? "نقش خودتان را نمی‌توانید از اینجا تغییر دهید." : undefined}
            />
          )}
        />
      </ModalBody>
      <ModalFooter>
        <Button type="submit" loading={pending}>
          ذخیرهٔ تغییرات
        </Button>
        <Button variant="secondary" onClick={onDone} disabled={pending}>
          انصراف
        </Button>
      </ModalFooter>
    </form>
  );
}
