import { notFound } from "next/navigation";
import { SubjectsView } from "@/components/subjects-view";
import { TasksView } from "@/components/tasks-view";
import { requireUser } from "@/lib/session";
import { listSubjects, subjectDetail } from "@/lib/planner";
import { HttpError } from "@/lib/http";
export default async function SubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const subject = await subjectDetail(user.id, id).catch((error) => {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  });
  const subjects = await listSubjects(user.id);
  return (
    <>
      <SubjectsView
        subjects={[]}
        detail={JSON.parse(JSON.stringify(subject))}
      />
      <TasksView
        embedded
        subjectId={id}
        subjects={subjects}
        tasks={JSON.parse(
          JSON.stringify(
            subject.tasks.map((task) => ({
              ...task,
              subject: { name: subject.name },
            })),
          ),
        )}
      />
    </>
  );
}
