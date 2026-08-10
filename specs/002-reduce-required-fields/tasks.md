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

**Shared implementation note that applies to both stories**: both hooks must read a field's *effective* value for the current save — the incoming `data` merged over `originalDoc` (the full, currently-persisted document, present on updates) — rather than `data.<field>` alone, since Payload's `beforeValidate`/`beforeChange` hooks only receive the delta being submitted, not the full document. This is documented in `research.md`'s "`originalDoc` merge" decision and `data-model.md`'s Validation Rules, and is called out per-task below wherever it applies, but is not itself a separate blocking task — it's a correctness requirement baked into T007 and T014.

---

## Phase 3: User Story 1 - Save a draft listing without typing a slug (Priority: P1) 🎯 MVP

**Goal**: A blank `slug` field is auto-filled from the vehicle's title on save, collisions are resolved automatically, and manually-entered or previously-existing slugs are never overwritten — including on an update that simply doesn't mention `slug` in its payload.

**Independent Test**: Create a vehicle via `POST /api/vehicles` with only `title` set and no `slug`; confirm a `201` response with a non-empty, unique, auto-derived `slug` — independently of anything related to make/model/year.

### Tests for User Story 1 ⚠️

> Write these first; T002 must fail (module doesn't exist yet) before T006 is implemented.

- [ ] T002 [P] [US1] Write unit tests for a `generateUniqueSlug(title, existingSlugs)` pure function in `src/lib/slug.test.ts` covering: a blank/whitespace-only title input (asserted to throw, not to silently return an empty string), a non-blank title that normalizes to an empty string via `slugify()` (e.g. `"★★★"`) asserted to fall back to the `"vehicle"` base rather than throwing or returning empty, the no-collision base case, a single collision producing a `-2` suffix, and multiple sequential collisions producing `-3`/`-4`
- [ ] T003 [US1] Update the existing `can create a draft vehicle via API` test in `e2e/admin.spec.ts` to omit `slug` from the `POST /api/vehicles?locale=en` request body and assert the response's `doc.slug` is a non-empty, URL-safe value derived from `title`
- [ ] T004 [US1] Add a new test in `e2e/admin.spec.ts` that creates two vehicles with the same title one after another via `POST /api/vehicles?locale=en` and asserts their resulting `slug` values are distinct (sequential collision auto-resolved, no `400`/unique-constraint error) — write alongside T003/T005 but land sequentially, since all three edit the same `e2e/admin.spec.ts` region
- [ ] T005 [US1] Add a new test in `e2e/admin.spec.ts` that takes an existing vehicle with an already-persisted `slug`, sends a `PATCH` that changes only an unrelated field (e.g. `price`) with `slug` entirely absent from the request body, and asserts the vehicle's `slug` is unchanged afterward — this specifically exercises the `originalDoc`-fallback behavior (an update that omits `slug` must not be misread as "slug is blank")

### Implementation for User Story 1

- [ ] T006 [US1] Implement `generateUniqueSlug(title: string, existingSlugs: string[]): string` in `src/lib/slug.ts`, reusing `slugify()` from `src/lib/utils.ts` for formatting, throwing an error on a blank/whitespace-only `title`, falling back to a fixed `"vehicle"` base when a non-blank title normalizes to an empty string, and appending an incrementing numeric suffix (`-2`, `-3`, ...) until the result isn't in `existingSlugs` (makes T002 pass)
- [ ] T007 [US1] Add a `beforeValidate` hook to the `vehicles` collection in `src/collections/Vehicles.ts` that: computes the effective slug as `'slug' in data ? data.slug : originalDoc?.slug` (presence-based, not `??` — an explicit `data.slug: null` must be respected as a clear, not silently overridden by `originalDoc`) and no-ops if that's already non-blank; otherwise computes the effective title the same presence-based way from `data.title`/`originalDoc?.title` (or `titleEn`, per spec Assumptions) scoped to the `en` locale, fetches currently-persisted vehicle slugs via the Payload Local API (excluding the current document's own id on update), calls `generateUniqueSlug()`, and assigns the result to `data.slug` (depends on T006; makes T005 pass by construction — a `slug` key genuinely absent from `data` falls back to `originalDoc.slug` and is treated as already-set)
- [ ] T008 [US1] Remove `required: true` from the `slug` field definition in `src/collections/Vehicles.ts` and update its `admin.description` to accurately describe the new auto-generation behavior instead of the current, inaccurate claim (depends on T007; makes T003/T004 pass)

