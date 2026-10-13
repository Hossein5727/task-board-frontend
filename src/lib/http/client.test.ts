import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, setSessionExpiredHandler } from "./client";

type Responder = (config: InternalAxiosRequestConfig) => number;

function installBackend(statusFor: Responder) {
  const calls: string[] = [];
  http.defaults.adapter = async (config) => {
    calls.push(`${config.method?.toUpperCase()} ${config.url}`);
    const status = statusFor(config);
    const response = { status, statusText: "", data: {}, headers: {}, config } as AxiosResponse;
    if (status >= 400) throw new AxiosError(`HTTP ${status}`, "ERR_BAD_RESPONSE", config, null, response);
    return response;
  };
  return calls;
}

describe("http client auth handling", () => {
  const expired = vi.fn();
  beforeEach(() => setSessionExpiredHandler(expired));
  afterEach(() => expired.mockReset());

  it("refreshes once on 401 and retries the original request", async () => {
    let refreshed = false;
    const calls = installBackend((c) => {
      if (c.url === "/auth/refresh") return (refreshed = true), 200;
      return refreshed ? 200 : 401;
    });

    await expect(http.get("/todos")).resolves.toMatchObject({ status: 200 });
    expect(calls).toEqual(["GET /todos", "POST /auth/refresh", "GET /todos"]);
    expect(expired).not.toHaveBeenCalled();
  });

  it("shares one refresh between concurrent 401s", async () => {
    let refreshed = false;
    const calls = installBackend((c) => {
      if (c.url === "/auth/refresh") return (refreshed = true), 200;
      return refreshed ? 200 : 401;
    });

    await Promise.all([http.get("/todos"), http.get("/auth/me"), http.get("/users")]);
    expect(calls.filter((c) => c === "POST /auth/refresh")).toHaveLength(1);
  });

  it("signals session expiry without looping when refresh fails", async () => {
    const calls = installBackend(() => 401);

    await expect(http.get("/todos")).rejects.toMatchObject({ response: { status: 401 } });
    expect(calls).toEqual(["GET /todos", "POST /auth/refresh"]);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("gives up if the retried request is still 401 (e.g. disabled user)", async () => {
    const calls = installBackend((c) => (c.url === "/auth/refresh" ? 200 : 401));

    await expect(http.get("/todos")).rejects.toMatchObject({ response: { status: 401 } });
    expect(calls).toEqual(["GET /todos", "POST /auth/refresh", "GET /todos"]);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("never refreshes for login failures", async () => {
    const calls = installBackend(() => 401);

    await expect(http.post("/auth/login", {})).rejects.toBeInstanceOf(AxiosError);
    expect(calls).toEqual(["POST /auth/login"]);
    expect(expired).not.toHaveBeenCalled();
  });

  it("passes 403 through untouched", async () => {
    const calls = installBackend(() => 403);

    await expect(http.get("/users")).rejects.toMatchObject({ response: { status: 403 } });
    expect(calls).toEqual(["GET /users"]);
    expect(expired).not.toHaveBeenCalled();
  });

  it("never attaches tokens itself; it relies on same-origin cookies", () => {
    expect(http.defaults.baseURL).toBe("/api/v1");
    expect(http.defaults.headers.common.Authorization).toBeUndefined();
  });
});
