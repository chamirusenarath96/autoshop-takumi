# Contract: CI Run Data (R2 ↔ Dashboard)

Applies to spec.md User Stories 1 & 2 and FR-004/FR-005/FR-006/FR-008. This
is the boundary between issue #15's CI/Allure pipeline (the producer) and
this dashboard (the consumer) — both features must honor it independently.

## R2 layout (producer contract — issue #15's CI workflow writes this)

```text
testing-artifacts/
└── <run-id>/
    ├── summary.json      # small sidecar; see shape below
    └── report/           # full Allure report/result bundle for this run
        └── ...
```

- `<run-id>` MUST be unique per CI run and sort meaningfully by time (e.g. a
  timestamp-prefixed or monotonically-assigned ID) so the dashboard can
  order the history list without needing to open every `summary.json` up
  front for ordering purposes alone.
- `summary.json` MUST be written **last**, only after the full report bundle
  upload succeeds — its presence is what the dashboard treats as "this run
  is complete and listable" (spec.md Edge Case: in-progress runs must not
  appear as selectable/complete entries).

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

## Dashboard read operations

| Operation | Used by | Behavior |
|---|---|---|
| List run prefixes under `testing-artifacts/`, newest first | History view (US2) | Paginated (FR-005/SC-002); a prefix with no `summary.json` yet is excluded from the list (in-progress run). |
| Read one run's `summary.json` | Latest-run view (US1), history row rendering | Missing/malformed → treat as `incomplete`, do not crash the list (spec.md Edge Cases). |
| Read/serve one run's `report/` bundle | Run detail view (US1 latest, US2 historical) | Read-only; the dashboard never writes into `report/` or `summary.json` (FR-007). |

## Error handling

| Condition | Dashboard behavior |
|---|---|
| R2 bucket/prefix temporarily unreachable | Show a "results temporarily unavailable" state on the affected view; do not crash, do not show stale cached data as if live (spec.md Edge Cases). |
| Zero complete runs exist | Show an explicit empty state (FR-012), not an error. |
| A specific run's `report/` bundle is present but malformed/incomplete | That run is marked unavailable in its own detail view; does not block other runs from rendering (spec.md Edge Cases). |
