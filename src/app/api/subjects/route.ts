import { apiUser, failure, jsonBody } from "@/lib/http";
import { listSubjects, saveSubject } from "@/lib/planner";
export async function GET(request: Request) {
  try {
    return Response.json(await listSubjects((await apiUser(request)).id));
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const user = await apiUser(request, true);
    return Response.json(await saveSubject(user.id, await jsonBody(request)), {
      status: 201,
    });
  } catch (error) {
    return failure(error);
  }
}
