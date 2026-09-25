# Quickstart: Validating the shadcn/ui Component Migration

## Prerequisites

- `npm install` completed, including the new `radix-ui` dependency added by this feature
- Local dev server running: `npm run dev`
- Local SQLite seeded: `npm run seed` (so the vehicle listing/detail/about pages have real content to render)

## 1. Component tests

```bash
npm test
```

**Expected outcome**: All existing component test files pass, including `VehicleFilters.test.tsx`, `VehicleCard.test.tsx`, `Header.test.tsx`, `Footer.test.tsx`, `LocaleSwitcher.test.tsx`, `FacilityGallery.test.tsx`. Zero new failures. Any assertion changed to match the new markup must still assert the same *behavior* (role, accessible name, testid) as before.

## 2. Type check

```bash
npx tsc --noEmit
```

**Expected outcome**: Clean — no type errors from the new Radix-based prop shapes.

## 3. Manual visual spot-check (dev server)

Open each of the following in the Browser pane and compare against the pre-migration screenshots (or your own memory of the current site) at desktop (1280px), tablet (768px), and mobile (375px):

- `/en` and `/ja` — homepage
- `/en/vehicles` — listing page: open the mobile filter drawer (< 1024px viewport), select a body type, confirm it filters and the drawer closes
- `/en/vehicles/[any-seeded-slug]` — detail page: confirm gallery, inquiry form, and status badge still render with correct colors
- `/en/about` — confirm team member photos (now `Avatar`) render, and gracefully fall back for any member with no photo

**Expected outcome**: Pixel-identical (or intentionally-approved-different) appearance; every color still resolves to the existing `--primary`/`--background`/`--card`/etc. tokens — verify by inspecting computed styles, not just eyeballing.

## 4. e2e suites

```bash
npm run test:e2e
```

Runs `admin.spec.ts`, `api.spec.ts`, `public.spec.ts`, `responsive.spec.ts` against a fresh local DB (dev server must already be running per CLAUDE.md's local dev instructions).

**Expected outcome**: All pass. Specifically confirm:
- `responsive.spec.ts`'s three `test.describe` blocks (mobile/tablet/desktop) — the filter-drawer-open/select/close flow and the mobile-nav-menu-open/navigate flow both still pass with their rewritten Select/Collapsible-aware interactions.
- `public.spec.ts`'s dark-mode select background-color check passes against the new `Select` trigger element.

## 5. Visual regression suite (optional locally, mandatory in CI)

```bash
npm run test:e2e:visual   # or whatever script name playwright.visual.config.ts is wired to — see package.json
```

**Expected outcome**: No unexpected baseline diffs. If a diff is found and it's a genuine, approved visual change (there should be none for this feature), regenerate only that specific baseline via the `update-visual-baselines` GitHub Actions workflow — never blanket-regenerate.

## 6. Accessibility spot-check (User Story 3, best-effort)

With the mobile filter drawer open, tab through its contents with the keyboard only — focus should stay inside the drawer (Radix `Dialog`'s built-in focus trap) until closed. This is a manual smoke check, not a new automated gate, per the spec's Assumptions.
