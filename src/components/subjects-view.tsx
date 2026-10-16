"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  Breadcrumbs,
  Button,
  Card,
  Input,
  Modal,
  Section,
} from "@ryy1109/web-components";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import { requestJson } from "@/lib/client-api";
import { subjectSchema } from "@/lib/validation";
type Subject = {
  id: string;
  name: string;
  code: string | null;
  _count?: { tasks: number };
};
export function SubjectsView({
  subjects,
  detail,
  openNew = false,
}: {
  subjects: Subject[];
  detail?: Subject;
  openNew?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Subject | "new" | null>(
    openNew ? "new" : null,
  );
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [form, setForm] = useState({ name: "", code: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function edit(subject: Subject | "new") {
    setForm(
      subject === "new"
        ? { name: "", code: "" }
        : { name: subject.name, code: subject.code || "" },
    );
    setError("");
    setEditing(subject);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const result = subjectSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      await requestJson(
        "/api/subjects" +
          (editing !== "new" && editing ? "/" + editing.id : ""),
        editing === "new" ? "POST" : "PATCH",
        form,
      );
      setEditing(null);
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
      await requestJson("/api/subjects/" + deleting.id, "DELETE", {});
      setDeleting(null);
      if (detail) router.push("/subjects");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Overview", href: "/dashboard" },
          { label: "Subjects", href: detail ? "/subjects" : undefined },
          ...(detail ? [{ label: detail.name }] : []),
        ]}
      />
      <div className="page-heading">
        <div>
          <span className="eyebrow">A PLACE FOR EVERY CLASS</span>
          <h1>{detail?.name || "Your subjects"}</h1>
          <p className="muted">
            {detail?.code ||
              "Bring your classes and their next steps together."}
          </p>
        </div>
        {detail ? (
          <div className="inline-actions">
            <Button
              label="Edit subject"
              variant="Outline"
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
            label="Add a subject"
            variant="Primary"
            startIcon={<AddRounded />}
            onClick={() => edit("new")}
          />
        )}
      </div>
      {!detail &&
        (subjects.length ? (
          <div className="subject-grid">
            {subjects.map((subject, index) => (
              <Card
                key={subject.id}
                variant="outlined"
                className="subject-card"
                content={
                  <>
                    <div className={"subject-icon tone-" + (index % 3)}>
                      <MenuBookRounded />
                    </div>
                    <span className="subject-code">
                      {subject.code || "SUBJECT"}
                    </span>
                    <h2>
                      <Link href={"/subjects/" + subject.id}>
                        {subject.name}
                      </Link>
                    </h2>
                    <p className="muted">{subject._count?.tasks || 0} tasks</p>
                  </>
                }
                actions={
                  <>
                    <Button
                      label="Edit"
                      variant="Ghost"
                      size="Small"
                      onClick={() => edit(subject)}
                    />
                    <Button
                      label="Delete"
                      variant="Ghost"
                      size="Small"
                      onClick={() => {
                        setError("");
                        setDeleting(subject);
                      }}
                    />
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <Section title="A fresh start for your subjects">
            <div className="empty-state">
              <MenuBookRounded />
              <p>Add your first subject to give your study tasks a home.</p>
              <Button
                label="Add a subject"
                variant="Primary"
                onClick={() => edit("new")}
              />
            </div>
          </Section>
        ))}
      <Modal
        open={!!editing}
        onClose={() => {
          if (!busy) setEditing(null);
        }}
        title={editing === "new" ? "Add a subject" : "Edit subject"}
        type="form"
        size="small"
        onSubmit={submit}
        error={error || undefined}
        actions={[
          {
            label: "Cancel",
            type: "button",
            onClick: () => setEditing(null),
            disabled: busy,
          },
          {
            label: busy ? "Saving…" : "Save subject",
            type: "submit",
            onClick: () => {},
            disabled: busy,
            loading: busy,
          },
        ]}
      >
        <div className="form-stack">
          <Input
            id="subject-name"
            label="Subject name"
            required
            fullWidth
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={busy}
            autoFocus
          />
          <Input
            id="subject-code"
            label="Subject code (optional)"
            fullWidth
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            disabled={busy}
          />
        </div>
      </Modal>
      <Modal
        open={!!deleting}
        onClose={() => {
          if (!busy) setDeleting(null);
        }}
        title="Delete this subject?"
        type="confirmation"
        size="small"
        error={error || undefined}
        actions={[
          {
            label: "Keep subject",
            onClick: () => setDeleting(null),
            disabled: busy,
          },
          {
            label: "Delete subject",
            onClick: remove,
            destructive: true,
            disabled: busy,
            loading: busy,
          },
        ]}
      >
        <p>
          Delete <strong>{deleting?.name}</strong>? Its tasks will be preserved
          and will no longer be associated with a subject.
        </p>
      </Modal>
    </>
  );
}
