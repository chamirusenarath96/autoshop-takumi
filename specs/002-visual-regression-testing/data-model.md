# Phase 1 Data Model: Visual/UI Regression Testing with Allure Reporting

This feature introduces no Payload CMS collection, global, or database schema changes. The "entities" below are test-infrastructure artifacts on disk/in CI, documented here for completeness per the spec's Key Entities section — not persisted application data.

## Visual Baseline

Represents the stored known-good rendered appearance of one page at one viewport size.

| Attribute | Type | Notes |
|---|---|---|
| File path | PNG file under `e2e/visual.spec.ts-snapshots/` (Playwright's default naming: `<test-title>-<project>-<platform>.png`) | Committed to the repo, reviewed in PRs like any other file |
| Page identity | Encoded in the snapshot filename via the test title (e.g., `landing-mobile`, `admin-dashboard`) | No separate metadata file — Playwright's naming convention is the identity |
| Viewport | Encoded in the test title / `test.use({ viewport })` per test | Public-site tests: 375×667 (mobile), 768×1024 (tablet), 1280×800 (desktop) — matching `e2e/responsive.spec.ts`'s existing breakpoints. Admin tests: single desktop viewport (1280×800) — admin has no established mobile/tablet requirement today |
| Generating environment | Implicit — not stored in the file itself | Governed by process/documentation (FR-006), not a data field: only CI-generated PNGs are valid baselines |

**Lifecycle**: Created on first run of a new visual test (no baseline exists yet → Playwright writes one and the test is reported as newly-establishing, per FR-012). Updated only via the documented CI-equivalent regeneration procedure (research.md's "Baseline environment determinism" decision). Never hand-edited.

## Visual Regression Result

Represents the outcome of one comparison in one test run.

| Attribute | Type | Notes |
|---|---|---|
| State | enum: `pass` \| `fail` \| `new-baseline` | `fail` includes an attached diff image (Playwright's default behavior) |
| Associated page/viewport | Reference to the Visual Baseline it was compared against | 1:1 per test case |
| Run context | Which CI run / local invocation produced it | Not separately modeled — this is just "a Playwright test result," already representable by existing Playwright/Allure result structures |

**Lifecycle**: Ephemeral — produced fresh on every test run, not persisted as its own artifact beyond the run's reporter output (HTML report, Allure results, CI logs).

## Structured Test Results (Allure)

Represents the machine-readable output of one full `npm run test:e2e` execution.

| Attribute | Type | Notes |
|---|---|---|
| `allure-results/` directory | Directory of Allure's intermediate JSON result files | Produced by the `allure-playwright` reporter on every run (local and CI), per FR-008 |
| Generated static report (optional convenience) | Static HTML produced by `allure generate allure-results -o allure-report` | Not strictly required by FR-008 (which only requires the machine-readable `allure-results/`), but plan.md's Summary and the source issue recommend producing it too since it's a one-command step and materially easier for a human to browse than raw JSON |
| CI artifact | `allure-results/` (and the generated report, if produced) uploaded via `actions/upload-artifact@v4` | Satisfies FR-009 — retrievable independent of pass/fail, mirroring the existing `playwright-report` upload pattern in `ci.yml` (currently `if: failure()` only — this new upload step should run unconditionally, since Allure results are useful on both success and failure, unlike the existing Playwright HTML report which is only uploaded on failure today) |

**Relationships**: One Structured Test Results output aggregates all Visual Regression Results *and* all existing functional test results from the same run — Allure doesn't distinguish "visual" vs. "functional" as a first-class concept, but the Playwright `project` name (`visual` vs. `chromium`) is captured as part of each result's metadata and can be filtered/grouped on within the Allure report, satisfying FR-005's separability requirement inside the reporting layer too.
