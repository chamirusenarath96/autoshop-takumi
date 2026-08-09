# Quickstart: Validating the Test Results Dashboard

This guide validates the feature end-to-end once implemented, in the
**separate** `autoshop-takumi-test-dashboard` project (see `plan.md` Project
Structure — nothing here runs inside the `autoshop-takumi` repo itself).

## Prerequisites

- Issue #15 has landed and CI is actively uploading Allure artifacts to
  `testing-artifacts/<run-id>/` in the shared R2 bucket, per
  `contracts/runs-data-contract.md` (at least one complete run exists for a
  non-empty-state check, though the empty state itself, FR-012, should also
  be validated against a fresh bucket/prefix with zero runs).
- A GitHub OAuth app registered for the dashboard, with its client ID/secret
  available.
- `ALLOWED_DASHBOARD_GITHUB_LOGIN` set to a real, reachable test GitHub
  account for the "allowed" path, and access to at least one *other* GitHub
  account for the "denied" path.
- R2 credentials scoped read-only to `testing-artifacts/` (research.md §5).
- `.env.example` copied to `.env.local` and filled in with the above.

## Setup

```bash
cd autoshop-takumi-test-dashboard
npm install
cp .env.example .env.local   # fill in AUTH_GITHUB_ID/SECRET, AUTH_SECRET,
                              # ALLOWED_DASHBOARD_GITHUB_LOGIN, R2 credentials
npm run dev                  # → http://localhost:3000
```

## Scenario 1 — Unauthenticated access is blocked (US3, FR-001/FR-003)

1. Open `http://localhost:3000/` in a private/incognito window.
2. **Expect**: redirected to GitHub sign-in; no run data visible anywhere in
   the page, including page source.
3. Repeat step 1 with a direct deep link, e.g.
   `http://localhost:3000/runs/<any-run-id>`.
4. **Expect**: same redirect — deep links are not a bypass (contracts/auth-contract.md).

## Scenario 2 — Non-allowlisted account is denied (US3, FR-002)

1. Complete GitHub OAuth sign-in using an account that is **not** the value
   configured in `ALLOWED_DASHBOARD_GITHUB_LOGIN`.
2. **Expect**: landed on an access-denied page/state; no run list, no run
   detail, no counts — nothing derived from `testing-artifacts/` appears
   anywhere in the response.

## Scenario 3 — Allowed account sees the latest run (US1, FR-004)

1. Complete GitHub OAuth sign-in using the allowlisted account.
2. **Expect**: landed on the dashboard home, showing the most recent
   complete CI run's overall status and pass/fail/skipped counts.
3. Open that run's detail.
4. **Expect**: individual test results are visible; any failing test shows
   its failure message (and screenshot/trace if Allure captured one).

## Scenario 4 — Browsing history (US2, FR-005/FR-006, SC-002)

1. From the dashboard home, navigate to the history/run-list view.
2. **Expect**: runs listed most-recent-first, each showing date/time and
   overall pass/fail summary; reachable in ≤3 interactions per SC-002.
3. Select a run other than the latest.
4. **Expect**: that specific run's full report renders — not the latest
   run's data.

## Scenario 5 — Empty and degraded states (FR-012/FR-013, Edge Cases)

1. Point the dashboard's R2 config at an empty/fresh prefix (no runs
   uploaded yet) and reload.
2. **Expect**: a clear empty-state message, not an error page.
3. Simulate R2 being unreachable (e.g. revoke/point credentials at an
   invalid endpoint temporarily) and reload.
4. **Expect**: a "results temporarily unavailable" state, not an unhandled
   crash — and confirm no stale/incorrect data is shown as if it were live.

## Scenario 6 — Operational isolation (FR-009, SC-004)

1. Confirm the dashboard's Vercel project, GitHub OAuth app, and deploy
   pipeline are entirely separate from `autoshop-takumi`'s.
2. Confirm the dashboard's R2 credentials are scoped read-only to
   `testing-artifacts/` and cannot write to or delete objects the main
   app's media library depends on.

All six scenarios passing, together with the automated Vitest/Playwright
suites referenced in `plan.md`'s Testing section, constitute this feature
being ready to consider done.
