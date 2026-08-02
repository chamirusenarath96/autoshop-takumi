# Quickstart: Validating Mobile and Tablet Responsive Support

## Prerequisites

- `npm install` completed (`.npmrc` sets `legacy-peer-deps=true`, no flag needed)
- `.env` present with `PAYLOAD_SECRET` set (`cp .env.example .env`)
- `npm run seed` run at least once, so `/vehicles` has inventory to render (a make/model/vehicle in `available` status)

## 1. Manual smoke test (fastest feedback loop)

```bash
npm run dev
```

Then, using a browser's device toolbar (Chrome DevTools → Toggle device toolbar, or equivalent):

1. Set viewport to **375×812** (mobile). Visit `/en`, `/en/vehicles`, `/en/vehicles/<any-slug>`, `/en/about`.
   - Confirm no horizontal scrollbar appears on any page.
   - Confirm the header shows a hamburger/menu control instead of the full nav row; tapping it reveals Home/Inventory/About + locale switcher.
   - On `/en/vehicles`, confirm a "Filters" control opens a drawer/sheet (not the full desktop sidebar squeezed into the width); selecting a filter value updates the listing and the drawer closes.
   - On a vehicle detail page, confirm the gallery responds to a touch/trackpad swipe gesture (DevTools' device toolbar supports simulated touch drag) by advancing to the next image.
   - Confirm every inquiry form input/button is comfortably tappable (no visually cramped controls).
2. Repeat at **768×1024** (tablet) — confirm the intermediate layout (e.g. more than one vehicle card per row) and that filters still use the mobile-appropriate pattern per FR-003.
3. Repeat at **1280×800** (desktop) — confirm layout is pixel-for-pixel consistent with pre-feature behavior (sidebar filters visible inline, full nav row, no drawer/hamburger).

## 2. Automated component tests

```bash
npm test
```

Expect new/updated tests covering:
- The mobile nav toggle opens/closes and reveals all nav links (`Header.test.tsx` or `MobileNav.test.tsx`)
- The filter drawer trigger opens/closes (`VehicleFilters.test.tsx`)

## 3. Automated e2e viewport suite

```bash
npm run dev &              # in one terminal, if not already running
npm run test:e2e -- e2e/responsive.spec.ts   # in another terminal, once the server is up
```

Expect `e2e/responsive.spec.ts` to:
- Run against 375px, 768px, and 1280px viewports (see `research.md` §6)
- Assert no horizontal overflow on the landing, vehicle listing, vehicle detail, and about pages at each breakpoint
- Assert the nav collapses/expands correctly below the tablet breakpoint
- Assert the filter drawer opens, applies a filter, and closes on the vehicle listing page
- Assert the gallery advances via a simulated touch swipe on the vehicle detail page
- Log/attach page-load timing for the homepage, vehicle listing, and vehicle detail pages at each viewport (informational — see `research.md` §7; not a hard pass/fail gate)

Run the full suite before opening/updating the implementation PR, per this repo's standard testing rule:

```bash
npm test && npx tsc --noEmit
npm run test:e2e
```

## Expected Outcome

All of the above pass with zero horizontal-overflow findings, a working mobile nav and filter drawer, a touch-responsive gallery, an accessible inquiry form, and unchanged desktop (1280px+) behavior — satisfying spec.md's SC-001 through SC-006.
