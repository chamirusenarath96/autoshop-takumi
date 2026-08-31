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

Single Next.js + Payload monorepo. All new/changed files live under the existing `e2e/` directory, a new `playwright.visual.config.ts` at the repo root, `playwright.config.ts`, `package.json`, `.github/workflows/ci.yml`, `README.md`, and `CLAUDE.md` — no new top-level directories, per plan.md's Structure Decision.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Get the new tooling, project topology, and test file skeletons in place before any visual assertions are written.

- [X] T001 Add `allure-playwright` and `allure` (Allure 3's Node-based CLI — not the Java-based `allure-commandline`, per research.md) as devDependencies in `package.json` (`npm install --save-dev allure-playwright allure`)
- [X] T002 Create `playwright.visual.config.ts`, a second, standalone Playwright config file (does **not** import or reference `e2e/global-setup.ts` — this is required, not optional: Playwright's `globalSetup` is a single top-level config property that runs before every project a config file defines, so the only way `visual-first-run` genuinely sees an empty database is a config file that never sets it at all, per research.md's Test-organization/Isolation-model decisions). Define `testDir: './e2e'`, a `visual` project (`devices['Desktop Chrome']`, `testMatch: /visual\.spec\.ts$/`) and a `visual-first-run` project (`devices['Desktop Chrome']`, `testMatch: /visual-first-run\.spec\.ts$/`), and `use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000' }` (no `webServer` — the `visual-e2e` CI job starts its own dev server as an explicit step, per T013)
- [X] T003 Add `testIgnore: [/visual\.spec\.ts$/, /visual-first-run\.spec\.ts$/]` to the existing `chromium` project in `playwright.config.ts`, so its file discovery never picks up the new spec files regardless of which config a given invocation uses (defense in depth) — `globalSetup` and `chromium`'s other settings are otherwise untouched
- [X] T004 [P] Add the `allure-playwright` reporter to **both** `playwright.config.ts`'s and `playwright.visual.config.ts`'s `reporter` config so `allure-results/` is produced on every run — CI branches (`process.env.CI` arrays) and local branches (arrays including `list` + `allure-playwright` rather than a bare string) in each file
- [X] T005 [P] Move the `VIEWPORTS` constant (`{ mobile: {375,812}, tablet: {768,1024}, desktop: {1280,800} }`) out of `e2e/responsive.spec.ts` into `e2e/helpers.ts` as a new export, and update `e2e/responsive.spec.ts`'s own usage to `import { VIEWPORTS } from './helpers'` — Playwright does not support importing one test (`*.spec.ts`) file from another, so the original plan of `visual.spec.ts` importing `VIEWPORTS` from `responsive.spec.ts` would fail at test-collection time
- [X] T006 Create `e2e/visual.spec.ts` with imports (`test`, `expect` from `@playwright/test`; `VIEWPORTS` from `./helpers` per T005; `AUTH_STATE_PATH`, `getVisualMasks` from `./helpers`) and two empty `test.describe` blocks: `'Visual — public site'` and `'Visual — admin'`. Since this project's database is job-local and freshly seeded by `visual-setup.ts` (T011) rather than shared with the functional suite, the seeded Vehicle's ID/slug are read here from a small JSON file `visual-setup.ts` writes (e.g. `e2e/.visual-fixture.json`), not re-derived
- [X] T007 [P] Create `e2e/visual-first-run.spec.ts` with its own minimal imports (`test`, `expect` from `@playwright/test`) — deliberately does not import anything from `e2e/visual.spec.ts` or share its `describe` blocks
- [X] T008 [P] In `package.json`, add a `test:e2e:visual` script (`"test:e2e:visual": "playwright test --config=playwright.visual.config.ts --project=visual"`) — `test:e2e` itself is unchanged (still bare `playwright test`, implicitly using `playwright.config.ts`, which has no visual projects to accidentally reach)
- [X] T009 [P] Add `pretest:e2e` and `pretest:e2e:visual` npm scripts to `package.json` (both `"rimraf allure-results"`, adding `rimraf` as a devDependency for cross-platform `rm -rf`) so `allure-results/` is cleared before both `npm run test:e2e` and `npm run test:e2e:visual` — `allure-playwright` appends to an existing directory rather than replacing it, and npm only auto-runs a `pre<script>` hook when its name exactly matches `pre` + the target script name (per research.md)
- [X] T009a [P] Add `e2e/.visual-fixture.json` and the job-local scratch SQLite database file pattern to `.gitignore`, alongside this repo's existing `e2e/.auth/`/`*.db` entries — a second layer of protection (beyond T029's scoped `file_pattern`) against either ever being swept into a baseline-update commit

