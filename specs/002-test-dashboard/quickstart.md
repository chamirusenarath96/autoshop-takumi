# Quickstart: Validating the Test Results Dashboard

This guide validates the feature end-to-end once implemented, in the
**separate** `autoshop-takumi-test-dashboard` project (see `plan.md` Project
Structure — nothing here runs inside the `autoshop-takumi` repo itself).

## Prerequisites

- Issue #15 has landed and CI is actively uploading Allure artifacts to
  `testing-artifacts/<run-id>/` in the **dedicated test-artifacts R2
  bucket** (separate from the main app's production-media bucket — see
  research.md §5), per `contracts/runs-data-contract.md`. At least **two**
  complete runs with distinct `runId`s and different report contents exist
  (needed for Scenario 4 to actually distinguish "the latest run" from "a
  specific older run" rather than trivially matching a single run either
  way), plus the empty state (FR-012) is separately validated against a
  fresh bucket/prefix with zero runs (Scenario 5).
- This whole quickstart run happens against a **disposable validation
  deployment and bucket** — not production — so that the incomplete/
  malformed-run fixtures in Scenario 5 and the effective-policy test in
  Scenario 6 can freely write throwaway data without affecting real users
  or leaving stray "processing" indicators behind. Tear down/clear the
  disposable bucket's contents after the run.
- A GitHub OAuth app registered for the dashboard, with its client ID/secret
  available.
- `ALLOWED_DASHBOARD_GITHUB_ID` set to the stable numeric GitHub account ID
  of a real, reachable test account for the "allowed" path (see spec.md
  FR-002 and `data-model.md`'s Authorized Viewer entity — the comparison is
  ID-based, not login-based), and access to at least one *other* GitHub
  account for the "denied" path.
- R2 credentials for the dedicated test-artifacts bucket (research.md §5).
- `.env.example` copied to `.env.local` and filled in with the above.

## Setup

```bash
cd autoshop-takumi-test-dashboard
npm install
cp .env.example .env.local   # fill in AUTH_GITHUB_ID/SECRET, AUTH_SECRET,
                              # ALLOWED_DASHBOARD_GITHUB_ID, R2 credentials
npm run dev                  # → http://localhost:3000
```

## Scenario 1 — Unauthenticated access is blocked (US3, FR-001/FR-003)

1. Open `http://localhost:3000/` in a private/incognito window.
2. **Expect**: redirected to GitHub sign-in; no run data visible anywhere in
   the page, including page source.
3. Repeat step 1 with a direct deep link, e.g.
   `http://localhost:3000/runs/<any-run-id>`.
4. **Expect**: same redirect — deep links are not a bypass (contracts/auth-contract.md).
5. **Test the underlying resource, not just the page shell**: with no
   session, directly request a known run's report asset, e.g.
   `http://localhost:3000/runs/<run-id>/report/index.html` (or the
   equivalent `data/*.json`).
6. **Expect**: the same redirect/authorization failure as step 4, and the
   response body contains none of that run's report content — a page-level
   redirect alone doesn't prove the underlying asset route is guarded if it
   was never actually requested directly.

## Scenario 2 — Non-allowlisted account is denied (US3, FR-002)

1. Start from a **fresh/clean browser context** (new incognito window, or
   explicitly clear cookies/local storage first) — reusing a browser profile
   that still holds the allowlisted account's session would let the
   dashboard render successfully without this scenario actually exercising
   the denial path at all.
2. Complete GitHub OAuth sign-in using an account whose stable GitHub
   account ID is **not** the value configured in
   `ALLOWED_DASHBOARD_GITHUB_ID`.
3. **Verify the selected account before asserting anything else** — confirm
   (e.g. via GitHub's own account-chooser UI during the OAuth flow, or by
   checking which account the test fixture actually authenticated as) that
   sign-in genuinely completed as the non-allowlisted account, not a
   leftover session from Scenario 3.
4. **Expect**: landed on `/access-denied?error=AccessDenied`
   (`contracts/auth-contract.md`); no run list, no run detail, no counts —
   nothing derived from `testing-artifacts/` appears anywhere in the
   response.
5. While still signed in as the denied account, directly request the same
   run-data and report-asset URLs as Scenario 1 step 5.
