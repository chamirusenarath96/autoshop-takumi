# Contract: CI Run Data (R2 ↔ Dashboard)

Applies to spec.md User Stories 1 & 2 and FR-004/FR-005/FR-006/FR-008. This
is the boundary between issue #15's CI/Allure pipeline (the producer) and
this dashboard (the consumer) — both features must honor it independently.
Full Allure report bundle format/layout is defined separately in
`contracts/allure-report-contract.md`; this contract covers run identity,
listing/ordering, and access to whatever that bundle contains.

## Ownership

The **producer** side of this contract (writing `summary.json` and the
`report/` bundle into R2) is owned entirely by issue #15's CI workflow, in
the `autoshop-takumi` repo — **not** by this dashboard project. This
dashboard is a pure **consumer**: read-only, never writes to
`testing-artifacts/`. Issue #15's own acceptance criteria must include: (a)
uploading to the `testing-artifacts/<run-id>/` prefix on the shared R2
bucket, (b) uploading the full report bundle, and (c) writing `summary.json`
last, only after the bundle upload succeeds (see Run Identity & Listing
below for why ordering matters). Without issue #15 implementing its half of
this contract, this dashboard has no data to show regardless of how
correctly it's built (FR-008, SC-005) — this is the dependency already
called out in spec.md's Assumptions and this feature's Depends-on relationship.

## R2 layout (producer contract — issue #15's CI workflow writes this)

```text
testing-artifacts/
└── <run-id>/
    ├── summary.json      # small sidecar; see shape below
    └── report/           # full Allure report bundle; see allure-report-contract.md
        └── ...
```

## Run identity & listing order

- `<run-id>` MUST be a lexicographically-sortable, time-ordered identifier
  that also preserves numeric order for its tie-breaker, since plain
  string/lexicographic comparison of an unpadded number is wrong (e.g.
  `"...-10"` sorts *before* `"...-9"` as a string). Concretely:
  `<run-id> = "<startedAt-as-YYYYMMDDTHHMMSSZ>-<github-run-id, zero-padded to 12 digits>"`
  — GitHub Actions run IDs are numeric and currently well under 12 digits, so
  zero-padding preserves both chronological order (from the timestamp
  prefix) and correct numeric tie-breaking for two runs whose `startedAt`
  lands in the same second (from the padded run ID). A test MUST cover two
  runs with the same `startedAt` and run IDs that cross a digit-width
  boundary (e.g. `9` and `10`) to confirm the padded key still orders them
  correctly.
