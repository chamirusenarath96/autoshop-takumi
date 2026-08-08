# Quickstart: Visual/UI Regression Testing with Allure Reporting

Validation guide for confirming this feature works end-to-end once implemented. See [data-model.md](./data-model.md) for the Visual Baseline / Structured Test Results shapes referenced below, and [research.md](./research.md) for why each mechanism was chosen.

## Prerequisites

- `npm install` completed (pulls in the new `allure-playwright`/`allure` devDependencies once added)
- `npm run dev` running in one terminal — required for every scenario below. Playwright's `webServer` config in `playwright.config.ts` only starts the dev server automatically when `process.env.CI` is set; a local run always needs the dev server already running
- The `admin-setup` Playwright project able to run (creates/logs in the admin user — replaces today's `e2e/global-setup.ts` hook with a project-dependencies-based equivalent, see research.md) — note this is exactly the precondition that makes `/admin/create-first-user` unreachable in the normal `visual` project; see Scenario 2a below and research.md's "Coverage for the create-first-user admin view" decision

## Scenario 1 — Visual suite passes against unmodified pages (validates User Story 1's baseline "all good" path)

```bash
npx playwright test --project=visual
```

**Expected outcome**: All visual tests pass against committed baselines in `e2e/visual.spec.ts-snapshots/`. Distinct from running `npm run test:e2e` (which runs every project, functional + visual).

## Scenario 2 — Catch the exact incident this feature guards against (validates User Story 1 / SC-002)

1. Temporarily break the admin dashboard render (e.g., comment out the dashboard's root layout content, reproducing the blank-`/admin` incident from PR #14) on a local branch — do not commit this.
2. Run:
   ```bash
   npx playwright test --project=visual -g "admin dashboard"
   ```
3. **Expected outcome**: The admin-dashboard visual test fails with a screenshot diff, even though no functional admin test would catch this (functional tests only assert DOM/interaction, not that content is visually present).
4. Revert the temporary breakage.

## Scenario 2a — create-first-user view is covered despite the admin-setup ordering conflict (validates FR-002's fifth admin view)

Run this project **standalone** — never combined with `chromium`/`visual` in the same invocation, since either of those triggers the `admin-setup` dependency that creates a user (see research.md's "Coverage for the create-first-user admin view" decision):

```bash
npx playwright test --project=visual-first-run
```

**Expected outcome**: This project has no `admin-setup` dependency, so it runs against a database with no admin user yet and snapshots `/admin/create-first-user` showing the actual first-run form, not a redirect to `/admin`/`/admin/login`.

## Scenario 3 — Visual and functional failures are distinguishable (validates User Story 2 / SC-003)

```bash
npm run test:e2e
```

**Expected outcome**: Report output (terminal `list` reporter locally, or the CI `github`/`html`/Allure reporters) shows results grouped by Playwright project (`chromium` = functional, `visual` = visual), so a reviewer can tell which failed without opening every test's individual output.

## Scenario 4 — Update a baseline after an intentional design change (validates User Story 3 / SC-004)

Documented procedure (also to be added to README.md/CLAUDE.md per FR-007):

1. Make the intentional design change on a feature branch.
2. Push and open a PR — CI's `e2e` job runs the visual project and fails with diffs for the changed page(s).
3. From the GitHub Actions tab, manually trigger the `update-visual-baselines` `workflow_dispatch` job against the PR's branch (do **not** commit a locally-generated PNG — see research.md's environment-determinism decision). This job runs on the same `ubuntu-latest` runner as the `e2e` job, regenerates snapshots with `--update-snapshots`, and pushes the updated PNGs to the branch.
4. Pull the branch locally (or just observe CI) — the updated baseline PNGs are now on the branch; CI's visual project re-runs and passes.

**Expected outcome**: Suite passes with the new baseline; the diff in the PR clearly shows which snapshot PNGs changed, giving reviewers an explicit visual artifact to approve — not just "tests pass now."

## Scenario 5 — Structured results are produced every run (validates User Story 4 / SC-005)

```bash
npm run test:e2e
ls allure-results/
```

**Expected outcome**: `allure-results/` contains Allure's JSON result files after the run completes (pass or fail). Optionally generate a browsable static report:

```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

## Scenario 6 — CI uploads results as a retrievable artifact (validates FR-009 / SC-005)

1. Push any branch and open/update a PR.
2. Once the `e2e` CI job completes (pass or fail), check the workflow run's Artifacts section on GitHub.
3. **Expected outcome**: An `allure-results` (and/or `allure-report`) artifact is present and downloadable, in addition to the existing `playwright-report` artifact (still failure-only, unchanged per FR-010).

## Scenario 7 — Existing functional tests are unaffected (validates FR-010 / SC-006)

```bash
npx playwright test --project=chromium
```

**Expected outcome**: Identical pass/fail results and count to what `e2e/admin.spec.ts`, `e2e/public.spec.ts`, `e2e/api.spec.ts`, and `e2e/responsive.spec.ts` produced before this feature was added — this feature is additive only.
