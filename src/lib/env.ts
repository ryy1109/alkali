import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z
    .url()
    .refine((v) => v.startsWith("mysql://"), "Use a MySQL connection URL."),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .refine((v) => !v.startsWith("REPLACE_")),
  BETTER_AUTH_URL: z.url(),
  APP_TIMEZONE: z.literal("Asia/Singapore").default("Asia/Singapore"),
});

export function getEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success)
    throw new Error(
      "Application configuration is incomplete. Check the setup documentation.",
    );
  if (
    process.env.NODE_ENV === "production" &&
    new URL(result.data.BETTER_AUTH_URL).protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(
      new URL(result.data.BETTER_AUTH_URL).hostname,
    )
  ) {
    throw new Error("Production requires an HTTPS application URL.");
  }
  return result.data;
}
