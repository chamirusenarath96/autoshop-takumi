# Implementation Plan: Visual/UI Regression Testing with Allure Reporting

**Branch**: `002-visual-regression-testing` | **Date**: 2026-08-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-visual-regression-testing/spec.md`

## Summary

Extend the existing Playwright e2e suite with visual/screenshot regression coverage for both the public site and the Payload admin, running as a distinct Playwright project so it can be triaged separately from the functional suite, with baselines authoritative only in CI's Linux container. Wire `allure-playwright` into `playwright.config.ts` so every `test:e2e` run (local and CI) produces structured Allure results, and upload those results as a CI artifact. This closes the gap that let a blank `/admin` dashboard ship to production undetected by functional tests alone (see PR #14 and the incident described in issue #15).

## Technical Context

**Language/Version**: TypeScript (Next.js 15 / Node 20, matching `.github/workflows/ci.yml`)

**Primary Dependencies**: `@playwright/test` (already in use — built-in `expect(page).toHaveScreenshot()` visual comparison, no new visual-diffing framework; current installed version `^1.61.1`, which satisfies `allure-playwright`'s `>=1.53.0` peer requirement), `allure-playwright` (new dev dependency, reporter adapter), `allure` (new dev dependency — Allure 3's Node/TypeScript-based CLI, chosen over the older Java-based `allure-commandline` package specifically to avoid adding a Java toolchain requirement to CI/local dev for report generation, consistent with Constitution Principle VI)

**Storage**: N/A — visual baselines are PNG files committed to the repo under `e2e/visual.spec.ts-snapshots/` and `e2e/visual-first-run.spec.ts-snapshots/` (Playwright's default convention: one snapshot directory per spec file); Allure results are ephemeral build output (`allure-results/`), not persisted storage; visual tests additionally use a job-local, throwaway SQLite database file (see research.md's Isolation-model decision) that is never persisted between CI runs

**Testing**: Playwright (existing `e2e/*.spec.ts` suite: `admin.spec.ts`, `public.spec.ts`, `api.spec.ts`, `responsive.spec.ts`, run by the existing `e2e` CI job — entirely unchanged by this feature); this feature adds `e2e/visual.spec.ts` and `e2e/visual-first-run.spec.ts` as new spec files, new `visual`/`visual-first-run` Playwright `project` entries in `playwright.config.ts`, and a new `e2e/visual-setup.ts` plain script (not a Playwright `globalSetup`) — all run by a new, separate `visual-e2e` CI job (see research.md's Isolation-model decision)

**Target Platform**: CI — GitHub Actions, `runs-on: ubuntu-24.04` (an explicit, dated label — not the floating `ubuntu-latest` the pre-existing `e2e`/`test`/`typecheck`/`build` jobs use, chosen specifically for the new `visual-e2e` and `update-visual-baselines` jobs so they stay pinned to an identical environment over time, per FR-006/Assumptions and research.md); local dev (macOS/Linux/WSL) for iterative (non-authoritative) `visual`-project runs only — `visual-first-run` is CI-only (see quickstart.md)

**Project Type**: Web application (existing Next.js App Router + Payload CMS monorepo — this feature adds test infrastructure only, no new app surface)

**Performance Goals**: Not applicable in the traditional sense — SC-003 requires a developer to distinguish a functional vs. visual failure within seconds of viewing results, which is a reporting/UX property of the test output, not a runtime performance target

**Constraints**: Visual baselines MUST only be generated/compared in the CI Linux container (FR-006); dynamic content (timestamps, seeded IDs) MUST be masked (FR-004); adding visual coverage MUST NOT change any existing functional test's pass/fail behavior (FR-010, SC-006)

**Scale/Scope**: 5 public page/state combinations (landing, listing-no-filter, listing-filtered, detail, about) × 3 viewports (mobile/tablet/desktop) = 15 public visual checks + 5 Payload admin views (single viewport — admin has no established mobile/tablet requirement, unlike the public site) = 20 new visual test cases total

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. CMS-Driven Content, Not Hardcoded | No | Pure test infrastructure — no new UI content or shop-identity data introduced |
| II. No Hardcoded UI Strings | No | No new visitor-facing UI/strings — tests read existing pages, don't add copy |
| III. Every Change Ships With a Test (NON-NEGOTIABLE) | **Yes — this feature IS the test infrastructure** | Satisfied by construction: the feature's entire deliverable is test coverage (`e2e/visual.spec.ts`). No separate "test for the test" is meaningful here, matching the precedent set by issue #15 itself (a testing-infra feature needs no additional test-of-tests) |
| IV. Verify Access Control Empirically, Not by Reading Source | Partially | Admin visual checks (login, create-first-user, dashboard, list, edit views) must authenticate the same empirically-verified way `e2e/admin.spec.ts` already does — `e2e/visual-setup.ts` reuses `e2e/global-setup.ts`'s proven login/create-first-user logic rather than assuming access or re-deriving it from scratch |
| V. Draft-Safe, Publish-Gated | No | No new collection/field/hook behavior |
| VI. Simplicity Over Premature Abstraction | **Yes** | Directly satisfied by the spec's own Assumptions: use Playwright's built-in comparison (no new visual-testing framework), no paid third-party SaaS (Percy/Chromatic rejected) — the one new dependency (`allure-playwright`) is justified by an explicit, already-filed downstream consumer (the dashboard issue, #16) |

**Result**: PASS. No violations requiring Complexity Tracking justification.

## Project Structure

### Documentation (this feature)

```text
specs/002-visual-regression-testing/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── checklists/
│   └── requirements.md   # Spec quality checklist (/speckit-specify command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
e2e/
├── admin.spec.ts                        # existing — functional admin tests (unchanged)
├── public.spec.ts                       # existing — functional public-site tests (unchanged)
├── api.spec.ts                          # existing — REST API tests (unchanged)
├── responsive.spec.ts                   # existing — overflow-only viewport tests (unchanged, except VIEWPORTS moves out to helpers.ts)
├── global-setup.ts                      # existing — UNCHANGED (the visual suite does not touch this; see research.md's Isolation-model decision)
├── visual.spec.ts                       # NEW — visual/screenshot regression tests (public + admin, authenticated/unauthenticated views — NOT create-first-user); does NOT import from another *.spec.ts file (Playwright forbids this at test-collection time)
├── visual-first-run.spec.ts             # NEW — the single create-first-user snapshot test, in its own file/project, run first against the visual-e2e job's still-empty database
├── visual-setup.ts                      # NEW — plain script (not a Playwright globalSetup) run as a visual-e2e CI job step between the two Playwright invocations: creates the admin user + AUTH_STATE_PATH, seeds SiteSettings, creates the deterministic Vehicle fixture
├── helpers.ts                           # existing — MODIFIED to add the shared `VIEWPORTS` constant (moved here, not imported from responsive.spec.ts) plus a `getVisualMasks(page, view)` helper, both reused by visual.spec.ts
├── visual.spec.ts-snapshots/            # NEW (auto-created by Playwright) — committed baseline PNGs for visual.spec.ts (public + authenticated/unauthenticated admin views)
└── visual-first-run.spec.ts-snapshots/  # NEW (auto-created by Playwright) — committed baseline PNG for the one create-first-user test

playwright.config.ts           # MODIFIED — add `visual` project (scoped to visual.spec.ts only via testMatch) and `visual-first-run` project (scoped to visual-first-run.spec.ts); `chromium` gets `testIgnore` for both new spec files; add allure-playwright reporter; add an explicit expect.toHaveScreenshot tolerance — `globalSetup`/`chromium` otherwise untouched

.github/workflows/ci.yml       # MODIFIED — new `visual-e2e` job (own database, runs visual-first-run → visual-setup.ts → visual, uploads its own allure-results); existing `e2e` job gets an unconditional (not gated on success) allure-results upload step; new `update-visual-baselines` workflow_dispatch job (contents: write, ubuntu-24.04) for regenerating visual baselines (see research.md)

package.json                   # MODIFIED — add allure-playwright, allure devDependencies; test:e2e becomes `playwright test --project=chromium` (was bare `playwright test`); new test:e2e:visual and allure:report scripts; pretest:e2e clears allure-results/ before each invocation (allure-playwright appends rather than overwriting)

README.md / CLAUDE.md          # MODIFIED — document visual test workflow, baseline update procedure, CI-environment-determinism gotcha; CLAUDE.md testing rule updated per FR-011
```

**Structure Decision**: This is a test-infrastructure-only feature within the existing single Next.js + Payload monorepo (no frontend/backend split, no new app). All new files live under the existing `e2e/` directory alongside current spec files, following the same flat-file-per-concern convention already established (`admin.spec.ts`, `public.spec.ts`, etc.) rather than introducing a new subdirectory structure. Playwright's own `project` mechanism (in `playwright.config.ts`) satisfies FR-005's "distinct, separately runnable/reportable group" requirement without any custom tooling; a new dedicated CI job (`visual-e2e`, alongside the existing `e2e`/`test`/`typecheck`/`build` jobs) with its own database satisfies the isolation this feature's snapshot determinism actually needs, while leaving every existing job untouched.

## Complexity Tracking

*No Constitution Check violations — this section is not applicable.*
