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

**Purpose**: Get the new tooling, project topology, and test file skeletons in place before any visual assertions are written.

- [ ] T001 Add `allure-playwright` and `allure` (Allure 3's Node-based CLI — not the Java-based `allure-commandline`, per research.md) as devDependencies in `package.json` (`npm install --save-dev allure-playwright allure`)
- [ ] T002 In `playwright.config.ts`, replace the top-level `globalSetup: './e2e/global-setup.ts'` with an `admin-setup` project whose one test runs the same `loginAsAdmin()` flow `global-setup.ts` currently runs (creating the admin user, writing `AUTH_STATE_PATH`); give the existing `chromium` project `dependencies: ['admin-setup']` so its tests still run after admin creation exactly as before (behavior-preserving for the existing functional suite — required so FR-010/SC-006 hold across this mechanism change)
- [ ] T003 [P] Add a `visual` project entry to `playwright.config.ts`'s `projects` array, using `devices['Desktop Chrome']`, `testMatch: /visual\.spec\.ts$/`, and `dependencies: ['admin-setup']`; add `testIgnore: /visual\.spec\.ts$/` to the existing `chromium` project so the two projects never double-run each other's spec file
- [ ] T004 [P] Add a `visual-first-run` project entry to `playwright.config.ts`, using `devices['Desktop Chrome']`, `testMatch: /visual-first-run\.spec\.ts$/`, and **no** `dependencies` (must not depend on `admin-setup` — see research.md's create-first-user decision); add `testIgnore: /visual-first-run\.spec\.ts$/` to both `chromium` and `visual` so neither accidentally picks it up
- [ ] T005 [P] Add the `allure-playwright` reporter to `playwright.config.ts`'s `reporter` config so `allure-results/` is produced on every run — both the CI branch (`process.env.CI` array) and the local branch (change local reporter to an array including `list` + `allure-playwright` rather than the bare string `'list'`)
- [ ] T006 [P] Add a `pretest:e2e` npm script to `package.json` (`"pretest:e2e": "rimraf allure-results"`, adding `rimraf` as a devDependency for cross-platform `rm -rf`) so `allure-results/` is cleared before every `npm run test:e2e` invocation — `allure-playwright` appends to an existing directory rather than replacing it (per research.md)
- [ ] T007 [P] Move the `VIEWPORTS` constant (`{ mobile: {375,812}, tablet: {768,1024}, desktop: {1280,800} }`) out of `e2e/responsive.spec.ts` into `e2e/helpers.ts` as a new export, and update `e2e/responsive.spec.ts`'s own usage to `import { VIEWPORTS } from './helpers'` — Playwright does not support importing one test (`*.spec.ts`) file from another, so the original plan of `visual.spec.ts` importing `VIEWPORTS` from `responsive.spec.ts` would fail at test-collection time
- [ ] T008 Create `e2e/visual.spec.ts` with imports (`test`, `expect` from `@playwright/test`; `VIEWPORTS` from `./helpers` per T007; `AUTH_STATE_PATH`, `createMake`, `createModel`, `createPublishedVehicle`, `getVisualMasks` from `./helpers`) and two empty `test.describe` blocks: `'Visual — public site'` and `'Visual — admin'`
- [ ] T009 [P] Create `e2e/visual-first-run.spec.ts` with its own minimal imports (`test`, `expect` from `@playwright/test`) — deliberately does not import anything from `e2e/visual.spec.ts` or share its `describe` blocks, since it runs as a fully separate, non-dependent project (T004)

**Checkpoint**: `npx playwright test --project=visual` and `npx playwright test --project=visual-first-run` both run (with zero tests each); `npx playwright test --project=chromium` still passes exactly as before T002's mechanism change; `allure-results/` appears (fresh, not appended) after any `npm run test:e2e` run.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared visual-test configuration that every page/view snapshot in Phase 3+ depends on for stable, non-flaky comparisons.

**⚠️ CRITICAL**: Complete before writing any individual page snapshot test — retrofitting these into already-written tests risks needing to regenerate every baseline twice.

- [ ] T010 In `playwright.config.ts`'s `visual` (and `visual-first-run`) project `use` block, fix `colorScheme: 'light'` and `deviceScaleFactor: 1` so snapshots don't vary with OS theme or DPI; set a top-level `expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 } }` so CSS transitions/animations and the text-input caret don't produce nondeterministic diffs, while `maxDiffPixelRatio: 0.01` (1% of pixels) stays tight enough to reject a gross regression like a page rendering blank (which would differ far beyond 1%) but tolerant of minor anti-aliasing noise within the pinned CI environment (per research.md's baseline-determinism decision) — document this tolerance value and rationale as a comment at the config site
- [ ] T011 [P] In `e2e/helpers.ts`, add an idempotent `getOrCreateVisualFixture(page)` helper: looks up a Vehicle by a fixed, deterministic slug (e.g. `visual-test-vehicle`) via the existing `/api/vehicles` endpoint, and only calls `createMake`/`createModel`/`createPublishedVehicle` if it doesn't already exist, returning `{ makeId, modelId, vehicleId, vehicleSlug }` — reused by every public-site visual test so the listing/detail pages have stable, unchanging content across repeated runs (per research.md's fixture-isolation decision; replaces T006 from the original task draft, which called the existing disposable-fixture helpers unconditionally)
- [ ] T012 [P] In `e2e/helpers.ts`, add a `getVisualMasks(page, view)` helper function (not a module-level constant, since `Locator`s are bound to the `page` they're created from) returning an array of fresh `Locator`s for the requested `view` (e.g. `'admin-dashboard'`, `'vehicle-detail'`) covering known-dynamic regions identified during implementation (visible seeded IDs/slugs, Payload admin's relative "last updated" timestamps) — for reuse across the individual `toHaveScreenshot({ mask: getVisualMasks(page, view) })` calls in Phase 3, satisfying FR-004
- [ ] T013 In `e2e/visual.spec.ts`, add a `test.beforeAll` in the `'Visual — public site'` describe block calling `getOrCreateVisualFixture` (T011) and storing its result in a block-scoped variable, so the listing/detail/edit-view tests (T017, T023, T025) all reference the same seeded Vehicle

