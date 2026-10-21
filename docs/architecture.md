# Architecture

Alkali is a Next.js App Router application using React, TypeScript, MySQL,
Prisma 7, Zod, Better Auth, and @ryy1109/web-components 1.1.3.

## Boundaries

- Server pages load only the current user's data.
- src/lib/planner.ts contains ownership-scoped database operations.
- Route handlers validate requests, authenticate sessions, check mutation
  origins, and return public error messages.
- src/lib/validation.ts supplies shared client/server Zod schemas.
- src/lib/db.ts creates one Prisma client using the MySQL/MariaDB adapter.
- Prisma schema and SQL migrations are tracked; generated client code is ignored.
- Client views receive public planner fields, never password hashes or sessions.

## Authentication

Better Auth owns signup, login, session cookies, current-user lookup, and logout.
Passwords use its maintained Node scrypt implementation, with a random salt,
N=16384, r=16, p=1, and a 64-byte derived key in the inspected version.
Better Auth applies NFKC normalization; passwords are never trimmed or truncated.
The application rejects passwords over 128 JavaScript string code units.
Signup requires full name, normalized email, confirmation, complexity checks,
and an explicit Privacy Policy acknowledgement, validated on the server too.
The database records acknowledgement time. Email ownership is not verified.

Session cookies are HttpOnly, SameSite=Lax, and Secure for HTTPS URLs.
Sessions expire after seven days, refresh after one day of activity, and
are checked against the database (cookie caching is disabled).
Logout revokes the current session. Authentication tokens are not persisted
in localStorage. Better Auth origin and CSRF checks remain enabled.
Authentication rate limits are database-backed: signup 3/minute, login 5/minute,
and 100/minute by default. Before deployment, configure the platform's trusted
proxy/IP forwarding behavior and test limits behind that proxy.

## Ownership and deletion

Every subject/task query and mutation includes the current user ID.
Linking a task to a subject checks ownership inside the same transaction.
Subject foreign keys use ON DELETE SET NULL: tasks survive subject deletion.
User-owned data is not returned to other users, including through IDs in URLs.
User deletion cascades to owned records, although account deletion UI is not
implemented. No database reset is part of setup or tests.

## Deadlines and dashboard

Due dates are calendar dates stored as MySQL DATE, represented as YYYY-MM-DD.
The product timezone is Asia/Singapore, independent of browser timezone.
A pending task becomes overdue at Singapore midnight after its due date.
Upcoming means pending tasks due today through six days from today,
ordered by due date, with up to eight displayed.
Pending includes To do and In progress. Completed counts only Completed.
The progress percentage is completed / all tasks; zero when no tasks exist.
Dashboard queries run in one transaction and use actual per-user records.

The monthly calendar defaults to the current Singapore month; a validated
YYYY-MM query selects another month (1900 through 9999). Invalid or repeated
month parameters fall back to the current month. It queries all owned tasks
within that month, including completed tasks, independently of the eight-item
upcoming limit. The calendar places tasks on due dates, not across planned ranges.

## Task work planning

Tasks have nullable resourceUrl (up to 2,048 characters), estimatedMinutes
(whole minutes from 1 through 525,600), and startDate (MySQL DATE).
Only HTTP/HTTPS resource links without embedded credentials are accepted;
links open in a new tab with noopener/noreferrer and are never fetched by the server.
An optional start date cannot be later than the existing due date. Estimates
and date ranges are independent and do not automatically change task status.
Empty fields clear saved values. The completion-only PATCH changes status only.
The task-planning migration adds nullable columns without changing existing rows.

## Current limits

No email verification, reset-email delivery, account deletion/export, analytics,
or deployment is configured. Privacy contact remains an explicit placeholder.
The first implementation loads a user's task list before client filtering and
pagination; move filtering/pagination into validated server queries if data volume
requires it. No production-ready deployment is claimed.
