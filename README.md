# Alkali

Highly reactive productivity.

Alkali is a student study planner for organizing subjects, managing
assignments and study tasks, and tracking progress.

## Project status

The initial Next.js App Router application runs locally and builds
successfully. Strict TypeScript checking and ESLint are configured.
Authentication, database access, and study-planning features are not
implemented yet.

## Local development

Requirements: Node.js 24.22.0 and npm 11.19.1.
The Node version is recorded in `.node-version`.

From the repository root:

```powershell
npm ci
npm run dev
```

Open the local URL printed by the development server.

## Checks

```powershell
npm run lint
npm run typecheck
npm run build
```

Linting covers JavaScript, TypeScript, and React Hooks rules.
Next.js-specific and JSX accessibility lint rules are not configured
because the bundled plugins currently have ESLint 10 peer conflicts.

## Branching workflow

Features are developed on `feature/*` branches created from `integration`.

Promotion flow: `feature/*` -> `integration` -> `development` -> `main`.


- `main`: stable, release-ready code
- `development`: tested baseline and release preparation
- `integration`: combined features undergoing testing
- `feature/*`: one coherent feature or foundation slice
- `fix/*`: a focused correction