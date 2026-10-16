import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../src/generated/prisma/client";
const url = new URL(process.env.TEST_DATABASE_URL || "mysql://invalid/invalid");
if (
  url.pathname !== "/alkali_test" ||
  !["localhost", "127.0.0.1", "mysql"].includes(url.hostname)
)
  throw new Error("Fixtures require the isolated local alkali_test database.");
export const fixtureDb = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: "alkali_test",
    connectionLimit: 2,
  }),
});
