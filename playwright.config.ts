import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || new URL(testUrl).pathname !== "/alkali_test")
  throw new Error("Browser tests require a separate alkali_test database.");
const baseURL = "http://localhost:3100";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 240000,
  reporter: "list",
  expect: { timeout: 15000 },
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PLAYWRIGHT_CHANNEL,
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 3100",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      DATABASE_URL: testUrl,
      BETTER_AUTH_URL: baseURL,
      ALKALI_TEST_MODE: "1",
      NODE_ENV: "development",
    },
  },
});
