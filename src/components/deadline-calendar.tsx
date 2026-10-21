"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Modal, Section } from "@ryy1109/web-components";
import { adjacentMonth, displayDate, monthDays } from "@/lib/dates";

export type CalendarTask = {
  id: string;
  title: string;
  dueDate: string;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
};

export function DeadlineCalendar({ month, today, tasks }: {
  month: string; today: string; tasks: CalendarTask[];
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const previous = adjacentMonth(month, -1);
  const next = adjacentMonth(month, 1);
  const monthLabel = new Intl.DateTimeFormat("en-SG", {
    month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(month + "-01T00:00:00Z"));
  const byDay = new Map<string, CalendarTask[]>();
  for (const task of tasks) {
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
    return <Link href={`/tasks/${task.id}`} onClick={() => setSelectedDay(null)} className={`calendar-task calendar-task-${status.className}`}>
      <span className="calendar-task-title">{task.title}</span>
      <span className="calendar-task-state">{status.label}</span>
    </Link>;
  }
  return (
    <div className="deadline-calendar">
      <Section title="Deadline calendar" spacing="medium"
        description="All task deadlines, including completed tasks. Dates follow Asia/Singapore time.">
        <div className="calendar-toolbar">
          <h3 aria-live="polite">{monthLabel}</h3>
          <div className="calendar-controls">
            <Button label="Previous month" variant="Outline" size="Small"
              href={previous ? `/dashboard?month=${previous}` : undefined} disabled={!previous} />
            <Button label="This month" variant="Ghost" size="Small"
              href={`/dashboard?month=${today.slice(0, 7)}`} />
            <Button label="Next month" variant="Outline" size="Small"
              href={next ? `/dashboard?month=${next}` : undefined} disabled={!next} />
          </div>
        </div>
        <p className="calendar-summary">{tasks.length} {tasks.length === 1 ? "deadline" : "deadlines"} this month. Select a day to see its tasks.</p>
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
                  <span className="calendar-mobile-count">{entries.length ? count : ""}</span>
                </button>
                <ul className="calendar-entries">{entries.slice(0, 3).map((task) =>
                  <li key={task.id}>{entry(task)}</li>)}</ul>
                {entries.length > 3 && <button type="button" className="calendar-more"
                  onClick={() => setSelectedDay(date)} aria-label={`View all ${count} for ${displayDate(date)}`}>
                  View all {entries.length}
                </button>}
              </td>;
            })}</tr>
          ))}</tbody>
        </table>
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
