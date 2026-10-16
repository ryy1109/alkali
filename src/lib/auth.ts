import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { db } from "./db";
import { getEnv } from "./env";
import { loginSchema, passwordSchema, signupSchema } from "./validation";

function createAuth() {
  const env = getEnv();
  return betterAuth({
    appName: "Alkali",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [new URL(env.BETTER_AUTH_URL).origin],
    database: prismaAdapter(db(), { provider: "mysql" }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: false,
    },
    user: {
      additionalFields: {
        privacyAccepted: { type: "boolean", required: true, input: true },
        privacyAcceptedAt: { type: "date", required: false, input: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    advanced: {
      useSecureCookies: new URL(env.BETTER_AUTH_URL).protocol === "https:",
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 3 },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (
          ["/change-password", "/reset-password", "/set-password"].includes(
            ctx.path,
          )
        ) {
          const result = passwordSchema.safeParse(ctx.body?.newPassword);
          if (!result.success)
            throw new APIError("BAD_REQUEST", {
              message: result.error.issues[0].message,
            });
        }
        if (
          ctx.path === "/update-user" &&
          (ctx.body?.privacyAccepted !== undefined ||
            ctx.body?.privacyAcceptedAt !== undefined)
        ) {
          throw new APIError("BAD_REQUEST", {
            message: "Privacy acknowledgements cannot be changed here.",
          });
        }
        if (ctx.path === "/sign-up/email") {
          const result = signupSchema.safeParse(ctx.body);
          if (!result.success)
            throw new APIError("BAD_REQUEST", {
              message: result.error.issues[0].message,
            });
          return { context: { body: { ...ctx.body, ...result.data } } };
        }
        if (ctx.path === "/sign-in/email") {
          const result = loginSchema.safeParse(ctx.body);
          if (!result.success)
            throw new APIError("BAD_REQUEST", {
              message: "Enter a valid email and password.",
            });
          return { context: { body: { ...ctx.body, ...result.data } } };
        }
      }),
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: { ...user, privacyAcceptedAt: new Date() },
          }),
        },
      },
    },
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  return (instance ??= createAuth());
}
