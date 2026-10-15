import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/intranet",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 20_000,
  },
  use: {
    baseURL: "http://127.0.0.1:4174",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4174",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_USE_BACKEND_API: "true",
      VITE_ALLOW_DEMO_LOGIN: "true",
      VITE_API_BASE: "http://127.0.0.1:8000/make-server-cfb78916",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
