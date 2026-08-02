# Implementation Plan: Mobile and Tablet Responsive Support

**Branch**: `docs/spec-mobile-responsive-support` | **Date**: 2026-08-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-mobile-responsive-support/spec.md`

## Summary

The public site's header nav, vehicle filter sidebar, inquiry form, and vehicle image gallery were built desktop-first with no responsive breakpoints, no mobile nav collapse, no touch gestures, and no viewport test coverage. This plan collapses the header nav into a hamburger-triggered menu below the tablet breakpoint, converts the vehicle listing's filter sidebar into a drawer/sheet on mobile and tablet, adds touch swipe to the vehicle gallery, verifies the inquiry form meets 44px minimum tap targets, and adds a new `e2e/responsive.spec.ts` that runs viewport/layout assertions and load-time logging across three Playwright viewport configurations (375px/768px/1280px). All work is CSS/Tailwind + light client-side React state — no new runtime dependencies, no CMS schema changes, no new API surface.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 15 (App Router), React 19

**Primary Dependencies**: Tailwind CSS v4 (existing token system in `src/app/globals.css`), `shadcn/ui`-style component conventions already used in the project (`src/components/`), `next-intl` for UI strings. No new npm dependency is expected — touch swipe can be implemented with native `onTouchStart`/`onTouchMove`/`onTouchEnd` handlers, and the mobile drawer/nav can be implemented as plain conditional-rendered React state (`useState`) styled with Tailwind, matching the project's existing "zero bespoke abstraction beyond what's needed" pattern (Constitution Principle VI). If a drawer/sheet primitive is later found to already exist under `src/components/ui/` it should be reused instead of hand-rolled.

**Storage**: N/A — no data model changes (see Data Model below)

**Testing**: Vitest + React Testing Library + happy-dom (component tests) for the new Header/mobile-nav toggle and filter-drawer trigger components; Playwright (e2e) for cross-breakpoint layout/interaction assertions and load-time logging, in a new `e2e/responsive.spec.ts`, extending the existing `e2e/public.spec.ts` suite's page-object conventions where practical.

**Target Platform**: Web — evergreen mobile/desktop browsers (site already targets no specific legacy browser support)

**Project Type**: Web application (Next.js App Router monolith with embedded Payload CMS — single `src/` tree, no separate frontend/backend split)

**Performance Goals**: No new hard performance target introduced by this feature (see spec Assumptions — load-time reporting is informational, not gating). Existing pages should not regress in bundle size or render cost from the responsive changes (no new heavy dependency).

**Constraints**: No horizontal overflow at 375px/768px/1280px+ (FR-001); 44×44px minimum tap targets (FR-005); desktop (1280px+) layout must be visually unchanged (FR-007); must not alter Payload admin styling (out of scope, and CLAUDE.md's admin/public stylesheet isolation must not be touched).

**Scale/Scope**: 4 public pages (landing, vehicle listing, vehicle detail, about) + shared Header/Footer, 1 new e2e spec file, modifications to Header, VehicleFilters, VehicleGallery, InquiryForm components. No new pages or routes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. CMS-Driven Content, Not Hardcoded | PASS | No shop identity/content introduced; purely layout/interaction changes to existing CMS-driven data rendering. |
| II. No Hardcoded UI Strings | PASS (must maintain) | Any new visible string (e.g. a "Filters"/"Menu" button label or aria-label) MUST go through `useTranslations()` with both `en.json`/`ja.json` updated. Icon-only controls (hamburger, close) may use `aria-label` sourced from translations for accessibility, not raw hardcoded English. |
| III. Every Change Ships With a Test | PASS (design commitment) | New `e2e/responsive.spec.ts` covers all four public pages at three breakpoints; component tests added for Header's mobile toggle and the filter drawer trigger, per Phase 1 design below. |
| IV. Verify Access Control Empirically | N/A | No access-control-relevant change; no API/collection/global touched. |
| V. Draft-Safe, Publish-Gated | N/A | No Payload collection/global fields touched. |
| VI. Simplicity Over Premature Abstraction | PASS (design commitment) | No new npm dependency planned; reuse existing Tailwind token system and component patterns; touch gestures via native DOM events, not a carousel library, unless research finds an already-installed primitive that's clearly simpler. |

No violations requiring justification — Complexity Tracking table is empty/omitted.

## Project Structure

### Documentation (this feature)

```text
specs/001-mobile-responsive-support/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks — not created by this command)
```

No `contracts/` directory: this feature adds no new API endpoints, Payload collection/global fields, or other external interface — it is purely public-site UI/layout/interaction behavior on top of existing data-fetching paths.

### Source Code (repository root)

```text
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx              # MODIFIED: add mobile nav toggle (hamburger) + collapsible menu panel
│   │   ├── Footer.tsx              # MODIFIED (if needed): confirm no overflow at 375px, adjust grid/stack as needed
│   │   └── MobileNav.tsx           # NEW (if not folded into Header.tsx directly): collapsible nav panel
│   └── vehicles/
│       ├── VehicleFilters.tsx      # MODIFIED: mobile/tablet drawer presentation, desktop sidebar unchanged
│       ├── FilterDrawer.tsx        # NEW (if not folded into VehicleFilters.tsx directly): drawer/sheet wrapper
│       ├── VehicleGallery.tsx      # MODIFIED: add touch swipe handlers for image navigation
│       └── InquiryForm.tsx         # MODIFIED (if needed): confirm/adjust tap target sizing, input font-size (avoid iOS zoom-on-focus)
├── app/(public)/[locale]/
│   ├── page.tsx                    # Landing — verified/adjusted for overflow only, no structural change expected
│   ├── vehicles/page.tsx           # Listing — wires VehicleFilters' new drawer trigger
│   ├── vehicles/[slug]/page.tsx    # Detail — no structural change expected beyond child component updates
│   └── about/page.tsx              # Verified/adjusted for overflow only
└── messages/
    ├── en.json                     # MODIFIED: new strings for menu/filter drawer controls (e.g. "Menu", "Filters", "Close")
    └── ja.json                     # MODIFIED: matching Japanese strings

e2e/
├── responsive.spec.ts              # NEW: viewport/layout assertions + load-time logging across mobile/tablet/desktop
└── public.spec.ts                  # Unchanged unless an existing test's assumptions about Header/VehicleFilters DOM structure break

src/components/__tests__/ (or colocated)
├── Header.test.tsx or MobileNav.test.tsx   # NEW: component test for nav toggle open/close behavior
└── VehicleFilters.test.tsx (extended)      # MODIFIED/NEW: component test for drawer trigger behavior
```

**Structure Decision**: Single Next.js App Router project (Option 1-style, no frontend/backend split — this repo is already a monolith). No new top-level directories. Whether the mobile nav panel and filter drawer become separate new component files (`MobileNav.tsx`, `FilterDrawer.tsx`) or stay inlined in `Header.tsx`/`VehicleFilters.tsx` is an implementation-time call for `/speckit-tasks`/`/speckit-implement` to make based on component size — both are consistent with this plan and the constitution's simplicity principle.

## Complexity Tracking

*No Constitution Check violations — table intentionally omitted.*
