# Phase 0 Research: shadcn/ui Component Migration

No `[NEEDS CLARIFICATION]` markers were left in the Technical Context — every choice below was either dictated directly by the user's request or resolved by inspecting the current codebase and the shadcn v4 registry output. Documented here for traceability.

## Decision: Use the unified `radix-ui` package, not individual `@radix-ui/react-*` packages

**Rationale**: Fetching `select`, `sheet`, `avatar`, `label`, `separator`, and `collapsible` from the shadcn v4 registry (via the `Shadcn_UI` MCP) shows every one of them importing its primitive from a single `radix-ui` package (e.g. `import { Dialog as SheetPrimitive } from "radix-ui"`), not from per-component `@radix-ui/react-dialog` etc. This matches shadcn's current (v4) convention. Installing the single `radix-ui` package covers all six new primitives with one dependency addition.

**Alternatives considered**: Installing individual `@radix-ui/react-select`, `@radix-ui/react-dialog`, etc. — rejected because it doesn't match what the registry output actually imports; would require rewriting every fetched component's imports for no benefit.

## Decision: Component-to-replacement mapping

| Existing implementation | Replacement | Why |
|---|---|---|
| Native `<select>` in `VehicleFilters.tsx`'s `FilterSelect` (used 5×: sort, make, model, body type, transmission) | shadcn `Select` | Direct native-HTML → shadcn primitive swap explicitly called out in the spec (FR-003) |
| `<div role="dialog" aria-modal="true">` mobile filter drawer in `VehicleFilters.tsx` | shadcn `Sheet` | Already a true modal (backdrop, `role="dialog"`, focus should be trapped) — `Sheet` is Radix `Dialog` under the hood, a correct behavioral match, not just a visual one |
| `<div className="lg:hidden border-t px-6 py-4 ...">` mobile nav panel in `Header.tsx` | shadcn `Collapsible` | This panel is **non-modal** — no backdrop, no focus trap, it just shows/hides inline below the header bar. Forcing it into `Sheet` (a modal dialog) would change real behavior (add a backdrop, trap focus, block background scroll) — a regression the spec's User Story 1 explicitly forbids. `Collapsible` (Radix `Collapsible`) is the behaviorally correct match: inline expand/collapse, no overlay. |
| Manual `<div className="w-px h-4" style={{backgroundColor: 'var(--nav-border)'}} />` dividers in `Header.tsx` | shadcn `Separator` | Same visual role, standard primitive instead of a bespoke div |
| `<img>` for the site logo (Header) and team-member photos (`TeamMemberCard`) | shadcn `Avatar` (`AvatarImage` + `AvatarFallback`) | Small, fixed-aspect-ratio images with a natural "missing image" fallback state — exactly `Avatar`'s use case. Vehicle photography (hero images, `VehicleGallery`) explicitly stays plain `<img>` per the spec's Assumptions — shadcn has no gallery/lightbox primitive, and forcing one would be a redesign, not a migration. |
| `<input>`/`<textarea>` + manual `<label>` in `InquiryForm.tsx` | shadcn `Input` (already added, reconcile) + `Label` | Pairs the existing `Input` primitive with shadcn's `Label` for consistent `htmlFor`/focus-ring styling; textarea has no shadcn primitive in this registry snapshot, stays a styled native `<textarea>` (already the case today) |
| Hand-written `button.tsx`/`card.tsx`/`badge.tsx`/`input.tsx` | Reconcile against shadcn v4 registry output | These already exist and are already token-based; diff against genuine shadcn source and adopt shadcn's exact class list/variant structure (`cva` config, `data-slot` attributes) so future shadcn additions integrate cleanly (spec User Story 2) |

## Decision: Strip shadcn's default `dark:` variant classes

**Rationale**: shadcn v4 components are generated assuming a light-default + `dark:` Tailwind variant theme. This project's public site is dark-only (the light/dark toggle was removed in an earlier feature — see `src/app/globals.css`'s "dark-only by design" comment). Every fetched component's `dark:*` Tailwind classes must be dropped, keeping only the base (which resolves against the project's single token set already pointing at dark values). This avoids accidentally introducing a light-mode branch that Tailwind would compile but the project has no toggle for (directly required by spec FR-002 and the Constitution Check above).

**Alternatives considered**: Leaving `dark:` classes in place (harmless since no `.dark` class is ever toggled) — rejected as unnecessary dead code / could mislead a future maintainer into thinking light mode is supported.

## Decision: Rewrite each fetched component's `cn` import to `@/lib/utils`

**Rationale**: The MCP's registry output imports `cn` from a placeholder `"cn"` module path (e.g. `import { cn } from "cn"`) — a convention of the registry format, not a real package. This project already has `cn()` implemented at `src/lib/utils.ts` (used by the four existing primitives). Every new/reconciled primitive file's import is rewritten to `import { cn } from '@/lib/utils'` to match.

**Alternatives considered**: Creating a `cn` package alias — unnecessary indirection for a one-line import fix.

## Decision: No `contracts/` artifact

**Rationale**: Per the Phase 1 process, contracts are skipped when a feature exposes no new API/CLI/external interface. This is a pure internal component swap — nothing outside the React tree observes a "contract" here.
