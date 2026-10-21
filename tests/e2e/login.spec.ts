import { test, expect } from "@playwright/test";

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