- **Pagination**: the dashboard lists run prefixes with `ListObjectsV2`
  (`Delimiter: '/'`, `Prefix: 'testing-artifacts/'`), requesting keys in
  **descending** order is not natively supported by S3-compatible
  `ListObjectsV2` (it's ascending-only), so the dashboard fetches the
  ordered key set of run prefixes (cheap — prefixes only, not object bodies)
  and paginates the *reversed* list at the application layer for
  newest-first display; `pageSize` (FR-005/SC-002) applies to this
  already-time-ordered, already-incomplete-filtered list, not to raw
  `ListObjectsV2` pages. Because a live re-listing between two page requests
  could insert a new run and shift a naive offset-based "page 2" into
  repeating or skipping an entry, pagination state MUST be an opaque
  **keyset cursor** — a `beforeRunId` value (the last run ID emitted on the
  previous page) plus the run-id upper bound in effect for that browsing
  session — not a raw page number, and not the S3 `ContinuationToken` itself
  (which only orders the underlying ascending storage listing, not the
  dashboard's reversed, filtered view of it). Each subsequent page requests
  "runs older than `beforeRunId`," which is stable regardless of what's
  uploaded in between.
- **Incomplete-run filtering**: a `<run-id>` prefix with no `summary.json`
  yet (upload still in progress) is excluded from the listable/paginated set
  entirely — it does not occupy a page slot, consistent with "in-progress
  runs must not appear as selectable, complete entries" (spec.md Edge Cases).
- **Concurrent runs**: two runs can be mid-upload at once (e.g. two PRs'
  CI both running); each is independently excluded until its own
  `summary.json` lands — there is no shared "current run" lock to reason
  about.

## `summary.json` shape (consumer contract — dashboard reads this)

```json
{
  "runId": "string",
  "startedAt": "ISO-8601 timestamp",
  "status": "passed | failed | incomplete",
  "commitSha": "string",
  "counts": { "passed": 0, "failed": 0, "skipped": 0 },
  "reportPath": "testing-artifacts/<run-id>/report/"
}
```

Neither `runId` nor `reportPath` inside `summary.json` is an independently-
trusted field — both MUST be validated against the R2 prefix the dashboard
is actually reading, not taken at face value from the JSON payload:

- The dashboard MUST derive the **expected** `runId` from the R2 prefix it
  just listed (the `<run-id>` segment of `testing-artifacts/<run-id>/`), and
  MUST reject (treat as malformed/`incomplete`) any `summary.json` whose own
  `runId` field doesn't match that prefix-derived value. Without this check,
  a malformed or malicious `summary.json` uploaded under run A's prefix
  could claim to *be* run B and pass the `reportPath`-equality check below
  purely because both sides used the same (wrong) `runId`.
- `reportPath` MUST always equal `testing-artifacts/<prefix-derived-runId>/report/`.
  The dashboard MUST **derive** the expected `reportPath` from the
  prefix-derived `runId` (never from the JSON's own `runId` field, per the
  point above) and MUST reject any `summary.json` whose `reportPath` doesn't
  match the derived value, contains `..` traversal segments, or is an
  absolute URL.

Both checks together close off a malformed or malicious `summary.json`
pointing the dashboard at data outside its own run's prefix — checking
`reportPath` alone is insufficient if `runId` itself can't be trusted.

## "Latest run" semantics

`getLatestRun()` (tasks.md T015) returns the most recent run with a
**valid, complete** `summary.json` (i.e. one that survived the listing
filter above) — this is the **latest complete run**, not necessarily the
single most recent CI run overall. A newer run that is still uploading (no
`summary.json` yet) or whose `summary.json` is malformed MUST NOT be
silently skipped in a way that presents an older run as if it were fully
current with no indication otherwise: the dashboard home view (FR-004) MUST
additionally check whether any *more recent* run prefix exists beyond the
one being shown as "latest complete," and if so, surface a lightweight
"a newer run is still processing" or "a newer run's results couldn't be
read" indicator alongside the latest-complete run's data — never present a
stale run as simply "the latest" with no signal that something newer exists.

The **CI Run ↔ Allure Report** relationship (`data-model.md`) is therefore
**optional (0..1)**, not guaranteed 1:1: an `incomplete` run has no readable
report to link to, only the fact that a run prefix exists.

## Dashboard read operations

| Operation | Used by | Behavior |
|---|---|---|
| List run prefixes under `testing-artifacts/`, newest first, paginated | History view (US2) | Per Run Identity & Listing above; a prefix with no `summary.json` yet is excluded (in-progress run). |
| Read one run's `summary.json` | Latest-run view (US1), history row rendering | Missing/malformed, or with a `reportPath` that fails the derivation check above → treat as `incomplete`, do not crash the list (spec.md Edge Cases). |
| Read/serve one run's `report/` bundle | Run detail view (US1 latest, US2 historical) | Read-only; the dashboard never writes into `report/` or `summary.json` (FR-007). Served per `allure-report-contract.md`'s access model — through the authorized session boundary, never as a direct/public storage URL (R2 credential scoping alone does not protect an asset that's been handed out as a raw link). |

## Error handling

| Condition | Dashboard behavior |
|---|---|
| R2 bucket/prefix temporarily unreachable | Show a "results temporarily unavailable" state on the affected view; do not crash, do not show stale cached data as if live (spec.md Edge Cases). |
| Zero complete runs exist | Show an explicit empty state (FR-012), not an error. |
| A specific run's `report/` bundle is present but malformed/incomplete | That run is marked unavailable in its own detail view; does not block other runs from rendering (spec.md Edge Cases). |
| A run's `summary.json` has a `reportPath` that fails the derivation/traversal check above | Treated as malformed → `incomplete`; the run does not link out to an unverified path. |
