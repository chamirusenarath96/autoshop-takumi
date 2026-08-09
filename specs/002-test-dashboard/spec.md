# Feature Specification: Internal Test Results Dashboard (Allure, OAuth-Gated)

**Feature Branch**: `002-test-dashboard`

**Created**: 2026-08-09

**Status**: Draft

**Input**: User description: "Build an internal, OAuth-gated dashboard for viewing e2e/visual regression test results (Allure reports) produced by CI, restricted to a single authorized account (chamirusenarath96). The dashboard shows the latest CI run's Allure results and lets the viewer browse historical runs (not just the most recent), view-only in v1 (no re-running tests or writing data back from the dashboard). Authentication uses a single OAuth provider — GitHub, since the repo and its CI already live there (Auth.js/NextAuth v5), with a JWT session strategy and no database/adapter, since there is exactly one allowed user. A signIn callback checks the authenticated account's login against an allowlist environment variable (e.g. ALLOWED_DASHBOARD_GITHUB_LOGIN) and rejects everyone else — a valid OAuth login by itself is not sufficient for access. All secrets (OAuth client ID/secret, allowed-account identifier, AUTH_SECRET) come from environment variables, never hardcoded in the repo, and are documented in that project's .env.example. Per the design analysis already recorded on the source issue, this ships as a separate, minimal Next.js project fully decoupled from the main Autoshop Takumi product app (its own Vercel project, its own GitHub OAuth app registration), reading Allure results/report artifacts from the same Cloudflare R2 bucket the main app already uses in production (via a new prefix, e.g. testing-artifacts/) so a bug in the dashboard can never break the production dealership site — consistent with this repo's existing pattern of strictly separating concerns (e.g. the public site and Payload admin already use two fully separate stylesheet systems, per CLAUDE.md). Include a basic README covering how the two projects/repos relate, how new CI runs get their Allure artifacts into the dashboard's R2 prefix, and how to rotate/replace the OAuth app if needed. Out of scope for v1: multi-user access/roles/permissions, triggering test re-runs from the dashboard, and alerting/notifications on test failures."

