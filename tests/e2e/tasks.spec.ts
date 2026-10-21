import type { Locator } from "@playwright/test";
import { test, expect } from "./fixtures";
import { addDays, todayInSingapore } from "../../src/lib/dates";

async function fillDueDate(dialog: Locator, date: string) {
  const value = `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
  const field = dialog.getByRole("group", { name: /^Due date\b/ });
  const input = field.getByRole("textbox", { includeHidden: true });

  // Focus MUI's visible field before editing its associated input.
  await field.click();
  await input.fill(value);
  await input.press("Tab");
  await expect(input).toHaveValue(value);
}

test("student can manage a task and see dashboard progress", async ({
  page,
  account,
  baseURL,
}) => {
  test.setTimeout(180_000);
  if (!baseURL) throw new Error("A test base URL is required.");

  const signup = await page.request.post("/api/auth/sign-up/email", {
    headers: { Origin: baseURL },
    data: {
      ...account,
      confirmPassword: account.password,
      privacyAccepted: true,
    },
  });
  expect(signup.status()).toBe(200);

  // Subject CRUD has its own browser test; prepare this task's subject via API.
  const subjectResponse = await page.request.post("/api/subjects", {
    headers: { Origin: baseURL },
    data: { name: "Physics", code: "PHY101" },
  });
  expect(subjectResponse.status()).toBe(201);
  const subject: { id: string } = await subjectResponse.json();

  const today = todayInSingapore();
  const originalDate = addDays(today, 1);
  const editedDate = addDays(today, 2);
  const originalTitle = "Revise motion notes";
  const editedTitle = "Complete motion revision";
  let taskEndpoint = "";

  const taskRow = (title: string) =>
    page.getByRole("row").filter({
      has: page.getByRole("link", { name: title, exact: true }),
    });

  const dashboardCount = (label: string) =>
    page
      .locator(".stat-card")
      .filter({ has: page.getByText(label, { exact: true }) })
      .locator(".stat-number");

  await test.step("Create a task using DateInput, subject, and priority", async () => {
    await page.goto("/dashboard");
    await page
      .getByRole("link", { name: "Create a task", exact: true })
      .click();

    const dialog = page.getByRole("dialog", {
      name: /^Add a task(?: Close dialog)?$/,
    });
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await dialog.getByLabel(/^Task title(?:\s*\*)?$/).fill(originalTitle);
    await dialog
      .getByLabel("Description (optional)", { exact: true })
      .fill("Read chapter 3 and summarize the main ideas.");

    await dialog.getByRole("combobox", { name: /^Subject\b/ }).click();
    await page.getByRole("option", { name: "Physics", exact: true }).click();
    await fillDueDate(dialog, originalDate);
    await dialog.getByRole("combobox", { name: /^Priority\b/ }).click();
    await page.getByRole("option", { name: "High", exact: true }).click();

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url() === `${baseURL}/api/tasks` &&
        response.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "Save task", exact: true }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    const task: { id: string; dueDate: string } = await response.json();
    expect(task.id).toEqual(expect.any(String));
    expect(task.dueDate.slice(0, 10)).toBe(originalDate);
    taskEndpoint = `${baseURL}/api/tasks/${task.id}`;

    await expect(dialog).not.toBeVisible();
    await expect(taskRow(originalTitle)).toBeVisible({ timeout: 15_000 });
    await expect(taskRow(originalTitle).getByText("High", { exact: true })).toBeVisible();
    await expect(taskRow(originalTitle).getByText("To do", { exact: true })).toBeVisible();

    // Remove the quick-create query before loading a fresh copy of the list.
    await page.goto("/tasks");
    await expect(taskRow(originalTitle)).toBeVisible();
    const stored = await page.request.get(taskEndpoint);
    expect(stored.status()).toBe(200);
    expect(await stored.json()).toEqual(
      expect.objectContaining({
        title: originalTitle,
        subjectId: subject.id,
        priority: "HIGH",
        status: "TODO",
      }),
    );
  });

  await test.step("Edit the title, notes, due date, priority, and status", async () => {
    await taskRow(originalTitle).getByRole("button", { name: "Edit", exact: true }).click();
    const dialog = page.getByRole("dialog", {
      name: /^Edit task(?: Close dialog)?$/,
    });
    await dialog.getByLabel(/^Task title(?:\s*\*)?$/).fill(editedTitle);
    await dialog
      .getByLabel("Description (optional)", { exact: true })
      .fill("Finish the practice questions and check the answers.");
    await fillDueDate(dialog, editedDate);
    await dialog.getByRole("combobox", { name: /^Priority\b/ }).click();
    await page.getByRole("option", { name: "Medium", exact: true }).click();
    await dialog.getByRole("combobox", { name: /^Status\b/ }).click();
    await page.getByRole("option", { name: "In progress", exact: true }).click();

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url() === taskEndpoint && response.request().method() === "PATCH",
    );
    await dialog.getByRole("button", { name: "Save task", exact: true }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    const task: { dueDate: string } = await response.json();
    expect(task.dueDate.slice(0, 10)).toBe(editedDate);
    await expect(dialog).not.toBeVisible();
    await expect(taskRow(editedTitle)).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(taskRow(originalTitle)).toHaveCount(0);
    await expect(taskRow(editedTitle).getByText("Medium", { exact: true })).toBeVisible();
    await expect(taskRow(editedTitle).getByText("In progress", { exact: true })).toBeVisible();
    const stored = await page.request.get(taskEndpoint);
    expect(stored.status()).toBe(200);
    expect(await stored.json()).toEqual(
      expect.objectContaining({
        title: editedTitle,
        description: "Finish the practice questions and check the answers.",
        subjectId: subject.id,
        priority: "MEDIUM",
        status: "IN_PROGRESS",
      }),
    );
  });

  await test.step("Search tasks and check pending dashboard counts", async () => {
    const search = page.getByRole("textbox", { name: "Search tasks", exact: true });
    await search.fill("no matching title");
    await expect(
      page.getByRole("heading", { name: "No matching tasks", exact: true }),
    ).toBeVisible();
    await search.fill("motion");
    await expect(taskRow(editedTitle)).toBeVisible();
    await search.fill("");

    await page.goto("/dashboard");
    await expect(dashboardCount("Total subjects")).toHaveText("1");
    await expect(dashboardCount("Pending tasks")).toHaveText("1");
    await expect(dashboardCount("Completed tasks")).toHaveText("0");
    await expect(taskRow(editedTitle)).toBeVisible();
    await expect(
      page.getByRole("progressbar", { name: "Completed tasks", exact: true }),
    ).toHaveAttribute("value", "0");
  });

  await test.step("Complete the task and verify saved dashboard progress", async () => {
    await page.goto("/tasks");
    const checkbox = taskRow(editedTitle).getByRole("checkbox", {
      name: `Mark ${editedTitle} complete`,
      exact: true,
    });
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url() === taskEndpoint && response.request().method() === "PATCH",
    );
    // Its checked value comes from refreshed server data, not a local toggle.
    await checkbox.click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ status: "COMPLETED" }));
    await expect(checkbox).toBeChecked({ timeout: 15_000 });
    await expect(checkbox).toBeDisabled();

    await page.reload();
    await expect(checkbox).toBeChecked();
    await page.goto("/dashboard");
    await expect(dashboardCount("Pending tasks")).toHaveText("0");
    await expect(dashboardCount("Completed tasks")).toHaveText("1");
    await expect(page.getByText("1 of 1 tasks complete", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("progressbar", { name: "Completed tasks", exact: true }),
    ).toHaveAttribute("value", "100");
    await expect(taskRow(editedTitle)).toHaveCount(0);
  });

  await test.step("Delete the task and verify the empty list and dashboard", async () => {
    await page.goto("/tasks");
    await taskRow(editedTitle).getByRole("button", { name: "Delete", exact: true }).click();
    const dialog = page.getByRole("dialog", {
      name: /^Delete this task\?(?: Close dialog)?$/,
    });
    await expect(dialog.getByText(editedTitle, { exact: true })).toBeVisible();
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url() === taskEndpoint && response.request().method() === "DELETE",
    );
    await dialog.getByRole("button", { name: "Delete task", exact: true }).click();
    expect((await responsePromise).status()).toBe(204);
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Your next step starts here", exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    const missing = await page.request.get(taskEndpoint);
    expect(missing.status()).toBe(404);
    const remaining = await page.request.get("/api/tasks");
    expect(remaining.status()).toBe(200);
    expect(await remaining.json()).toEqual([]);

    await page.goto("/dashboard");
    await expect(dashboardCount("Total subjects")).toHaveText("1");
    await expect(dashboardCount("Pending tasks")).toHaveText("0");
    await expect(dashboardCount("Completed tasks")).toHaveText("0");
    await expect(
      page.getByRole("progressbar", { name: "Completed tasks", exact: true }),
    ).toHaveAttribute("value", "0");
  });
});
