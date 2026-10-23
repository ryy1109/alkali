import { notFound } from "next/navigation";
import { TasksView } from "@/components/tasks-view";
import { requireUser } from "@/lib/session";
import { listSubjects, taskDetail } from "@/lib/planner";
import { HttpError } from "@/lib/http";
export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const task = await taskDetail(user.id, id).catch((error) => {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  });
  return (
    <TasksView
      tasks={[]}
      detail={JSON.parse(JSON.stringify(task))}
      subjects={await listSubjects(user.id)}
    />
  );
}
