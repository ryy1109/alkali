import "dotenv/config";
import process from "node:process";
import { randomUUID } from "node:crypto";
import { URL } from "node:url";
import { test as base, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../src/generated/prisma/client";

type TestAccount = {
  name: string;
  email: string;
  password: string;
};

// The real signup limit stays enabled. API setup respects a rate-limit response.
export async function signupAccount(request: APIRequestContext, account: TestAccount, baseURL: string) {
  const create = () => request.post("/api/auth/sign-up/email", {
    headers: { Origin: baseURL },
    data: { ...account, confirmPassword: account.password, privacyAccepted: true },
  });
  let response = await create();
  if (response.status() === 429) {
    const seconds = Number(response.headers()["retry-after"] ?? response.headers()["x-retry-after"]);
    const delay = Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 60) : 60;
    await new Promise((resolve) => setTimeout(resolve, (delay + 1) * 1000));
    response = await create();
  }
  return response;
}

async function accountFixture({ baseURL }: { baseURL: string | undefined }, use: (account: TestAccount) => Promise<void>) {
    if (baseURL !== "http://localhost:3100") {
      throw new Error("Account tests require the isolated test server.");
    }

    const databaseURL = process.env.TEST_DATABASE_URL ?? "";

    if (!URL.canParse(databaseURL)) {
      throw new Error("A valid TEST_DATABASE_URL is required.");
    }

    const url = new URL(databaseURL);

    if (
      url.protocol !== "mysql:" ||
      !["localhost", "127.0.0.1"].includes(url.hostname) ||
      url.pathname !== "/alkali_test"
    ) {
      throw new Error("Account cleanup requires local alkali_test.");
    }

    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: "alkali_test",
      connectionLimit: 1,
    });

    const prisma = new PrismaClient({ adapter });

    const account: TestAccount = {
      name: "E2E Student",
      email: `e2e-${randomUUID()}@example.test`,
      password: `Study1!${randomUUID()}`,
    };

    try {
      await use(account);
    } finally {
      try {
        await prisma.user.deleteMany({
          where: { email: account.email },
        });
      } finally {
        await prisma.$disconnect();
      }
    }
}

export const test = base.extend<{ account: TestAccount; otherAccount: TestAccount }>({
  account: accountFixture,
  otherAccount: accountFixture,
});

export { expect };