**Checkpoint**: Foundation ready — individual page/view snapshot tests (Phase 3+) can now be added.

---

## Phase 3: User Story 1 - Catch a visually broken page before it reaches production (Priority: P1) 🎯 MVP

**Goal**: Automated visual regression coverage exists for every public-site page and Payload admin view enumerated in FR-001/FR-002, catching the exact "renders with no visible content" failure class that let a blank `/admin` ship to production.

**Independent Test**: Intentionally break a covered page's render (e.g. comment out the admin dashboard's content, per quickstart.md Scenario 2) and confirm `npx playwright test --project=visual` fails with a diff; revert and confirm it passes again.

### Implementation for User Story 1

- [ ] T014 [P] [US1] In `e2e/visual.spec.ts`'s `'Visual — public site'` block, add a snapshot test for the landing page (`/en`) looping over `VIEWPORTS.mobile`/`.tablet`/`.desktop`, calling `expect(page).toHaveScreenshot('landing-mobile.png')` / `'landing-tablet.png'` / `'landing-desktop.png'` per viewport — explicit, unique names per Playwright's requirement (an unnamed `toHaveScreenshot()` auto-generates a name from call order, which breaks if the loop's iteration order ever changes)
- [ ] T015 [P] [US1] Add a snapshot test for the vehicle listing page with no filters applied (`/en/vehicles`) across all three `VIEWPORTS`, named `listing-nofilter-{mobile,tablet,desktop}.png`
- [ ] T016 [P] [US1] Add a snapshot test for the vehicle listing page with one filter applied (filtered by the seeded Make from T013's fixture) across all three `VIEWPORTS`, named `listing-filtered-{mobile,tablet,desktop}.png`
- [ ] T017 [P] [US1] Add a snapshot test for the vehicle detail page (`/en/vehicles/<T013's seeded slug>`) across all three `VIEWPORTS`, named `detail-{mobile,tablet,desktop}.png`, passing `mask: getVisualMasks(page, 'vehicle-detail')` (T012) to each `toHaveScreenshot()` call
- [ ] T018 [P] [US1] Add a snapshot test for the about page (`/en/about`) across all three `VIEWPORTS`, named `about-{mobile,tablet,desktop}.png`
- [ ] T019 [P] [US1] In `e2e/visual.spec.ts`'s `'Visual — admin'` block, add an unauthenticated snapshot test for `/admin/login` (this describe block runs under the `visual` project, which has `dependencies: ['admin-setup']` — so an admin user already exists and a plain unauthenticated page load correctly reaches the login form, not create-first-user; do not apply `storageState: AUTH_STATE_PATH` to this one test), named `admin-login.png`
- [ ] T020 [US1] In `e2e/visual-first-run.spec.ts` (the separate, non-dependent project — T004/T009), add the create-first-user snapshot test: navigate to `/admin/create-first-user`, assert the create-first-user form is showing (not a redirect), and call `expect(page).toHaveScreenshot('admin-create-first-user.png')`; document at the top of the file, per quickstart.md Scenario 2a, that this project must always run standalone, never combined with `chromium`/`visual` in the same `npx playwright test` invocation
- [ ] T021 [US1] Add an authenticated (`test.use({ storageState: AUTH_STATE_PATH })`) snapshot test in `e2e/visual.spec.ts` for the post-login admin dashboard (`/admin`), named `admin-dashboard.png` — this is the specific regression check for the blank-`/admin` incident (SC-002); pass `mask: getVisualMasks(page, 'admin-dashboard')` for any dynamic dashboard content
- [ ] T022 [P] [US1] Add an authenticated snapshot test for a collection list view (`/admin/collections/vehicles`), named `admin-vehicles-list.png`, masked via `getVisualMasks(page, 'admin-vehicles-list')`
- [ ] T023 [P] [US1] Add an authenticated snapshot test for a collection edit view (`/admin/collections/vehicles/<T013's seeded vehicle ID>`), named `admin-vehicles-edit.png`, masked via `getVisualMasks(page, 'admin-vehicles-edit')`
- [ ] T024 [US1] Run `npx playwright test --project=visual --update-snapshots` and, standalone, `npx playwright test --project=visual-first-run --update-snapshots` via the `update-visual-baselines` `workflow_dispatch` job (T033, Phase 5) once it exists — or, for this very first baseline (before that job exists yet), accept this one-time bootstrap run's output as the initial baseline for human review per FR-012 — and commit the generated PNG baselines under `e2e/visual.spec.ts-snapshots/` and `e2e/visual-first-run.spec.ts-snapshots/`

**Checkpoint**: `npx playwright test --project=visual` passes against committed baselines; intentionally breaking the admin dashboard's render causes T021 to fail (quickstart.md Scenario 2). This is the MVP — the feature delivers its core value at this point.

---

## Phase 4: User Story 2 - Triage visual failures separately from functional failures (Priority: P2)

**Goal**: A developer can tell a visual failure from a functional failure at a glance, and run/re-run either suite independently.

**Independent Test**: Run `npm run test:e2e` with one functional and one visual test both failing; confirm the report distinguishes them by project. Run `npx playwright test --project=visual` alone and confirm it does not execute any `chromium`-project (functional) test.

### Implementation for User Story 2

- [ ] T025 [US2] Add a `test:e2e:visual` script to `package.json` (`"test:e2e:visual": "playwright test --project=visual"`) as a documented shortcut for running only the visual suite, matching the existing `test:e2e:ui`/`test:e2e:headed` script naming convention
- [ ] T026 [US2] Verify (manually, during implementation) that the `github` and `html` reporters already configured in `playwright.config.ts` group results by project name in their output — Playwright's built-in project grouping requires no additional code, only confirmation this behaves as expected with the new `visual`/`visual-first-run`/`admin-setup` projects present
- [ ] T027 [US2] In `README.md`'s Testing section (and/or CLAUDE.md's testing rule section), document the `npm run test:e2e:visual` command and that CI/report output groups results by project name, satisfying FR-005/SC-003

**Checkpoint**: Both User Story 1 and User Story 2 work independently — visual tests both exist and are separately triageable.

---

## Phase 5: User Story 3 - Update a baseline after an intentional design change (Priority: P2)

**Goal**: A documented, reliable procedure exists for regenerating a visual baseline after an intentional design change, without regenerating it in a way that risks masking unrelated regressions.

**Independent Test**: Make an intentional visual change to a covered page, follow the documented procedure, and confirm the suite passes with the new baseline (quickstart.md Scenario 4).

### Implementation for User Story 3

- [ ] T028 [US3] In `.github/workflows/ci.yml`, add a new `update-visual-baselines` job triggered by `workflow_dispatch` (with a required `branch` input, or triggered directly on the invoking branch/PR ref), running on `ubuntu-latest` — the same runner image as the existing `e2e` job — that: checks out the target branch, installs dependencies identically to `e2e`, runs `npx playwright install chromium --with-deps`, runs `npx playwright test --project=visual --update-snapshots` and `npx playwright test --project=visual-first-run --update-snapshots` (standalone, per T020's constraint), then commits and pushes the regenerated PNGs back to that branch (e.g. via `stefanzweifel/git-auto-commit-action` or an equivalent `git commit`/`git push` step using the workflow's `GITHUB_TOKEN`)
- [ ] T029 [US3] Add a new `README.md` subsection (in or near the existing Testing section) titled something like "Visual regression tests" documenting: how to run them locally (`npm run test:e2e:visual`), that local runs are for iteration only, and the step-by-step baseline-update procedure — manually triggering the `update-visual-baselines` workflow from GitHub Actions against the PR's branch (T028) — per research.md's "Baseline environment determinism" decision (never commit a locally-generated PNG as the merged baseline)
- [ ] T030 [US3] In the same `README.md` subsection, explicitly document the font/OS screenshot-diffing determinism gotcha (why local baselines are invalid) using the same documentation pattern already used for the `tsx`/`@next/env` gotcha in README's Known Issues section, per FR-006
- [ ] T031 [US3] Update `CLAUDE.md`'s testing rule section to note that new public pages/admin views are expected to get visual snapshot coverage going forward (FR-011), matching the existing pattern where the responsive-testing requirement was added as a standing rule

**Checkpoint**: User Stories 1–3 all work independently — coverage exists, is triageable, and is maintainable via a documented update path.

---

## Phase 6: User Story 4 - Browse structured test results as artifacts, not just pass/fail (Priority: P3)

**Goal**: Every `test:e2e` run (local and CI) produces Allure's structured results, and CI preserves them as a retrievable build artifact.

**Independent Test**: Run `npm run test:e2e` locally and confirm `allure-results/` is populated (quickstart.md Scenario 5). Push a PR and confirm the `e2e` CI job's run has a downloadable `allure-results` artifact regardless of pass/fail (quickstart.md Scenario 6).

### Implementation for User Story 4

- [ ] T032 [US4] Add an `allure:report` script to `package.json` (`"allure:report": "allure generate allure-results --clean -o allure-report"`) for generating the optional static HTML report locally, per data-model.md's Structured Test Results entity
- [ ] T033 [US4] In `.github/workflows/ci.yml`'s `e2e` job, add a step with `if: ${{ !cancelled() }}` (so it still runs after a test failure, unlike the default implicit `success()` condition, but is skipped if the job itself was cancelled) that runs `npx allure generate allure-results --clean -o allure-report` after the test step
- [ ] T034 [US4] In the same job, add an `actions/upload-artifact@v4` step, also `if: ${{ !cancelled() }}`, uploading both `allure-results/` and `allure-report/` (mirroring the existing `playwright-report` upload step's structure: `retention-days: 7`), satisfying FR-009
- [ ] T035 [US4] Document in `README.md`'s Testing section how to generate and open the local Allure report (`npm run allure:report` then `npx allure open allure-report`) and where to find the CI-produced artifact on a workflow run's Summary page

**Checkpoint**: All four user stories work independently — the feature is complete per spec.md.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation that the feature is additive-only and fully documented, per FR-010/SC-006 and the repo's standard pre-PR checklist.

- [ ] T036 Run `npm run test:e2e` (full suite, all projects) and confirm the `chromium` (functional) project's pass/fail results and count are identical to what they were before this feature was added, per FR-010/SC-006 — this is the key check that T002's `globalSetup` → `admin-setup`-project migration was truly behavior-preserving for existing tests
- [ ] T037 Run `npx tsc --noEmit` and confirm no type errors were introduced by `e2e/visual.spec.ts`, `e2e/visual-first-run.spec.ts`, `e2e/helpers.ts`'s additions, or the `playwright.config.ts` changes
- [ ] T038 Walk through every scenario in `specs/002-visual-regression-testing/quickstart.md` end-to-end and confirm each expected outcome holds
- [ ] T039 [P] Do a final pass over `README.md`/`CLAUDE.md` changes from T027/T029/T030/T031/T035 for consistency with the rest of each document's existing tone/structure

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (needs `e2e/visual.spec.ts`/`e2e/visual-first-run.spec.ts` and the `visual`/`visual-first-run` projects to exist) — BLOCKS Phase 3
- **User Story 1 (Phase 3)**: Depends on Foundational — delivers the MVP
- **User Story 2 (Phase 4)**: Depends on Foundational; independent of US1's specific page tests (only needs the `visual` project to exist, from Setup) — can run in parallel with Phase 3 if staffed separately, though in practice T026 benefits from at least one real visual test existing to verify against
- **User Story 3 (Phase 5)**: Depends on Foundational and benefits from US1 existing (documents the procedure T024 already exercised) — sequence after Phase 3 in practice
- **User Story 4 (Phase 6)**: Depends on Setup's T001/T005/T006 (Allure reporter already wired, results-clearing in place) — independent of US1/US2/US3's specific content, can run in parallel with Phases 3–5
- **Polish (Phase 7)**: Depends on all prior phases being complete

### Parallel Opportunities

- T003, T004, T005, T006, T007 (different config sections/files — T002 must land first since T003/T004 reference the `admin-setup` project it introduces)
- T011 and T012 (different helper additions in `e2e/helpers.ts`)
- T014–T018 (public-site page tests, US1) can be written in parallel — different `test()` blocks in the same file, no shared state beyond the T013 fixture
- T019, T022, T023 (admin view tests in `visual.spec.ts`, US1) can be written in parallel with each other and with T014–T018; T020 (in the separate `visual-first-run.spec.ts` file) is fully independent of all of them
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
- T002's `globalSetup` → `admin-setup`-project migration is the one change in this feature that touches shared test infrastructure used by the *existing* functional suite, not just new visual tests — it is required (Playwright has no per-project `globalSetup` opt-out) but must be behavior-preserving; T036 is the explicit check that it is.
- T024's baseline commit is the one task in this feature that produces binary (PNG) file changes rather than source/doc changes — call this out explicitly in the PR description so reviewers know to expect image diffs.
