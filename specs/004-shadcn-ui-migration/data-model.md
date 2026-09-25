# Phase 1 Data Model: shadcn/ui Component Migration

This feature introduces no data entities (no Payload collections/globals, no database changes — confirmed in Technical Context). In place of a data model, this document specifies the **component contracts**: for each UI primitive and feature component touched, the props/behavior that must be preserved and the exact accessibility attributes existing tests depend on.

## UI Primitives (`src/components/ui/`)

| Component | Source | Key props preserved | Notes |
|---|---|---|---|
| `Button` | shadcn v4 `button`, reconciled | `variant`, `size`, `asChild` | Existing usages pass `variant="default"`/`"outline"`/etc. — verify each call site still resolves to the same visual variant after reconciliation |
| `Card` | shadcn v4 `card`, reconciled | `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` composition | `VehicleCard` already composes these — no prop changes expected |
| `Badge` | shadcn v4 `badge`, reconciled | `variant` (`default`/`secondary`/`destructive`/`outline`) | Used for vehicle status pills — variant-to-status-color mapping must be re-verified against tokens |
| `Input` | shadcn v4 `input`, reconciled | standard `<input>` props pass-through | Used in `InquiryForm` |
| `Select` | shadcn v4 `select` (new) | `value`, `onValueChange`, item list | Replaces native `<select>`; the existing `FilterSelect` wrapper in `VehicleFilters.tsx` keeps its own props (`label`, `value`, `onChange`, `options`, `allLabel`) — only its internal render swaps to `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` |
| `Sheet` | shadcn v4 `sheet` (new) | `open`, `onOpenChange`, `side="right"` | Replaces the modal mobile filter drawer; must render with `SheetContent` `aria-labelledby` pointing at a `SheetTitle` equivalent to the existing `id="filter-drawer-heading"` |
| `Collapsible` | shadcn v4 `collapsible` (new) | `open`, `onOpenChange` | Replaces Header's non-modal mobile nav panel; the panel's `data-testid="mobile-nav-panel"` MUST remain on the rendered `CollapsibleContent` (or a wrapping element with the same testid) |
| `Label` | shadcn v4 `label` (new) | `htmlFor` | Pairs with `Input`/`Select` in `VehicleFilters`/`InquiryForm` |
| `Separator` | shadcn v4 `separator` (new) | `orientation` | Replaces manual divider `<div>`s in `Header` |
| `Avatar` | shadcn v4 `avatar` (new) | `AvatarImage src/alt`, `AvatarFallback` | Site logo and `TeamMemberCard` photos only — never vehicle photography |

## Feature Components — behavior contracts that MUST NOT change

### `Header.tsx`

- Hamburger button: `aria-label` toggles between the existing `t('menu')` / `t('closeMenu')` strings, `aria-expanded` reflects open state — unchanged regardless of Collapsible adoption.
- Mobile panel: `data-testid="mobile-nav-panel"` present exactly when the panel is open (matches current `menuOpen && (...)` conditional rendering pattern, or Collapsible's own open-state rendering — either is acceptable as long as the testid is queryable exactly when open).
- Desktop nav is untouched (`hidden lg:flex`) — Collapsible only affects the `lg:hidden` mobile branch.

### `VehicleFilters.tsx`

- Desktop: inline sidebar filters remain always-visible (`hidden lg:block`), unaffected by the Sheet migration (Sheet only wraps the `lg:hidden` mobile trigger + drawer).
- Mobile trigger button: accessible name `t('openFilters')` ("Filters"), minimum 44×44px tap target (already `min-h-11` — must survive).
- Drawer: opens via trigger click, closes via its own close control (`aria-label={t('closeFilters')}`, "Close filters") — Sheet's built-in close button (an `X` icon with `sr-only` "Close" text) must either be suppressed in favor of the existing custom close button, or the existing tests' assertion on `{ name: 'Close filters' }` must resolve to Sheet's rendered close control. Decision for implementation: keep the existing custom close button/label (`showCloseButton={false}` on `SheetContent`) so the exact existing accessible name is preserved with zero test changes to that assertion.
- Each `FilterSelect` (sort/make/model/bodyType/transmission): `getByLabel(...)` and `.selectOption(...)`-style e2e interactions (see `e2e/responsive.spec.ts`'s `dialog.getByLabel('Body type').selectOption('suv')`) MUST keep working — shadcn `Select` does not support Playwright's native `selectOption()` (it isn't a real `<select>`), so this specific e2e interaction pattern MUST be rewritten to shadcn `Select`'s click-open-then-click-option pattern in the same PR (documented as a required task, not a deferred follow-up).

### `InquiryForm.tsx`

- Field `name` attributes (`name`, `email`, `phone`, `message`) unchanged — the inquiry POST payload and existing e2e form-fill interactions depend on them.
- Tap targets ≥44×44px preserved on the submit button and every field.

### `TeamMemberCard.tsx`

- Falls back gracefully when `photo` is absent (existing behavior: renders an empty muted box) — `AvatarFallback` must reproduce an equivalent visual fallback, not a broken-image icon.

## Test Coupling Inventory (must be updated in the same PR per FR-005/FR-006)

- `src/components/vehicles/__tests__/VehicleFilters.test.tsx` — asserts `role: 'dialog'` and button accessible names; re-verify against Sheet's rendered `role` (Radix Dialog content also exposes `role="dialog"` by default, so this should need no change, but must be verified, not assumed).
- `e2e/responsive.spec.ts` — `dialog.getByLabel('Body type').selectOption('suv')` must be rewritten for shadcn `Select`'s interaction model.
- `e2e/public.spec.ts` — any `page.locator('select')` usage (e.g. the dark-mode background-color check) must be rewritten to target the new `Select` trigger element instead of a native `<select>`.
- `src/components/layout/__tests__/Header.test.tsx` — verify `data-testid="mobile-nav-panel"` and hamburger `aria-expanded`/`aria-label` assertions still pass unmodified against the Collapsible-based implementation.
- `e2e/visual.spec.ts` — regenerate only the specific baselines (if any) that show an unintended pixel diff; do not blanket-regenerate.
