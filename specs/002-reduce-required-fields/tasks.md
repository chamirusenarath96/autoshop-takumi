---

description: "Task list template for feature implementation"
---

# Tasks: Reduce Required Fields on Vehicle Listings

**Input**: Design documents from `/specs/002-reduce-required-fields/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/vehicles-api.md, quickstart.md

**Tests**: Included — this repo's Constitution Principle III ("Every Change Ships With a Test") is non-negotiable, so every task group below pairs implementation with the test(s) that cover it.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

Single project (no frontend/backend split) — all paths are relative to the repository root, matching plan.md's Project Structure section: `src/collections/Vehicles.ts`, `src/lib/`, `e2e/admin.spec.ts`.

## Phase 1: Setup

**Purpose**: Confirm the working baseline before any field/hook changes begin. No new dependencies, admin screens, or scaffolding are needed for this feature (plan.md Technical Context) — this phase is a checkpoint, not a build step.

- [ ] T001 Review the current `slug`/`make`/`model`/`year` field definitions and the existing `beforeChange` hook in `src/collections/Vehicles.ts`, and the `slugify()` implementation in `src/lib/utils.ts`, to confirm they match plan.md's stated baseline before making any change

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by both user stories.

None. The slug auto-generation (US1) and the make/model/year publish gate (US2) are independent hook/field changes that happen to live in the same collection file but do not depend on each other's code — either can be implemented and tested first. Proceed directly to Phase 3.

---

## Phase 3: User Story 1 - Save a draft listing without typing a slug (Priority: P1) 🎯 MVP

**Goal**: A blank `slug` field is auto-filled from the vehicle's title on save, collisions are resolved automatically, and manually-entered or previously-existing slugs are never overwritten.

**Independent Test**: Create a vehicle via `POST /api/vehicles` with only `title` set and no `slug`; confirm a `201` response with a non-empty, unique, auto-derived `slug` — independently of anything related to make/model/year.

### Tests for User Story 1 ⚠️

> Write these first; T002 must fail (module doesn't exist yet) before T005 is implemented.

- [ ] T002 [P] [US1] Write unit tests for a `generateUniqueSlug(title, existingSlugs)` pure function in `src/lib/slug.test.ts` covering: blank/whitespace-only title input, the no-collision base case, a single collision producing a `-2` suffix, and multiple sequential collisions producing `-3`/`-4`
- [ ] T003 [US1] Update the existing `can create a draft vehicle via API` test in `e2e/admin.spec.ts` to omit `slug` from the `POST /api/vehicles` request body and assert the response's `doc.slug` is a non-empty, URL-safe value derived from `title`
- [ ] T004 [P] [US1] Add a new test in `e2e/admin.spec.ts` that creates two vehicles with the same title back-to-back via `POST /api/vehicles` and asserts their resulting `slug` values are distinct (collision auto-resolved, no `400`/unique-constraint error)

### Implementation for User Story 1

- [ ] T005 [US1] Implement `generateUniqueSlug(title: string, existingSlugs: string[]): string` in `src/lib/slug.ts`, reusing `slugify()` from `src/lib/utils.ts` for formatting and appending an incrementing numeric suffix (`-2`, `-3`, ...) until the result isn't in `existingSlugs` (makes T002 pass)
- [ ] T006 [US1] Add a `beforeValidate` hook to the `vehicles` collection in `src/collections/Vehicles.ts` that: no-ops when `data.slug` is already non-blank; otherwise reads the title being saved, fetches currently-persisted vehicle slugs via the Payload Local API (excluding the current document's own id on update), calls `generateUniqueSlug()`, and assigns the result to `data.slug` (depends on T005)
- [ ] T007 [US1] Remove `required: true` from the `slug` field definition in `src/collections/Vehicles.ts` and update its `admin.description` to accurately describe the new auto-generation behavior instead of the current, inaccurate claim (depends on T006; makes T003/T004 pass)

**Checkpoint**: User Story 1 is independently functional — T002–T004 pass, and a vehicle can be created and saved with only a title.

---

## Phase 4: User Story 2 - Save a bare-bones draft from the auction floor (Priority: P2)

**Goal**: `make`, `model`, and `year` are no longer required to save a draft vehicle, but are required (alongside the existing `heroImage` check) before a vehicle can be moved to `status: 'available'`.

**Independent Test**: Create a draft vehicle via `POST /api/vehicles` with `make`/`model`/`year` omitted; confirm the save succeeds. Then attempt `PATCH .../:id` with `{"status": "available"}` and confirm it's blocked with a message naming the missing field(s), independently of anything related to slugs.

### Tests for User Story 2 ⚠️

- [ ] T008 [P] [US2] Extend `e2e/admin.spec.ts`'s existing `blocks publishing a vehicle without a hero image` coverage (or add a sibling test) asserting that a draft vehicle with a `heroImage` set but `make`, `model`, or `year` missing is individually blocked from `status: 'available'`, with the error naming the specific missing field — cover each of the three fields
- [ ] T009 [P] [US2] Add a test in `e2e/admin.spec.ts` confirming `POST /api/vehicles` succeeds with `make`, `model`, and `year` all omitted from the request body (draft creation)
- [ ] T010 [US2] Add a test in `e2e/admin.spec.ts` confirming a `PATCH` that does not set `status: 'available'` (e.g. an unrelated field update, or a `draft`→`draft` no-op) on a vehicle missing `make`/`model`/`year` is never blocked by the new gate

### Implementation for User Story 2

- [ ] T011 [P] [US2] Remove `required: true` from the `make`, `model`, and `year` field definitions in `src/collections/Vehicles.ts` (makes T009 pass)
- [ ] T012 [US2] Extend the existing `beforeChange` hook in `src/collections/Vehicles.ts` so the `status === 'available'` check also requires `make`, `model`, and `year` alongside the existing `heroImage` check, with the thrown error message naming every specific field found missing (depends on T011; makes T008/T010 pass)

**Checkpoint**: User Stories 1 and 2 both independently functional — the full slug + draft-safety behavior described in spec.md works end-to-end.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Repo-wide consistency and final validation once both stories are complete.

- [ ] T013 [P] Review the `vehicle create form shows all key fields` test in `e2e/admin.spec.ts` and update any assertion that describes `slug`/`make`/`model`/`year` as required, so it reflects the new minimum-required-fields reality
- [ ] T014 Walk through all 7 scenarios in `specs/002-reduce-required-fields/quickstart.md` against a local `npm run dev` server to confirm end-to-end behavior matches the spec
- [ ] T015 Run `npm test && npx tsc --noEmit && npm run test:e2e` locally per this repo's testing rule and confirm all three suites are green before opening/updating the implementation PR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Empty for this feature — nothing blocks Phase 3/4 beyond Setup.
- **User Story 1 (Phase 3)**: Depends on Setup (T001) only. Fully independent of User Story 2.
- **User Story 2 (Phase 4)**: Depends on Setup (T001) only. Fully independent of User Story 1 — can be implemented and shipped before, after, or interleaved with US1.
- **Polish (Phase 5)**: Depends on both User Story 1 and User Story 2 being complete.

### Within Each User Story

- Tests (T002–T004, T008–T010) MUST be written and observed failing before their corresponding implementation tasks.
- The pure helper (T005) is implemented before the hook that calls it (T006).
- Field `required`-ness changes (T007, T011) and hook changes (T006, T012) touch the same file (`src/collections/Vehicles.ts`) — do these sequentially even though they're within the same story, to avoid overlapping edits.

### Parallel Opportunities

- T002 and T004 (different describe blocks / different files) can be written in parallel.
- T008, T009 (different test cases within `e2e/admin.spec.ts`, no shared state) can be written in parallel; T010 depends on the field changes from T011 being conceptually understood but not on T008/T009's code.
- T011 (field definitions) can be done in parallel with writing T008–T010, since it's a different concern within the same file than the `beforeChange` hook logic in T012.
- Because User Story 1 and User Story 2 touch non-overlapping parts of `src/collections/Vehicles.ts` (one field + one hook each) and separate test cases, they can be implemented in either order or interleaved by a single implementer without conflict, despite sharing a file.

---

## Parallel Example: User Story 1

```bash
# Launch both independent test-authoring tasks together:
Task: "Write unit tests for generateUniqueSlug() in src/lib/slug.test.ts"
Task: "Add e2e/admin.spec.ts test for slug-collision auto-resolution"
```

## Parallel Example: User Story 2

```bash
# Launch independent test-authoring tasks together:
Task: "Extend e2e/admin.spec.ts publish-gate test for make/model/year"
Task: "Add e2e/admin.spec.ts test asserting draft creation succeeds without make/model/year"