**Source Issue**: [#16](https://github.com/chamirusenarath96/autoshop-takumi/issues/16) — depends on [#15](https://github.com/chamirusenarath96/autoshop-takumi/issues/15) (visual/UI regression testing with Allure reporting), which produces the Allure artifacts this dashboard consumes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View the latest CI run's results (Priority: P1)

The site owner, after a CI run completes, opens the dashboard URL to see whether the latest e2e/visual regression run passed or failed, and to drill into which checks failed if any did.

**Why this priority**: This is the core value proposition — replacing "download a 7-day-retention zip artifact from GitHub Actions" with an always-available, browsable view. Without this, the feature delivers nothing.

**Independent Test**: Can be fully tested by signing in as the authorized account, landing on the dashboard, and confirming the most recent CI run's Allure report (pass/fail counts, individual test results) renders correctly and matches what that CI run actually produced.

**Acceptance Scenarios**:

1. **Given** the authorized account is signed in, **When** they open the dashboard's home/latest view, **Then** they see the Allure results (pass/fail/skipped counts and a link into the detailed report) for the most recent completed CI run.
2. **Given** a CI run has failing tests, **When** the owner views that run's results, **Then** they can identify which specific test(s) failed and see Allure's failure detail (error message, trace/screenshot if Allure captured one) for each.
3. **Given** no CI run has ever produced Allure artifacts yet, **When** the owner opens the dashboard, **Then** they see a clear empty state explaining no results exist yet, not an error page.

---

### User Story 2 - Browse historical runs (Priority: P2)

The site owner wants to compare today's run against previous runs — e.g. to see whether a particular test has been flaky over the last two weeks, or to confirm a fix actually resolved a prior failure — by browsing a list of past runs and opening any one of them.

**Why this priority**: This is the second half of the stated problem ("no history/trend view" in ephemeral GitHub Actions artifacts) and is explicitly called out as required in the source issue, but the dashboard still delivers real value with only User Story 1 (latest-run visibility), so this is P2.

**Independent Test**: Can be fully tested by triggering (or having on record) at least two CI runs, then confirming the dashboard lists both as distinct, individually-selectable historical entries, each opening its own correct Allure report.

**Acceptance Scenarios**:

1. **Given** at least two prior CI runs have produced Allure artifacts, **When** the owner opens the history view, **Then** they see a list of runs ordered most-recent-first, each showing at minimum its date/time and overall pass/fail summary.
2. **Given** the history list, **When** the owner selects an older run, **Then** the dashboard displays that specific run's full Allure report, not the latest one.
3. **Given** many runs have accumulated over time, **When** the owner opens the history view, **Then** the list is still usable (paginated or otherwise navigable) rather than rendering every run at once.

---

### User Story 3 - Sign in as the authorized account, and be rejected otherwise (Priority: P1)

Anyone who reaches the dashboard's URL is prompted to sign in via GitHub OAuth; the one pre-approved account gets in, and any other GitHub account — even a valid, successfully-authenticated one — is denied.

**Why this priority**: This is a hard security requirement, not a convenience feature. The dashboard's data (internal CI/test results) is only meant to be reachable by one person, and the whole reason for building this as OAuth-gated rather than link-sharing is to enforce that. It's P1 because User Stories 1 and 2 are meaningless (or actively a leak) without it.

**Independent Test**: Can be fully tested by (a) signing in with the allowlisted GitHub account and confirming access to the dashboard, and (b) signing in with a different, valid GitHub account and confirming access is denied with a clear message — no dashboard data is ever rendered to that session.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they open the dashboard URL, **Then** they are redirected to sign in via GitHub OAuth before seeing any test-result data.
2. **Given** the visitor completes GitHub OAuth using the allowlisted account, **When** sign-in completes, **Then** they land on the dashboard with full view access.
3. **Given** the visitor completes GitHub OAuth using any other GitHub account, **When** sign-in completes, **Then** they are shown an access-denied message and cannot reach any dashboard view or underlying data.
4. **Given** a rejected sign-in attempt, **When** examined afterward, **Then** no test-result data was ever transmitted to that browser session (rejection happens before data access, not as a UI-only hide).

---

### Edge Cases

- What happens when the Allure artifacts for a given run exist in storage but are incomplete or malformed (e.g. a CI run was cancelled mid-upload)? The dashboard should show that run as unavailable/incomplete rather than crashing or silently showing a stale/empty report.
- How does the dashboard behave if the storage bucket is temporarily unreachable? It should show a clear "results temporarily unavailable" state rather than an unhandled error page, and must not fall back to displaying cached credentials-adjacent data.
- What happens if the allowlisted GitHub account's login changes (e.g. the account is renamed)? Per FR-002, access control is keyed on GitHub's stable account ID, so a rename does not break or misdirect access — this remains a configuration/rotation concern documented in the project's README (e.g. re-confirming the configured ID after any account changes), not a runtime feature.
- What happens when someone who is not signed in tries to hit a dashboard data view directly (deep link), bypassing the home page? They must still be redirected to sign-in — access control is enforced per-view/per-request, not only at a single entry point.
- What happens when a CI run is still in progress and hasn't finished uploading Allure artifacts yet? It should not appear in the run list as a selectable, complete entry until its artifacts are fully available.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST require sign-in via GitHub OAuth before any test-result data (latest run or historical) is rendered or otherwise transmitted to the browser.
- **FR-002**: The dashboard MUST reject sign-in for any GitHub account other than the single pre-configured allowed account, showing a clear access-denied state instead of any dashboard content. The allowlist comparison MUST be keyed on GitHub's stable account identifier (the numeric account ID GitHub itself never reassigns), not solely on the account's current login/username — a login string is user-changeable and would silently break or misdirect the allowlist if the authorized account is ever renamed (see Edge Cases). The login MAY still be used for human-readable configuration/labeling, but the actual authorization check MUST resolve to and compare the stable ID.
- **FR-003**: The dashboard MUST enforce the sign-in and allowlist check described in FR-001/FR-002 on every view and data-fetching path, including direct/deep links, not only the entry page.
- **FR-004**: The dashboard MUST display the most recent completed CI run's Allure results, including overall pass/fail/skipped counts and access to per-test detail (failure messages, and any screenshots/traces Allure captured).
- **FR-005**: The dashboard MUST provide a browsable list of historical CI runs, ordered most-recent-first, each identifiable by at least its date/time and overall pass/fail summary.
- **FR-006**: The dashboard MUST let the signed-in user open any historical run from that list and view its full Allure report, distinct from the latest run's report.
- **FR-007**: The dashboard MUST be read-only in this version — it MUST NOT provide any way to trigger a test re-run, delete/modify stored results, or otherwise write back to CI or the results store.
- **FR-008**: The dashboard MUST source its run data from the Allure results/report artifacts produced by the project's CI pipeline (the visual/e2e regression suite tracked in issue #15), without requiring manual upload by the user.
- **FR-009**: The dashboard MUST run and be deployed as a project independent of the main Autoshop Takumi application — its availability, deploys, and any of its defects MUST NOT be able to affect the production dealership site's availability or deploys.
- **FR-010**: All credentials and identity configuration the dashboard depends on (OAuth client ID/secret, session signing secret, the allowed account identifier) MUST be supplied via environment variables and MUST NOT be hardcoded anywhere in the dashboard project's source.
- **FR-011**: The dashboard project MUST ship a `.env.example` documenting every environment variable it requires, with no real secret values.
- **FR-012**: The dashboard MUST show a clear empty state when no CI run has yet produced Allure results, rather than an error.
- **FR-013**: The dashboard MUST show a clear, non-crashing degraded/error state when the underlying results storage is temporarily unreachable or when a specific run's artifacts are incomplete/malformed.
- **FR-014**: The dashboard project MUST include a README documenting how it relates to the main Autoshop Takumi project, how CI runs deliver new Allure artifacts into the store the dashboard reads from, and how to rotate or replace the OAuth application registration if it's ever compromised or needs reissuing.

### Key Entities

- **CI Run**: A single completed (or in-progress) execution of the e2e/visual regression test suite. Key attributes: identifying timestamp/run reference, overall status (pass/fail/incomplete), pass/fail/skipped test counts, link to its full Allure report data.
- **Allure Report**: The structured test-result output (individual test cases, statuses, failure details, attachments such as screenshots/traces) associated with one CI Run.
- **Authorized Viewer**: The single GitHub account permitted to sign in and view dashboard data, identified by an allowlisted account identifier supplied via configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The site owner can check the outcome of the latest CI run (pass/fail, and which tests failed if any) in under 30 seconds from opening the dashboard, without downloading or unzipping anything.
- **SC-002**: The site owner can locate and open any of the last 20 CI runs' results within three interactions (open history, scroll/paginate if needed, select a run).
- **SC-003**: 100% of sign-in attempts from GitHub accounts other than the allowlisted one are denied access to dashboard data, verified across repeated attempts.
- **SC-004**: A defect or outage in the dashboard project results in zero measurable impact (uptime, error rate, deploy success) to the production Autoshop Takumi site, verified by the two projects having fully independent deploy pipelines and hosting.
- **SC-005**: A new CI run's results become viewable on the dashboard without any manual step by the site owner (no manual upload, no manual "refresh the data" action beyond simply reloading the page after CI completes).

## Assumptions

- **Hosting/architecture**: Per the design options already evaluated and recommended on source issue #16, the dashboard ships as Option B — a separate, minimal Next.js project with its own deploy target and its own OAuth app registration — rather than a route inside the main app or a static-hosting-plus-access-proxy approach. This is recorded as a decision, not a [NEEDS CLARIFICATION], because the issue body already performed this analysis and gave an explicit recommendation with reasoning.
- **OAuth provider**: GitHub is assumed as the OAuth provider (over Google or another option), since the issue's own proposed approach names it as "the natural fit since the repo/CI already lives there" and the codebase has no existing Google OAuth integration to reuse. This is recorded as a decision per the issue's stated reasoning, not left open.
- **Session/identity strategy**: A stateless, database-free session strategy is assumed (e.g. signed session tokens) rather than a persistent session store, since there is exactly one allowed user and no multi-user session management is in scope for v1.
- **Results storage**: The dashboard reads Allure artifacts from Cloudflare R2 — the same storage *provider* the main app already uses in production for media, but a **dedicated bucket** rather than a shared one. This was refined during spec review from the issue's original "same bucket, distinct prefix" recommendation: R2 temporary credentials can't exceed their parent token's permissions, and static R2 tokens only scope to a bucket (never a prefix), so a shared bucket can't actually be isolated from the dashboard's credentials the way FR-009 requires — see `research.md` §5 for the full reasoning. A dedicated bucket keeps the "reuse the existing storage provider, don't introduce a second one" spirit of the issue's recommendation while actually satisfying the isolation requirement. The exact mechanism by which CI uploads artifacts into that bucket (vs. the dashboard pulling them from GitHub Actions' own artifact API) is a technical decision deferred to the planning phase — both are compatible with FR-008.
- **Retention**: Historical runs are assumed to be retained indefinitely for v1 (no automatic deletion policy), since the issue does not mention a retention requirement and the explicit goal is a "history/trend view" that ephemeral 7-day GitHub Actions artifacts don't provide. A retention/cleanup policy can be added later without affecting this spec's requirements.
- **Artifact content/privacy**: Allure screenshots and traces are captured from this project's own e2e/visual regression suite (test fixtures and seeded/synthetic data per the main app's `scripts/seed.ts` pattern), not from real customer or production data, so indefinite retention is assumed safe without redaction — this is now even lower-stakes than originally assessed, since the dedicated test-artifacts bucket holds no production media at all to be confused with. If issue #15's implementation ever captures real production data in a test run (e.g. a visual test accidentally pointed at production), that is a defect in that feature to fix at the source, not something this dashboard should assume it needs to redact.
- **Scale**: The dashboard is assumed to serve a single user with a low request volume (this is an internal tool for one person, not a public-facing feature), so no specific concurrency/load targets are defined beyond "doesn't degrade under normal single-user browsing."
- **Out of scope for v1** (per the source issue): multi-user access or roles/permissions beyond the single allowlisted account; triggering test re-runs from the dashboard; alerting or notifications on test failures. These may become their own future issues.
- **Dependency**: This feature depends on issue #15 (visual/UI regression testing with Allure reporting) actually producing Allure result artifacts in CI. The dashboard's implementation cannot be completed/deployed against real data until #15 ships, though this spec, its plan, and its tasks can be written in advance.
