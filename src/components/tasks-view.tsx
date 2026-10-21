"use client";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  DateInput,
  Input,
  Modal,
  Section,
  Select,
  Table,
  Textarea,
  dayjs,
  type TableColumn,
} from "@ryy1109/web-components";
import AddRounded from "@mui/icons-material/AddRounded";
import { requestJson } from "@/lib/client-api";
import { displayDate, displayEstimate, todayInSingapore } from "@/lib/dates";
import { taskSchema } from "@/lib/validation";
export type Task = {
  id: string;
  title: string;
  description: string | null;
  resourceUrl: string | null;
  estimatedMinutes: number | null;
  startDate: string | null;
  subjectId: string | null;
  dueDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  subject?: { name: string } | null;
};
type Subject = { id: string; name: string };
type Form = {
  title: string;
  description: string;
  resourceUrl: string;
  estimatedHours: string;
  estimatedMinutePart: string;
  startDate: string;
  subjectId: string;
  dueDate: string;
  priority: Task["priority"];
  status: Task["status"];
};
const priorityLabels = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" };
const statusLabels = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};
function emptyForm(subjectId = ""): Form {
  return {
    title: "",
    description: "",
    resourceUrl: "",
    estimatedHours: "",
    estimatedMinutePart: "",
    startDate: "",
    subjectId,
    dueDate: todayInSingapore(),
    priority: "MEDIUM",
    status: "TODO",
  };
}
export function TasksView({
  tasks,
  subjects,
  detail,
  subjectId,
  embedded = false,
  openNew = false,
  initialFilter = "ALL",
}: {
  tasks: Task[];
  subjects: Subject[];
  detail?: Task;
  subjectId?: string;
  embedded?: boolean;
  openNew?: boolean;
  initialFilter?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Task | "new" | null>(
    openNew ? "new" : null,
  );
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [form, setForm] = useState<Form>(() => emptyForm(subjectId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sort, setSort] = useState({
    field: "dueDate",
    direction: "asc" as "asc" | "desc",
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  function edit(task: Task | "new") {
    setForm(
      task === "new"
        ? emptyForm(subjectId)
        : {
            title: task.title,
            description: task.description || "",
            resourceUrl: task.resourceUrl || "",
            estimatedHours: task.estimatedMinutes == null ? "" : String(Math.floor(task.estimatedMinutes / 60)),
            estimatedMinutePart: task.estimatedMinutes == null ? "" : String(task.estimatedMinutes % 60),
            startDate: task.startDate?.slice(0, 10) || "",
            subjectId: task.subjectId || "",
            dueDate: task.dueDate.slice(0, 10),
            priority: task.priority,
            status: task.status,
          },
    );
    setError("");
    setEditing(task);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const hasEstimate = form.estimatedHours !== "" || form.estimatedMinutePart !== "";
    const hours = Number(form.estimatedHours || 0);
    const minutes = Number(form.estimatedMinutePart || 0);
    if (hasEstimate && (!Number.isInteger(hours) || hours < 0 ||
      !Number.isInteger(minutes) || minutes < 0 || minutes > 59)) {
      setError("Use whole hours and minutes, with minutes between 0 and 59.");
      return;
    }
    const payload = {
      title: form.title, description: form.description, subjectId: form.subjectId,
      dueDate: form.dueDate, startDate: form.startDate, resourceUrl: form.resourceUrl,
      priority: form.priority, status: form.status,
      estimatedMinutes: hasEstimate ? hours * 60 + minutes : null,
    };
    const parsed = taskSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      await requestJson(
        "/api/tasks" + (editing && editing !== "new" ? "/" + editing.id : ""),
        editing === "new" ? "POST" : "PATCH",
        payload,
      );
      setEditing(null);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function complete(task: Task) {
    setBusy(true);
    setError("");
    try {
      await requestJson("/api/tasks/" + task.id, "PATCH", {
        status: "COMPLETED",
      });
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await requestJson("/api/tasks/" + deleting.id, "DELETE", {});
      setDeleting(null);
      if (detail) router.push("/tasks");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const filtered = useMemo(
    () =>
      tasks
        .filter(
          (task) =>
            task.title.toLowerCase().includes(search.toLowerCase()) &&
            (filter === "ALL" ||
              (filter === "OVERDUE"
                ? task.status !== "COMPLETED" &&
                  task.dueDate.slice(0, 10) < todayInSingapore()
                : task.status === filter)) &&
            (subjectFilter === "ALL" ||
              task.subjectId === subjectFilter ||
              (subjectFilter === "NONE" && !task.subjectId)) &&
            (priorityFilter === "ALL" || task.priority === priorityFilter),
        )
        .sort((a, b) => {
          const weight = { LOW: 1, MEDIUM: 2, HIGH: 3 };
          const result =
            sort.field === "priority"
              ? weight[a.priority] - weight[b.priority]
              : String(a[sort.field as keyof Task] ?? "").localeCompare(
                  String(b[sort.field as keyof Task] ?? ""),
                );
          return sort.direction === "asc" ? result : -result;
        }),
    [tasks, search, filter, subjectFilter, priorityFilter, sort],
  );
  const actualPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / pageSize) - 1),
  );
  const Heading = embedded ? "h2" : "h1";
  const columns: TableColumn[] = [
    {
      id: "complete",
      label: "Done",
      render: (row: Task) => (
        <Checkbox
          checked={row.status === "COMPLETED"}
          disabled={busy || row.status === "COMPLETED"}
          size="small"
          onChange={() => complete(row)}
          slotProps={{
            input: { "aria-label": "Mark " + row.title + " complete" },
          }}
        />
      ),
    },
    {
      id: "title",
      label: "Task",
      sortable: true,
      render: (row: Task) => (
        <Link
          className={row.status === "COMPLETED" ? "completed-title" : ""}
          href={"/tasks/" + row.id}
        >
          {row.title}
        </Link>
      ),
    },
    {
      id: "dueDate",
      label: "Due date",
      sortable: true,
      render: (row: Task) => (
        <span
          className={
            row.status !== "COMPLETED" &&
            row.dueDate.slice(0, 10) < todayInSingapore()
              ? "overdue-text"
              : ""
          }
        >
          {displayDate(row.dueDate)}
        </span>
      ),
    },
    {
      id: "priority",
      label: "Priority",
      sortable: true,
      render: (row: Task) => (
        <span className={"badge priority-" + row.priority.toLowerCase()}>
          {priorityLabels[row.priority]}
        </span>
      ),
    },
    {
      id: "status",
      label: "Status",
      sortable: true,
      render: (row: Task) => (
        <span className={"badge status-" + row.status.toLowerCase()}>
          {statusLabels[row.status]}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      render: (row: Task) => (
        <div className="row-actions">
          <Button
            label="Edit"
            variant="Ghost"
            size="Small"
            onClick={() => edit(row)}
            disabled={busy}
          />
          <Button
            label="Delete"
            variant="Ghost"
            size="Small"
            onClick={() => {
              setError("");
              setDeleting(row);
            }}
            disabled={busy}
          />
        </div>
      ),
    },
  ];
  return (
    <>
      {!embedded && (
        <Breadcrumbs
          items={[
            { label: "Overview", href: "/dashboard" },
            { label: "Tasks", href: detail ? "/tasks" : undefined },
            ...(detail ? [{ label: detail.title }] : []),
          ]}
        />
      )}
      <div className="page-heading">
        <div>
          {!embedded && <span className="eyebrow">ONE STEP AT A TIME</span>}
          <Heading className={embedded ? "embedded-title" : ""}>
            {detail?.title || (embedded ? "Subject tasks" : "Your tasks")}
          </Heading>
          <p className="muted">
            {detail
              ? "The details that keep you moving."
              : "Make space for what matters next."}
          </p>
        </div>
        {detail ? (
          <div className="inline-actions">
            <Button
              label="Edit task"
              variant="Primary"
              onClick={() => edit(detail)}
            />
            <Button
              label="Delete"
              variant="Ghost"
              onClick={() => {
                setError("");
                setDeleting(detail);
              }}
            />
          </div>
        ) : (
          <Button
            label="Add a task"
            variant="Primary"
            startIcon={<AddRounded />}
            onClick={() => edit("new")}
          />
        )}
      </div>
      {error && !editing && !deleting && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {detail ? (
        <Card
          variant="outlined"
          content={
            <div className="task-details">
              <dl>
                <dt>Status</dt>
                <dd>{statusLabels[detail.status]}</dd>
                <dt>Priority</dt>
                <dd>{priorityLabels[detail.priority]}</dd>
                <dt>Due date</dt>
                <dd>{displayDate(detail.dueDate)} · Asia/Singapore</dd>
                <dt>Subject</dt>
                <dd>
                  {detail.subject ? (
                    <Link href={"/subjects/" + detail.subjectId}>
                      {detail.subject.name}
                    </Link>
                  ) : (
                    "No subject"
                  )}
                </dd>
              </dl>
              <dl>
                <dt>Planned dates</dt>
                <dd>{detail.startDate
                  ? `${displayDate(detail.startDate)} – ${displayDate(detail.dueDate)}`
                  : "No start date set"}</dd>
                <dt>Estimated work time</dt>
                <dd>{detail.estimatedMinutes == null ? "No estimate set" : displayEstimate(detail.estimatedMinutes)}</dd>
                <dt>Resource link</dt>
                <dd>{detail.resourceUrl ? (
                  <a className="task-resource-link" href={detail.resourceUrl} target="_blank" rel="noopener noreferrer">
                    {detail.resourceUrl} <span className="muted">(opens in a new tab)</span>
                  </a>
                ) : "No link added"}</dd>
              </dl>
              <h2>Notes</h2>
              <p className="task-description">
                {detail.description || "No description added."}
              </p>
              {detail.status !== "COMPLETED" && (
                <Button
                  label="Mark complete"
                  variant="Primary"
                  disabled={busy}
                  onClick={() => complete(detail)}
                />
              )}
            </div>
          }
        />
      ) : (
        <>
          <div className="filter-bar">
            <Input
              id="task-search"
              label="Search tasks"
              size="small"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
            <Select
              id="status-filter"
              label="Status"
              size="small"
              value={filter}
              onChange={(e) => {
                setFilter(String(e.target.value));
                setPage(0);
              }}
              options={[
                { value: "ALL", label: "All statuses" },
                ...Object.entries(statusLabels).map(([value, label]) => ({
                  value,
                  label,
                })),
                { value: "OVERDUE", label: "Overdue" },
              ]}
            />
            {!subjectId && (
              <Select
                id="subject-filter"
                label="Subject"
                size="small"
                value={subjectFilter}
                onChange={(e) => {
                  setSubjectFilter(String(e.target.value));
                  setPage(0);
                }}
                options={[
                  { value: "ALL", label: "All subjects" },
                  { value: "NONE", label: "No subject" },
                  ...subjects.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            )}
            <Select
              id="priority-filter"
              label="Priority"
              size="small"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(String(e.target.value));
                setPage(0);
              }}
              options={[
                { value: "ALL", label: "All priorities" },
                ...Object.entries(priorityLabels).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
          </div>
          {tasks.length && filtered.length ? (
            <div className="table-wrap">
              <Table<Task>
                columns={columns}
                data={filtered.slice(
                  actualPage * pageSize,
                  (actualPage + 1) * pageSize,
                )}
                rowKey={(row) => row.id}
                state={filtered.length ? "default" : "empty"}
                emptyMessage="No tasks match your filters."
                caption="Your study tasks"
                sortField={sort.field}
                sortDirection={sort.direction}
                onSort={(field, direction) => setSort({ field, direction })}
                pagination={{
                  page: actualPage,
                  rowsPerPage: pageSize,
                  totalCount: filtered.length,
                  onPageChange: setPage,
                  onRowsPerPageChange: (value) => {
                    setPageSize(value);
                    setPage(0);
                  },
                }}
              />
            </div>
          ) : (
            <Section
              title={
                tasks.length
                  ? "No matching tasks"
                  : "Your next step starts here"
              }
            >
              <div className="empty-state">
                <p>
                  {tasks.length
                    ? "Try another search or change your filters."
                    : "Add a task, give it a due date, and make it manageable."}
                </p>
                {!tasks.length && (
                  <Button
                    label="Add your first task"
                    variant="Primary"
                    onClick={() => edit("new")}
                  />
                )}
              </div>
            </Section>
          )}
          <p className="timezone-note">
            Dates follow Asia/Singapore time. A task becomes overdue the day
            after its due date.
          </p>
        </>
      )}
      <Modal
        open={!!editing}
        onClose={() => {
          if (!busy) setEditing(null);
        }}
        title={editing === "new" ? "Add a task" : "Edit task"}
        type="form"
        size="medium"
        error={error || undefined}
        onSubmit={submit}
        actions={[
          {
            label: "Cancel",
            type: "button",
            onClick: () => setEditing(null),
            disabled: busy,
          },
          {
            label: "Save task",
            type: "submit",
            onClick: () => {},
            disabled: busy,
            loading: busy,
          },
        ]}
      >
        <div className="form-stack">
          <Input
            id="task-title"
            label="Task title"
            required
            fullWidth
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            disabled={busy}
            autoFocus
          />
          <Textarea
            id="task-description"
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={5000}
            showCharacterCount
            fullWidth
            disabled={busy}
          />
          <Select
            id="task-subject"
            label="Subject"
            value={form.subjectId}
            options={[
              { label: "No subject", value: "" },
              ...subjects.map((s) => ({ label: s.name, value: s.id })),
            ]}
            onChange={(e) =>
              setForm({ ...form, subjectId: String(e.target.value) })
            }
            fullWidth
            disabled={busy}
          />
          <Input
            id="task-resource-url"
            label="Resource link (optional)"
            type="url"
            value={form.resourceUrl}
            onChange={(e) => setForm({ ...form, resourceUrl: e.target.value })}
            helperText="An HTTP or HTTPS link to instructions, references, or your work."
            fullWidth
            disabled={busy}
            maxLength={2048}
          />
          <Section title="Work plan (optional)" headingLevel={3} spacing="small">
            <p className="muted">Estimate your work time, plan a start date, or use both. Status stays under your control.</p>
            <div className="form-two-columns">
              <Input
                id="task-estimated-hours" label="Estimated hours" type="number"
                value={form.estimatedHours}
                onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                slotProps={{ htmlInput: { min: 0, max: 8760, step: 1 } }}
                disabled={busy} fullWidth
              />
              <Input
                id="task-estimated-minutes" label="Estimated minutes" type="number"
                value={form.estimatedMinutePart}
                onChange={(e) => setForm({ ...form, estimatedMinutePart: e.target.value })}
                slotProps={{ htmlInput: { min: 0, max: 59, step: 1 } }}
                disabled={busy} fullWidth
              />
            </div>
            <p className="muted">Leave both fields empty for no estimate. Maximum: 8,760 hours.</p>
            <DateInput
              label="Start date (optional)"
              value={form.startDate ? dayjs(form.startDate) : null}
              onChange={(value) => setForm({ ...form,
                startDate: value?.isValid() ? value.format("YYYY-MM-DD") : "",
              })}
              maxDate={form.dueDate ? dayjs(form.dueDate) : undefined}
              format="DD/MM/YYYY" clearable fullWidth disabled={busy}
              helperText="The due date is the end of your planned date range."
            />
          </Section>
          <DateInput
            label="Due date"
            value={form.dueDate ? dayjs(form.dueDate) : null}
            onChange={(value) =>
              setForm({
                ...form,
                dueDate: value?.isValid() ? value.format("YYYY-MM-DD") : "",
              })
            }
            format="DD/MM/YYYY"
            required
            fullWidth
            disabled={busy}
            helperText="Calendar date in Asia/Singapore."
          />
          <div className="form-two-columns">
            <Select
              id="task-priority"
              label="Priority"
              value={form.priority}
              options={Object.entries(priorityLabels).map(([value, label]) => ({
                value,
                label,
              }))}
              onChange={(e) =>
                setForm({
                  ...form,
                  priority: e.target.value as Task["priority"],
                })
              }
              fullWidth
              disabled={busy}
            />
            <Select
              id="task-status"
              label="Status"
              value={form.status}
              options={Object.entries(statusLabels).map(([value, label]) => ({
                value,
                label,
              }))}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as Task["status"] })
              }
              fullWidth
              disabled={busy}
            />
          </div>
        </div>
      </Modal>
      <Modal
        open={!!deleting}
        onClose={() => {
          if (!busy) setDeleting(null);
        }}
        title="Delete this task?"
        type="confirmation"
        size="small"
        error={error || undefined}
        actions={[
          {
            label: "Keep task",
            onClick: () => setDeleting(null),
            disabled: busy,
          },
          {
            label: "Delete task",
            onClick: remove,
            destructive: true,
            disabled: busy,
            loading: busy,
          },
        ]}
      >
        <p>
          Delete <strong>{deleting?.title}</strong>? This cannot be undone.
        </p>
      </Modal>
    </>
  );
}
