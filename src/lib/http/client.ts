import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * Same-origin client. Requests go to Next.js (`/api/v1/*`), which rewrites them to NestJS.
 * Auth lives in HttpOnly cookies set by NestJS, so no token is ever read or attached here.
 */
export const http = axios.create({
  baseURL: "/api/v1",
  timeout: 15_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    // Defense-in-depth against CSRF: a cross-site form cannot set custom headers.
    "X-Requested-With": "XMLHttpRequest",
  },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const NO_REFRESH_PATHS = ["/auth/login", "/auth/refresh", "/auth/logout"];

let refreshPromise: Promise<void> | null = null;
let onSessionExpired: () => void = () => {};

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

/** Concurrent 401s share one refresh request. */
function refreshSession() {
  refreshPromise ??= http
    .post("/auth/refresh")
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

http.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetriableConfig | undefined;
  const isAuthPath = NO_REFRESH_PATHS.some((path) => config?.url?.startsWith(path));

  if (error.response?.status !== 401 || !config || isAuthPath) throw error;

  // Second 401 after a successful refresh: the session is genuinely gone (e.g. user disabled).
  if (config._retried) {
    onSessionExpired();
    throw error;
  }

  try {
    await refreshSession();
  } catch {
    onSessionExpired();
    throw error;
  }
  config._retried = true;
  return http(config);
});
