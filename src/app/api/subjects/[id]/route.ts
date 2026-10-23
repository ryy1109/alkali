import { apiUser, failure, jsonBody } from "@/lib/http";
import { deleteSubject, saveSubject, subjectDetail } from "@/lib/planner";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try {
    return Response.json(
      await subjectDetail(
        (await apiUser(request)).id,
        (await context.params).id,
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    const user = await apiUser(request, true);
    return Response.json(
      await saveSubject(
        user.id,
        await jsonBody(request),
        (await context.params).id,
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const user = await apiUser(request, true);
    await deleteSubject(user.id, (await context.params).id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return failure(error);
  }
}
