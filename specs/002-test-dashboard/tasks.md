---

description: "Task list for the internal Allure test-results dashboard (issue #16)"

---

# Tasks: Internal Test Results Dashboard (Allure, OAuth-Gated)

**Input**: Design documents from `/specs/002-test-dashboard/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md — all present in this directory.

**Location note**: Every task below is implemented in the **new, separate**
`autoshop-takumi-test-dashboard` repository (per plan.md's Project
Structure), not in this `autoshop-takumi` repo. File paths are relative to
that new repo's root.

**Tests**: Included — per constitution Principle III ("every change ships
with a test") and Principle IV (verify access control empirically), carried
over as this dashboard project's own testing discipline.

**Organization**: Tasks are grouped by user story from spec.md so each story
is independently implementable and testable. User Story 3 (P1, access
control) is enforced starting in the Foundational phase because Stories 1
and 2 both assume "the authorized viewer is signed in" as a precondition —
User Story 3's own phase focuses on the negative-path UX and its dedicated
verification tests, per FR-002/FR-003 and `contracts/auth-contract.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Single Next.js project (see plan.md Project Structure):
`src/app/`, `src/lib/`, `src/auth.ts`, `src/middleware.ts`, `tests/unit/`, `tests/e2e/` at the new repo's root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Stand up the new, standalone dashboard project.

- [ ] T001 Initialize a new Next.js 15 (App Router, TypeScript) project scaffold for `autoshop-takumi-test-dashboard` per plan.md's Project Structure
- [ ] T002 [P] Install dependencies: `next-auth` (Auth.js v5), `@aws-sdk/client-s3`, `vitest`, `@testing-library/react`, `@playwright/test`
- [ ] T003 [P] Configure linting/formatting (ESLint, Prettier) consistent with `autoshop-takumi`'s conventions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth gating and R2 read access — the mechanisms every user story depends on (per research.md §2/§3/§4/§5 and `contracts/auth-contract.md`).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Configure Auth.js (NextAuth v5) with the GitHub OAuth provider and JWT session strategy in `src/auth.ts`
- [ ] T005 [US3] Implement the `signIn` callback in `src/auth.ts` that rejects any GitHub login not equal to `ALLOWED_DASHBOARD_GITHUB_LOGIN` (FR-002)
- [ ] T006 Implement `src/middleware.ts` enforcing a valid, allowlisted session on every dashboard route including deep links, redirecting unauthenticated/rejected requests before any page component runs (FR-001, FR-003, `contracts/auth-contract.md`)
- [ ] T007 [P] [US3] Create the access-denied route/page at `src/app/access-denied/page.tsx`, rendered on allowlist rejection, containing no run/report data
- [ ] T008 [P] Implement a read-only R2 client wrapper in `src/lib/r2.ts` using `@aws-sdk/client-s3`, scoped to the `testing-artifacts/` prefix (research.md §5)
- [ ] T009 [P] Define the `CIRun` type/shape in `src/lib/types.ts` per `data-model.md` (runId, startedAt, status, commitSha, counts, reportPath)
- [ ] T010 Implement `listRunPrefixes()` and `readRunSummary(runId)` in `src/lib/runs.ts` reading `testing-artifacts/<run-id>/summary.json` via `src/lib/r2.ts`, per `contracts/runs-data-contract.md` — treating a missing/malformed `summary.json` as `status: 'incomplete'` rather than throwing (depends on T008, T009)
- [ ] T011 [P] Create `.env.example` documenting `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_SECRET`, `ALLOWED_DASHBOARD_GITHUB_LOGIN`, and the R2 read-only credential/endpoint variables (FR-010, FR-011)

**Checkpoint**: Auth gating and run-data access are in place — User Stories 1 and 2 can now be built on top, and User Story 3's dedicated verification tests can run against real behavior.

---

## Phase 3: User Story 1 - View the latest CI run's results (Priority: P1) 🎯 MVP

**Goal**: The signed-in, authorized viewer sees the most recent CI run's overall status, counts, and per-test detail — including failures.

**Independent Test**: Sign in as the authorized account, land on the dashboard, and confirm the latest CI run's Allure results render correctly and match what that CI run actually produced (quickstart.md Scenario 3).

### Tests for User Story 1

- [ ] T012 [P] [US1] Component test: latest-run summary (counts, status) renders correctly given a sample `CIRun` in `tests/unit/latest-run-summary.test.tsx`
- [ ] T013 [P] [US1] Component test: empty state renders when no complete runs exist (FR-012) in `tests/unit/empty-state.test.tsx`
- [ ] T014 [P] [US1] E2E test: authorized account signs in and sees the latest run's results and can drill into a failing test's detail in `tests/e2e/latest-run.spec.ts` (quickstart.md Scenario 3)

