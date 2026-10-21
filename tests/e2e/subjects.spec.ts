import { test, expect, signupAccount } from "./fixtures";

test("student can create, edit, and delete a subject", async ({
  page,
  account,
  baseURL,
}) => {
  test.setTimeout(180_000);

  if (!baseURL) throw new Error("A test base URL is required.");

  // Authentication UI has its own test; prepare this test's session via API.
  const signup = await signupAccount(page.request, account, baseURL);
  expect(signup.status()).toBe(200);

  let subjectEndpoint = "";

  await test.step("Create a subject using the dashboard shortcut", async () => {
    await page.goto("/dashboard");
    await page
      .getByRole("link", { name: "Add a subject", exact: true })
      .click();

    const dialog = page.getByRole("dialog", {
      name: /^Add a subject(?: Close dialog)?$/,
    });
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await dialog.getByLabel(/^Subject name(?:\s*\*)?$/).fill("Physics");
    await dialog
      .getByLabel("Subject code (optional)", { exact: true })
      .fill("PHY101");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url() === `${baseURL}/api/subjects` &&
        response.request().method() === "POST",
    );
    await dialog
      .getByRole("button", { name: "Save subject", exact: true })
      .click();

    const response = await responsePromise;
    expect(response.status()).toBe(201);
    const subject: { id: string } = await response.json();
    expect(subject.id).toEqual(expect.any(String));
    subjectEndpoint = `${baseURL}/api/subjects/${subject.id}`;

    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Physics", exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    // Leave ?new=1 before reloading, since that query opens a new dialog.
    await page.goto("/subjects");
    await expect(
      page.getByRole("heading", { name: "Physics", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("PHY101", { exact: true })).toBeVisible();
  });

  await test.step("Edit the subject and verify persistence", async () => {
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    const dialog = page.getByRole("dialog", {
      name: /^Edit subject(?: Close dialog)?$/,
    });
    await dialog
      .getByLabel(/^Subject name(?:\s*\*)?$/)
      .fill("Advanced Physics");
    await dialog
      .getByLabel("Subject code (optional)", { exact: true })
      .fill("PHY201");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url() === subjectEndpoint &&
        response.request().method() === "PATCH",
    );
    await dialog
      .getByRole("button", { name: "Save subject", exact: true })
      .click();
    expect((await responsePromise).status()).toBe(200);
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Advanced Physics", exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Advanced Physics", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("PHY201", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Physics", exact: true }),
    ).toHaveCount(0);
  });

  await test.step("Cancel deletion and keep the subject", async () => {
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    const dialog = page.getByRole("dialog", {
      name: /^Delete this subject\?(?: Close dialog)?$/,
    });
    await dialog
      .getByRole("button", { name: "Keep subject", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Advanced Physics", exact: true }),
    ).toBeVisible();
  });

  await test.step("Confirm deletion and verify the saved empty state", async () => {
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    const dialog = page.getByRole("dialog", {
      name: /^Delete this subject\?(?: Close dialog)?$/,
    });
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url() === subjectEndpoint &&
        response.request().method() === "DELETE",
    );
    await dialog
      .getByRole("button", { name: "Delete subject", exact: true })
      .click();
    expect((await responsePromise).status()).toBe(204);
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "A fresh start for your subjects",
        exact: true,
      }),
    ).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Advanced Physics", exact: true }),
    ).toHaveCount(0);
    const remaining = await page.request.get("/api/subjects");
    expect(remaining.status()).toBe(200);
    expect(await remaining.json()).toEqual([]);
  });
});
