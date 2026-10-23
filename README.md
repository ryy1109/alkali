# Alkali

Highly reactive productivity.

A student study planner for subjects, tasks, priorities, deadlines, and progress.

## Local setup (Windows PowerShell)

Requires Node.js 24.22.0, npm 11.19.1, and MySQL 8.
With fnm configured, run from the repository root:

```powershell
fnm use
npm ci
npm run db:generate
```

Prisma Client must be generated after installation. Generated output is ignored.

For a fresh local database setup, run:

```powershell
& .\scripts\setup-local.ps1
npm run db:migrate
npm run dev
```

The helper prompts locally for MySQL root access, checks target names first,
and creates only alkali_dev, alkali_test, and the alkali_local database account.
It refuses to replace existing targets or an existing .env.
It generates application credentials in ignored .env, never storing the root
password. If setup fails, do not rerun blindly; inspect the reported error.

For manual configuration, copy .env.example to .env and replace placeholders
locally. Never commit secrets. Use a separate production database/account and
a strong random BETTER_AUTH_SECRET. Production requires an HTTPS
BETTER_AUTH_URL. APP_TIMEZONE is Asia/Singapore.

The existing alkali database is not used. No reset command is required.

Open the local URL printed by Next.js. Signup creates a real account in the
configured database; it does not verify email ownership.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Unit tests cover validation, task planning, and deadline/calendar rules.
For browser tests, configure TEST_DATABASE_URL for local alkali_test, then run:

```powershell
npx --no-install playwright install chromium
npx --no-install playwright test --project=chromium --workers=1
```

Playwright applies pending migrations to alkali_test, starts an isolated server
at localhost:3100 using .next-test, and cleans up its generated test accounts.
Browser tests require the generated Prisma Client and a running local MySQL.
Reports and traces are ignored; CI does not currently run browser tests.

ESLint covers JavaScript, TypeScript, and React Hooks rules.
Next.js-specific and JSX accessibility lint rules are not configured because
the bundled plugins currently declare incompatible ESLint 10 peer requirements.

## Features and design

Signup/login/logout, private subjects and tasks, date-only due dates, priorities,
statuses, filtering, sorting, and dashboard summaries use per-user MySQL data.
Tasks also support one optional HTTP(S) resource link, an estimated work time,
and an optional start date ending at the existing due date. Estimates and date
ranges can be used together; status remains manual. The dashboard's monthly
deadline calendar includes completed tasks and supports month/day navigation.
The supplied logo guides the purple, lavender, and mint design.
The primary UI package is @ryy1109/web-components; see docs/components.md.

Privacy contact is a placeholder. Email delivery, self-service account
deletion/export, and production deployment are not configured.

## Branching workflow

`feature/* -> integration -> development -> main`

- main: stable release-ready code
- development: tested development baseline
- integration: combined feature testing
- feature/*: coherent implementation slice
- fix/*: focused correction

Use merge commits for features and promotions; see docs/branching.md.
Architecture, session behavior, ownership, and deadline rules are documented in
docs/architecture.md. CI must pass before merging. No license is assigned.
