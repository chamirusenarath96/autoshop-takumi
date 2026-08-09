# Phase 1 Data Model: Internal Test Results Dashboard

No relational database exists for this feature (per research.md §2/§4) — the
entities below are read from Cloudflare R2 object storage (a `summary.json`
sidecar per run, plus the full Allure report/result bundle) and from the
Auth.js session/JWT, not persisted by the dashboard itself.

## CI Run

Represents one completed (or in-progress) execution of the e2e/visual
regression suite that produced Allure output. Sourced from
`testing-artifacts/<run-id>/summary.json` in R2.

| Field | Type | Notes |
|---|---|---|
| `runId` | string | Stable identifier for the run; derived from the R2 object prefix (e.g. the CI run ID/timestamp issue #15's workflow assigns). |
| `startedAt` | ISO 8601 timestamp | When the CI run began; used to order the history list most-recent-first (FR-005). |
| `status` | enum: `passed` \| `failed` \| `incomplete` | `incomplete` covers the edge case of a cancelled/partial artifact upload (spec.md Edge Cases) — the dashboard must render this distinctly, never silently as `passed`/`failed`. |
| `commitSha` | string | Git commit the run was for — gives the viewer a way to correlate a run with a specific push/PR. |
| `counts.passed` / `counts.failed` / `counts.skipped` | number | Aggregate test counts for the run's summary display (FR-004, FR-005). |
| `reportPath` | string | R2 key/prefix for the full Allure report bundle for this run (FR-006). |

**Validation rules**:
- A run missing `summary.json` entirely, or with a `summary.json` that fails
  to parse, MUST be treated as `incomplete`/unavailable rather than causing
  the whole history list to fail to render (spec.md Edge Cases).
- `counts.*` MUST be non-negative integers; a run whose counts don't sum
  consistently with its `status` (e.g. `status: passed` with
  `counts.failed > 0`) is a data-integrity condition the dashboard should
  surface as-is (display what's there) rather than attempt to "correct."

**State transitions**: None managed by the dashboard — a run's `status` is
set once by CI on upload and is read-only from the dashboard's perspective
(FR-007: the dashboard never writes back).

**Relationship to Allure Report**: **optional (0..1)**, not guaranteed. A
run whose `status` is `incomplete` (missing/malformed `summary.json`, or a
`reportPath` that fails validation — see `contracts/runs-data-contract.md`)
has no readable report to link to; the dashboard still lists the run
prefix's existence without a report link, rather than omitting the run
entirely or pretending an older run is "latest" with no indication a newer
one exists (`contracts/runs-data-contract.md`'s "Latest run" semantics).

## Allure Report

The full structured test-result output for one CI Run — individual test
cases, pass/fail/skip status per test, failure messages, and any captured
attachments (screenshots/traces). Format and internal structure are owned
entirely by issue #15's Allure integration, not redefined here; the
dashboard's contract with this data is limited to: "given a CI Run's
`reportPath`, render/link into its contents" (see
`contracts/allure-report-contract.md`).

| Field (conceptual) | Notes |
|---|---|
| Per-test result | status, name, duration, failure message/stack if failed. |
| Attachments | Screenshots/traces Allure captured for a given test, if any — surfaced per FR-004's "any screenshots/traces Allure captured." |

## Authorized Viewer

Not a stored entity — derived per-request from the Auth.js JWT session after
a successful GitHub sign-in.

| Field | Type | Notes |
|---|---|---|
| `githubId` | string | The signed-in GitHub account's stable numeric account ID (GitHub's `profile.id` / OAuth `providerAccountId`, never reassigned even across a username rename). This is the field actually compared against the allowlist in the `signIn` callback (FR-002). |
| `githubLogin` | string | The signed-in GitHub account's current login/username — carried in the session for display purposes (e.g. "signed in as @login") only. MUST NOT be used as the authorization comparison, since it is user-changeable. |
| `authorized` | boolean (derived) | `true` only when `githubId` matches the allowlisted ID; unauthorized sessions never reach a page that renders CI Run/Allure Report data (FR-001, FR-003). |

**Validation rules**:
- The allowlist comparison MUST happen server-side (Auth.js `signIn`
  callback + `middleware.ts`), never as a client-side-only UI hide, per
  spec.md Edge Cases ("no test-result data was ever transmitted to that
  browser session").
- The allowlist comparison MUST be performed on `githubId`, not
  `githubLogin` (FR-002) — the configured allowlist value
  (`ALLOWED_DASHBOARD_GITHUB_ID`, see `contracts/auth-contract.md`) is the
  account's stable ID, with `ALLOWED_DASHBOARD_GITHUB_LOGIN` retained only as
  an optional human-readable label for operators configuring the deployment.

## Relationships

```text
Authorized Viewer ──(session-gated access)──→ CI Run (0..N, listed newest-first)
CI Run ──(0..1)──→ Allure Report (full detail, fetched on selection; absent for incomplete runs)
```
