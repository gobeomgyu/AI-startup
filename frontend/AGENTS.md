# Agent guide

This repository is the Next.js frontend for the FastAPI service in `C:\Users\LG\test`. Keep this file short; use the linked documents for details.

## Source of truth

- `docs/plan.md`: product scope, routes, API contract, acceptance criteria.
- `docs/TEST_CASE.md`: user-run browser scenarios. Playwright E2E tests are excluded.
- `docs/DESIGN-productivity.md.txt` and `docs/DESIGN-warm.md.txt`: the two themes.
- `docs/AGENT_WORKFLOW.md`: the implementation and verification loop.
- `docs/PROGRESS.md`: completed work, evidence, and remaining blockers. Update it after each finished slice.
- `docs/CODE_QUALITY.md`: commands and commit gate.

## Product boundaries

- Build one Next.js App Router application. `/` opens the TODO list; `/settings` is a separate theme-selection screen.
- Implement working TODO list, detail, create, edit, status change, and delete against the real backend. Do not treat a visual mock as feature completion.
- Use existing members for assignee selection. Do not add authentication, member-management UI, admin UI, or Playwright E2E tests.
- Keep the backend base URL in server-side `TODO_API_BASE_URL`; do not hard-code it in browser code.
- Preserve the API semantics for optional `null` fields and tag replacement described in `docs/plan.md`.
- Treat `C:\Users\LG\test` as a reference backend. Make frontend changes in this repository.

## Work loop

1. Read the relevant part of the plan, matching `M-xx` cases, and current progress before editing.
2. Implement one complete user-visible slice, including loading, empty, error, and success states when applicable.
3. Run the smallest meaningful test for the changed behavior. Fix the failure and rerun it. Do not add tests that merely repeat the implementation.
4. Run `npm run check` before marking a slice complete. It runs lint, format, type checking, and unit tests. Fix failures; do not suppress rules to make the gate green.
5. For UI or API behavior, execute the matching manual cases in `docs/TEST_CASE.md` when the app and backend can run. Record the result or exact blocker in `docs/PROGRESS.md`.
6. Report what changed, what passed, and what remains unverified. Never claim a check passed if it was not run.

If a command fails twice for the same reason, change the diagnosis or inputs before trying again. Keep the failure output and blocker in the progress record. See `docs/AGENT_WORKFLOW.md` for the full loop.
