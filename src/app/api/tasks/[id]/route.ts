import { apiUser, failure, jsonBody } from "@/lib/http";
import { completeTask, deleteTask, saveTask, taskDetail } from "@/lib/planner";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try {
    return Response.json(
      await taskDetail((await apiUser(request)).id, (await context.params).id),
    );
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    const user = await apiUser(request, true);
    const id = (await context.params).id;
    const body = await jsonBody(request);
    if (
      body &&
      typeof body === "object" &&
      Object.keys(body).length === 1 &&
      body.status === "COMPLETED"
    )
      return Response.json(await completeTask(user.id, id));
    return Response.json(await saveTask(user.id, body, id));
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const user = await apiUser(request, true);
    await deleteTask(user.id, (await context.params).id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return failure(error);
  }
}
