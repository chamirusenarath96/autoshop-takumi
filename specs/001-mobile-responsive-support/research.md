# Research: Mobile and Tablet Responsive Support

## 1. Breakpoint values to standardize on

**Decision**: Adopt Tailwind CSS v4's default breakpoint scale — `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px` — and treat "mobile" as `< md` (below 768px), "tablet" as `md`–`lg` (768–1023px), and "desktop" as `lg`+ (1024px and up), while validating the spec's specific test viewports (375px, 768px, 1280px) against these ranges.

**Rationale**: The project already depends on Tailwind CSS v4 with no custom breakpoint overrides found in `src/app/globals.css` or `tailwind.config` equivalents. Using Tailwind's default scale means no new configuration, keeps utility classes (`md:hidden`, `lg:flex`, etc.) idiomatic, and matches what a future contributor would expect from an unmodified Tailwind v4 project. The spec's illustrative widths (375/768/1280) all fall cleanly within this scale's mobile/tablet/desktop bands.

**Alternatives considered**:
- Custom breakpoint tokens (e.g. `--breakpoint-mobile: 375px`) — rejected as premature abstraction (Constitution Principle VI) for a single feature; nothing in the codebase currently needs breakpoints outside Tailwind's utility classes.
- Bootstrap-style breakpoints (576/768/992/1200) — rejected, not the project's existing CSS framework.

## 2. Mobile nav pattern

**Decision**: Hamburger icon button in the header, toggling a full-width dropdown/overlay panel containing the nav links, locale switcher, and Instagram link — implemented as local component state (`useState`) with conditional rendering, not a new routing state or global store.

**Rationale**: `Header.tsx` today renders `nav`, `LocaleSwitcher`, `ThemeToggle`, and the Instagram link unconditionally in a single flex row — this is what overflows below ~768px. A toggled panel is the simplest fix consistent with existing patterns elsewhere in the header (`ThemeToggle`, `LocaleSwitcher` are already small self-contained client components). No existing drawer/sheet primitive was found under a `src/components/ui/` directory in this project (unlike some `shadcn/ui` starter templates that pre-install one), so Phase 1 tasks should build a minimal one rather than assume a prebuilt import exists.

**Alternatives considered**:
- Bottom tab bar (common on mobile apps) — rejected, inconsistent with existing top-header nav pattern and higher redesign cost than the issue calls for.
- Full-page nav route — rejected, unnecessary routing complexity for 3 links + a locale switcher + theme toggle.

## 3. Mobile filter pattern

**Decision**: A "Filters" trigger button visible at mobile/tablet widths that opens `VehicleFilters` inside a slide-in/bottom-sheet drawer (overlay + close button), while the existing always-visible sidebar rendering is preserved unchanged at desktop (`lg:` and above) via Tailwind responsive classes (e.g. render the sidebar with `hidden lg:block`, and the trigger+drawer with `lg:hidden`).

**Rationale**: Directly matches the spec's explicit steer ("a drawer/sheet") and FR-003/FR-004. `VehicleFilters.tsx` is already a self-contained client component using `useSearchParams`/`router.push` for filter state that lives in the URL, not component state — so the drawer is purely a presentational wrapper around the existing component; filter logic itself needs no changes, which directly satisfies FR-004 (same filtered results regardless of viewport) with minimal risk of behavioral drift.

**Alternatives considered**:
- Native `<dialog>` element — considered for built-in focus-trapping/backdrop, but deferred to implementation-time judgment; a manually-styled overlay `div` with `useState` is simpler and consistent with the rest of the codebase's lack of native-dialog usage today (avoids inconsistent browser support quirks with `<dialog>` inert/backdrop behavior across the tested breakpoints).
- Accordion-style inline filters pushed above the results grid — rejected, doesn't match "drawer/sheet" language in the issue and reflows page content awkwardly compared to an overlay.

## 4. Touch swipe on the vehicle gallery

**Decision**: Add native `onTouchStart`/`onTouchMove`/`onTouchEnd` handlers to `VehicleGallery.tsx`'s main image container, tracking horizontal delta to trigger `setActive(active ± 1)` past a minimum swipe-distance threshold (e.g. 40–50px), clamped to the image array bounds.

**Rationale**: `VehicleGallery.tsx` already holds `active` in `useState` and has `setActive` wired to thumbnail clicks — swipe just needs to call the same setter from touch handlers, no new state model. This avoids pulling in a carousel/slider dependency (Embla, Swiper, etc.) for what's fundamentally a "next/previous based on a single gesture" need, consistent with Constitution Principle VI.

