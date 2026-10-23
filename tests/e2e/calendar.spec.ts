import { test, expect, signupAccount } from "./fixtures";
import { displayDate, todayInSingapore } from "../../src/lib/dates";

test("all calendar months work offline in a compact dashboard and stay private", async ({
  page, account, otherAccount, browser, baseURL,
}, testInfo) => {
  test.setTimeout(300_000);
  if (!baseURL) throw new Error("A test base URL is required.");
  const headers = { Origin: baseURL };
  expect((await signupAccount(page.request, account, baseURL)).status()).toBe(200);
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

  // Even an unavailable month API must never block the calendar UI.
  await page.route("**/api/calendar**", (route) => route.abort());
  const calendarRequests: string[] = [];
  const dashboardRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/calendar") calendarRequests.push(request.url());
    if (url.pathname === "/dashboard") dashboardRequests.push(request.url());
  });
  await page.goto("/dashboard?month=2028-02");
  const calendar = page.locator(".deadline-calendar");
  await expect(calendar.getByLabel("Jump to month", { exact: true })).toHaveCount(0);
  const monthHeading = (name: string) => calendar.getByRole("heading", { name, exact: true });
  await expect(monthHeading("February 2028")).toBeVisible();
  await expect(calendar.getByText("9 deadlines this month", { exact: true })).toBeVisible();
  const leapDay = calendar.getByRole("button", { name: "29 Feb 2028: 5 tasks", exact: true });
  await expect(leapDay.getByText("5 tasks", { exact: true })).toBeVisible();
  const leapCell = leapDay.locator("..");
  await expect(leapCell.getByRole("link")).toHaveCount(2);
  await expect(leapCell.getByRole("link", { name: /Calendar study 1 Completed/ })).toBeVisible();
  expect(await leapCell.locator(".calendar-cell-tasks .calendar-task").first().evaluate((element) =>
    element.getBoundingClientRect().right <= element.closest("td")!.getBoundingClientRect().right,
  )).toBe(true);
  await leapCell.getByRole("button", { name: "View all 5 tasks for 29 Feb 2028", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: /^Deadlines for 29 Feb 2028/ });
  await expect(dialog.getByRole("link")).toHaveCount(5);
  await expect(dialog.getByText("Completed", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();

  const upcoming = await page.locator(".dashboard-main > :first-child").boundingBox();
  const calendarBox = await calendar.boundingBox();
  expect(upcoming).not.toBeNull();
  expect(calendarBox).not.toBeNull();
  expect(calendarBox!.x).toBeCloseTo(upcoming!.x, 0);
  expect(calendarBox!.width).toBeCloseTo(upcoming!.width, 0);
  expect(calendarBox!.y - upcoming!.y - upcoming!.height).toBeLessThan(85);
  expect(calendarBox!.height).toBeLessThan(850);
  await page.locator(".dashboard-grid").screenshot({ path: testInfo.outputPath("dashboard-compact.png") });
  await calendar.screenshot({ path: testInfo.outputPath("calendar-desktop.png") });

  dashboardRequests.length = 0;
  const heading = page.locator(".page-heading");
  await heading.evaluate((element) => element.setAttribute("data-calendar-check", "preserved"));
  await page.context().setOffline(true);
  try {
    // Every month works without prefetching, APIs, or a document navigation.
    await calendar.getByRole("button", { name: "Previous month", exact: true }).click();
    for (let number = 1; number <= 12; number++) {
      const value = `2028-${String(number).padStart(2, "0")}`;
      if (number > 1) await calendar.getByRole("button", { name: "Next month", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`month=${value}$`));
      const count = number === 2 ? 9 : number === 3 ? 1 : 0;
      await expect(calendar.getByText(`${count} ${count === 1 ? "deadline" : "deadlines"} this month`, { exact: true })).toBeVisible();
    }
    for (let step = 0; step < 12; step++) await calendar.getByRole("button", { name: "Previous month", exact: true }).click();
    await calendar.getByRole("button", { name: "Next month", exact: true }).click();
    await expect(monthHeading("January 2028")).toBeVisible();
    await calendar.getByRole("button", { name: "Previous month", exact: true }).click();
    await expect(monthHeading("December 2027")).toBeVisible();
    for (let step = 0; step < 2; step++) await calendar.getByRole("button", { name: "Next month", exact: true }).click();
    await calendar.getByRole("button", { name: "Next month", exact: true }).click();
    await calendar.getByRole("button", { name: "1 Mar 2028: 1 task", exact: true }).click();
    await expect(page.getByRole("dialog").getByRole("link", { name: /Next month deadline/ })).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
    await page.goBack();
    await expect(monthHeading("February 2028")).toBeVisible();
    await page.goForward();
    await expect(monthHeading("March 2028")).toBeVisible();
    await calendar.getByRole("button", { name: "Next month", exact: true }).click();
    await calendar.getByRole("button", { name: "Next month", exact: true }).click();
    await calendar.getByRole("button", { name: "Previous month", exact: true }).click();
    await expect(monthHeading("April 2028")).toBeVisible();
    await expect(heading).toHaveAttribute("data-calendar-check", "preserved");
    expect(calendarRequests).toEqual([]);
    expect(dashboardRequests).toEqual([]);
  } finally {
    await page.context().setOffline(false);
  }

  for (let step = 0; step < 2; step++) await calendar.getByRole("button", { name: "Previous month", exact: true }).click();
  await page.reload();
  await expect(monthHeading("February 2028")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(leapDay).toBeVisible();
  await expect(leapDay.getByText("5 tasks", { exact: true })).toBeVisible();
  const agenda = calendar.getByRole("region", { name: "Task agenda for February 2028", exact: true });
  await expect(agenda).toBeVisible();
  await expect(agenda.getByRole("link")).toHaveCount(9);
  await expect(agenda.getByRole("link", { name: /Calendar study 5/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await calendar.screenshot({ path: testInfo.outputPath("calendar-mobile.png") });
  await leapDay.click();
  dialog = page.getByRole("dialog", { name: /^Deadlines for 29 Feb 2028/ });
  await expect(dialog.getByRole("link")).toHaveCount(5);
  await dialog.getByRole("link", { name: /Calendar study 5/ }).click();
  await expect(page).toHaveURL(/\/tasks\/[^/]+$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Calendar study 5", exact: true })).toBeVisible({ timeout: 15_000 });
  await page.goto("/dashboard?month=2020-02");
  await calendar.getByRole("button", { name: "29 Feb 2020: 1 task", exact: true }).click();
  dialog = page.getByRole("dialog", { name: /^Deadlines for 29 Feb 2020/ });
  await expect(dialog.getByText("Overdue", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await calendar.getByRole("button", { name: "This month", exact: true }).click();
  const today = todayInSingapore();
  await expect(page).toHaveURL(new RegExp(`month=${today.slice(0, 7)}$`));
  await expect(calendar.getByRole("button", { name: `${displayDate(today)}: 0 tasks, today`, exact: true })).toHaveAttribute("aria-current", "date");
  await expect(calendar.getByRole("region", { name: /^Task agenda for/ })).toContainText("No tasks are due this month.");
  await page.goto("/dashboard?month=1900-01");
  await expect(calendar.getByRole("button", { name: "Previous month", exact: true })).toBeDisabled();
  await page.goto("/dashboard?month=9999-12");
  await expect(calendar.getByRole("button", { name: "Next month", exact: true })).toBeDisabled();

  const otherContext = await browser.newContext({ baseURL });
  try {
    expect((await signupAccount(otherContext.request, otherAccount, baseURL)).status()).toBe(200);
    const otherPage = await otherContext.newPage();
    await otherPage.goto("/dashboard?month=2028-02");
    const otherCalendar = otherPage.locator(".deadline-calendar");
    await expect(otherCalendar.getByText("0 deadlines this month", { exact: true })).toBeVisible();
    await expect(otherCalendar.getByRole("link", { name: /Calendar study/ })).toHaveCount(0);
    expect((await otherContext.request.get(`/api/tasks/${ownedTaskId}`)).status()).toBe(404);
    const otherMonth = await otherContext.request.get("/api/calendar?month=2028-02");
    expect(otherMonth.status()).toBe(200);
    expect(otherMonth.headers()["cache-control"]).toBe("private, no-store");
    expect(await otherMonth.json()).toEqual({ month: "2028-02", tasks: [] });
  } finally {
    await otherContext.close();
  }
});
