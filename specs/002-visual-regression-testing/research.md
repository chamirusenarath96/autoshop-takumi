# Phase 0 Research: Visual/UI Regression Testing with Allure Reporting

All items below were determined from the source issue's explicit proposal plus inspection of this repo's existing `playwright.config.ts`, `.github/workflows/ci.yml`, and `e2e/*.spec.ts` conventions — no items remained `NEEDS CLARIFICATION` after spec authoring, so this file records the reasoning behind each Technical Context decision rather than resolving open questions.

## Decision: Visual comparison mechanism

**Decision**: Use Playwright's native `expect(page).toHaveScreenshot()` / `expect(locator).toHaveScreenshot()`.

**Rationale**: Already bundled with `@playwright/test`, which this project already depends on and already uses for all other e2e coverage. Produces pixel-diff PNGs on failure automatically, integrates with the existing `html`/`github` reporters, and needs no new test runner or CI step beyond what already exists for the functional suite. The source issue explicitly calls this out as the preferred approach over adopting a separate framework.

**Alternatives considered**:
- **Percy / Chromatic (paid SaaS)**: Rejected per the source issue and spec Assumptions — external cost/vendor dependency for a capability Playwright already provides natively.
- **A custom pixel-diff script (e.g., `pixelmatch` invoked manually)**: Rejected — reinvents what `toHaveScreenshot()` already does, with worse reporter/CI integration.

## Decision: Test organization — separate Playwright `project`

**Decision**: Add a `visual` entry to the `projects` array in `playwright.config.ts`, and put all visual assertions in a new `e2e/visual.spec.ts` file (not mixed into `admin.spec.ts`/`public.spec.ts`).

**Rationale**: Playwright projects can be filtered independently (`npx playwright test --project=visual`), get separate result grouping in reporters (including Allure, which reports Playwright project as a distinct dimension), and can have distinct `use` config (e.g., forcing consistent `deviceScaleFactor`/color-scheme for visual tests specifically) without affecting the `chromium` functional project. This directly satisfies FR-005 (distinct, separately-triageable group) using a mechanism already native to the tool in use, consistent with Constitution Principle VI (no premature abstraction).

**Alternatives considered**:
- **A separate Playwright config file** (`playwright.visual.config.ts`): Rejected — duplicates `webServer`/`baseURL`/global-setup config that already lives in the one config file; a second project entry is simpler and keeps one source of truth.
- **Tagging tests with `test.describe` + grep filters** (no new project): Rejected — grep-based filtering is more fragile (relies on naming discipline) and doesn't get separate reporter grouping the way `project` does.

## Decision: Baseline environment determinism

