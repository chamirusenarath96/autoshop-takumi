# Feature Specification: Visual/UI Regression Testing with Allure Reporting

**Feature Branch**: `002-visual-regression-testing`

**Created**: 2026-08-08

**Status**: Draft

**Input**: User description: "Add visual/UI regression testing coverage to the existing Playwright e2e suite for both the public site and the Payload CMS admin dashboard, and produce structured Allure report artifacts from every test run." (GitHub issue #15)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Catch a visually broken page before it reaches production (Priority: P1)

A developer changes styling, a dependency upgrade shifts CSS output, or a build misconfiguration silently drops content from a page (as happened when `/admin` rendered completely blank in production while every functional test still passed). Before that PR merges, an automated check compares the current rendered appearance of key pages against a known-good baseline and fails the build if they differ unexpectedly.

**Why this priority**: This is the entire reason the feature exists — the exact failure mode that inspired this issue (a blank admin dashboard shipping to production undetected) is only catchable by comparing actual rendered pixels, not by functional assertions. Without this story, the feature delivers no value.

**Independent Test**: Can be fully tested by intentionally introducing a visual regression (e.g., commenting out a component's render, or a CSS change that hides content) on a covered page, running the visual test suite, and confirming it fails with a clear diff. Delivers value standalone even before every page is covered.

**Acceptance Scenarios**:

1. **Given** a covered page renders identically to its stored baseline, **When** the visual test suite runs, **Then** all visual tests for that page pass.
2. **Given** a covered page's rendered appearance changes unexpectedly (e.g., content silently fails to render), **When** the visual test suite runs, **Then** the corresponding test fails and reports a visual diff.
3. **Given** the Payload admin dashboard specifically renders blank or unstyled (the incident this feature guards against), **When** the visual test suite runs against it, **Then** the dashboard visual test fails.

---

### User Story 2 - Triage visual failures separately from functional failures (Priority: P2)

A CI run reports failures. A developer or reviewer needs to immediately tell whether real user-facing functionality broke (a button doesn't work, a form doesn't submit) versus a cosmetic/rendering difference (spacing shifted, a screenshot legitimately needs updating after an intentional design change) — these need different urgency and different people to act on them.

**Why this priority**: Visual tests are inherently more prone to incidental noise (font rendering, timing) than functional tests. Bundling them into the same suite/report as functional tests would make functional failures harder to spot and train the team to ignore red CI. This story protects the signal quality of the existing functional suite, which is why it's P2 rather than P1 — it's about not degrading what already works while adding the new capability.

**Independent Test**: Can be tested by running the full e2e command and confirming visual tests execute as an identifiably separate group/job from the functional suite, with results (pass/fail counts) reported independently.

**Acceptance Scenarios**:

1. **Given** a functional test fails and a visual test fails in the same run, **When** results are reported, **Then** a developer can identify which failure is which without opening every individual test's output.
2. **Given** only visual tests are affected by a change, **When** a developer wants to re-run just those, **Then** they can do so without re-running the entire functional suite.

---

### User Story 3 - Update a baseline after an intentional design change (Priority: P2)

A developer intentionally changes a page's design (new hero layout, updated brand color). The stored baseline is now correctly "outdated" and needs to be regenerated to match the new intended appearance, without that regeneration silently masking an unrelated, unintentional regression elsewhere on the same page.

**Why this priority**: Without a clear, documented update path, visual testing becomes a source of friction that teams route around (e.g., by disabling failing tests) rather than a tool they trust — undermining Story 1's value over time. Ranked P2 because the feature can ship and prove value (Story 1) before this workflow is battle-tested, but it's required before the feature is sustainable long-term.

**Independent Test**: Can be tested by making an intentional visual change to a covered page, following the documented baseline-update procedure, and confirming the suite passes afterward with the new appearance as the baseline.

**Acceptance Scenarios**:

1. **Given** documented instructions for updating a baseline, **When** a developer follows them after an intentional design change, **Then** the visual test suite passes using the new baseline.
2. **Given** a baseline was generated on a machine other than the designated CI environment, **When** that baseline is used for comparison in CI, **Then** documentation warns this is unsupported and explains why (font/OS rendering differences produce false failures).

---

### User Story 4 - Browse structured test results as artifacts, not just pass/fail (Priority: P3)

A developer or the project owner wants to look back at a specific CI run's test results in a structured, browsable format (which tests ran, timings, screenshots on failure) rather than only scrolling raw CI logs — as a foundation for a future results-history dashboard (tracked separately).

**Why this priority**: This doesn't gate the core regression-catching value (Stories 1-3) but is called out explicitly in the source issue as required output this feature must produce, since a separate, already-filed roadmap item depends on consuming it. Lowest priority because nothing in this feature's own acceptance depends on the report being consumed yet — it just needs to exist as an artifact.

**Independent Test**: Can be tested by running the e2e suite and confirming a structured results directory (or generated static report) is produced and retrievable, independent of whether any downstream dashboard exists yet.

**Acceptance Scenarios**:

1. **Given** the e2e suite runs (locally or in CI), **When** it completes, **Then** a structured results directory is produced covering both functional and visual test outcomes.
2. **Given** a CI run has completed, **When** a developer wants to inspect that run's results afterward, **Then** the structured results are retrievable as a build artifact rather than only visible in the live log output.

### Edge Cases

- What happens when a page's content is intentionally dynamic per render (timestamps, seeded/random IDs, live inventory counts)? The comparison must not fail on these — such regions are masked or excluded from comparison rather than causing permanent false failures.
- What happens when a visual baseline doesn't exist yet for a newly added page (first run after adding coverage)? The system establishes it as the new baseline rather than failing with no prior baseline to compare against, and this is called out during review so the initial baseline itself gets a human look.
- What happens when a visual comparison is run outside the designated consistent environment (e.g., a developer's local machine with different fonts/OS rendering)? Results are expected to differ from CI and must not be used to update the authoritative baseline — this is a documented constraint, not a bug to fix.
- How does the system handle a page that fails to load at all (e.g., a server error) during a visual check? It is reported as a failure distinguishable from "content rendered but looks different," so a developer isn't stuck decoding a screenshot diff for a page that never rendered.
- What happens to existing functional test behavior/results when this feature is added? Existing functional tests must continue to pass and report exactly as before — this feature is additive only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The test suite MUST include visual regression checks for each of the following public-site pages, at mobile (~375px), tablet (~768px), and desktop (~1280px) viewport widths: landing page, vehicle listing (both with no filters applied and with at least one filter applied), vehicle detail, and the about page.
- **FR-002**: The test suite MUST include visual regression checks for each of the following Payload admin views: the login page, the create-first-admin-user page, the post-login dashboard, a collection list view, and a collection edit view.
- **FR-003**: A visual regression check MUST fail when a covered page's rendered appearance differs from its stored baseline beyond an acceptable, documented tolerance, and MUST pass when it matches.
- **FR-004**: Visual regression checks MUST exclude or mask content regions that are expected to vary between runs through normal operation (e.g., timestamps, seeded/random record identifiers) so that such variation alone never causes a failure.
- **FR-005**: Visual regression checks MUST be executable and reportable as a distinct group, separable from the existing functional test suite, so a developer can run or re-run either independently and distinguish which group produced a given failure.
- **FR-006**: The project's documentation MUST state that visual baselines are authoritative only when generated in the designated CI environment, and MUST explain why (rendering differences across fonts/operating systems produce false failures), mirroring how the project documents its other environment-specific testing gotchas.
- **FR-007**: The project's documentation MUST describe the procedure for regenerating a visual baseline after an intentional design change, and how to run the visual checks locally for development purposes (understanding local runs are for iteration, not for producing authoritative baselines).
- **FR-008**: Every execution of the full e2e test command (locally and in CI) MUST produce a structured, machine-readable results output covering both functional and visual test outcomes, in addition to any human-readable report already produced today.
- **FR-009**: The CI pipeline MUST preserve the structured test results output described in FR-008 as a retrievable artifact of the run, independent of the pipeline's pass/fail outcome.
- **FR-010**: The addition of visual regression checks MUST NOT change the pass/fail outcome or reported results of any existing functional test.
- **FR-011**: Project documentation MUST state that visual regression coverage is an expected part of adding any new public-facing page or admin view going forward, consistent with the project's existing testing rule for other test types.
- **FR-012**: A first-time visual regression check for a page with no existing baseline MUST establish that baseline rather than fail, and this initial-baseline case MUST be visible/reviewable by a human as part of normal change review (e.g., the baseline file appears as a reviewable addition in the change that introduces it).

### Key Entities

- **Visual Baseline**: The stored known-good rendered appearance of one page at one viewport size, used as the comparison target for future test runs. Tied to a specific page, viewport, and (implicitly) the environment it was generated in.
- **Visual Regression Result**: The outcome of comparing a current render against its Visual Baseline for one test run — pass, fail (with a diff for review), or newly-established baseline.
- **Structured Test Results**: The machine-readable output of one full test suite execution, covering both functional and visual results, retained as a retrievable artifact of that run.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visual regression affecting any of the covered public-site or admin pages is caught by the test suite before merge, with 100% of the pages enumerated in FR-001/FR-002 under visual coverage.
- **SC-002**: The specific incident class that motivated this feature — a page rendering with no visible content while functional checks still pass — is caught automatically: reproducing that condition on the admin dashboard causes the visual suite to fail.
- **SC-003**: A developer can distinguish a functional failure from a visual failure in a completed test run within a few seconds of looking at the results, without opening individual test output.
- **SC-004**: A developer can regenerate a baseline after an intentional design change and get the suite passing again by following documented steps alone, without needing to ask a teammate how.
- **SC-005**: Every completed e2e run, local or CI, leaves behind a structured, browsable results output that a developer can open afterward to see what ran and what happened — not just pass/fail counts in a log.
- **SC-006**: Zero existing functional tests change behavior (pass rate, assertions, or reported outcomes) as a result of this feature being added.

## Assumptions

- **Tooling choice**: Playwright's own built-in visual comparison (`expect(page).toHaveScreenshot()`) is used rather than introducing a new visual-testing framework or a paid third-party visual-diffing service (Percy, Chromatic, etc.) — Playwright is already the project's e2e tool, and its native capability is sufficient for this scope. This is called out explicitly in the source issue, not left to an implementer's discretion.
- **Environment for authoritative baselines**: The project's CI environment (a specific Linux container image) is treated as the single source of truth for baseline generation and comparison, matching the source issue's explicit call-out that screenshot diffing is font/OS sensitive. Locally generated baselines are for developer iteration only and are not committed as authoritative.
- **Separation mechanism**: "Distinct, separately runnable/reportable group" (FR-005) is satisfied by any mechanism that lets visual and functional tests be filtered, triggered, and reported independently — the source issue suggests a distinct Playwright "project" as one reasonable way to achieve this, but the requirement itself is expressed as user-facing behavior, not a specific configuration mechanism.
- **Reporting format**: "Structured, machine-readable results" (FR-008) is satisfied by Allure-compatible output, per the source issue's explicit request, since a separate already-filed roadmap issue (a results dashboard) is designed to consume that specific format. This spec treats the dashboard itself as out of scope — only the artifact it will eventually consume is in scope here.
- **Filter-applied listing state**: "Vehicle listing with at least one filter applied" (FR-001) does not mandate which specific filter (make/model/body type/transmission) — any single filter that produces a stable, deterministic result set is acceptable, since the goal is coverage of the filtered-state layout, not any particular filter's data.
- **Out of scope**: The results-browsing dashboard UI itself (tracked in a separate, already-filed roadmap issue) and any paid third-party visual-diffing SaaS are explicitly out of scope for this feature, per the source issue.
- **Out of scope**: Visual regression coverage for pages/views not enumerated in FR-001/FR-002 (e.g., the Inquiries admin screen, the Users admin screen) is not required by this feature; FR-011 establishes the forward-looking expectation for pages created after this feature ships, not retroactive coverage of every existing screen.
