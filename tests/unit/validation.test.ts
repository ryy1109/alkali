import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dateOnlySchema,
  emailSchema,
  passwordSchema,
  signupSchema,
  subjectSchema,
  taskSchema,
} from "../../src/lib/validation.ts";
import { addDays, displayDate, todayInSingapore } from "../../src/lib/dates.ts";

test("normalizes email consistently without claiming verification", () => {
  assert.equal(
    emailSchema.parse("  Student@Example.COM "),
    "student@example.com",
  );
  assert.equal(emailSchema.safeParse("student@").success, false);
});
test("enforces each password boundary without truncation", () => {
  for (const invalid of [
    "Short1!",
    "lowercase1!",
    "UPPERCASE1!",
    "NoNumber!",
    "NoSymbol123",
    "A".repeat(129) + "a1!",
  ])
    assert.equal(passwordSchema.safeParse(invalid).success, false);
  assert.equal(passwordSchema.safeParse("A1!" + "x".repeat(125)).success, true);
  assert.equal(passwordSchema.safeParse("Strong1!").success, true);
});
test("signup requires confirmation and explicit privacy acknowledgement", () => {
  const base = {
    name: "A Student",
    email: "student@example.com",
    password: "Strong1!",
    confirmPassword: "Strong1!",
    privacyAccepted: true,
  };
  assert.equal(signupSchema.safeParse(base).success, true);
  assert.equal(
    signupSchema.safeParse({ ...base, confirmPassword: "Wrong1!" }).success,
    false,
  );
  assert.equal(
    signupSchema.safeParse({ ...base, privacyAccepted: false }).success,
    false,
  );
  assert.equal(
    signupSchema.safeParse({ ...base, privacyAccepted: undefined }).success,
    false,
  );
});
test("calendar dates reject rollover and ambiguous formats", () => {
  for (const invalid of [
    "2026-02-30",
    "2025-02-29",
    "16/10/2026",
    "",
    "0000-01-01",
  ])
    assert.equal(dateOnlySchema.safeParse(invalid).success, false);
  assert.equal(dateOnlySchema.safeParse("2028-02-29").success, true);
});
test("Singapore midnight controls date-only overdue boundaries", () => {
  assert.equal(
    todayInSingapore(new Date("2026-10-15T15:59:59Z")),
    "2026-10-15",
  );
  assert.equal(
    todayInSingapore(new Date("2026-10-15T16:00:00Z")),
    "2026-10-16",
  );
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.match(displayDate("2026-10-16"), /16/);
});
test("subject and task schemas normalize optional fields and reject invalid enums", () => {
  assert.equal(
    subjectSchema.parse({ name: " Physics ", code: " " }).code,
    null,
  );
  const task = {
    title: " Revision ",
    description: "",
    subjectId: "",
    dueDate: "2026-10-16",
    priority: "HIGH",
    status: "TODO",
  };
  assert.equal(taskSchema.parse(task).subjectId, null);
  assert.equal(taskSchema.parse(task).description, null);
  assert.equal(
    taskSchema.safeParse({ ...task, status: "ADMIN" }).success,
    false,
  );
  assert.equal(taskSchema.safeParse({ ...task, title: "" }).success, false);
});
