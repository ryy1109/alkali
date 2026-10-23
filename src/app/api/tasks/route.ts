import { apiUser, failure, jsonBody } from "@/lib/http";
import { listTasks, saveTask } from "@/lib/planner";
export async function GET(request: Request) {
  try {
    return Response.json(await listTasks((await apiUser(request)).id));
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const user = await apiUser(request, true);
    return Response.json(await saveTask(user.id, await jsonBody(request)), {
      status: 201,
    });
  } catch (error) {
    return failure(error);
  }
}
