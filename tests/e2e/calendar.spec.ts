import { test, expect, signupAccount } from "./fixtures";
import { displayDate, todayInSingapore } from "../../src/lib/dates";

test("monthly deadlines include every task and stay private on desktop and mobile", async ({
  page, account, otherAccount, browser, baseURL,
}, testInfo) => {
  test.setTimeout(240_000);
  if (!baseURL) throw new Error("A test base URL is required.");
  const headers = { Origin: baseURL };
  const signup = await signupAccount(page.request, account, baseURL);
  expect(signup.status()).toBe(200);
  let ownedTaskId = "";
  for (let i = 0; i < 9; i++) {
    const created = await page.request.post("/api/tasks", {
      headers, data: {
        title: `Calendar study ${i + 1}`, dueDate: i < 5 ? "2028-02-29" : `2028-02-0${i - 4}`,
        priority: "MEDIUM", status: i === 0 ? "COMPLETED" : "TODO",
      },
    });
    expect(created.status()).toBe(201);
    if (i === 0) ownedTaskId = (await created.json()).id;
  }
  for (const [title, dueDate] of [["Next month deadline", "2028-03-01"], ["Earlier unfinished work", "2020-02-29"]]) {
    expect((await page.request.post("/api/tasks", {
      headers, data: { title, dueDate, priority: "HIGH", status: "TODO" },
    })).status()).toBe(201);
  }

  await page.goto("/dashboard?month=2028-02");
  const calendar = page.locator(".deadline-calendar");
  await expect(calendar.getByRole("heading", { name: "February 2028", exact: true })).toBeVisible();
  await expect(calendar.getByText("9 deadlines this month. Select a day to see its tasks.", { exact: true })).toBeVisible();
  await expect(calendar.getByRole("link", { name: /Next month deadline/ })).toHaveCount(0);
  const leapDay = calendar.getByRole("button", { name: "29 Feb 2028: 5 tasks", exact: true });
  await expect(leapDay).toBeVisible();
  const crowded = leapDay.locator("..");
  await expect(crowded.getByRole("link")).toHaveCount(3);
  await expect(crowded.getByText("Completed", { exact: true })).toBeVisible();
  await calendar.getByRole("button", { name: "View all 5 tasks for 29 Feb 2028", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: /^Deadlines for 29 Feb 2028/ });
  await expect(dialog.getByRole("link")).toHaveCount(5);
  await expect(dialog.getByRole("link", { name: /Calendar study 5/ })).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await calendar.screenshot({ path: testInfo.outputPath("calendar-desktop.png") });

  await calendar.getByRole("link", { name: "Next month", exact: true }).click();
  await expect(page).toHaveURL(/month=2028-03$/);
  await expect(calendar.getByRole("link", { name: /Next month deadline/ })).toBeVisible();
  await page.reload();
  await expect(calendar.getByRole("heading", { name: "March 2028", exact: true })).toBeVisible();
  await calendar.getByRole("link", { name: "Previous month", exact: true }).click();
  await expect(calendar.getByRole("heading", { name: "February 2028", exact: true })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(leapDay).toBeVisible();
  await expect(calendar.locator(".calendar-entries").first()).toBeHidden();
  await leapDay.click();
  dialog = page.getByRole("dialog", { name: /^Deadlines for 29 Feb 2028/ });
  await expect(dialog.getByRole("link")).toHaveCount(5);
  await dialog.getByRole("link", { name: /Calendar study 5/ }).click();
  await expect(page).toHaveURL(/\/tasks\/[^/]+$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Calendar study 5", exact: true })).toBeVisible({ timeout: 15_000 });
  await page.goto("/dashboard?month=2028-02");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await calendar.screenshot({ path: testInfo.outputPath("calendar-mobile.png") });

  await page.goto("/dashboard?month=2020-02");
  await calendar.getByRole("button", { name: "29 Feb 2020: 1 task", exact: true }).click();
  dialog = page.getByRole("dialog", { name: /^Deadlines for 29 Feb 2020/ });
  await expect(dialog.getByText("Overdue", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await calendar.getByRole("link", { name: "This month", exact: true }).click();
  const today = todayInSingapore();
  await expect(page).toHaveURL(new RegExp(`month=${today.slice(0, 7)}$`));
  await expect(calendar.getByRole("button", { name: `${displayDate(today)}: 0 tasks, today`, exact: true })).toHaveAttribute("aria-current", "date");
  await page.goto("/dashboard?month=invalid");
  await expect(calendar.getByRole("button", { name: `${displayDate(today)}: 0 tasks, today`, exact: true })).toBeVisible();

  const otherContext = await browser.newContext({ baseURL });
  try {
    const registered = await signupAccount(otherContext.request, otherAccount, baseURL);
    expect(registered.status()).toBe(200);
    const otherPage = await otherContext.newPage();
    await otherPage.goto("/dashboard?month=2028-02");
    const otherCalendar = otherPage.locator(".deadline-calendar");
    await expect(otherCalendar.getByText("0 deadlines this month. Select a day to see its tasks.", { exact: true })).toBeVisible();
    await expect(otherCalendar.getByRole("link", { name: /Calendar study/ })).toHaveCount(0);
    await otherCalendar.getByRole("button", { name: "29 Feb 2028: 0 tasks", exact: true }).click();
    await expect(otherPage.getByRole("dialog").getByText("No tasks are due on this date.", { exact: true })).toBeVisible();
    expect((await otherContext.request.get(`/api/tasks/${ownedTaskId}`)).status()).toBe(404);
    expect((await otherContext.request.patch(`/api/tasks/${ownedTaskId}`, {
      headers, data: { status: "COMPLETED" },
    })).status()).toBe(404);
  } finally {
    await otherContext.close();
  }
});