**Checkpoint**: User Story 1 is independently functional — T002–T005 pass, and a vehicle can be created and saved with only a title.

---

## Phase 4: User Story 2 - Save a bare-bones draft from the auction floor (Priority: P2)

**Goal**: `make`, `model`, and `year` are no longer required to save a draft vehicle, but are required (alongside the existing `heroImage` check) before a vehicle can be moved to `status: 'available'` — from any originating status, and correctly reading already-persisted values on a save that doesn't resubmit them.

**Independent Test**: Create a draft vehicle via `POST /api/vehicles` with `make`/`model`/`year` omitted; confirm the save succeeds. Then attempt `PATCH .../:id` with `{"status": "available"}` and confirm it's blocked with a message naming the missing field(s), independently of anything related to slugs.

### Tests for User Story 2 ⚠️

- [ ] T009 [US2] Extend `e2e/admin.spec.ts`'s existing `blocks publishing a vehicle without a hero image` coverage (or add sibling tests) asserting that a draft vehicle with `heroImage` set is blocked from `status: 'available'` when: each of `make`/`model`/`year` is missing individually (error names that one field); all three are missing at once (error names all three); two of the three are missing in combination (error names exactly those two) — and repeat the individually-missing case starting from `status: 'reserved'` and `status: 'sold'` (not just `draft`) to confirm the gate is origin-agnostic
- [ ] T010 [US2] Add a test in `e2e/admin.spec.ts` confirming `POST /api/vehicles` succeeds with `make`, `model`, and `year` all omitted from the request body (draft creation) — write alongside T009/T011/T012 but land sequentially, since all four edit the same `e2e/admin.spec.ts` region
- [ ] T011 [US2] Add a test in `e2e/admin.spec.ts` confirming a `PATCH` that does not set `status: 'available'` (e.g. an unrelated field update, or a `draft`→`draft` no-op) on a vehicle missing `make`/`model`/`year` is never blocked by the new gate
- [ ] T012 [US2] Add a test in `e2e/admin.spec.ts` that takes a vehicle whose `make`/`model`/`year`/`heroImage` were already set via an earlier `PATCH`, then sends a *second* `PATCH` containing only `{"status": "available"}` (none of those four fields resubmitted), and asserts the publish succeeds — this specifically exercises the `originalDoc`-fallback behavior on the publish gate, mirroring T005 on the slug side

### Implementation for User Story 2

