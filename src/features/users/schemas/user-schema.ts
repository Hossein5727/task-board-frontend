import { z } from "zod";

const fullName = z.string().trim().min(2, "نام باید حداقل ۲ کاراکتر باشد.").max(100, "نام حداکثر ۱۰۰ کاراکتر است.");

export const createUserSchema = z.object({
  fullName,
  email: z.string().trim().min(1, "ایمیل را وارد کنید.").pipe(z.email("ایمیل معتبر نیست.")),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد.").max(128, "رمز عبور حداکثر ۱۲۸ کاراکتر است."),
  role: z.enum(["manager", "member"]),
});

export const editUserSchema = z.object({
  fullName,
  role: z.enum(["owner", "manager", "member"]),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;
export type EditUserValues = z.infer<typeof editUserSchema>;
