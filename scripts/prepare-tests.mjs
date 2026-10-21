import "dotenv/config";
import { execFileSync } from "node:child_process";
import process from "node:process";
import { URL } from "node:url";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is missing from your local environment.");
}

let url;

try {
  url = new URL(testDatabaseUrl);
} catch {
  throw new Error("TEST_DATABASE_URL is not a valid URL.");
}

if (
  url.protocol !== "mysql:" ||
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  url.pathname !== "/alkali_test"
) {
  throw new Error("Tests require a local MySQL database named alkali_test.");
}

execFileSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
    },
  },
);