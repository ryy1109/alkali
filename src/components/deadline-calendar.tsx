"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Modal, Section } from "@ryy1109/web-components";
import { adjacentMonth, calendarMonth, displayDate, monthDays } from "@/lib/dates";

export type CalendarTask = {
  id: string;
  title: string;
  dueDate: string;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
};

function monthTitle(month: string) {
  return new Intl.DateTimeFormat("en-SG", {
    month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(month + "-01T00:00:00Z"));
}

export function DeadlineCalendar({ month: initialMonth, today, tasks }: {
  month: string; today: string; tasks: CalendarTask[];
}) {
  const [month, setMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const requestedMonth = useRef(initialMonth);
  // The server supplies only this user's deadline metadata once. Month changes
  // are synchronous, including empty months and months never visited before.
  const navigate = useCallback((target: string, updateHistory = true) => {
    requestedMonth.current = target;
    setSelectedDay(null);
    setMonth(target);
    if (updateHistory) {
      const url = new URL(window.location.href);
      url.searchParams.set("month", target);
      if (url.search !== window.location.search) {
        window.history.pushState(null, "", url.pathname + url.search + url.hash);
      }
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const values = new URL(window.location.href).searchParams.getAll("month");
      const target = calendarMonth(values.length === 1 ? values[0] : undefined, today);
      navigate(target, false);
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [navigate, today]);

  function changeMonth(offset: number) {
    const target = adjacentMonth(requestedMonth.current, offset);
    if (target) navigate(target);
  }
  const previous = adjacentMonth(month, -1);
  const next = adjacentMonth(month, 1);
  const monthLabel = monthTitle(month);
  const monthTasks = tasks.filter((task) => task.dueDate.slice(0, 7) === month);
  const byDay = new Map<string, CalendarTask[]>();
  for (const task of monthTasks) {
    const date = task.dueDate.slice(0, 10);
    const entries = byDay.get(date) ?? [];
    entries.push(task);
    byDay.set(date, entries);
  }
  const days = monthDays(month);
  function state(task: CalendarTask) {
    if (task.status === "COMPLETED") return { label: "Completed", className: "completed" };
    if (task.dueDate.slice(0, 10) < today) return { label: "Overdue", className: "overdue" };
    return { label: task.status === "IN_PROGRESS" ? "In progress" : "To do", className: "pending" };
  }
  function entry(task: CalendarTask) {
    const status = state(task);
    return <Link href={`/tasks/${task.id}`} title={`${task.title} — ${status.label}`} onClick={() => setSelectedDay(null)} className={`calendar-task calendar-task-${status.className}`}>
      <span className="calendar-task-title">{task.title}</span>
      <span className="calendar-task-state">{status.label}</span>
    </Link>;
  }
  return (
    <div className="deadline-calendar">
      <Section title="Deadline calendar" spacing="medium">
        <div className="calendar-toolbar">
          <h3 aria-live="polite">{monthLabel}</h3>
          <div className="calendar-controls">
            <Button label="Previous month" variant="Outline" size="Small"
              onClick={() => changeMonth(-1)} disabled={!previous} />
            <Button label="This month" variant="Ghost" size="Small"
              onClick={() => navigate(today.slice(0, 7))} />
            <Button label="Next month" variant="Outline" size="Small"
              onClick={() => changeMonth(1)} disabled={!next} />
          </div>
        </div>
        <p className="calendar-summary" role="status">{monthTasks.length} {monthTasks.length === 1 ? "deadline" : "deadlines"} this month</p>
        <table className="month-calendar">
          <caption className="sr-only">Task deadlines for {monthLabel}</caption>
          <thead><tr>{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) =>
            <th key={day} scope="col"><abbr title={day}>{day.slice(0, 3)}</abbr></th>)}</tr></thead>
          <tbody>{Array.from({ length: days.length / 7 }, (_, week) => (
            <tr key={week}>{days.slice(week * 7, week * 7 + 7).map((date, index) => {
              if (!date) return <td key={`blank-${index}`} className="calendar-blank" />;
              const entries = byDay.get(date) ?? [];
              const count = `${entries.length} ${entries.length === 1 ? "task" : "tasks"}`;
              return <td key={date} className={date === today ? "calendar-today" : undefined}>
                <button type="button" className="calendar-day" onClick={() => setSelectedDay(date)}
                  aria-label={`${displayDate(date)}: ${count}${date === today ? ", today" : ""}`}
                  aria-current={date === today ? "date" : undefined}>
                  <span className="calendar-day-number">{Number(date.slice(8, 10))}</span>
                  {entries.length > 0 && <span className={`calendar-day-count ${
                    entries.every((task) => task.status === "COMPLETED") ? "count-completed"
                      : entries.some((task) => state(task).className === "overdue") ? "count-overdue" : ""
                  }`}>{count}</span>}
                </button>
                {entries.length > 0 && <div className="calendar-cell-tasks">
                  <ul>{entries.slice(0, 2).map((task) => <li key={task.id}>{entry(task)}</li>)}</ul>
                  {entries.length > 2 && <button type="button" className="calendar-more"
                    aria-label={`View all ${count} for ${displayDate(date)}`}
                    onClick={() => setSelectedDay(date)}>+{entries.length - 2} more</button>}
                </div>}
              </td>;
            })}</tr>
          ))}</tbody>
        </table>
        <section className="calendar-agenda" aria-label={`Task agenda for ${monthLabel}`}>
          <h3>This month’s tasks</h3>
          {byDay.size ? [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, entries]) =>
            <div className="calendar-agenda-day" key={date}>
              <h4>{displayDate(date)}</h4>
              <ul className="calendar-day-list">{entries.map((task) => <li key={task.id}>{entry(task)}</li>)}</ul>
            </div>) : <p>No tasks are due this month.</p>}
        </section>
      </Section>
      <Modal open={!!selectedDay} onClose={() => setSelectedDay(null)}
        title={selectedDay ? `Deadlines for ${displayDate(selectedDay)}` : "Daily deadlines"} size="medium"
        actions={[{ label: "Close", onClick: () => setSelectedDay(null) }]}>
        {selectedDay && (byDay.get(selectedDay)?.length
          ? <ul className="calendar-day-list">{byDay.get(selectedDay)!.map((task) => <li key={task.id}>{entry(task)}</li>)}</ul>
          : <p>No tasks are due on this date.</p>)}
      </Modal>
    </div>
  );
}
