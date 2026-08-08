# Quickstart: Visual/UI Regression Testing with Allure Reporting

Validation guide for confirming this feature works end-to-end once implemented. See [data-model.md](./data-model.md) for the Visual Baseline / Structured Test Results shapes referenced below, and [research.md](./research.md) for why each mechanism was chosen.

## Prerequisites

- `npm install` completed (pulls in the new `allure-playwright`/`allure-commandline` devDependencies once added)
- `npm run dev` running in one terminal (or rely on Playwright's `webServer` config, matching this repo's existing e2e setup)
- `e2e/global-setup.ts` able to run (creates/logs in the admin user, matching existing `test:e2e` prerequisites)

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

## Scenario 3 — Visual and functional failures are distinguishable (validates User Story 2 / SC-003)

```bash
npm run test:e2e
```

**Expected outcome**: Report output (terminal `list` reporter locally, or the CI `github`/`html`/Allure reporters) shows results grouped by Playwright project (`chromium` = functional, `visual` = visual), so a reviewer can tell which failed without opening every test's individual output.

## Scenario 4 — Update a baseline after an intentional design change (validates User Story 3 / SC-004)

Documented procedure (also to be added to README.md/CLAUDE.md per FR-007):

1. Make the intentional design change on a feature branch.
2. Push and open a PR — CI's `e2e` job runs the visual project and fails with diffs for the changed page(s).
3. Regenerate baselines in the CI-equivalent environment (do **not** commit a locally-generated PNG — see research.md's environment-determinism decision):
   - Either: run the update in a container matching CI's image (`ubuntu-latest`'s Playwright browser image) and commit the resulting PNGs, or
   - Use a dedicated CI-triggered "update snapshots" job/workflow_dispatch if one is added during implementation (see tasks.md for the decision).
4. Push the updated baseline PNGs; CI's visual project now passes.

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
