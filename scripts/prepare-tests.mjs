import "dotenv/config";
import process from "node:process";
import { URL } from "node:url";
import { spawnSync } from "node:child_process";
const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  new URL(url).pathname !== "/alkali_test" ||
  !["localhost", "127.0.0.1", "mysql"].includes(new URL(url).hostname)
) {
  throw new Error(
    "Test migrations are restricted to the isolated local alkali_test database.",
  );
}
const result = spawnSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  },
);
process.exit(result.status ?? 1);
