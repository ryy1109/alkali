import "server-only";
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { getAuth } from "./auth";
import { getEnv } from "./env";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function apiUser(request: Request, mutation = false) {
  if (mutation) {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(getEnv().BETTER_AUTH_URL).origin)
      throw new HttpError(403, "This request could not be verified.");
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new HttpError(415, "Use a JSON request.");
  }
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session)
    throw new HttpError(401, "Your session expired. Please log in again.");
  return session.user;
}
export async function jsonBody(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 32768)
    throw new HttpError(413, "The request is too large.");
  const text = await request.text();
  if (new TextEncoder().encode(text).length > 32768)
    throw new HttpError(413, "The request is too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "The request could not be read.");
  }
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError)
    return Response.json({ error: error.issues[0].message }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025")
      return Response.json(
        { error: "This item was not found." },
        { status: 404 },
      );
    if (error.code === "P2003" || error.code === "P2034")
      return Response.json(
        { error: "This item changed. Refresh and try again." },
        { status: 409 },
      );
  }
  return Response.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
