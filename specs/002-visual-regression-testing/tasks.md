# Tasks: Visual/UI Regression Testing with Allure Reporting

**Input**: Design documents from `/specs/002-visual-regression-testing/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: This feature's deliverable IS test coverage (visual regression tests) — per Constitution Principle III precedent (a testing-infra feature needs no separate "test of the test"), implementation tasks below directly are the test tasks. There is no separate test-first subsection per user story.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to spec.md user stories (US1–US4)
- File paths are exact and relative to the repo root

## Path Conventions

Single Next.js + Payload monorepo. All new/changed files live under the existing `e2e/` directory, `playwright.config.ts`, `package.json`, `.github/workflows/ci.yml`, `README.md`, and `CLAUDE.md` — no new top-level directories, per plan.md's Structure Decision.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Get the new tooling and test file in place before any visual assertions are written.

- [ ] T001 Add `allure-playwright` and `allure-commandline` as devDependencies in `package.json` (`npm install --save-dev allure-playwright allure-commandline`)
- [ ] T002 [P] Add a `visual` project entry to the `projects` array in `playwright.config.ts` (alongside the existing `chromium` project), using `devices['Desktop Chrome']` as its base
- [ ] T003 [P] Add the `allure-playwright` reporter to `playwright.config.ts`'s `reporter` config so `allure-results/` is produced on every run — both the CI branch (`process.env.CI` array) and the local `list` branch (change local reporter to an array including `list` + `allure-playwright` rather than the bare string `'list'`)
- [ ] T004 Create `e2e/visual.spec.ts` with imports (`test`, `expect` from `@playwright/test`; `VIEWPORTS` from `./responsive.spec` — reuse the existing exported constant rather than redefining 375/768/1280 literals per CLAUDE.md's testing conventions; `AUTH_STATE_PATH`, `createMake`, `createModel`, `createPublishedVehicle` from `./helpers`) and two empty `test.describe` blocks: `'Visual — public site'` and `'Visual — admin'`

**Checkpoint**: `npx playwright test --project=visual` runs (with zero tests) and `allure-results/` appears after any `npm run test:e2e` run.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared visual-test configuration that every page/view snapshot in Phase 3+ depends on for stable, non-flaky comparisons.

**⚠️ CRITICAL**: Complete before writing any individual page snapshot test — retrofitting these into already-written tests risks needing to regenerate every baseline twice.

- [ ] T005 In `playwright.config.ts`'s `visual` project `use` block, fix `colorScheme: 'light'` and `deviceScaleFactor: 1` so snapshots don't vary with OS theme or DPI; set a top-level `expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide' } }` so CSS transitions/animations and the text-input caret don't produce nondeterministic diffs (Playwright's documented mechanism for this exact problem, per research.md)
- [ ] T006 [P] In `e2e/visual.spec.ts`, add a shared `test.beforeAll`/setup helper that seeds one deterministic Make/Model/published Vehicle fixture (via `createMake`/`createModel`/`createPublishedVehicle` from `./helpers`, mirroring the pattern already used in `e2e/responsive.spec.ts`) for use by every public-site visual test, so listing/detail pages have stable, known content instead of relying on whatever data happens to exist
- [ ] T007 [P] In `e2e/visual.spec.ts`, add a shared masking helper/constant (an array of `Locator`s or a `mask: [...]` builder) covering known-dynamic regions identified during implementation (e.g. any visible seeded IDs/slugs, Payload admin's relative "last updated" timestamps) for reuse across the individual `toHaveScreenshot()` calls in Phase 3, satisfying FR-004

**Checkpoint**: Foundation ready — individual page/view snapshot tests (Phase 3+) can now be added.

---

## Phase 3: User Story 1 - Catch a visually broken page before it reaches production (Priority: P1) 🎯 MVP

**Goal**: Automated visual regression coverage exists for every public-site page and Payload admin view enumerated in FR-001/FR-002, catching the exact "renders with no visible content" failure class that let a blank `/admin` ship to production.

**Independent Test**: Intentionally break a covered page's render (e.g. comment out the admin dashboard's content, per quickstart.md Scenario 2) and confirm `npx playwright test --project=visual` fails with a diff; revert and confirm it passes again.

### Implementation for User Story 1

- [ ] T008 [P] [US1] In `e2e/visual.spec.ts`'s `'Visual — public site'` block, add a snapshot test for the landing page (`/en`) looping over `VIEWPORTS.mobile`/`.tablet`/`.desktop`, calling `expect(page).toHaveScreenshot()` per viewport
- [ ] T009 [P] [US1] Add a snapshot test for the vehicle listing page with no filters applied (`/en/vehicles`) across all three `VIEWPORTS`
- [ ] T010 [P] [US1] Add a snapshot test for the vehicle listing page with one filter applied (e.g. filtered by the seeded Make from T006) across all three `VIEWPORTS`
- [ ] T011 [P] [US1] Add a snapshot test for the vehicle detail page (`/en/vehicles/<seeded-slug>`) across all three `VIEWPORTS`, using the masking helper from T007 to mask any visibly dynamic region
- [ ] T012 [P] [US1] Add a snapshot test for the about page (`/en/about`) across all three `VIEWPORTS`
- [ ] T013 [P] [US1] In `e2e/visual.spec.ts`'s `'Visual — admin'` block, add an unauthenticated snapshot test for `/admin/login` (do not apply `AUTH_STATE_PATH` to this test — it must render the logged-out login form)
- [ ] T014 [P] [US1] Add an unauthenticated snapshot test for `/admin/create-first-user` — note in a code comment (per quickstart.md) that this route redirects once a user already exists, so this test must run against a database state with no admin user yet, or be explicitly skipped/documented as a first-run-only check consistent with how `e2e/global-setup.ts` already handles this dual-state route
- [ ] T015 [US1] Add an authenticated (`test.use({ storageState: AUTH_STATE_PATH })`) snapshot test for the post-login admin dashboard (`/admin`) — this is the specific regression check for the blank-`/admin` incident (SC-002); apply the masking helper from T007 for any dynamic dashboard content
- [ ] T016 [P] [US1] Add an authenticated snapshot test for a collection list view (`/admin/collections/vehicles`), masked for dynamic row data (T007)
- [ ] T017 [P] [US1] Add an authenticated snapshot test for a collection edit view (`/admin/collections/vehicles/<seeded-vehicle-id>`), masked for dynamic fields (T007)
- [ ] T018 [US1] Run `npx playwright test --project=visual --update-snapshots` once (in the CI-equivalent environment per research.md's determinism decision, or accept that this first run establishes the initial baselines for human review per FR-012) and commit the generated PNG baselines under `e2e/visual.spec.ts-snapshots/`

**Checkpoint**: `npx playwright test --project=visual` passes against committed baselines; intentionally breaking the admin dashboard's render causes T015 to fail (quickstart.md Scenario 2). This is the MVP — the feature delivers its core value at this point.

---

## Phase 4: User Story 2 - Triage visual failures separately from functional failures (Priority: P2)

**Goal**: A developer can tell a visual failure from a functional failure at a glance, and run/re-run either suite independently.

**Independent Test**: Run `npm run test:e2e` with one functional and one visual test both failing; confirm the report distinguishes them by project. Run `npx playwright test --project=visual` alone and confirm it does not execute any `chromium`-project (functional) test.

### Implementation for User Story 2

- [ ] T019 [US2] Add a `test:e2e:visual` script to `package.json` (`"test:e2e:visual": "playwright test --project=visual"`) as a documented shortcut for running only the visual suite, matching the existing `test:e2e:ui`/`test:e2e:headed` script naming convention
- [ ] T020 [US2] Verify (manually, during implementation) that the `github` and `html` reporters already configured in `playwright.config.ts` group results by project name in their output — Playwright's built-in project grouping requires no additional code, only confirmation this behaves as expected with the new `visual` project present
- [ ] T021 [US2] In `README.md`'s Testing section (and/or CLAUDE.md's testing rule section), document the `npm run test:e2e:visual` command and that CI/report output groups results by project name, satisfying FR-005/SC-003

**Checkpoint**: Both User Story 1 and User Story 2 work independently — visual tests both exist and are separately triageable.

---

## Phase 5: User Story 3 - Update a baseline after an intentional design change (Priority: P2)

**Goal**: A documented, reliable procedure exists for regenerating a visual baseline after an intentional design change, without regenerating it in a way that risks masking unrelated regressions.

**Independent Test**: Make an intentional visual change to a covered page, follow the documented procedure, and confirm the suite passes with the new baseline (quickstart.md Scenario 4).

### Implementation for User Story 3

- [ ] T022 [US3] Add a new `README.md` subsection (in or near the existing Testing section) titled something like "Visual regression tests" documenting: how to run them locally (`npm run test:e2e:visual`), that local runs are for iteration only, and the step-by-step baseline-update procedure from research.md's "Baseline environment determinism" decision (CI-equivalent environment only — never commit a locally-generated PNG as the merged baseline)
- [ ] T023 [US3] In the same `README.md` subsection, explicitly document the font/OS screenshot-diffing determinism gotcha (why local baselines are invalid) using the same documentation pattern already used for the `tsx`/`@next/env` gotcha in README's Known Issues section, per FR-006
- [ ] T024 [US3] Update `CLAUDE.md`'s testing rule section to note that new public pages/admin views are expected to get visual snapshot coverage going forward (FR-011), matching the existing pattern where the responsive-testing requirement was added as a standing rule

**Checkpoint**: User Stories 1–3 all work independently — coverage exists, is triageable, and is maintainable via a documented update path.

---

## Phase 6: User Story 4 - Browse structured test results as artifacts, not just pass/fail (Priority: P3)

**Goal**: Every `test:e2e` run (local and CI) produces Allure's structured results, and CI preserves them as a retrievable build artifact.

**Independent Test**: Run `npm run test:e2e` locally and confirm `allure-results/` is populated (quickstart.md Scenario 5). Push a PR and confirm the `e2e` CI job's run has a downloadable `allure-results` artifact regardless of pass/fail (quickstart.md Scenario 6).

### Implementation for User Story 4

- [ ] T025 [US4] Add an `allure:report` script to `package.json` (`"allure:report": "allure generate allure-results --clean -o allure-report"`) for generating the optional static HTML report locally, per data-model.md's Structured Test Results entity
- [ ] T026 [US4] In `.github/workflows/ci.yml`'s `e2e` job, add a step (running unconditionally, i.e. no `if: failure()` guard — unlike the existing `playwright-report` upload) that runs `npx allure generate allure-results --clean -o allure-report` after the test step
- [ ] T027 [US4] In the same job, add an `actions/upload-artifact@v4` step uploading both `allure-results/` and `allure-report/` (mirroring the existing `playwright-report` upload step's structure: `retention-days: 7`), satisfying FR-009
- [ ] T028 [US4] Document in `README.md`'s Testing section how to generate and open the local Allure report (`npm run allure:report` then `npx allure open allure-report`) and where to find the CI-produced artifact on a workflow run's Summary page

**Checkpoint**: All four user stories work independently — the feature is complete per spec.md.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation that the feature is additive-only and fully documented, per FR-010/SC-006 and the repo's standard pre-PR checklist.

- [ ] T029 Run `npm run test:e2e` (full suite, all projects) and confirm the `chromium` (functional) project's pass/fail results and count are identical to what they were before this feature was added, per FR-010/SC-006
- [ ] T030 Run `npx tsc --noEmit` and confirm no type errors were introduced by `e2e/visual.spec.ts` or the `playwright.config.ts` changes
- [ ] T031 Walk through every scenario in `specs/002-visual-regression-testing/quickstart.md` end-to-end and confirm each expected outcome holds
- [ ] T032 [P] Do a final pass over `README.md`/`CLAUDE.md` changes from T021/T022/T023/T024/T028 for consistency with the rest of each document's existing tone/structure

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (needs `e2e/visual.spec.ts` and the `visual` project to exist) — BLOCKS Phase 3
- **User Story 1 (Phase 3)**: Depends on Foundational — delivers the MVP
- **User Story 2 (Phase 4)**: Depends on Foundational; independent of US1's specific page tests (only needs the `visual` project to exist, from Setup) — can run in parallel with Phase 3 if staffed separately, though in practice T020 benefits from at least one real visual test existing to verify against
- **User Story 3 (Phase 5)**: Depends on Foundational and benefits from US1 existing (documents the procedure T018 already exercised) — sequence after Phase 3 in practice
- **User Story 4 (Phase 6)**: Depends on Setup's T001/T003 (Allure reporter already wired) — independent of US1/US2/US3's specific content, can run in parallel with Phases 3–5
- **Polish (Phase 7)**: Depends on all prior phases being complete

### Parallel Opportunities

- T002 and T003 (different config sections of the same file — flag as sequential in practice since both edit `playwright.config.ts`, but conceptually independent changes)
- T006 and T007 (different helper additions within `e2e/visual.spec.ts`)
- T008–T012 (public-site page tests, US1) can be written in parallel — different `test()` blocks in the same file, no shared state beyond the T006 fixture
- T013, T014, T016, T017 (admin view tests, US1) can be written in parallel with each other and with T008–T012
- Phase 4 (US2) and Phase 6 (US4) can proceed in parallel with each other and, once Foundational is done, largely in parallel with Phase 3 (US1) since they touch different files (`package.json`/`ci.yml`/docs vs. `e2e/visual.spec.ts` test bodies)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational)
2. Complete Phase 3 (User Story 1) — this alone catches the incident class that motivated the feature (SC-002)
3. **STOP and VALIDATE**: run quickstart.md Scenarios 1–2, confirm the admin-dashboard-blank regression is caught
4. Everything from Phase 4 onward is valuable but not required for the core regression-catching capability to exist

### Incremental Delivery

1. Setup + Foundational → visual testing infrastructure exists but covers nothing yet
2. Add US1 → full page/view coverage exists (MVP — the feature's core value is delivered)
3. Add US2 → triage/separation is confirmed and documented
4. Add US3 → the team has a trustworthy, documented way to keep the suite green after intentional changes
5. Add US4 → structured results feed the (separately tracked) future dashboard issue
6. Polish → confirm nothing regressed, everything documented

## Notes

- No `[P]` marker is used across different sections of the same file (e.g. `playwright.config.ts`, `e2e/visual.spec.ts`) even when the specific edits are logically independent, to avoid merge conflicts from parallel agents/developers editing the same file.
- Per Constitution Principle III's own precedent for testing-infrastructure features (see issue #15's explicit acceptance criterion "this itself needs no additional test-of-tests"), there is no separate "write a test that tests these tests" task — Phase 3–6's tasks are themselves the test coverage.
- T018's baseline commit is the one task in this feature that produces binary (PNG) file changes rather than source/doc changes — call this out explicitly in the PR description so reviewers know to expect image diffs.
