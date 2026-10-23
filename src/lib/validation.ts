import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email());
export const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "One special character",
    test: (p: string) => /[^A-Za-z0-9\s]/.test(p),
  },
] as const;
export const passwordSchema = z
  .string()
  .min(8)
  .max(128, "Use at most 128 characters.")
  .refine(
    (p) => passwordRules.every((rule) => rule.test(p)),
    "Include uppercase, lowercase, a number, and a special character.",
  );
export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(100),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    privacyAccepted: z.literal(true, {
      error: "Please read and acknowledge the Privacy Policy.",
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
const blankToNull = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null);
export const subjectSchema = z.object({
  name: z.string().trim().min(1, "Enter a subject name.").max(100),
  code: blankToNull(30),
});
export const priorities = ["LOW", "MEDIUM", "HIGH"] as const;
export const statuses = ["TODO", "IN_PROGRESS", "COMPLETED"] as const;
export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a due date.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value &&
      value >= "1900-01-01" &&
      value <= "9999-12-31"
    );
  }, "Choose a valid date.");
const resourceUrlSchema = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Enter an HTTP or HTTPS link without a username or password.");

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Enter a task title.").max(200),
  description: blankToNull(5000),
  resourceUrl: resourceUrlSchema.nullable().optional().transform((v) => v || null),
  estimatedMinutes: z.number().int("Use whole minutes.")
    .min(1, "Enter at least one minute, or leave the estimate empty.")
    .max(525600, "Use at most 8,760 hours of estimated work.").nullable().optional()
    .transform((v) => v ?? null),
  startDate: z.union([dateOnlySchema, z.literal(""), z.null()]).optional()
    .transform((v) => v || null),
  subjectId: z
    .string()
    .max(100)
    .nullable()
    .optional()
    .transform((v) => v || null),
  dueDate: dateOnlySchema,
  priority: z.enum(priorities),
  status: z.enum(statuses),
}).refine((task) => !task.startDate || task.startDate <= task.dueDate, {
  path: ["startDate"],
  message: "Start date must be on or before the due date.",
});