**Checkpoint**: `npx playwright test --config=playwright.visual.config.ts --project=visual` and `...--project=visual-first-run` both run (with zero tests each) against whatever database is configured; `npm run test:e2e` still runs exactly the same `chromium`/functional tests as before this feature, with `allure-results/` freshly populated afterward.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The dedicated CI job, its isolated database, and the shared visual-test configuration every page/view snapshot in Phase 3+ depends on.

**⚠️ CRITICAL**: Complete before writing any individual page snapshot test — retrofitting these into already-written tests risks needing to regenerate every baseline twice.

- [X] T010 In `playwright.visual.config.ts`'s shared `use` block, fix `colorScheme: 'light'` and `deviceScaleFactor: 1` so snapshots don't vary with OS theme or DPI; set a top-level `expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 } }` so CSS transitions/animations and the text-input caret don't produce nondeterministic diffs, while `maxDiffPixelRatio: 0.01` (1% of pixels) stays tight enough to reject a gross regression like a page rendering blank (which would differ far beyond 1%) but tolerant of minor anti-aliasing noise within the pinned CI environment (per research.md's baseline-determinism decision) — document this tolerance value and rationale as a comment at the config site
- [X] T011 Create `e2e/visual-setup.ts`, a plain Node/tsx script (not a Playwright `globalSetup` — it's invoked as its own CI job step, per research.md's Isolation-model decision): replicates `e2e/global-setup.ts`'s login/create-first-user branching logic to create the admin user and write `AUTH_STATE_PATH`; seeds `SiteSettings` with the same fields `global-setup.ts` seeds today (shop name, contact email/phone, address, Instagram social link); creates one deterministic Make/Model/Vehicle fixture via `createMake`/`createModel`/`createPublishedVehicle` (from `./helpers`) with a fixed slug (e.g. `visual-test-vehicle`) — no idempotency/upsert logic needed, since this script always runs against a freshly created, empty database (unconditional-create, per research.md's fixture decision); writes the fixture's `{ makeId, modelId, vehicleId, vehicleSlug }` to `e2e/.visual-fixture.json` for T006's tests to read
- [X] T012 [P] In `e2e/helpers.ts`, add a `getVisualMasks(page, view)` helper function (not a module-level constant, since `Locator`s are bound to the `page` they're created from) returning an array of fresh `Locator`s for the requested `view` (e.g. `'admin-dashboard'`, `'vehicle-detail'`) covering only genuinely run-varying regions identified during implementation (Payload's own auto-generated internal document IDs where visible, timestamps, "last updated" style fields) — deliberately excluding the fixture's fixed `visual-test-vehicle` slug, which stays unmasked as a useful stable assertion (per research.md's masking decision) — for reuse across the individual `toHaveScreenshot({ mask: getVisualMasks(page, view) })` calls in Phase 3, satisfying FR-004
- [X] T013 In `.github/workflows/ci.yml`, add a new `visual-e2e` job (`needs: [test, typecheck]`, matching the existing `e2e` job's trigger point), `runs-on: ubuntu-24.04` (not `ubuntu-latest` — see research.md's baseline-determinism decision), with its own `DATABASE_URI` pointing at a job-local SQLite file distinct from whatever `e2e` uses. Since `playwright.visual.config.ts` deliberately has no `webServer` entry (T002), manage the dev server's lifecycle as explicit steps: start `npm run dev` in the background (e.g. `npm run dev &`, capturing the PID) with the job-local `DATABASE_URI`; wait for it to be ready (e.g. `npx wait-on http://localhost:3000`, adding `wait-on` as a devDependency) before proceeding; add a `Stop dev server` step gated `if: always()` at the end of the job that kills the captured PID, so it runs even if an earlier step fails. Full step order: checkout, install deps, install Playwright browsers, start dev server in background, wait for readiness, clear `allure-results/` once, run `npx playwright test --config=playwright.visual.config.ts --project=visual-first-run`, run `e2e/visual-setup.ts` (T011), run `npx playwright test --config=playwright.visual.config.ts --project=visual` (results appended to the same `allure-results/` from the first invocation, per research.md's Allure decision), ..., stop dev server (`if: always()`)

