import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "ایمیل را وارد کنید.").pipe(z.email("ایمیل معتبر نیست.")),
  password: z.string().min(1, "رمز عبور را وارد کنید.").max(128, "رمز عبور بیش از حد طولانی است."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