**Alternatives considered**:
- A carousel library (e.g. `embla-carousel-react`, commonly paired with `shadcn/ui`) — rejected as a new dependency for a need this small; revisit only if implementation discovers native handlers are insufficient (e.g. need for momentum/snap physics).
- CSS scroll-snap with a horizontally scrolling image strip — considered viable but rejected in favor of touch handlers because it would change the existing single-large-image-plus-thumbnails visual structure more than necessary, risking a larger unplanned redesign.

## 5. Inquiry form tap targets and zoom-on-focus

**Decision**: Audit and, where needed, adjust `InquiryForm.tsx`'s input/button sizing to guarantee a minimum 44×44px hit area (via Tailwind padding/height utilities) and ensure input `font-size` is at least 16px at mobile widths (iOS Safari auto-zooms on focus for inputs below 16px).

**Rationale**: Directly satisfies FR-005. This is a CSS-only audit-and-fix, not a form logic change — no new dependency, no schema change to `Inquiries` collection.

**Alternatives considered**: None needed — this is a well-established, narrow web platform convention (WCAG 2.5.5 target size guidance; iOS 16px zoom threshold is a known browser behavior), not a design decision requiring exploration.

## 6. Viewport e2e test strategy in Playwright

**Decision**: Add a new `e2e/responsive.spec.ts` that iterates a `VIEWPORTS` array of `{ name: 'mobile', width: 375, height: 812 }`, `{ name: 'tablet', width: 768, height: 1024 }`, `{ name: 'desktop', width: 1280, height: 800 }`, using `test.describe` blocks with `test.use({ viewport: { width, height } })` per breakpoint, rather than adding new `projects` entries to `playwright.config.ts`.

**Rationale**: `playwright.config.ts` currently defines a single `chromium` project with no per-project viewport override, and other specs (`public.spec.ts`, `admin.spec.ts`, `api.spec.ts`) assume the project's default viewport. Adding breakpoint variation via `test.use({ viewport })` inside the new spec file only, rather than new top-level Playwright `projects`, avoids multiplying every existing test's run count by 3 (which would significantly slow CI) and keeps the blast radius of this feature scoped to the new spec file, consistent with FR-008's explicit mention of extending `e2e/public.spec.ts` or adding a dedicated `e2e/responsive.spec.ts`.

**Alternatives considered**:
- Multiple Playwright `projects` (`mobile-chromium`, `tablet-chromium`, `desktop-chromium`) each running the *entire* suite — rejected: correct for "every test at every breakpoint" but overkill here since only nav/filter-drawer/gallery/overflow assertions need multi-breakpoint coverage, not the full existing admin/API suite; would also require rebasing all other spec files' assumptions unnecessarily.
- Playwright's built-in device descriptors (`devices['iPhone 13']`, `devices['iPad Mini']`) — considered for realism (touch emulation, UA string) but the spec's stated widths (375/768/1280) don't map 1:1 to any single built-in device, and explicit `{width, height}` viewport objects keep the three tested sizes exactly matching the spec's stated numbers rather than an approximation. `hasTouch: true` can still be set explicitly alongside a custom viewport for the mobile case to enable touch-event testing (needed for the gallery swipe test).

## 7. Page load timing capture

**Decision**: Use Playwright's `page.evaluate(() => performance.timing)` or the newer Navigation Timing Level 2 API (`performance.getEntriesByType('navigation')`) inside the new e2e spec to capture `domContentLoadedEventEnd`/`loadEventEnd` relative to `startTime` for the homepage, vehicle listing, and vehicle detail pages at each of the three viewports, and `console.log`/attach the values to the Playwright test report (e.g. via `testInfo.attach`) rather than asserting a strict pass/fail threshold.

**Rationale**: Matches FR-009/SC-006 ("informational, not gating" — see spec Assumptions) and avoids CI flakiness tied to runner performance variance, while still giving visibility via Playwright's HTML report (already configured in `playwright.config.ts`'s `reporter` array). A loose sanity-check upper bound assertion (e.g. "under 30s, catches a true hang/regression") is reasonable to keep as a smoke-test floor without being a meaningful performance gate.

**Alternatives considered**:
- Lighthouse CI — rejected as a new dependency/tooling addition disproportionate to this feature's scope; a good candidate for separate future work if the team wants a real performance budget (noted as a possible follow-up in spec.md's Assumptions).
- Strict pass/fail thresholds per page — rejected per spec Assumptions (CI runner variance risk).

## Outcome

All Technical Context unknowns are resolved; no `[NEEDS CLARIFICATION]` markers remain. Ready for Phase 1 design.
