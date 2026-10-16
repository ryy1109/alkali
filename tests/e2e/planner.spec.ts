import { test, expect, request as requestFactory } from "@playwright/test";
import { todayInSingapore } from "../../src/lib/dates";
import { fixtureDb } from "./database";
const origin = "http://localhost:3100";
const run = Date.now().toString(36);
const password = "StudyStrong1!";
const emails = [
  "owner-" + run + "@alkali.test",
  "other-" + run + "@alkali.test",
];
test.afterAll(async () => {
  await fixtureDb.user.deleteMany({ where: { email: { in: emails } } });
  await fixtureDb.$disconnect();
});
test("signup, ownership, planner lifecycle, real dashboard, and logout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|cannot.*(?:child|descendant|contain)/i.test(message.text())
    )
      errors.push(message.text());
  });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.screenshot({
    path: `.cache/qa/landing-${page.viewportSize()?.width}.png`,
    fullPage: true,
  });
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/signup");
  await page.getByLabel(/Full name/).fill("Alkali Test Student");
  await page.getByLabel(/^Email/).fill("owner-" + run + "@alkali.test");
  await page.locator("#password").fill(password);
  await page.locator("#confirm-password").fill(password);
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Privacy Policy", exact: true }).click();
  const popup = await popupPromise;
  await expect(
    popup.getByRole("heading", { name: "Privacy Policy", exact: true }),
  ).toBeVisible();
  await popup.close();
  await expect(page.getByLabel(/Full name/)).toHaveValue("Alkali Test Student");
  await page.getByRole("checkbox", { name: /I have read/ }).check();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30000 });
  await expect(
    page.getByRole("heading", { name: /Hello, Alkali/ }),
  ).toBeVisible();
  const stored = await fixtureDb.user.findUniqueOrThrow({
    where: { email: emails[0] },
    include: { accounts: true },
  });
  expect(stored.privacyAccepted).toBe(true);
  expect(stored.privacyAcceptedAt).not.toBeNull();
  expect(stored.accounts[0].password).not.toBe(password);
  expect(stored.accounts[0].password).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);
  const cookies = await page.context().cookies();
  const session = cookies.find((cookie) =>
    cookie.name.includes("session_token"),
  );
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");
  const storage = await page.evaluate(() => Object.keys(localStorage));
  expect(storage.filter((key) => /auth|token|session/i.test(key))).toEqual([]);
  await page.screenshot({
    path: ".cache/qa/dashboard-desktop.png",
    fullPage: true,
  });
  const owner = page.request;
  expect(
    (
      await owner.post("/api/auth/change-password", {
        headers: { origin },
        data: { currentPassword: password, newPassword: "weakpassword" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await owner.post("/api/auth/update-user", {
        headers: { origin },
        data: { privacyAccepted: false },
      })
    ).status(),
  ).toBe(400);
  const created = await owner.post("/api/subjects", {
    headers: { origin },
    data: { name: "Physics " + run, code: "PHY101" },
  });
  expect(created.status()).toBe(201);
  const subject = await created.json();
  const payload = {
    title: "Revise motion " + run,
    description: "Practice questions",
    subjectId: subject.id,
    dueDate: todayInSingapore(),
    priority: "HIGH",
    status: "TODO",
  };
  const taskResponse = await owner.post("/api/tasks", {
    headers: { origin },
    data: payload,
  });
  expect(taskResponse.status()).toBe(201);
  const task = await taskResponse.json();

  const other = await requestFactory.newContext({
    baseURL: origin,
    extraHTTPHeaders: { origin },
  });
  const registration = await other.post("/api/auth/sign-up/email", {
    data: {
      name: "Other Student",
      email: "other-" + run + "@alkali.test",
      password,
      confirmPassword: password,
      privacyAccepted: true,
    },
  });
  expect(registration.status()).toBe(200);
  for (const resource of [
    "/api/subjects/" + subject.id,
    "/api/tasks/" + task.id,
  ]) {
    expect((await other.get(resource)).status()).toBe(404);
    expect((await other.delete(resource, { data: {} })).status()).toBe(404);
  }
  expect(
    (
      await other.patch("/api/subjects/" + subject.id, {
        data: { name: "Stolen", code: "" },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await other.patch("/api/tasks/" + task.id, {
        data: { status: "COMPLETED" },
      })
    ).status(),
  ).toBe(404);
  expect((await other.post("/api/tasks", { data: payload })).status()).toBe(
    404,
  );
  expect(
    (
      await owner.post("/api/tasks", {
        headers: { origin: "https://attacker.invalid" },
        data: payload,
      })
    ).status(),
  ).toBe(403);
  await other.dispose();
  const incompleteSignup = await owner.post("/api/auth/sign-up/email", {
    headers: { origin },
    data: {
      name: "No Consent",
      email: "invalid-" + run + "@alkali.test",
      password,
      confirmPassword: password,
      privacyAccepted: false,
    },
  });
  expect(incompleteSignup.status()).toBe(400);
  const limitedSignup = await owner.post("/api/auth/sign-up/email", {
    headers: { origin },
    data: {
      name: "Rate Limited",
      email: "invalid-" + run + "@alkali.test",
      password,
      confirmPassword: password,
      privacyAccepted: true,
    },
  });
  expect(limitedSignup.status()).toBe(429);

  await page.goto("/tasks");
  await expect(
    page.getByRole("link", { name: payload.title, exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search tasks").fill("no-matching-task-12345");
  await expect(
    page.getByRole("heading", { name: "No matching tasks" }),
  ).toBeVisible();
  await page.getByLabel("Search tasks").fill("");
  await page
    .getByRole("columnheader", { name: "Priority", exact: true })
    .click();
  await expect(
    page.getByRole("columnheader", { name: "Priority", exact: true }),
  ).toHaveAttribute("aria-sort", "ascending");
  await page.getByRole("button", { name: "Add a task", exact: true }).click();
  await page.getByLabel(/Task title/).fill("Browser-created task " + run);
  await expect(
    page.getByRole("dialog").getByText("Due date", { exact: false }).first(),
  ).toBeVisible();
  const savedTask = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/tasks") &&
      response.request().method() === "POST",
    { timeout: 30000 },
  );
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  expect((await savedTask).status()).toBe(201);
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  await expect(
    page.getByRole("link", {
      name: "Browser-created task " + run,
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/dashboard");
  await expect(
    page.getByRole("link", { name: payload.title, exact: true }),
  ).toBeVisible();
  expect(
    (
      await owner.patch("/api/tasks/" + task.id, {
        headers: { origin },
        data: { status: "COMPLETED" },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await owner.delete("/api/subjects/" + subject.id, {
        headers: { origin },
        data: {},
      })
    ).status(),
  ).toBe(204);
  const preserved = await owner.get("/api/tasks/" + task.id);
  expect(preserved.status()).toBe(200);
  expect((await preserved.json()).subjectId).toBeNull();
  await page.goto("/tasks/" + task.id);
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  await expect(page.getByText("No subject", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await page.screenshot({
    path: ".cache/qa/dashboard-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open profile" }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await owner.get("/api/tasks")).status()).toBe(401);
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.screenshot({
    path: `.cache/qa/landing-${page.viewportSize()?.width}.png`,
    fullPage: true,
  });
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  const login = await owner.post("/api/auth/sign-in/email", {
    headers: { origin },
    data: { email: "  " + emails[0].toUpperCase() + "  ", password },
  });
  expect(login.status()).toBe(200);
  const current = await owner.get("/api/auth/get-session");
  expect(current.status()).toBe(200);
  const currentBody = await current.json();
  expect(currentBody.user.email).toBe(emails[0]);
  expect(currentBody.user.password).toBeUndefined();
  expect(errors).toEqual([]);
});
