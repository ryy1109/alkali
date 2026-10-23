import { test } from "node:test";
import assert from "node:assert/strict";
import { taskSchema } from "../../src/lib/validation.ts";
import { adjacentMonth, calendarMonth, displayEstimate, monthBounds, monthDays, todayInSingapore } from "../../src/lib/dates.ts";

const task = { title: "Study", dueDate: "2026-10-25", priority: "MEDIUM", status: "TODO" };

test("task planning is optional and blank fields can be cleared", () => {
  const old = taskSchema.parse(task);
  assert.equal(old.resourceUrl, null);
  assert.equal(old.startDate, null);
  assert.equal(old.estimatedMinutes, null);
  const cleared = taskSchema.parse({ ...task, resourceUrl: "  ", startDate: "", estimatedMinutes: null });
  assert.equal(cleared.resourceUrl, null);
  assert.equal(cleared.startDate, null);
  assert.equal(cleared.estimatedMinutes, null);
});

test("resource links accept HTTP(S) and reject unsafe or credentialed URLs", () => {
  for (const resourceUrl of ["https://example.com/path?q=1", "http://example.com", null])
    assert.equal(taskSchema.safeParse({ ...task, resourceUrl }).success, true);
  for (const resourceUrl of ["javascript:alert(1)", "data:text/html,test", "ftp://example.com", "/relative", "https://user:secret@example.com", "https://user@example.com", "not a URL", "https://example.com/" + "a".repeat(2048)])
    assert.equal(taskSchema.safeParse({ ...task, resourceUrl }).success, false);
  assert.equal(taskSchema.parse({ ...task, resourceUrl: " https://example.com " }).resourceUrl, "https://example.com");
});

test("estimates require whole positive minutes within the maximum", () => {
  for (const estimatedMinutes of [1, 90, 525600, null])
    assert.equal(taskSchema.safeParse({ ...task, estimatedMinutes }).success, true);
  for (const estimatedMinutes of [0, -1, 1.5, 525601, "90", NaN, Infinity])
    assert.equal(taskSchema.safeParse({ ...task, estimatedMinutes }).success, false);
  assert.equal(displayEstimate(90), "1 hour 30 minutes");
  assert.equal(displayEstimate(60), "1 hour");
  assert.equal(displayEstimate(1), "1 minute");
});

test("date ranges include same-day tasks and allow an independent effort estimate", () => {
  for (const startDate of ["2026-10-24", "2026-10-25", null])
    assert.equal(taskSchema.safeParse({ ...task, startDate, estimatedMinutes: 90 }).success, true);
  for (const startDate of ["2026-10-26", "2026-02-30", "25/10/2026"])
    assert.equal(taskSchema.safeParse({ ...task, startDate }).success, false);
});

test("calendar defaults follow Singapore midnight and invalid months fall back", () => {
  const before = todayInSingapore(new Date("2026-10-31T15:59:59Z"));
  const after = todayInSingapore(new Date("2026-10-31T16:00:00Z"));
  assert.equal(calendarMonth(undefined, before), "2026-10");
  assert.equal(calendarMonth(undefined, after), "2026-11");
  for (const value of ["bad", "2026-13", "2026-1", "0000-01", ["2026-10"]])
    assert.equal(calendarMonth(value, before), "2026-10");
});

test("month grids have Monday-first alignment and correct leap/year boundaries", () => {
  assert.deepEqual(monthBounds("2028-02"), { start: "2028-02-01", end: "2028-02-29" });
  assert.equal(monthBounds("2027-02").end, "2027-02-28");
  assert.equal(adjacentMonth("2026-12", 1), "2027-01");
  assert.equal(adjacentMonth("2027-01", -1), "2026-12");
  assert.equal(adjacentMonth("1900-01", -1), null);
  assert.equal(adjacentMonth("9999-12", 1), null);
  const days = monthDays("2028-02");
  assert.equal(days[0], null); // February 1 is Tuesday.
  assert.equal(days[1], "2028-02-01");
  assert.equal(days.filter(Boolean).length, 29);
  assert.equal(days.length % 7, 0);
});