- [ ] T013 [P] [US2] Remove `required: true` from the `make`, `model`, and `year` field definitions in `src/collections/Vehicles.ts` (makes T010 pass)
- [ ] T014 [US2] Extend the existing `beforeChange` hook in `src/collections/Vehicles.ts` so that whenever `data.status === 'available'` (i.e. this specific save is the one setting it — a save that doesn't touch `status` at all never triggers this check, per FR-011), it requires the effective `heroImage`/`make`/`model`/`year` — each computed presence-based as `'<field>' in data ? data.<field> : originalDoc?.<field>`, not `??` (so an explicit clear, e.g. `data.make: null`, is correctly read as missing rather than silently falling back to the old value) — with the thrown error message naming every specific field found missing; this fires identically regardless of the vehicle's status before this save (depends on T013; makes T009/T012 pass)

**Checkpoint**: User Stories 1 and 2 both independently functional — the full slug + draft-safety behavior described in spec.md works end-to-end.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Repo-wide consistency and final validation once both stories are complete.

- [ ] T015 [P] Review the `vehicle create form shows all key fields` test in `e2e/admin.spec.ts` and update any assertion that describes `slug`/`make`/`model`/`year` as required, so it reflects the new minimum-required-fields reality
- [ ] T016 Walk through all 8 scenarios in `specs/002-reduce-required-fields/quickstart.md` against a local `npm run dev` server to confirm end-to-end behavior matches the spec
- [ ] T017 Run `npm test && npx tsc --noEmit && npm run test:e2e` locally per this repo's testing rule and confirm all three suites are green before opening/updating the implementation PR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: No standalone tasks for this feature — see the shared implementation note above, which both T007 and T014 must honor.
- **User Story 1 (Phase 3)**: Depends on Setup (T001) only. Fully independent of User Story 2.
- **User Story 2 (Phase 4)**: Depends on Setup (T001) only. Fully independent of User Story 1 — can be implemented and shipped before, after, or interleaved with US1.
- **Polish (Phase 5)**: Depends on both User Story 1 and User Story 2 being complete.

### Within Each User Story

- Tests (T002–T005, T009–T012) MUST be written and observed failing before their corresponding implementation tasks.
- The pure helper (T006) is implemented before the hook that calls it (T007).
- Field `required`-ness changes (T008, T013) and hook changes (T007, T014) touch the same file (`src/collections/Vehicles.ts`) — do these sequentially even though they're within the same story, to avoid overlapping edits.

### Parallel Opportunities

- T002 (`src/lib/slug.test.ts`) is the only test task in User Story 1 marked `[P]` — it's a genuinely different file from T003/T004/T005, which all edit `e2e/admin.spec.ts` and must be sequenced relative to each other (see note above the task list) even though they're independent *in content*.
- T013 (field definitions in `src/collections/Vehicles.ts`) can be done in parallel with authoring T009–T012, since it's a different file-region concern than those `e2e/admin.spec.ts` tests. T009–T012 themselves all edit `e2e/admin.spec.ts` and are sequenced relative to each other, same as T003–T005.
- Because User Story 1 and User Story 2 touch non-overlapping parts of `src/collections/Vehicles.ts` (one field + one hook each), they can be implemented in either order or interleaved by a single implementer without conflict, despite sharing that file — but each story's own `e2e/admin.spec.ts` tests still land one at a time.

---

## Parallel Example: User Story 1

```bash
# T002 is the only genuinely parallel task here (different file):
Task: "Write unit tests for generateUniqueSlug() in src/lib/slug.test.ts"

# T003, T004, T005 all edit e2e/admin.spec.ts — author independently if useful,
# but land/commit them one at a time to avoid overlapping edits to the same file.
```

## Parallel Example: User Story 2

```bash
# T013 (different file) can run alongside the e2e/admin.spec.ts test authoring below:
Task: "Remove required: true from make/model/year in src/collections/Vehicles.ts"

# T009, T010, T011, T012 all edit e2e/admin.spec.ts — author independently if useful,
# but land/commit them one at a time to avoid overlapping edits to the same file.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001).
2. Complete Phase 3: User Story 1 (T002–T008).
3. **STOP and VALIDATE**: Run T002–T005; confirm slug auto-generation works end-to-end via quickstart.md Scenarios 1–4.
4. This alone resolves the most visible friction called out in the source issue (#17) — staff never type a slug again — and can ship as its own PR if desired.

### Incremental Delivery

1. Setup → User Story 1 → validate → ship (resolves the slug/friction problem).
2. Add User Story 2 → validate via quickstart.md Scenarios 5–8 → ship (resolves the auction-floor draft-creation friction).
3. Polish phase (T015–T017) closes out full-suite regression coverage and confirms CI-equivalent green locally before the implementation PR is opened.

---

## Notes

- [P] tasks touch different files only — tasks sharing a file (e.g. the several `e2e/admin.spec.ts` additions within each story) are left unmarked and should land one at a time, even when they're independent in content.
- Every task in Phase 3/4 maps to a specific functional requirement or acceptance scenario in `spec.md` — see `research.md` and `data-model.md` for the underlying design decisions each implementation task follows.
- This feature deliberately touches only `src/collections/Vehicles.ts`, one new file under `src/lib/`, and `e2e/admin.spec.ts` — no new routes, globals, or admin screens, per plan.md's Constitution Check (Principle VI).
- Commit after each task or logical group, consistent with this repo's git workflow (feature branch, PR, CI, CodeRabbit review) once `/speckit-implement` picks this up.