### Implementation for User Story 1

- [ ] T015 [US1] Implement `getLatestRun()` in `src/lib/runs.ts`, returning the most recent complete `CIRun` or `null` (depends on T010)
- [ ] T016 [US1] Implement `getRunReport(runId)` in `src/lib/runs.ts` to fetch/serve a single run's full Allure report bundle content from `reportPath` (depends on T010)
- [ ] T017 [US1] Implement the dashboard home page in `src/app/(dashboard)/page.tsx`, rendering the latest run's overall status and pass/fail/skipped counts (depends on T015)
- [ ] T018 [US1] Implement the run detail page in `src/app/(dashboard)/runs/[runId]/page.tsx`, rendering per-test results, failure messages, and any screenshots/traces Allure captured (depends on T016)
- [ ] T019 [US1] Add the empty-state UI to `src/app/(dashboard)/page.tsx` for when `getLatestRun()` returns `null` (FR-012)
- [ ] T020 [US1] Add a "results temporarily unavailable" degraded-state UI to `src/app/(dashboard)/page.tsx` and `src/app/(dashboard)/runs/[runId]/page.tsx` for R2-unreachable or malformed-run conditions, without crashing (FR-013)

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Browse historical runs (Priority: P2)

**Goal**: The authorized viewer can list past CI runs, most-recent-first, and open any one of them to see its own full report.

**Independent Test**: With at least two prior CI runs present, confirm the dashboard lists both as distinct entries, each opening its own correct report (quickstart.md Scenario 4).

### Tests for User Story 2

- [ ] T021 [P] [US2] Component test: run history list renders multiple runs ordered most-recent-first in `tests/unit/run-history-list.test.tsx`
- [ ] T022 [P] [US2] E2E test: authorized account opens the history view, selects an older run, and sees that run's (not the latest's) report in `tests/e2e/run-history.spec.ts` (quickstart.md Scenario 4)

### Implementation for User Story 2