6. **Expect**: same authorization failure, no run/report content in the
   response — a denied *session* must not still be able to reach data
   through a route the page-level check didn't cover.

## Scenario 3 — Allowed account sees the latest run (US1, FR-004)

1. Complete GitHub OAuth sign-in using the allowlisted account.
2. **Expect**: landed on the dashboard home, showing the most recent
   complete CI run's overall status and pass/fail/skipped counts.
3. Open that run's detail.
4. **Expect**: individual test results are visible; any failing test shows
   its failure message (and screenshot/trace if Allure captured one).

## Scenario 4 — Browsing history (US2, FR-005/FR-006, SC-002)

Requires the **two distinct complete runs** from Prerequisites, with
different report contents — this scenario is only meaningful if there's a
non-latest run whose data is actually distinguishable from the latest.

1. From the dashboard home, navigate to the history/run-list view.
2. **Expect**: both runs listed most-recent-first, each showing date/time
   and overall pass/fail summary; reachable in ≤3 interactions per SC-002.
3. Select the run that is **not** the latest.
4. **Expect**: that specific older run's own report content renders (verify
   against its known distinct data) — not the latest run's data reused or
   duplicated.

## Scenario 5 — Empty and degraded states (FR-012/FR-013, Edge Cases)

1. Point the dashboard's R2 config at an empty/fresh prefix (no runs
   uploaded yet) and reload.
2. **Expect**: a clear empty-state message, not an error page.
3. Simulate R2 being unreachable (e.g. revoke/point credentials at an
   invalid endpoint temporarily) and reload.
4. **Expect**: a "results temporarily unavailable" state, not an unhandled
   crash — and confirm no stale/incorrect data is shown as if it were live.
5. Upload a run prefix with **no `summary.json`** yet (simulating an
   in-progress upload) that is newer than the existing latest-complete run,
   then reload the dashboard home.
6. **Expect**: the existing latest-complete run's data still renders, plus
   the "a newer run is still processing" indicator from
   `contracts/runs-data-contract.md`'s "Latest run" semantics — the newer,
   incomplete run must not silently replace or be indistinguishable from a
   genuinely-latest run, and must not appear as a selectable entry in the
   history list (Scenario 4).
7. Upload a run prefix with a **malformed `summary.json`** (e.g. invalid
   JSON, or a `reportPath`/`runId` that fails the validation in
   `contracts/runs-data-contract.md`) — give it a `runId` that sorts
   **after** the existing latest-complete run from Prerequisites (same
   requirement as step 5: if the malformed run were older, the dashboard
   correctly ignoring it wouldn't actually exercise this scenario), then
   reload.
8. **Expect**: that run is treated as `incomplete` — same non-crashing,
   "newer run unreadable" indicator as step 6, not a silent fallback to the
   older complete run with no signal — and other, validly-complete runs
   continue to render normally in both the latest and history views.
9. **Cleanup**: remove the fixtures uploaded in steps 5 and 7 (or discard
   the disposable bucket entirely) before treating this scenario as
   complete, per the disposable-environment note in Prerequisites.

## Scenario 6 — Operational isolation (FR-009, SC-004)

1. Confirm the dashboard's Vercel project, GitHub OAuth app, and R2 bucket
   are entirely separate from `autoshop-takumi`'s production infrastructure
   — no shared deploy pipeline, no shared bucket (research.md §5).
2. **Effective-policy test, not just configuration review**: using the
   dashboard's actual R2 credentials against **disposable validation
   objects** in the dedicated test-artifacts bucket (never the main app's
   real production media), attempt each of the following and confirm every
   one is denied:
   - `GetObjectCommand` with a `Key` pointing into the main app's
     production-media bucket (proves the dedicated-bucket boundary, not
     just a same-bucket prefix restriction).
   - `ListObjectsV2Command` with a `Prefix` against the main app's
     production-media bucket.
   - `PutObjectCommand` and `DeleteObjectCommand`, attempted **within the
     dashboard's own dedicated bucket** (proving the credential is
     genuinely read-only, not merely bucket-isolated).

   "The env var says read-only, different bucket" is not the same claim as
   "the credential was actually denied when it tried" — this step proves
   the latter.

All six scenarios passing, together with the automated Vitest/Playwright
suites referenced in `plan.md`'s Testing section, constitute this feature
being ready to consider done.
