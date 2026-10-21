"use client";
import Link from "next/link";
import {
  Breadcrumbs,
  Button,
  Card,
  Section,
  Table,
  type TableColumn,
} from "@ryy1109/web-components";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import ChecklistRounded from "@mui/icons-material/ChecklistRounded";
import TaskAltRounded from "@mui/icons-material/TaskAltRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { displayDate } from "@/lib/dates";
type Upcoming = {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  subject: { name: string } | null;
};
type Data = {
  subjects: number;
  pending: number;
  completed: number;
  overdue: number;
  upcoming: Upcoming[];
};
export function DashboardView({ name, data }: { name: string; data: Data }) {
  const total = data.pending + data.completed;
  const percent = total ? Math.round((data.completed / total) * 100) : 0;
  const columns: TableColumn[] = [
    {
      id: "title",
      label: "Task",
      render: (row: Upcoming) => (
        <Link href={"/tasks/" + row.id}>{row.title}</Link>
      ),
    },
    {
      id: "subject",
      label: "Subject",
      render: (row: Upcoming) => row.subject?.name || "No subject",
    },
    {
      id: "dueDate",
      label: "Due",
      render: (row: Upcoming) => displayDate(row.dueDate),
    },
    {
      id: "priority",
      label: "Priority",
      render: (row: Upcoming) => (
        <span className={"badge priority-" + row.priority.toLowerCase()}>
          {row.priority.toLowerCase()}
        </span>
      ),
    },
  ];
  return (
    <>
      <Breadcrumbs items={[{ label: "Workspace" }, { label: "Overview" }]} />
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR STUDY SNAPSHOT</span>
          <h1>
            Hello, {name.split(" ")[0]}
            <span className="greeting-dot">.</span>
          </h1>
          <p className="muted">A clear view of what's next. You've got this.</p>
        </div>
        <Button href="/tasks?new=1" label="Create a task" variant="Primary" />
      </div>
      <div className="stats-grid">
        {[
          {
            title: "Total subjects",
            value: data.subjects,
            note: "Your classes, organized",
            icon: MenuBookRounded,
          },
          {
            title: "Pending tasks",
            value: data.pending,
            note: "To do + in progress",
            icon: ChecklistRounded,
          },
          {
            title: "Completed tasks",
            value: data.completed,
            note: "Every step counts",
            icon: TaskAltRounded,
          },
        ].map(({ title, value, note, icon: Icon }) => (
          <Card
            key={title}
            variant="outlined"
            className="stat-card"
            content={
              <>
                <div className="stat-label">
                  <span>{title}</span>
                  <Icon />
                </div>
                <strong className="stat-number">{value}</strong>
                <p className="muted">{note}</p>
              </>
            }
          />
        ))}
      </div>
      <div className="dashboard-grid">
        <Section
          title="Coming up next"
          description="Pending tasks due today and over the next six days."
          spacing="medium"
          actions={
            <Link className="text-link" href="/tasks">
              View all tasks <ArrowForwardRounded fontSize="small" />
            </Link>
          }
        >
          {data.overdue > 0 && (
            <p className="overdue-notice">
              <strong>{data.overdue}</strong>{" "}
              {data.overdue === 1 ? "task needs" : "tasks need"} attention from
              an earlier date.{" "}
              <Link href="/tasks?filter=overdue">Review overdue tasks</Link>
            </p>
          )}
          {data.upcoming.length ? (
            <div className="table-wrap">
              <Table<Upcoming>
                columns={columns}
                data={data.upcoming}
                rowKey={(row) => row.id}
                caption="Upcoming study deadlines"
              />
            </div>
          ) : (
            <Card
              variant="outlined"
              content={
                <div className="empty-state">
                  <TaskAltRounded />
                  <h3>A little breathing room.</h3>
                  <p className="muted">No deadlines in the next seven days.</p>
                  <Button
                    href="/tasks?new=1"
                    label="Plan your next step"
                    variant="Outline"
                  />
                </div>
              }
            />
          )}
        </Section>
        <div className="dashboard-aside">
          <Card
            className="progress-card"
            content={
              <>
                <span className="eyebrow">STEADY PROGRESS</span>
                <h2>Small steps add up.</h2>
                <strong className="progress-number">{percent}%</strong>
                <progress
                  max={100}
                  value={percent}
                  aria-label="Completed tasks"
                />
                <p>
                  {data.completed} of {total} tasks complete
                </p>
                <p className="muted">
                  {total
                    ? "Keep going at your own pace."
                    : "Add your first task to start your progress."}
                </p>
              </>
            }
          />
          <Card
            variant="outlined"
            content={
              <>
                <h3>Make it your own</h3>
                <p className="muted">
                  Start with your subjects. Your next steps will follow.
                </p>
                <Button
                  href="/subjects?new=1"
                  label="Add a subject"
                  variant="Outline"
                  fullWidth
                />
              </>
            }
          />
        </div>
      </div>
      <p className="timezone-note">
        Deadlines follow Asia/Singapore time. Completed tasks are excluded from
        upcoming and overdue counts.
      </p>
    </>
  );
}
