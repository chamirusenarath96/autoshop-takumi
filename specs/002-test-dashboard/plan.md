# Implementation Plan: Internal Test Results Dashboard (Allure, OAuth-Gated)

**Branch**: `002-test-dashboard` | **Date**: 2026-08-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-test-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

A single-user, OAuth-gated dashboard that lets the site owner view the latest and historical Allure test-report data produced by this repo's CI (the e2e/visual regression suite from issue #15), without downloading GitHub Actions artifact zips. Ships as its own minimal Next.js project (**not** inside `autoshop-takumi`) — its own Vercel project and GitHub OAuth app — reading Allure result/report artifacts CI uploads into a `testing-artifacts/` prefix on a **dedicated Cloudflare R2 bucket used only for test artifacts**, separate from the bucket the main app uses for production media (research.md §5 — prefix-isolating a shared bucket doesn't hold up against a compromised credential-minting path). Auth.js (NextAuth v5) with the GitHub provider, JWT sessions (no database), and a `signIn` callback that compares the stable GitHub account ID against one allowlisted value enforces the single-viewer restriction on every route, not just the landing page.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22, matching this repo's Volta-pinned toolchain for consistency even though the dashboard is a separate project/repo.

**Primary Dependencies**: Next.js 15 (App Router), Auth.js (NextAuth) v5 with the GitHub OAuth provider, `@aws-sdk/client-s3` (R2 is S3-compatible) for read-only artifact listing/fetch, Allure's own result/report tooling for interpreting `summary.json`/report output (no custom parser for Allure's internal format).

**Storage**: Cloudflare R2 — read-only access to a `testing-artifacts/<run-id>/` prefix in a **dedicated R2 bucket** for test artifacts, separate from the bucket `resolveR2Config` wires up for the main app's production media (research.md §5 — R2 temporary credentials can't exceed their parent token's permissions, and static tokens only scope to a bucket, so prefix-isolating a *shared* bucket doesn't actually protect production media from a compromised minting path; a dedicated bucket closes that off structurally). No relational database — there is exactly one user and run metadata is derived from what's already in R2 (object listing + each run's `summary.json`), not duplicated into a separate store.

**Testing**: Vitest + React Testing Library for component-level UI behavior (run list rendering, empty/error states), Playwright for end-to-end coverage of the OAuth allow/deny flow and run browsing — mirroring the testing stack and "every change ships with a test" discipline this main repo uses, applied to the dashboard's own repo.

**Target Platform**: Vercel (serverless functions + edge middleware for auth gating), accessed via a modern desktop/mobile browser.

**Project Type**: Web application — small full-stack Next.js app, standalone from the `autoshop-takumi` repo/deploy.

**Performance Goals**: Single authorized user, no concurrency target beyond "stays responsive for one person actively browsing" — the latest-run view and any individual run's report should be interactive within a few seconds on a normal connection.

**Constraints**: Strictly view-only (no test re-run triggers, no writes to CI or the results store); must be fully decoupled operationally from the main app (separate deploy pipeline, separate OAuth app, separate hosting project) so a dashboard defect or outage cannot affect the production dealership site; every credential (OAuth client ID/secret, `AUTH_SECRET`, allowlisted login) comes from environment variables, documented in `.env.example`, never hardcoded.

**Scale/Scope**: One authorized viewer; expected to accumulate on the order of one CI run's artifacts per PR/push over the project's lifetime (tens to low hundreds of historical runs) — the history view needs pagination/lazy loading, not a scheme built for unbounded scale.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

This feature lives in a **separate project/repository** from `autoshop-takumi`, so several constitution principles that govern this repo's own source tree (Payload collections, `next-intl` UI strings, the public/admin styling split) don't have a direct object to apply to here. Each principle is evaluated for relevance rather than blanket-skipped:

