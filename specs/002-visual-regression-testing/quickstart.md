# Quickstart: Visual/UI Regression Testing with Allure Reporting

Validation guide for confirming this feature works end-to-end once implemented. See [data-model.md](./data-model.md) for the Visual Baseline / Structured Test Results shapes referenced below, and [research.md](./research.md) for why each mechanism was chosen — in particular, the "Isolation model" decision: visual tests run in their own CI job (`visual-e2e`) against their own freshly created database, entirely separate from the existing `e2e` job. Because of that, most scenarios below are CI-only or require pointing your local dev server at a scratch database first (noted per scenario).

## Prerequisites

- `npm install` completed (pulls in the new `allure-playwright`/`allure` devDependencies once added)
- For the `visual` project locally: `npm run dev` running in one terminal, then `npx tsx e2e/visual-setup.ts` run once against it to create `AUTH_STATE_PATH`, seed `SiteSettings`, and create the deterministic Vehicle fixture (`e2e/.visual-fixture.json`) that `e2e/visual.spec.ts`'s tests read — without this step, `test:e2e:visual` will fail immediately trying to read a fixture file that doesn't exist yet. `playwright.visual.config.ts` has no `webServer` entry (see research.md), so a local run always needs both the dev server and this setup step run manually first
- For `visual-first-run`: this project needs a database with **no** admin user yet, which a normal local dev database won't have after first setup — treat this as CI-only in practice (see Scenario 2a) unless you deliberately point `DATABASE_URI` at a fresh, empty SQLite file first

## Scenario 1 — Visual suite passes against unmodified pages (validates User Story 1's baseline "all good" path)

```bash
npm run dev &
npx tsx e2e/visual-setup.ts
npm run test:e2e:visual
```

**Expected outcome**: All `visual` project tests pass against committed baselines in `e2e/visual.spec.ts-snapshots/`. Locally, this runs against your existing dev data — expect the listing/detail snapshots to only reliably match in the `visual-e2e` CI job, where the database is freshly seeded with exactly the fixture Vehicle these baselines were generated against (see research.md's fixture-isolation decision). Use this command locally mainly to sanity-check a page renders and to iterate on masks/selectors, not to validate the full pass/fail state — that's what the CI job is for.

## Scenario 2 — Catch the exact incident this feature guards against (validates User Story 1 / SC-002)

1. Temporarily break the admin dashboard render (e.g., comment out the dashboard's root layout content, reproducing the blank-`/admin` incident from PR #14) on a local branch — do not commit this.
2. Run:
   ```bash
   npm run test:e2e:visual -- -g "admin dashboard"
   ```
3. **Expected outcome**: The admin-dashboard visual test fails with a screenshot diff, even though no functional admin test would catch this (functional tests only assert DOM/interaction, not that content is visually present).
4. Revert the temporary breakage.

## Scenario 2a — create-first-user view is covered via its own CI job step (validates FR-002's fifth admin view)

This test only runs meaningfully inside the `visual-e2e` CI job, where `visual-first-run` executes first against that job's freshly created, still-empty database — before `e2e/visual-setup.ts` creates any admin user (see research.md's Isolation-model decision). To reproduce locally:

```bash
rm -f /tmp/visual-first-run-test.db   # or wherever your scratch DB lives
DATABASE_URI=file:/tmp/visual-first-run-test.db npm run dev &
DATABASE_URI=file:/tmp/visual-first-run-test.db npx playwright test --config=playwright.visual.config.ts --project=visual-first-run
```

**Expected outcome**: Against a database with no `Users` row yet, `/admin/create-first-user` renders the actual first-run form (not a redirect to `/admin`/`/admin/login`), and the snapshot test passes against the committed baseline. This only works because `playwright.visual.config.ts` never references `e2e/global-setup.ts` (see research.md) — running this same test via the main `playwright.config.ts` would fail, since that config's `globalSetup` always creates an admin user first.

## Scenario 3 — Visual and functional failures are distinguishable (validates User Story 2 / SC-003)

1. Push a branch with one intentionally broken functional test and one intentionally broken visual test.
2. Open a PR and wait for CI.
3. **Expected outcome**: GitHub's PR checks list shows `e2e` (functional) and `visual-e2e` (visual) as two separate, independently red/green checks — a reviewer can tell which kind of failure occurred without opening either job's logs, since the job names themselves carry that information (CI-job-level separation, not just Playwright-project-level).

## Scenario 4 — Update a baseline after an intentional design change (validates User Story 3 / SC-004)

Documented procedure (also to be added to README.md/CLAUDE.md per FR-007):

1. Make the intentional design change on a feature branch.
2. Push and open a PR — CI's `visual-e2e` job runs and fails with diffs for the changed page(s).
3. From the GitHub Actions tab, manually trigger the `update-visual-baselines` `workflow_dispatch` job against the PR's branch (do **not** commit a locally-generated PNG — see research.md's baseline-environment-determinism decision). This job runs on the same pinned `ubuntu-24.04` runner as `visual-e2e`, regenerates snapshots with `--update-snapshots`, and pushes the updated PNGs directly to the branch.
4. Pull the branch locally (or just observe CI) — the updated baseline PNGs are now on the branch; `visual-e2e` re-runs and passes.

**Expected outcome**: Suite passes with the new baseline; the diff in the PR clearly shows which snapshot PNGs changed, giving reviewers an explicit visual artifact to approve — not just "tests pass now."

## Scenario 5 — Structured results are produced every run (validates User Story 4 / SC-005)

```bash
npm run test:e2e
ls allure-results/
```

**Expected outcome**: `allure-results/` contains Allure's JSON result files for the `chromium` (functional) run after it completes (pass or fail). The `visual-e2e` CI job produces its own separate `allure-results/` the same way, covering `visual-first-run` + `visual` together (see research.md's Allure decision on why these aren't cleared between those two invocations). Optionally generate a browsable static report from either:

```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

## Scenario 6 — CI uploads results as a retrievable artifact (validates FR-009 / SC-005)

1. Push any branch and open/update a PR.
2. Once the `e2e` and `visual-e2e` CI jobs complete (pass or fail), check the workflow run's Artifacts section on GitHub.
3. **Expected outcome**: Both jobs have their own downloadable Allure artifacts (distinctly named, e.g. `allure-results` for `e2e` and `allure-results-visual` for `visual-e2e`), in addition to the existing `playwright-report` artifact from `e2e` (still failure-only, unchanged per FR-010).

## Scenario 7 — Existing functional tests are unaffected (validates FR-010 / SC-006)

```bash
npm run test:e2e
```

**Expected outcome**: Identical pass/fail results and count to what `e2e/admin.spec.ts`, `e2e/public.spec.ts`, `e2e/api.spec.ts`, and `e2e/responsive.spec.ts` produced before this feature was added — this feature is additive only, and `e2e/global-setup.ts`/the `chromium` project's own configuration are completely untouched by this feature (see research.md's Isolation-model decision), which is what makes this guarantee structural rather than merely tested-for.
