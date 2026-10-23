import { apiUser, failure, HttpError } from "@/lib/http";
import { listCalendarTasks } from "@/lib/planner";
import { calendarMonth } from "@/lib/dates";

export async function GET(request: Request) {
  try {
    const user = await apiUser(request);
    const months = new URL(request.url).searchParams.getAll("month");
    const month = months[0];
    if (months.length !== 1 || !month || calendarMonth(month) !== month) {
      throw new HttpError(400, "Choose a valid calendar month.");
    }
    return Response.json({ month, tasks: await listCalendarTasks(user.id, month) }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
