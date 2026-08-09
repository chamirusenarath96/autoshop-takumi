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
| `githubLogin` | string | The signed-in GitHub account's login, compared against `ALLOWED_DASHBOARD_GITHUB_LOGIN` in the `signIn` callback (FR-002). |
| `authorized` | boolean (derived) | `true` only when `githubLogin` matches the allowlist; unauthorized sessions never reach a page that renders CI Run/Allure Report data (FR-001, FR-003). |

**Validation rules**:
- The allowlist comparison MUST happen server-side (Auth.js `signIn`
  callback + `middleware.ts`), never as a client-side-only UI hide, per
  spec.md Edge Cases ("no test-result data was ever transmitted to that
  browser session").

## Relationships

```text
Authorized Viewer ──(session-gated access)──→ CI Run (0..N, listed newest-first)
CI Run ──(1:1)──→ Allure Report (full detail, fetched on selection)
```
