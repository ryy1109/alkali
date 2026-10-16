import { requireUser } from "@/lib/session";
import { dashboard } from "@/lib/planner";
import { DashboardView } from "@/components/dashboard-view";
export default async function DashboardPage() {
  const user = await requireUser();
  return (
    <DashboardView
      name={user.name}
      data={JSON.parse(JSON.stringify(await dashboard(user.id)))}
    />
  );
}
