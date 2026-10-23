import { SubjectsView } from "@/components/subjects-view";
import { requireUser } from "@/lib/session";
import { listSubjects } from "@/lib/planner";
export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await requireUser();
  return (
    <SubjectsView
      openNew={(await searchParams).new === "1"}
      subjects={JSON.parse(JSON.stringify(await listSubjects(user.id)))}
    />
  );
}
