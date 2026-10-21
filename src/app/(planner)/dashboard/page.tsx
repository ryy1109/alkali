import { requireUser } from "@/lib/session";
import { dashboard } from "@/lib/planner";
import { DashboardView } from "@/components/dashboard-view";
import { calendarMonth, todayInSingapore } from "@/lib/dates";
export default async function DashboardPage({ searchParams }: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const user = await requireUser();
  const today = todayInSingapore();
  const month = calendarMonth((await searchParams).month, today);
  return (
    <DashboardView
      name={user.name}
      month={month}
      today={today}
      data={JSON.parse(JSON.stringify(await dashboard(user.id, month)))}
    />
  );
}
