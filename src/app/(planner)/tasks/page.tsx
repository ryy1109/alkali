import { TasksView } from "@/components/tasks-view";
import { requireUser } from "@/lib/session";
import { listSubjects, listTasks } from "@/lib/planner";
export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; filter?: string }>;
}) {
  const user = await requireUser();
  const [tasks, subjects] = await Promise.all([
    listTasks(user.id),
    listSubjects(user.id),
  ]);
  return (
    <TasksView
      openNew={(await searchParams).new === "1"}
      initialFilter={
        (await searchParams).filter === "overdue" ? "OVERDUE" : "ALL"
      }
      tasks={JSON.parse(JSON.stringify(tasks))}
      subjects={subjects}
    />
  );
}