# Field-definition cleanup can proceed in parallel with test authoring:
Task: "Remove required: true from make/model/year in src/collections/Vehicles.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001).
2. Complete Phase 3: User Story 1 (T002–T007).
3. **STOP and VALIDATE**: Run T002–T004; confirm slug auto-generation works end-to-end via quickstart.md Scenarios 1–4.
4. This alone resolves the most visible friction called out in the source issue (#17) — staff never type a slug again — and can ship as its own PR if desired.

### Incremental Delivery

1. Setup → User Story 1 → validate → ship (resolves the slug/friction problem).
2. Add User Story 2 → validate via quickstart.md Scenarios 5–7 → ship (resolves the auction-floor draft-creation friction).
3. Polish phase (T013–T015) closes out full-suite regression coverage and confirms CI-equivalent green locally before the implementation PR is opened.

---

## Notes

- [P] tasks touch different files, or different non-overlapping regions of the same test/config file with no shared state.
- Every task in Phase 3/4 maps to a specific functional requirement or acceptance scenario in `spec.md` — see `research.md` and `data-model.md` for the underlying design decisions each implementation task follows.
- This feature deliberately touches only `src/collections/Vehicles.ts`, one new file under `src/lib/`, and `e2e/admin.spec.ts` — no new routes, globals, or admin screens, per plan.md's Constitution Check (Principle VI).
- Commit after each task or logical group, consistent with this repo's git workflow (feature branch, PR, CI, CodeRabbit review) once `/speckit-implement` picks this up.
