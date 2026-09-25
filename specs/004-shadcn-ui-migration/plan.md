# Implementation Plan: shadcn/ui Component Migration

**Branch**: `004-shadcn-ui-migration` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-shadcn-ui-migration/spec.md`

## Summary

Replace every hand-written or native-HTML interactive component on the public site with a real shadcn/ui component (sourced via the shadcn MCP), restyled with the existing Takumi design tokens in `src/app/globals.css`. No visual, behavioral, or content change is intended — this is a like-for-like component-library swap. The four existing hand-written primitives (`button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx`) are reconciled against genuine shadcn output; five new primitives are added (`select.tsx`, `sheet.tsx`, `collapsible.tsx`, `label.tsx`, `separator.tsx`, `avatar.tsx`) to replace the native `<select>` in `VehicleFilters`, the modal filter drawer in `VehicleFilters`, the non-modal mobile nav panel in `Header`, and the site logo / team-member photos. Every existing `data-testid`, ARIA attribute, and test assertion is preserved or deliberately migrated to an equivalent role/testid-based assertion in the same PR.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, Next.js 15 (App Router)

**Primary Dependencies**: shadcn/ui components (sourced via the `Shadcn_UI` MCP, shadcn v4 registry); new dependency `radix-ui` (the unified Radix package — every shadcn v4 component fetched for this feature imports primitives from it, not individual `@radix-ui/react-*` packages); already-present `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`

**Storage**: N/A — no Payload collection/global schema changes

**Testing**: Vitest + React Testing Library + happy-dom (component tests); Playwright (`e2e/public.spec.ts`, `e2e/responsive.spec.ts`, `e2e/visual.spec.ts`) — no new test *framework*, existing suites extended/updated in place

**Target Platform**: Web (server-rendered + client-interactive, existing Next.js deployment on Vercel)

**Project Type**: Web application — single Next.js project, no frontend/backend split (public site + embedded Payload admin already coexist; this feature touches only the public-site half)

**Performance Goals**: No regression — component-library swap only, not a performance feature. Radix primitives are already tree-shaken by Next.js's existing bundler config; no new goal beyond "no measurable slowdown."

**Constraints**: Dark-only theme preserved (no light-mode variables introduced); zero new color/spacing/font values outside `src/app/globals.css`'s existing tokens; every existing `data-testid`/`aria-*`/`role`/form `name` attribute an existing test depends on must survive; Payload admin styling (`src/app/(payload)/`) must not be touched (separate stylesheet system, see CLAUDE.md).

**Scale/Scope**: 4 public pages (Home, Vehicles listing, Vehicle detail, About), 4 existing hand-written UI primitives to reconcile, 6 new UI primitives to add, ~7 feature components to update (`Header`, `VehicleFilters`, `VehicleCard`, `TeamMemberCard`, plus incidental touch-ups to `Footer`/`LocaleSwitcher` if they consume a changed primitive), full existing component + e2e test suite to review/update.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. CMS-Driven Content | No content, copy, or Payload schema changes in this feature | ✅ Pass — presentation-layer only |
| II. No Hardcoded UI Strings | All existing `next-intl` `t()` calls for labels/aria-labels (Menu, Close menu, Filters, Close filters, etc.) are preserved verbatim on the new shadcn-backed markup, not replaced with hardcoded strings | ✅ Pass, verified in Phase 1 design below |
| III. Every Change Ships With a Test (NON-NEGOTIABLE) | FR-005/FR-006 require every affected component test and e2e spec to be updated in the same PR; tasks.md will enumerate each file | ✅ Pass, enforced by task breakdown |
| IV. Verify Access Control Empirically | N/A — no access-control surface touched | N/A |
| V. Draft-Safe, Publish-Gated | N/A — no Payload hooks/collections touched | N/A |
| VI. Simplicity Over Premature Abstraction | Only 6 new primitives are added, each mapped to a concrete existing replacement need (see Data Model below) — no speculative addition of unused shadcn components (e.g. no Accordion/Tabs/Carousel added "just in case") | ✅ Pass |
| Tech Constraint: Tailwind v4 + CSS-variable tokens | All new/reconciled primitives consume the existing `--primary`/`--background`/`--card`/etc. tokens exclusively; shadcn's generated `dark:` variants are stripped since the site has no light mode | ✅ Pass, verified in Phase 1 design below |
| Tech Constraint: Admin/public stylesheet separation | This feature never imports from or edits `src/app/(payload)/`; new primitives live under `src/components/ui/`, imported only by public-site components | ✅ Pass |

No violations. Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/004-shadcn-ui-migration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output (component/replacement map, since this feature has no data entities)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — not created by this command)
```

No `contracts/` directory — this feature exposes no new API, CLI, or external interface; it is a pure internal presentation-layer swap within an existing web application.

### Source Code (repository root)

```text
src/
├── components/
│   ├── ui/                         # shadcn primitives — existing 4 reconciled, 6 new added
│   │   ├── button.tsx              # existing — reconcile against shadcn v4 output
│   │   ├── card.tsx                # existing — reconcile against shadcn v4 output
│   │   ├── badge.tsx               # existing — reconcile against shadcn v4 output
│   │   ├── input.tsx               # existing — reconcile against shadcn v4 output
│   │   ├── select.tsx              # NEW — replaces native <select> in VehicleFilters
│   │   ├── sheet.tsx                # NEW — replaces the modal filter drawer in VehicleFilters
│   │   ├── collapsible.tsx         # NEW — replaces the non-modal mobile nav panel in Header
│   │   ├── label.tsx               # NEW — used by Select/Input pairings in VehicleFilters/InquiryForm
│   │   ├── separator.tsx           # NEW — replaces manual `<div className="w-px h-4">` dividers in Header
│   │   └── avatar.tsx              # NEW — site logo (Header/Footer) and team-member photos (TeamMemberCard)
│   ├── layout/
│   │   ├── Header.tsx              # mobile nav panel → Collapsible; logo → Avatar; dividers → Separator
│   │   ├── Footer.tsx              # logo → Avatar (if applicable), otherwise untouched
│   │   └── LocaleSwitcher.tsx      # untouched unless it needs to consume Button/Separator instead of raw <button>
│   ├── vehicles/
│   │   ├── VehicleFilters.tsx      # native <select> → Select; drawer <div role="dialog"> → Sheet
│   │   ├── VehicleCard.tsx         # already Card/Badge-based — reconcile only
│   │   ├── VehicleGallery.tsx      # untouched (spec excludes vehicle photography from Avatar/primitive treatment)
│   │   └── InquiryForm.tsx         # <input>/<textarea> → Input + Label pairing
│   └── about/
│       └── TeamMemberCard.tsx      # photo <img> → Avatar
├── app/(public)/[locale]/          # page-level files — no structural change, only consume updated components
└── app/(payload)/                  # OUT OF SCOPE — untouched

e2e/
├── public.spec.ts                  # update assertions coupled to old markup (e.g. `page.locator('select')`)
├── responsive.spec.ts              # update drawer/menu open-close assertions if Sheet/Collapsible change timing/animation
└── visual.spec.ts                  # baselines regenerated only if an unintended diff appears
```

**Structure Decision**: Single Next.js application, existing structure retained. All new primitives go into the existing `src/components/ui/` directory alongside the four already-present hand-written ones; no new top-level directory is introduced. Feature components under `layout/`, `vehicles/`, and `about/` are edited in place — none are moved or renamed.

## Complexity Tracking

*No Constitution Check violations — this section is intentionally empty.*