**Checkpoint**: Foundation ready — individual page/view snapshot tests (Phase 3+) can now be added. The `visual-e2e` CI job runs its two Playwright invocations plus setup step successfully with zero tests defined yet.

---

## Phase 3: User Story 1 - Catch a visually broken page before it reaches production (Priority: P1) 🎯 MVP

**Goal**: Automated visual regression coverage exists for every public-site page and Payload admin view enumerated in FR-001/FR-002, catching the exact "renders with no visible content" failure class that let a blank `/admin` ship to production.

**Independent Test**: Intentionally break a covered page's render (e.g. comment out the admin dashboard's content, per quickstart.md Scenario 2) and confirm the `visual-e2e` CI job's `visual` project fails with a diff; revert and confirm it passes again.

### Implementation for User Story 1

- [X] T014 [P] [US1] In `e2e/visual.spec.ts`'s `'Visual — public site'` block, add a snapshot test for the landing page (`/en`) looping over `VIEWPORTS.mobile`/`.tablet`/`.desktop`, calling `expect(page).toHaveScreenshot('landing-mobile.png')` / `'landing-tablet.png'` / `'landing-desktop.png'` per viewport — explicit, unique names per Playwright's requirement (an unnamed `toHaveScreenshot()` auto-generates a name from call order, which breaks if the loop's iteration order ever changes)
- [X] T015 [P] [US1] Add a snapshot test for the vehicle listing page with no filters applied (`/en/vehicles`) across all three `VIEWPORTS`, named `listing-nofilter-{mobile,tablet,desktop}.png` — deterministic because the `visual-e2e` job's database contains only the one fixture Vehicle T011 creates (per research.md's fixture decision)
- [X] T016 [P] [US1] Add a snapshot test for the vehicle listing page with one filter applied (filtered by T011's seeded Make, read from `e2e/.visual-fixture.json`) across all three `VIEWPORTS`, named `listing-filtered-{mobile,tablet,desktop}.png`
- [X] T017 [P] [US1] Add a snapshot test for the vehicle detail page (`/en/vehicles/<T011's seeded slug>`) across all three `VIEWPORTS`, named `detail-{mobile,tablet,desktop}.png`, passing `mask: getVisualMasks(page, 'vehicle-detail')` (T012) to each `toHaveScreenshot()` call
- [X] T018 [P] [US1] Add a snapshot test for the about page (`/en/about`) across all three `VIEWPORTS`, named `about-{mobile,tablet,desktop}.png`
- [X] T019 [P] [US1] In `e2e/visual.spec.ts`'s `'Visual — admin'` block, add an unauthenticated snapshot test for `/admin/login` (this describe block runs under the `visual` project, which runs *after* `visual-setup.ts` has already created an admin user — so an unauthenticated page load correctly reaches the login form, not create-first-user; do not apply `storageState: AUTH_STATE_PATH` to this one test), named `admin-login.png`
- [X] T020 [US1] In `e2e/visual-first-run.spec.ts` (the separate `visual-first-run` project — using `playwright.visual.config.ts`, which never runs `e2e/global-setup.ts`, and running *before* `visual-setup.ts` in the `visual-e2e` job — T013), add the create-first-user snapshot test: navigate to `/admin/create-first-user`, assert the create-first-user form is showing (not a redirect), and call `expect(page).toHaveScreenshot('admin-create-first-user.png')`
- [X] T021 [US1] Add an authenticated (`test.use({ storageState: AUTH_STATE_PATH })`) snapshot test in `e2e/visual.spec.ts` for the post-login admin dashboard (`/admin`), named `admin-dashboard.png` — this is the specific regression check for the blank-`/admin` incident (SC-002); pass `mask: getVisualMasks(page, 'admin-dashboard')` for any dynamic dashboard content
- [X] T022 [P] [US1] Add an authenticated snapshot test for a collection list view (`/admin/collections/vehicles`), named `admin-vehicles-list.png`, masked via `getVisualMasks(page, 'admin-vehicles-list')`
- [X] T023 [P] [US1] Add an authenticated snapshot test for a collection edit view (`/admin/collections/vehicles/<T011's seeded vehicle ID>`), named `admin-vehicles-edit.png`, masked via `getVisualMasks(page, 'admin-vehicles-edit')`
- [X] T024 [US1] Trigger the `update-visual-baselines` workflow (Phase 5, T031) once against this feature's branch to generate the initial baselines in the pinned `ubuntu-24.04` environment — or, before that workflow exists yet, run the `visual-e2e` job's steps once manually in an equivalent environment and treat that run's output as the initial baseline for human review per FR-012 — and commit the generated PNG baselines under `e2e/visual.spec.ts-snapshots/` and `e2e/visual-first-run.spec.ts-snapshots/`

**Checkpoint**: The `visual-e2e` CI job passes against committed baselines; intentionally breaking the admin dashboard's render causes T021 to fail (quickstart.md Scenario 2). This is the MVP — the feature delivers its core value at this point.

---

## Phase 4: User Story 2 - Triage visual failures separately from functional failures (Priority: P2)

**Goal**: A developer can tell a visual failure from a functional failure at a glance, and run/re-run either suite independently.

**Independent Test**: Confirm the `e2e` and `visual-e2e` CI jobs report as separate, independently-named checks on a PR. Run `npm run test:e2e:visual` locally alone and confirm it does not execute any `chromium`-project (functional) test.

### Implementation for User Story 2

- [X] T025 [US2] Verify (manually, during implementation) that GitHub's PR checks UI shows `e2e` (functional) and `visual-e2e` (visual) as distinctly named, independently pass/fail-able checks — this is what actually delivers FR-005/SC-003 for this feature's design (CI-job-level separation, per research.md's Isolation-model decision), more directly than Playwright project names alone would
- [X] T026 [US2] In `README.md`'s Testing section (and/or CLAUDE.md's testing rule section), document the `npm run test:e2e:visual` command, that `visual-first-run` is CI-only (via the `visual-e2e` job — see T013), and that CI shows visual results as a separate `visual-e2e` check from the functional `e2e` check

**Checkpoint**: Both User Story 1 and User Story 2 work independently — visual tests both exist and are separately triageable.

---

## Phase 5: User Story 3 - Update a baseline after an intentional design change (Priority: P2)

**Goal**: A documented, reliable procedure exists for regenerating a visual baseline after an intentional design change, without regenerating it in a way that risks masking unrelated regressions.

**Independent Test**: Make an intentional visual change to a covered page, follow the documented procedure, and confirm the suite passes with the new baseline (quickstart.md Scenario 4).

### Implementation for User Story 3

- [X] T027 [US3] In `.github/workflows/ci.yml`, add `permissions: contents: write` as a job-level override on a new `update-visual-baselines` job (the workflow's top-level `permissions: contents: read` stays unchanged for every other job), triggered only by `workflow_dispatch` with a required `branch` input, `runs-on: ubuntu-24.04` (same pinned label as `visual-e2e`)
- [X] T028 [US3] In the same job, check out the input `branch`, install dependencies and Playwright browsers identically to `visual-e2e`, boot the job-local dev server + database exactly as `visual-e2e` does, then run the same three-step sequence as `visual-e2e` (T013) with `--update-snapshots` appended to both Playwright invocations
- [X] T029 [US3] In the same job, add a step using `stefanzweifel/git-auto-commit-action` — **pinned to a specific commit SHA, not a floating tag**, since this job holds `contents: write` (T027) — with `file_pattern: 'e2e/visual.spec.ts-snapshots/ e2e/visual-first-run.spec.ts-snapshots/'` (not the action's `.` default, which would stage every changed file in the workspace) to commit and push only the regenerated PNGs back to the input `branch` using the workflow's `GITHUB_TOKEN` — the one concrete publication mechanism (per research.md, no artifact-download alternative)
- [X] T030 [US3] Add a new `README.md` subsection (in or near the existing Testing section) titled something like "Visual regression tests" documenting: how to run the `visual` project locally (`npm run test:e2e:visual`) for iteration, that `visual-first-run` only runs in CI, and the baseline-update procedure — manually triggering `update-visual-baselines` from the GitHub Actions tab against the PR's branch (T027–T029)
- [X] T031 [US3] In the same `README.md` subsection, explicitly document the font/OS screenshot-diffing determinism gotcha (why local baselines are invalid, why `visual-e2e`/`update-visual-baselines` are pinned to `ubuntu-24.04` specifically rather than `ubuntu-latest`) using the same documentation pattern already used for the `tsx`/`@next/env` gotcha in README's Known Issues section, per FR-006
- [X] T032 [US3] Update `CLAUDE.md`'s testing rule section to note that new public pages/admin views are expected to get visual snapshot coverage going forward (FR-011), matching the existing pattern where the responsive-testing requirement was added as a standing rule

**Checkpoint**: User Stories 1–3 all work independently — coverage exists, is triageable, and is maintainable via a documented update path.

---

## Phase 6: User Story 4 - Browse structured test results as artifacts, not just pass/fail (Priority: P3)

**Goal**: Every e2e/visual CI run produces Allure's structured results, and CI preserves them as a retrievable build artifact.

**Independent Test**: Run `npm run test:e2e` locally and confirm `allure-results/` is populated (quickstart.md Scenario 5). Push a PR and confirm both the `e2e` and `visual-e2e` CI jobs' runs have downloadable `allure-results` artifacts regardless of pass/fail (quickstart.md Scenario 6).

### Implementation for User Story 4

- [X] T033 [US4] Add an `allure:report` script to `package.json` (`"allure:report": "allure generate allure-results --clean -o allure-report"`) for generating the optional static HTML report locally, per data-model.md's Structured Test Results entity
- [X] T034 [US4] In `.github/workflows/ci.yml`'s existing `e2e` job, add a step with `if: ${{ !cancelled() }}` (so it still runs after a test failure, unlike the default implicit `success()` condition, but is skipped if the job itself was cancelled) that runs `npx allure generate allure-results --clean -o allure-report` after the test step, followed by an `actions/upload-artifact@v4` step (also `if: ${{ !cancelled() }}`) uploading both `allure-results/` and `allure-report/` (mirroring the existing `playwright-report` upload step's structure: `retention-days: 7`)
- [X] T035 [US4] In the new `visual-e2e` job (T013), add the same two steps (generate report, upload artifact — both `if: ${{ !cancelled() }}`) after its second Playwright invocation, uploading `visual-e2e`'s own `allure-results/`/`allure-report/` as a separately named artifact (e.g. `allure-results-visual`) so it doesn't collide with the `e2e` job's artifact of the same base name — satisfying FR-009 for both jobs
- [X] T036 [US4] Document in `README.md`'s Testing section how to generate and open the local Allure report (`npm run allure:report` then `npx allure open allure-report`) and where to find each job's CI-produced artifact on a workflow run's Summary page

**Checkpoint**: All four user stories work independently — the feature is complete per spec.md.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation that the feature is additive-only and fully documented, per FR-010/SC-006 and the repo's standard pre-PR checklist.

- [X] T037 Run `npm run test:e2e` (implicitly `--config=playwright.config.ts`, i.e. `chromium` only, since `playwright.visual.config.ts` isn't referenced) and confirm its pass/fail results and count are identical to what they were before this feature was added, per FR-010/SC-006 — the key check that `e2e/global-setup.ts` and the `chromium` project were genuinely left untouched
- [X] T038 Run `npx tsc --noEmit` and confirm no type errors were introduced by `e2e/visual.spec.ts`, `e2e/visual-first-run.spec.ts`, `e2e/visual-setup.ts`, `e2e/helpers.ts`'s additions, `playwright.visual.config.ts`, or the `playwright.config.ts` changes
- [X] T039 Walk through every scenario in `specs/002-visual-regression-testing/quickstart.md` end-to-end and confirm each expected outcome holds
- [X] T040 [P] Do a final pass over `README.md`/`CLAUDE.md` changes from T026/T030/T031/T032/T036 for consistency with the rest of each document's existing tone/structure

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (needs `e2e/visual.spec.ts`/`e2e/visual-first-run.spec.ts` and `playwright.visual.config.ts`'s projects to exist) — BLOCKS Phase 3
- **User Story 1 (Phase 3)**: Depends on Foundational (especially T013's `visual-e2e` job) — delivers the MVP
- **User Story 2 (Phase 4)**: Depends on Foundational; independent of US1's specific page tests — can proceed in parallel with Phase 3 if staffed separately
- **User Story 3 (Phase 5)**: Depends on Foundational and benefits from US1 existing (documents the procedure T024 already exercised) — sequence after Phase 3 in practice
- **User Story 4 (Phase 6)**: Depends on Setup's T001/T004/T009 (Allure reporter already wired, results-clearing in place) and Foundational's T013 (the `visual-e2e` job the new steps attach to) — can otherwise run in parallel with Phases 3–5
- **Polish (Phase 7)**: Depends on all prior phases being complete

### Parallel Opportunities

- T002 must land before T003 (which references file patterns the other new spec files use) and before T004/T010 (which edit the file T002 creates); T004, T005 can proceed in parallel with each other
- T011 and T012 (different new files — `visual-setup.ts` vs. `helpers.ts` additions)
- T014–T018 (public-site page tests, US1) can be written in parallel — different `test()` blocks in the same file, reading the same T011-produced fixture file, no other shared state
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

1. Setup + Foundational → visual testing infrastructure (including `playwright.visual.config.ts` and the `visual-e2e` CI job) exists but covers nothing yet
2. Add US1 → full page/view coverage exists (MVP — the feature's core value is delivered)
3. Add US2 → triage/separation is confirmed and documented
4. Add US3 → the team has a trustworthy, documented way to keep the suite green after intentional changes
5. Add US4 → structured results feed the (separately tracked) future dashboard issue
6. Polish → confirm nothing regressed, everything documented

## Notes

- No `[P]` marker is used across different sections of the same file (e.g. `.github/workflows/ci.yml`) even when the specific edits are logically independent, to avoid merge conflicts from parallel agents/developers editing the same file.
- Per Constitution Principle III's own precedent for testing-infrastructure features (see issue #15's explicit acceptance criterion "this itself needs no additional test-of-tests"), there is no separate "write a test that tests these tests" task — Phase 3–6's tasks are themselves the test coverage.
- This feature went through two design revisions during review before landing on its current shape: (1) initially tried sharing the `e2e` job/database via Playwright project-dependencies — didn't actually guarantee an empty database or listing-page determinism; (2) then tried adding `visual`/`visual-first-run` to the existing `playwright.config.ts`'s `projects` array with a dedicated CI job — still ran `globalSetup` before `visual-first-run` regardless, since `globalSetup` isn't a per-project setting. The current design (T002: a second, `globalSetup`-free config file, `playwright.visual.config.ts`, plus a dedicated CI job with its own database) is what actually makes both guarantees structural. `e2e/global-setup.ts` and the `chromium` project need **zero** changes — the strongest possible guarantee for FR-010/SC-006.
- T024's baseline commit is the one task in this feature that produces binary (PNG) file changes rather than source/doc changes — call this out explicitly in the PR description so reviewers know to expect image diffs.
