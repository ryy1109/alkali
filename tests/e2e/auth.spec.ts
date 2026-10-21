import { test, expect } from "./fixtures";

test("student can sign up and keep their session after reload", async ({
  page,
  account,
}) => {
  test.setTimeout(90_000);

  await page.goto("/signup");

  await page
    .getByLabel(/^Full name(?:\s*\*)?$/)
    .fill(account.name);

  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(account.email);

  await page
    .getByLabel(/^Password(?:\s*\*)?$/)
    .fill(account.password);

  await page
    .getByLabel(/^Confirm password(?:\s*\*)?$/)
    .fill(account.password);

  await page.getByRole("checkbox").check();

  const signupResponsePromise = page.waitForResponse(
  (response) =>
    response.url().endsWith("/api/auth/sign-up/email") &&
    response.request().method() === "POST",
);

await page
  .getByRole("button", { name: "Create account", exact: true })
  .click();

const signupResponse = await signupResponsePromise;

expect(signupResponse.status()).toBe(200);

await expect(page).toHaveURL(/\/dashboard$/, {
  timeout: 30_000,
});

  const greeting = page.getByRole("heading", {
    name: "Hello, E2E.",
    exact: true,
  });

  await expect(greeting).toBeVisible();

  await page.reload();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(greeting).toBeVisible();

  // Log out through the profile dialog.
await page
  .getByRole("button", { name: "Open profile", exact: true })
  .click();

await page
  .getByRole("button", { name: "Log out", exact: true })
  .click();

await expect(page).toHaveURL(/\/login$/, {
  timeout: 15_000,
});

// A logged-out user must not access the dashboard.
await page.goto("/dashboard");
await expect(page).toHaveURL(/\/login$/);

// Log back in with the account created earlier.
await page
  .getByRole("textbox", { name: "Email", exact: true })
  .fill(account.email);

await page
  .getByLabel(/^Password(?:\s*\*)?$/)
  .fill(account.password);

const loginResponsePromise = page.waitForResponse(
  (response) =>
    response.url().endsWith("/api/auth/sign-in/email") &&
    response.request().method() === "POST",
);

await page
  .getByRole("button", { name: "Log in", exact: true })
  .click();

const loginResponse = await loginResponsePromise;

expect(loginResponse.status()).toBe(200);

await expect(page).toHaveURL(/\/dashboard$/, {
  timeout: 30_000,
});

await expect(greeting).toBeVisible();
});
