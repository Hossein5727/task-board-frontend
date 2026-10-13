import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { httpError } from "@/test/utils";
import { isRetryable, toApiError } from "./errors";

describe("toApiError", () => {
  it("maps statuses to Persian messages and keeps the status", () => {
    const error = toApiError(httpError(403));
    expect(error.status).toBe(403);
    expect(error.message).toBe("شما اجازهٔ انجام این کار را ندارید.");
  });

  it("supports per-call overrides", () => {
    expect(toApiError(httpError(401), { 401: "ایمیل یا رمز عبور نادرست است." }).message).toBe(
      "ایمیل یا رمز عبور نادرست است.",
    );
  });

  it("never leaks backend or exception text", () => {
    const leaky = httpError(500);
    leaky.response!.data = { message: "QueryFailedError: relation users at db-internal:5432" };
    expect(toApiError(leaky).message).not.toMatch(/QueryFailed|5432/);
    expect(toApiError(new Error("stack trace here")).message).not.toMatch(/stack/);
  });

  it("treats missing responses as network errors", () => {
    expect(toApiError(new AxiosError("Network Error")).message).toMatch(/ارتباط با سرور/);
  });
});

describe("isRetryable", () => {
  it("retries only network, 429 and 5xx failures", () => {
    expect(isRetryable(new AxiosError("Network Error"))).toBe(true);
    expect(isRetryable(httpError(503))).toBe(true);
    expect(isRetryable(httpError(429))).toBe(true);
    for (const status of [400, 401, 403, 404, 409, 422]) expect(isRetryable(httpError(status))).toBe(false);
  });
});
