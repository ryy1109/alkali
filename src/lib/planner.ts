import "server-only";
import type { z } from "zod";
import { db } from "./db";
import { HttpError } from "./http";
import { subjectSchema, taskSchema } from "./validation";
import { addDays, monthBounds, todayInSingapore } from "./dates";

export async function listSubjects(userId: string) {
  return db().subject.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { tasks: true } } },
  });
}
export async function subjectDetail(userId: string, id: string) {
  const subject = await db().subject.findFirst({
    where: { id, userId },
    include: { tasks: { orderBy: { dueDate: "asc" } } },
  });
  if (!subject) throw new HttpError(404, "Subject not found.");
  return subject;
}
export async function saveSubject(userId: string, input: unknown, id?: string) {
  const data = subjectSchema.parse(input);
  return id
    ? db().subject.update({ where: { id, userId }, data })
    : db().subject.create({ data: { ...data, userId } });
}
export async function deleteSubject(userId: string, id: string) {
  await db().subject.delete({ where: { id, userId } });
}
export async function listTasks(userId: string) {
  return db().task.findMany({
    where: { userId },
    include: { subject: { select: { id: true, name: true, code: true } } },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
}
export async function taskDetail(userId: string, id: string) {
  const task = await db().task.findFirst({
    where: { id, userId },
    include: { subject: { select: { id: true, name: true, code: true } } },
  });
  if (!task) throw new HttpError(404, "Task not found.");
  return task;
}
export async function saveTask(userId: string, input: unknown, id?: string) {
  const parsed: z.output<typeof taskSchema> = taskSchema.parse(input);
  return db().$transaction(async (tx) => {
    if (
      parsed.subjectId &&
      !(await tx.subject.findFirst({
        where: { id: parsed.subjectId, userId },
        select: { id: true },
      }))
    ) {
      throw new HttpError(404, "Choose one of your subjects.");
    }
    const data = {
      ...parsed,
      dueDate: new Date(parsed.dueDate + "T00:00:00.000Z"),
      startDate: parsed.startDate ? new Date(parsed.startDate + "T00:00:00.000Z") : null,
    };
    return id
      ? tx.task.update({ where: { id, userId }, data })
      : tx.task.create({ data: { ...data, userId } });
  });
}
export async function deleteTask(userId: string, id: string) {
  await db().task.delete({ where: { id, userId } });
}
export async function completeTask(userId: string, id: string) {
  return db().task.update({
    where: { id, userId },
    data: { status: "COMPLETED" },
  });
}
export async function dashboard(userId: string, month: string) {
  const bounds = monthBounds(month);
  const today = todayInSingapore();
  const start = new Date(today + "T00:00:00.000Z");
  const end = new Date(addDays(today, 7) + "T00:00:00.000Z");
  const [subjects, pending, completed, overdue, upcoming, calendarTasks] =
    await db().$transaction([
      db().subject.count({ where: { userId } }),
      db().task.count({ where: { userId, status: { not: "COMPLETED" } } }),
      db().task.count({ where: { userId, status: "COMPLETED" } }),
      db().task.count({
        where: { userId, status: { not: "COMPLETED" }, dueDate: { lt: start } },
      }),
      db().task.findMany({
        where: {
          userId,
          status: { not: "COMPLETED" },
          dueDate: { gte: start, lt: end },
        },
        include: { subject: { select: { name: true } } },
        orderBy: { dueDate: "asc" },
        take: 8,
      }),
      db().task.findMany({
        where: { userId, dueDate: {
          gte: new Date(bounds.start + "T00:00:00.000Z"),
          lte: new Date(bounds.end + "T00:00:00.000Z"),
        } },
        select: { id: true, title: true, dueDate: true, status: true },
        orderBy: [{ dueDate: "asc" }, { title: "asc" }, { id: "asc" }],
      }),
    ]);
  return { subjects, pending, completed, overdue, upcoming, calendarTasks };
}
