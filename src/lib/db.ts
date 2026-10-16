import "server-only";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "./env";

const globalDb = globalThis as unknown as { alkaliDb?: PrismaClient };
export function db(): PrismaClient {
  if (!globalDb.alkaliDb) {
    const url = new URL(getEnv().DATABASE_URL);
    const database = decodeURIComponent(url.pathname.slice(1));
    if (
      process.env.NODE_ENV !== "production" &&
      !["alkali_dev", "alkali_test"].includes(database)
    ) {
      throw new Error(
        "Local development is restricted to alkali_dev or alkali_test.",
      );
    }
    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
      connectionLimit: 5,
    });
    globalDb.alkaliDb = new PrismaClient({ adapter });
  }
  return globalDb.alkaliDb;
}
