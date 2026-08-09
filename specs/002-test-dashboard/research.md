# Phase 0 Research: Internal Test Results Dashboard

All items the source issue (#16) left as options were already narrowed to a
recommendation with reasoning in the issue body itself; this research
confirms those choices are sound and fills in the remaining implementation
unknowns that block Phase 1 design.

## 1. Hosting architecture

**Decision**: Separate, minimal Next.js project (issue #16's "Option B"),
its own Vercel project, its own GitHub OAuth app registration.

**Rationale**: Zero shared deploy surface with the production dealership
site — a broken dashboard build/deploy cannot break `autoshop-takumi`'s own
build/deploy, satisfying FR-009/SC-004. Consistent with this repo's existing
precedent of keeping concerns in fully separate systems rather than
retrofitting one app to do two jobs (the public site vs. Payload admin
stylesheet separation documented in CLAUDE.md is the same instinct applied
elsewhere in this codebase).

**Alternatives considered**:
- *Route inside the existing Next.js app* (`/internal/test-dashboard`):
  rejected — mixes test-infra concerns into the product app's deploy
  pipeline; a dashboard bug becomes a product-app incident risk; Vercel
  serverless functions are a poor fit for serving large static Allure
  report bundles.
- *GitHub Pages + Cloudflare Access*: rejected — no native per-user OAuth
  gating on GitHub Pages itself (would need a second product, Cloudflare
  Access, layered on top); loses the custom aggregated-history view in
  favor of Allure's stock per-run report; per-run folder structure would
  need to be hand-managed anyway.

## 2. OAuth provider and session strategy

**Decision**: Auth.js (NextAuth) v5, GitHub OAuth provider only, JWT session
strategy, no database/adapter.

**Rationale**: The repo and its CI already live on GitHub, so a GitHub OAuth
app is the natural, zero-new-account-system choice; there is exactly one
allowed user, so a database-backed session store adds a moving part
(a database, migrations, hosting for it) with no corresponding benefit —
signed JWT sessions are sufficient and match constitution Principle VI
("no new dependency ... without a concrete need").

**Alternatives considered**:
- *Google OAuth*: viable equally well per the issue, but rejected in favor
  of GitHub since it avoids introducing a second identity provider/console
  the project doesn't otherwise use.
- *Database session strategy (e.g. Prisma + Postgres)*: rejected — solves a
  multi-device/revocable-session problem this single-user internal tool
  doesn't have; adds a persistent data store purely for session bookkeeping.

## 3. Access-control enforcement point

**Decision**: Enforce the allowlist check in Next.js `middleware.ts` so it
runs on every request/route (including deep links to `/runs/[runId]`), not
only inside individual page components.

**Rationale**: FR-003 explicitly requires per-view/per-request enforcement,
not just entry-page gating. Centralizing the check in middleware means a
new page added later can't accidentally forget the guard — the alternative
(auth check duplicated in every `page.tsx`) is exactly the kind of drift
constitution Principle IV ("verify access control empirically, not by
reading source") warns against trusting without a runtime check. Combined
with an e2e test (per Principle III/IV) that actually attempts sign-in with
a non-allowlisted account against a deep-linked run page, not just the
home page.

**Alternatives considered**:
- *Per-page `auth()` checks only*: rejected as the sole mechanism — easy to
  miss on a newly added route; kept as a defense-in-depth pattern but not
  relied on alone.

## 4. Reading Allure data from R2

**Decision**: CI (in the main `autoshop-takumi` repo, once issue #15 lands)
uploads each run's Allure *results* (or a generated static *report*, TBD by
#15's own implementation) to `testing-artifacts/<run-id>/` in the shared R2
bucket, plus a small `summary.json` per run (status, counts, timestamp,
commit SHA) written alongside it for cheap list-view rendering without
having to parse the full Allure report just to build the history list. The
dashboard lists run prefixes via `@aws-sdk/client-s3`'s `ListObjectsV2`,
reads each `summary.json` for the history/list views, and serves/links the
full report content for the detail view.

**Rationale**: Avoids requiring the dashboard to understand Allure's full
internal result-file format just to render a list — a tiny denormalized
summary file is cheap for CI to write and cheap for the dashboard to read.
Keeps the dashboard fully decoupled from *how* issue #15 generates the
report internally; the only real contract between the two features is
"a `summary.json` and a report bundle exist under a known R2 prefix per
run," documented in `data-model.md` and `contracts/`.

**Alternatives considered**:
- *Pull artifacts from the GitHub Actions API instead of R2*: rejected —
  GitHub Actions artifacts expire after 7 days (the exact problem this
  feature exists to solve), and would require GitHub API credentials with
  broader repo-read scope than a read-only R2 prefix grant.
- *Dashboard parses raw Allure `result.json` files directly for the list
  view*: rejected as the default — more parsing logic in the dashboard for
  data only needed in aggregate; the `summary.json` sidecar keeps the
  dashboard's R2 reads cheap. (Full per-test detail for a single selected
  run still comes from the real Allure report/result data, per FR-004.)

## 5. Storage credential scoping

**Decision**: The dashboard's R2 credentials are scoped read-only to the
`testing-artifacts/` prefix (a separate R2 API token from whatever the main
app uses for its media bucket writes), supplied via environment variables
per FR-010/FR-011.

**Rationale**: Least-privilege — the dashboard has no legitimate reason to
read or write the main app's media objects, and a leaked dashboard
credential should not be able to touch production media. This mirrors the
explicit incident reference in issue #19 (`/api/internal-init-schema`) about
avoiding overly-broad ambient credentials.

**Alternatives considered**:
- *Reuse the main app's existing R2 credentials wholesale*: rejected —
  unnecessarily broad scope for a read-only, single-user internal tool.

## Outcome

No unresolved `NEEDS CLARIFICATION` items remain. All Technical Context
fields in `plan.md` are concrete. Proceeding to Phase 1 design.
