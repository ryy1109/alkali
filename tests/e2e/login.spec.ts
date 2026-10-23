import { test, expect } from "@playwright/test";

test("login labels stay above empty and filled fields", async ({ page }, testInfo) => {
  await page.goto("/login");
  expect((await page.request.get("/api/calendar?month=2028-02")).status()).toBe(401);
  for (const id of ["email", "password"]) {
    await expect(page.locator(`label[for="${id}"]`)).toHaveClass(/MuiInputLabel-shrink/);
  }
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("student@example.test");
  await page.getByLabel(/^Password(?:\s*\*)?$/).fill("Study1!Example");
  await page.getByRole("button", { name: "Log in", exact: true }).focus();
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  for (const id of ["email", "password"]) {
    const label = page.locator(`label[for="${id}"]`);
    await expect(label).toHaveClass(/MuiInputLabel-shrink/);
    const labelBox = await label.boundingBox();
    const inputBox = await page.locator(`#${id}`).boundingBox();
    expect(labelBox).not.toBeNull();
    expect(inputBox).not.toBeNull();
    expect(labelBox!.y + labelBox!.height).toBeLessThan(inputBox!.y + inputBox!.height / 3);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".auth-card").screenshot({ path: testInfo.outputPath("login-labels-mobile.png") });
});

test("login page shows its required controls", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", {
      name: "Good to see you",
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("textbox", { name: "Email", exact: true }),
  ).toBeVisible();

  await expect(
    page.getByLabel(/^Password(?:\s*\*)?$/),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Log in", exact: true }),
  ).toBeVisible();
}); test("login page links to signup", async ({ page }) => {
  await page.goto("/login");

  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();

  await expect(page).toHaveURL(/\/signup$/);

  await expect(
    page.getByRole("heading", {
      name: "Create your account",
      exact: true,
    }),
  ).toBeVisible();
}); test("empty login form marks required fields invalid", async ({ page }) => {
  await page.goto("/login");

  await page
    .getByRole("button", { name: "Log in", exact: true })
    .click();

  await expect(
    page.getByRole("textbox", { name: "Email", exact: true }),
  ).toHaveAttribute("aria-invalid", "true");

  await expect(
    page.getByLabel(/^Password(?:\s*\*)?$/),
  ).toHaveAttribute("aria-invalid", "true");

  await expect(page).toHaveURL(/\/login$/);
});