- [ ] T023 [US2] Implement `listRuns({ page, pageSize })` in `src/lib/runs.ts`, returning paginated, most-recent-first `CIRun` summaries (depends on T010)
- [ ] T024 [US2] Implement the history/run-list page in `src/app/(dashboard)/runs/page.tsx`, showing each run's date/time and overall pass/fail summary (depends on T023)
- [ ] T025 [US2] Add pagination/lazy-loading controls to `src/app/(dashboard)/runs/page.tsx` so the list stays usable as runs accumulate (SC-002)
- [ ] T026 [US2] Link each history row in `src/app/(dashboard)/runs/page.tsx` to its `runs/[runId]` detail view (reuses US1's `src/app/(dashboard)/runs/[runId]/page.tsx` from T018)

**Checkpoint**: User Stories 1 and 2 both work independently — latest-run and history browsing are both functional.

---

## Phase 5: User Story 3 - Sign in as the authorized account, and be rejected otherwise (Priority: P1)

**Goal**: Verify, end-to-end, that only the allowlisted GitHub account can reach dashboard data, and every other account is cleanly denied — on every route, not just the entry page. (The enforcement mechanism itself was built in Phase 2; this phase adds the remaining UX and, critically, the empirical verification.)

**Independent Test**: Sign in with the allowlisted account and confirm access; sign in with a different valid GitHub account and confirm denial with no dashboard data ever rendered (quickstart.md Scenarios 1 & 2).

### Tests for User Story 3

- [ ] T027 [P] [US3] E2E test: unauthenticated request to the home page and to a deep-linked `/runs/[runId]` both redirect to GitHub sign-in with no run data in the response in `tests/e2e/auth-gate.spec.ts` (quickstart.md Scenario 1, `contracts/auth-contract.md`)
- [ ] T028 [P] [US3] E2E test: sign-in with a non-allowlisted GitHub account lands on the access-denied page/state with zero run or report data anywhere in the response, for both the home route and a deep-linked run route in `tests/e2e/auth-gate.spec.ts` (quickstart.md Scenario 2)
- [ ] T029 [P] [US3] E2E test: sign-in with the allowlisted account succeeds and reaches the dashboard in `tests/e2e/auth-gate.spec.ts`

### Implementation for User Story 3

- [ ] T030 [US3] Refine the access-denied page copy/messaging in `src/app/access-denied/page.tsx` (built in T007) to clearly explain the account is not authorized, with no reference to internal run data
- [ ] T031 [US3] Review `src/middleware.ts` and `src/auth.ts` against `contracts/auth-contract.md`'s Inputs/Outputs table to confirm every route (not just `/`) is covered, adding any missed route matchers

**Checkpoint**: All three user stories are independently functional and verified — the full feature is complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, isolation verification, and end-to-end validation across all stories.

- [ ] T032 [P] Write the project README documenting how this dashboard relates to `autoshop-takumi`, how CI runs deliver new Allure artifacts into `testing-artifacts/` (per `contracts/runs-data-contract.md`), and how to rotate/replace the GitHub OAuth app registration in `README.md` (FR-014)
- [ ] T033 [P] Component test: degraded/error state renders (not crashes) when a run's `summary.json` is malformed or R2 is unreachable in `tests/unit/error-states.test.tsx`
- [ ] T034 Verify the dashboard's R2 credentials are scoped read-only to `testing-artifacts/` and cannot write to or delete objects the main app's media library depends on (FR-009, SC-004, research.md §5; quickstart.md Scenario 6)
- [ ] T035 Confirm the dashboard's Vercel project and GitHub OAuth app registration are fully separate from `autoshop-takumi`'s own (FR-009, SC-004; quickstart.md Scenario 6)
- [ ] T036 Run all `quickstart.md` validation scenarios end-to-end against a deployed preview and record results

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories — auth gating (T004-T007) and R2 read access (T008-T010) are load-bearing for every story.
- **User Stories (Phase 3-5)**: All depend on Foundational completion.
  - User Story 1 (P1) has no dependency on User Story 2.
  - User Story 2 (P2) reuses User Story 1's `runs/[runId]/page.tsx` (T018) for its detail link (T026) but its list view (T023-T025) is independently buildable/testable once Foundational is done.
  - User Story 3 (P1) depends only on Foundational (the mechanism it verifies is already built there); its tasks can run in parallel with User Stories 1 and 2.
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### Parallel Opportunities

- T002, T003 (Setup) in parallel.
- T004, T007, T008, T009, T011 (Foundational, different files) in parallel; T005 depends on T004, T006 depends on T004/T005, T010 depends on T008/T009.
- Once Foundational is complete, User Story 1, User Story 2, and User Story 3 phases can proceed in parallel (different files/routes), though US2's T026 and US1's T018 touch the same detail route and should land in the order shown.
- All test tasks within a story marked [P] can run in parallel with each other.

---

## Parallel Example: Foundational Phase

```bash
# After T004 (Auth.js base config) completes:
Task: "Implement signIn allowlist callback in src/auth.ts"              # T005
Task: "Create access-denied page in src/app/access-denied/page.tsx"     # T007
Task: "Implement R2 client wrapper in src/lib/r2.ts"                    # T008
Task: "Define CIRun type in src/lib/types.ts"                           # T009
Task: "Create .env.example"                                             # T011
```

## Parallel Example: User Story 1

```bash
Task: "Component test: latest-run summary in tests/unit/latest-run-summary.test.tsx"   # T012
Task: "Component test: empty state in tests/unit/empty-state.test.tsx"                  # T013
Task: "E2E test: latest run view in tests/e2e/latest-run.spec.ts"                       # T014
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — auth gating and R2 read access block everything)
3. Complete Phase 3: User Story 1 (latest-run view)
4. **STOP and VALIDATE**: run quickstart.md Scenario 3 (and Scenarios 1/2 for the auth gate, since it's load-bearing even for the MVP)
5. Deploy the standalone dashboard project and demo

### Incremental Delivery

1. Setup + Foundational → auth-gated shell ready, no run data yet
2. Add User Story 1 → latest-run view works end-to-end → deploy (MVP)
3. Add User Story 2 → history browsing works → deploy
4. Add User Story 3's dedicated verification tests (mechanism already present since Phase 2) → confidence in the access-control guarantee is now test-backed, not just implemented
5. Polish: README, isolation verification, full quickstart pass

---

## Notes

- [P] tasks touch different files with no dependency on an incomplete task.
- Auth enforcement (US3's mechanism) is built in Foundational because Stories 1 and 2 both assume it as a precondition (spec.md acceptance scenarios for US1/US2 open with "Given the authorized account is signed in"); US3's own phase adds the denial UX and the empirical tests that prove the guarantee, per constitution Principle IV.
- This feature's implementation lives entirely in the new `autoshop-takumi-test-dashboard` repository — no task here touches this `autoshop-takumi` repo's `src/`, `e2e/`, or CI config. The CI-side step that uploads Allure artifacts into `testing-artifacts/` (the producer half of `contracts/runs-data-contract.md`) belongs to issue #15's own implementation, not this task list.
- Commit after each task or logical group; stop at each phase checkpoint to validate independently before continuing.
