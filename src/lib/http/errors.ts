import { isAxiosError } from "axios";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: "اطلاعات ارسال‌شده معتبر نیست. لطفاً فیلدها را بررسی کنید.",
  401: "نشست شما به پایان رسیده است. لطفاً دوباره وارد شوید.",
  403: "شما اجازهٔ انجام این کار را ندارید.",
  404: "مورد درخواستی پیدا نشد یا به آن دسترسی ندارید.",
  409: "این تغییر با وضعیت فعلی داده‌ها سازگار نیست.",
  422: "اطلاعات ارسال‌شده معتبر نیست. لطفاً فیلدها را بررسی کنید.",
  429: "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.",
};

const NETWORK_MESSAGE = "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کرده و دوباره تلاش کنید.";
const SERVER_MESSAGE = "خطایی در سرور رخ داد. لطفاً کمی بعد دوباره تلاش کنید.";

/**
 * Normalizes any thrown value into a Persian, user-safe ApiError.
 * Backend messages are intentionally not shown: they are English and may contain internal details.
 */
export function toApiError(error: unknown, overrides: Partial<Record<number, string>> = {}): ApiError {
  if (error instanceof ApiError) return error;
  if (isAxiosError(error)) {
    const status = error.response?.status ?? null;
    if (status === null) return new ApiError(NETWORK_MESSAGE, null);
    const message = overrides[status] ?? STATUS_MESSAGES[status] ?? SERVER_MESSAGE;
    return new ApiError(message, status);
  }
  return new ApiError(SERVER_MESSAGE, null);
}

export function getStatus(error: unknown): number | null {
  if (error instanceof ApiError) return error.status;
  if (isAxiosError(error)) return error.response?.status ?? null;
  return null;
}

/** Only network failures and 5xx/429 are worth retrying; never auth or validation errors. */
export function isRetryable(error: unknown): boolean {
  const status = getStatus(error);
  return status === null || status === 429 || status >= 500;
}
