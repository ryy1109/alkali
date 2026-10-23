import "dotenv/config";
import process from "node:process";
import { URL } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3100";
const databaseURL = process.env.TEST_DATABASE_URL ?? "";

if (!URL.canParse(databaseURL)) {
  throw new Error("A valid TEST_DATABASE_URL is required.");
}

const database = new URL(databaseURL);

if (
  database.protocol !== "mysql:" ||
  !["localhost", "127.0.0.1"].includes(database.hostname) ||
  database.pathname !== "/alkali_test"
) {
  throw new Error("Browser tests require a local alkali_test database.");
}

export default defineConfig({
  testDir: "./tests/e2e",

  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],

  use: {
    baseURL,
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command:
      "node scripts/prepare-tests.mjs && npm run dev -- --hostname localhost --port 3100",
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: databaseURL,
      BETTER_AUTH_URL: baseURL,
      ALKALI_TEST_MODE: "1",
    },
  },
});