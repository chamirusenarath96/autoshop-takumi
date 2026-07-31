# Autoshop Takumi Constitution

## Core Principles

### I. CMS-Driven Content, Not Hardcoded
Shop identity — addresses, phone numbers, social links, hero copy, taxonomy —
lives in Payload `SiteSettings`/`Homepage` globals or collections, never
hardcoded in component code. This is what makes the codebase reusable as a
template for a second dealership without touching component code. A feature
that bakes shop-specific data into a component is out of spec.

### II. No Hardcoded UI Strings
All visitor-facing text goes through `next-intl`'s `useTranslations()`, with
both `src/messages/en.json` and `src/messages/ja.json` updated together.
Every localized Payload field needs `localized: true` in its collection/
global config. A feature that adds English-only or Japanese-only strings is
incomplete.

### III. Every Change Ships With a Test (NON-NEGOTIABLE)
No code change merges without a matching test change in the same PR:
- New feature → component test (UI behavior) and/or `e2e/api.spec.ts` (new
  endpoint / access-control rule) and/or `e2e/admin.spec.ts` (new admin
  screen) and/or `e2e/public.spec.ts` (new public page)
- Bug fix → a test that would have caught the bug
- Behavior change (access control, required-ness, routes) → update the
  existing test(s) asserting the old behavior
- Refactor with no behavior change → existing tests pass unmodified

### IV. Verify Access Control Empirically, Not by Reading Source
Collections/globals with no explicit `access` block default to
`Boolean(req.user)` — authenticated-only for every operation, including
reads. Before writing a test or doc claiming an endpoint is "public," check
the actual HTTP response (curl or a fresh unauthenticated request context —
`playwright.request.newContext()` has previously been found to silently
inherit an authenticated session; prefer plain `fetch()` for genuine
unauthenticated e2e checks). Remember: public pages read CMS data server-side
via Payload's Local API (`overrideAccess: true` by default), which is
entirely separate from what the public REST API allows.

### V. Draft-Safe, Publish-Gated
Business-critical completeness checks (e.g. a vehicle needs a `heroImage`
before `status: 'available'`) belong in `beforeChange` hooks gated on the
specific status transition, not on the field's schema-level `required`. Drafts
must always be saveable incomplete.

### VI. Simplicity Over Premature Abstraction
No new dependency, admin screen, or abstraction without a concrete need. This
project deliberately has zero bespoke admin UI — everything is Payload's
auto-generated CRUD from collection/global schemas.

## Technology Constraints

- **Framework**: Next.js 15 App Router, React Server Components by default;
  `'use client'` only where interactivity requires it.
- **CMS**: Payload CMS 3.x, embedded in the Next.js app — no separate backend
  service.
- **Database**: SQLite locally; Postgres/Neon in production (adapter swap not
  yet wired — see README Known Issues before assuming it works).
- **i18n**: `next-intl` for UI strings, Payload field localization for
  content; only `ja`/`en` today, but the architecture supports adding a third
  locale.
- **Styling**: Tailwind CSS v4 + CSS-variable brand tokens in
  `src/app/globals.css`. Public site and Payload admin use two entirely
  separate stylesheet systems that must never cross-contaminate (see
  CLAUDE.md "Styling architecture").
- **Node version**: pinned via Volta (`package.json` `"volta"` field) —
  respect the pinned version rather than whatever happens to be on PATH.

## Development Workflow

- Never commit directly to `master` — it's protected. Every change goes on a
  `feat/`, `fix/`, `chore/`, or `docs/` branch.
- Open a PR; CI (Component Tests → Type Check → E2E Tests + Build Check) and
  CodeRabbit review must both be addressed before merge.
- Prefer small, single-purpose PRs over one large one — stack PRs on top of
  each other if a later one genuinely depends on an earlier one's changes.
- When a review comment or CI failure looks like a false positive or a
  Playwright/tooling quirk, verify empirically (curl, direct source read)
  before dismissing it — several past "obviously fine" assumptions in this
  project turned out to be wrong on inspection (see README Known Issues).

## Governance

This constitution supersedes ad-hoc practice for anything it covers. It is
subordinate to `CLAUDE.md` and `README.md`, which hold implementation-level
detail this document intentionally omits — when they conflict, treat it as a
sign the constitution needs amending, not that either source is wrong.
Amendments should update this file directly with a clear reason in the commit
message.

**Version**: 1.0.0 | **Ratified**: 2026-07-31 | **Last Amended**: 2026-07-31