| Principle | Applies? | How it's honored |
|---|---|---|
| I. CMS-Driven Content, Not Hardcoded | N/A | The dashboard has no shop-identity content (addresses, phone numbers, etc.) — it displays CI test data, not dealership content. Nothing here is a Payload consumer. |
| II. No Hardcoded UI Strings | N/A | Single-locale internal tool for one operator; no `next-intl`/bilingual requirement exists in the source issue or spec. |
| III. Every Change Ships With a Test | **Yes** | Carried over as this dashboard project's own testing discipline (see Technical Context: Vitest + RTL + Playwright), even though it's a different codebase — same spirit, new repo. |
| IV. Verify Access Control Empirically | **Yes** | FR-002/FR-003 (allowlist rejection, enforced per-route) must be verified against actual sign-in attempts in e2e tests, not inferred from reading the `signIn` callback source — directly analogous to this repo's access-control testing precedent. |
| V. Draft-Safe, Publish-Gated | N/A | No draft/publish content lifecycle exists in this feature — CI runs are either complete or not (handled via the incomplete-run edge case in spec.md), not a draft workflow. |
| VI. Simplicity Over Premature Abstraction | **Yes** | No database, no multi-provider auth abstraction, no custom Allure parser — read R2 directly, use Auth.js's built-in GitHub provider and JWT sessions as-is, matching "no new dependency/abstraction without a concrete need." |

No violations requiring justification. **Gate: PASS.**

## Project Structure

### Documentation (this feature)

```text
specs/002-test-dashboard/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (**new, separate repository** — NOT `autoshop-takumi`)

This feature's implementation does not live under this repo's `src/`. It is a
new, standalone repository (working name `autoshop-takumi-test-dashboard`,
per issue #16's Option B recommendation) with its own Next.js App Router
layout:

```text
autoshop-takumi-test-dashboard/          # separate repo, separate Vercel project
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/route.ts   # Auth.js (NextAuth v5) route handler
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx                      # latest-run view (US1)
│   │   │   ├── runs/page.tsx                 # historical run list (US2)
│   │   │   └── runs/[runId]/page.tsx         # single run's full Allure report (US2)
│   │   └── access-denied/page.tsx            # shown on allowlist rejection (US3)
│   ├── auth.ts                               # Auth.js config: GitHub provider, JWT
│   │                                          # strategy, signIn allowlist callback
│   ├── lib/
│   │   ├── r2.ts                             # read-only R2 client (@aws-sdk/client-s3)
│   │   └── runs.ts                           # list/summarize/fetch CI runs from R2
│   └── middleware.ts                         # enforces auth on every route (FR-003)
├── tests/
│   ├── unit/           # Vitest + RTL — run-list rendering, empty/error states
│   └── e2e/            # Playwright — allow/deny sign-in flow, run browsing
├── .env.example
└── README.md            # relationship to autoshop-takumi, artifact delivery, OAuth rotation
```

**Structure Decision**: Standalone Next.js web app (Option: separate project),
per FR-009 and the constitution's "no new abstraction without concrete need"
— reusing the exact same framework/testing stack as `autoshop-takumi` for
tooling familiarity, but with zero shared deploy surface, satisfying the
hard operational-isolation requirement in spec.md (SC-004).

**Producer/consumer split, explicitly**: this feature (issue #16) is the
**consumer** half only. The **producer** half — generating Allure's static
report and uploading it plus `summary.json` to the dedicated test-artifacts
R2 bucket's `testing-artifacts/<run-id>/` prefix, `summary.json` written
last — is owned
entirely by **issue #15**, as a CI workflow step in `.github/workflows/ci.yml`
in the `autoshop-takumi` repo (not this dashboard repo, and not a task in
this feature's `tasks.md`). This is not left implicit: `contracts/runs-data-
contract.md`'s Ownership section states it explicitly, and issue #15's own
acceptance criteria must include the three concrete producer obligations
above (prefix, bundle upload, summary-written-last ordering) so FR-008/SC-005
can actually be met once both issues ship. Everything in this feature's
`tasks.md` is new code in the new, separate dashboard repo.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
