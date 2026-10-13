import { defineConfig, devices } from "@playwright/test";

const MOCK_BACKEND_PORT = 4100;
const APP_PORT = 3100;

/**
 * E2E runs against a production build proxied to the test-only mock backend (e2e/mock-backend.mjs).
 * Set PW_CHANNEL=chrome (or msedge) to use an installed browser when Playwright's own cannot be downloaded.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    locale: "fa-IR",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], channel: process.env.PW_CHANNEL || undefined },
    },
  ],
  webServer: [
    {
      command: "node e2e/mock-backend.mjs",
      port: MOCK_BACKEND_PORT,
      env: { MOCK_BACKEND_PORT: String(MOCK_BACKEND_PORT) },
      reuseExistingServer: false,
    },
    {
      command: `npx next build && npx next start -p ${APP_PORT}`,
      port: APP_PORT,
      env: { BACKEND_URL: `http://localhost:${MOCK_BACKEND_PORT}` },
      timeout: 240_000,
      reuseExistingServer: false,
    },
  ],
});