**Decision**: Baselines are authoritative only when produced by one specific, single mechanism: a dedicated `update-visual-baselines` `workflow_dispatch` job in `.github/workflows/ci.yml`, run on the same `ubuntu-latest` runner (and therefore the same OS/font/Playwright-browser build) as the existing `e2e` job. That job checks out the PR branch, installs dependencies identically to the `e2e` job, runs `npx playwright test --project=visual --update-snapshots`, and commits the regenerated PNGs back to the PR branch (e.g. via `git commit`/`git push` from the workflow using `GITHUB_TOKEN`, or by uploading the PNGs as a downloadable artifact for a human to commit if writing back from CI is undesirable — the concrete mechanics are an implementation choice for `tasks.md`, but the *runner identity* is not: it is always this one workflow, never a developer's own machine or an ad hoc container). `npx playwright test --project=visual --update-snapshots` run locally on a developer's machine is for iteration/debugging only — its output is never committed.

**Rationale**: Font rendering, subpixel anti-aliasing, and OS-level rendering differences make cross-environment screenshot comparison inherently unreliable — a well-known Playwright limitation, not specific to this project. Pinning the *actual existing CI runner* (rather than introducing a separate pinned Docker image, which would need independent version maintenance) is the simplest mechanism satisfying "one authoritative, executable path," per Constitution Principle VI — the `e2e` job already defines what "correct" rendering looks like for this repo, so baseline generation reuses that exact definition instead of inventing a second one. The source issue explicitly names this determinism requirement and asks that it be documented the same way this repo already documents its `tsx`/`@next/env` gotcha in the README.

**Alternatives considered**:
- **A pinned Playwright Docker image** (e.g. `mcr.microsoft.com/playwright:v1.61.1-jammy`) run identically in CI and locally: This is Playwright's own documented best practice and would let developers generate valid baselines locally too. Not chosen for v1 because it requires introducing Docker as a new local-dev dependency this project doesn't otherwise have, and CI's `ubuntu-latest` + `npx playwright install chromium --with-deps` already gives a single consistent environment — revisit if cross-environment local generation becomes a real pain point.
- **Reviewing CI's failure-diff artifact and manually re-creating a baseline PNG by hand**: Rejected — not a real workflow, just restates "someone eyeballs a diff," with no mechanism for actually producing the replacement file.

## Decision: Coverage for the create-first-user admin view

**Decision**: `/admin/create-first-user` (FR-002) requires migrating admin-user creation from the current top-level `globalSetup: './e2e/global-setup.ts'` (which Playwright runs exactly once, before *every* project, with no per-project opt-out) to Playwright's **project-dependencies** model instead: introduce a small `admin-setup` project whose single "test" performs today's `loginAsAdmin()` flow (creating the admin user and writing `AUTH_STATE_PATH`), and have `chromium` and `visual` each declare `dependencies: ['admin-setup']` so it runs before them as today's `globalSetup` effectively does. The new `visual-first-run` project declares **no** dependency on `admin-setup`, so — provided the test database starts empty for a full run (already true today; nothing currently seeds a `Users` row outside `loginAsAdmin()`) — its test reaches `/admin/create-first-user` before any admin user has been created anywhere in the run, and captures the real first-run form rather than a redirect.

**Rationale**: `globalSetup` is a root-level config hook that Playwright always runs before any project's tests start, with no supported per-project override — so a project simply "not using" it, as an earlier draft of this decision assumed, would not actually change when admin-user creation happens. Project dependencies are Playwright's own documented, current-generation replacement for exactly this class of problem (the same mechanism the official docs recommend for "some tests need to run as an authenticated user, one doesn't"), so this is the accurate, executable fix rather than a hand-wave. `visual-first-run` must additionally run before (or in complete isolation from) `chromium`/`visual` within the same invocation, since once *either* of those projects' `admin-setup` dependency has run, a user exists; ordering this correctly (e.g. `visual-first-run` runs standalone, in its own `npx playwright test --project=visual-first-run` invocation, never combined with a run that also includes `chromium`/`visual` in the same `npm run test:e2e`) is an implementation detail for `tasks.md`, not a research question — but it must be called out explicitly wherever `test:e2e` is documented so nobody accidentally runs it as a combined suite and gets a nondeterministic pass/fail for this one test depending on project execution order.

**Alternatives considered**:
- **Skip this view / document it as inherently untestable**: Rejected — this was the original (inadequate) framing; it leaves one of FR-002's five enumerated admin views permanently uncovered, undermining SC-001's "100% of enumerated views" claim.
- **A project that simply omits `globalSetup`**: Rejected once it became clear `globalSetup` isn't a per-project setting in Playwright's config model — this would not have worked as described.
- **Truncating/deleting the test database mid-run before this one test**: Rejected — fragile (risks interfering with whichever other project's tests run concurrently or afterward against the same file-based SQLite DB) compared to simply never creating a user in this project's own isolated invocation.

## Decision: Structured results format — Allure

**Decision**: Add `allure-playwright` as the reporter (alongside existing `github`/`html` reporters in CI, and alongside `list` locally), configured to always run so both functional and visual results land in `allure-results/`. Because `allure-playwright` appends to (rather than replaces) an existing `allure-results/` directory, both the local `test:e2e` script and the CI `e2e` job clear that directory (`rm -rf allure-results` or equivalent) immediately before invoking Playwright, so every run's results reflect only that run. For generating the human-browsable static report from `allure-results/`, use the `allure` npm package (Allure 3, TypeScript-based, runnable via `npx allure`) rather than the older `allure-commandline` package (Allure 2, requires a Java runtime) — avoids adding a Java toolchain to CI/local dev purely for report generation.

**Rationale**: Explicitly required by the source issue as the sole deliverable this feature must produce for a separate, already-filed roadmap issue (#16, the results dashboard) to consume later — issue #16 is explicitly out of scope for this feature, but its input format is not, since retrofitting a reporter later would mean re-running history that was never captured. `allure-playwright` is the standard, actively maintained adapter for this pairing; `@playwright/test`'s currently installed `^1.61.1` satisfies its `>=1.53.0` peer requirement.

**Alternatives considered**:
- **Playwright's own JSON reporter** (`--reporter=json`): Rejected — satisfies "machine-readable" but not the specific Allure-compatible shape the downstream dashboard issue is designed around; would require a translation step later.
- **JUnit XML reporter**: Rejected for the same reason — a different, less rich structured format than what Allure provides (no built-in screenshot/attachment linking the way Allure's model has).
- **`allure-commandline` (Allure 2, Java-based)**: Rejected in favor of the Node-based `allure` (Allure 3) package specifically to avoid a Java dependency this Node/TypeScript project otherwise has no need for.

## Decision: Dynamic-content masking approach

**Decision**: Use Playwright's built-in `mask` option on `toHaveScreenshot()` (an array of `Locator`s painted over with a solid box before comparison), applied to known-dynamic regions: seeded record IDs/slugs where visible in the UI, any timestamp displays, and Payload admin's live "last updated" style fields if present in a covered view. Because a `Locator` is bound to the specific `Page` it was created from, masks are built fresh per test via a helper function (`getVisualMasks(page, view)` in `e2e/helpers.ts`) rather than defined once as a module-level constant — a `Locator` created against one test's `page` instance cannot be reused against another test's `page`.

**Rationale**: Native to the same `toHaveScreenshot()` API already chosen, requires no extra dependency, and is the documented Playwright-recommended pattern for exactly this problem (FR-004). Concrete masked regions per page are enumerated during implementation (`tasks.md`) after inspecting each covered page/view for what's actually dynamic — this research file records the mechanism, not the exhaustive per-page list, since that's implementation detail appropriately deferred to task breakdown.

**Alternatives considered**:
- **Seeding fully deterministic fixture data so nothing is dynamic**: Considered complementary, not a substitute — the admin dashboard and list views may still show Payload-internal auto-generated timestamps/IDs regardless of how deterministic the seed data is, so masking is still needed as a backstop even with deterministic fixtures.
- **A single module-level `Locator[]` constant reused across tests**: Rejected once identified as invalid — `Locator`s are page-scoped in Playwright's API, so this would throw or silently mask nothing for any page other than the one it was first created against.

## Decision: Admin auth for visual tests

**Decision**: Reuse the existing cached auth session from `e2e/global-setup.ts` (the same mechanism `e2e/admin.spec.ts` already uses) for every admin visual test except the two that must run unauthenticated by construction: `/admin/login` (simply don't apply `storageState`) and `/admin/create-first-user` (which additionally needs the dedicated `visual-first-run` project described above, since it needs *no user to exist at all*, not merely an unauthenticated request).

**Rationale**: Constitution Principle IV requires verifying access empirically rather than assuming — the existing global-setup already does this correctly (logs in for real, caches the session). Duplicating that logic for visual tests would violate Principle VI (no premature abstraction/duplication) for no benefit.

## Decision: Deterministic, isolated fixture data for public-site visual tests

**Decision**: The shared Make/Model/Vehicle fixture used by the public-site visual tests (landing, listing, detail) is created with a fixed, deterministic slug (e.g. `visual-test-vehicle`, not the `Date.now()`-suffixed slugs `createPublishedVehicle`'s current implementation generates for uniqueness) and an idempotent "find existing by slug, else create" check at the start of the shared setup, rather than an unconditional create-every-run call. This keeps the visual project's fixture stable and reusable across repeated local runs (which share the same dev database as the functional suite) instead of accumulating a new Vehicle/Make/Model on every invocation or colliding with a fixed slug on the second run.

**Rationale**: `e2e/helpers.ts`'s existing `createPublishedVehicle`/`createMake`/`createModel` helpers were written for the functional suite, where each test's data is disposable and uniqueness (via `Date.now()`) prevents cross-test collisions — but they have no upsert or cleanup semantics. Calling them unmodified from the visual suite's shared setup would either fail on a fixed slug's second run (unique-constraint violation) or, with the existing random-slug behavior, silently grow the shared listing page's content on every run, making the very "vehicle listing" and "vehicle detail" snapshots this feature exists to stabilize non-deterministic across runs. An idempotent lookup-or-create avoids both failure modes without needing a separate database for the visual suite. The same fixture's ID/slug are captured once in a shared scope (e.g. a module-level variable set in a `beforeAll` in `e2e/visual.spec.ts`) so the collection-edit-view test (covering the same Vehicle) references it directly rather than re-querying or re-creating it.

**Alternatives considered**:
- **A dedicated, separate database for visual tests**: Rejected for v1 as disproportionate — this project has no existing multi-database test infrastructure, and per Constitution Principle VI, an idempotent fixture is the simpler fix for the actual problem (non-determinism), not database isolation, which would primarily help with a different concern (test interference) not really present here since the visual and functional suites don't run their assertions concurrently against the same page state.
- **Leaving `createPublishedVehicle` as-is and accepting a growing/changing listing page**: Rejected — directly undermines FR-003's "fail when it differs, pass when it matches" for the two tests (listing, detail) that depend on this fixture's content being stable.
