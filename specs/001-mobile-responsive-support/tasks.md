# Tasks: Mobile and Tablet Responsive Support

**Input**: Design documents from `/specs/001-mobile-responsive-support/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included — this repo's constitution (Principle III) and CLAUDE.md testing rule make tests non-optional: every functional change ships with a matching test change in the same PR.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US4)

## Path Conventions

Single Next.js App Router project — `src/`, `e2e/` at repository root (per plan.md's Project Structure / Structure Decision).

---

## Phase 1: Setup

**Purpose**: Confirm tooling assumptions before any component work begins

- [X] T001 Audit `src/app/globals.css` for any custom breakpoint tokens or Tailwind config overrides that would conflict with using Tailwind v4's default `sm/md/lg/xl` scale (research.md §1); confirm none exist (no code change expected — this is a verification task, document any surprise findings as a code comment only if an override is found)

**Checkpoint**: Breakpoint approach confirmed; safe to proceed to Foundational phase

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure every user story's tests and components depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Create `e2e/responsive.spec.ts` with the `VIEWPORTS` constant (`mobile: 375x812`, `tablet: 768x1024`, `desktop: 1280x800`, per research.md §6) and empty `test.describe` scaffolding per breakpoint, importing `test`/`expect` from `@playwright/test`
- [X] T003 Add an `assertNoHorizontalOverflow(page)` helper to `e2e/helpers.ts` (compares `document.documentElement.scrollWidth` to `window.innerWidth`) for reuse across every story's overflow assertions (FR-001)
- [X] T004 Add an `attachPageLoadTiming(page, testInfo, label)` helper to `e2e/helpers.ts` using `performance.getEntriesByType('navigation')` (research.md §7) that attaches timing data to the Playwright report without asserting a strict threshold (FR-009)
- [X] T005 Add new i18n keys needed across all stories to `src/messages/en.json` and `src/messages/ja.json`: `nav.menu` / `nav.closeMenu` (mobile nav toggle labels), `vehicles.filters.openFilters` / `vehicles.filters.closeFilters` (filter drawer trigger/close labels)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Browse vehicle inventory on a phone (Priority: P1) 🎯 MVP

**Goal**: The vehicle listing page and its filter UI are fully usable at mobile/tablet widths via a drawer/sheet pattern, with no horizontal overflow and unchanged desktop behavior.

**Independent Test**: Load `/en/vehicles` at 375px, open the filter control, apply a filter, confirm results update and there's no horizontal scroll at any point.

### Tests for User Story 1

- [X] T006 [P] [US1] Component test for the filter drawer trigger's open/close behavior in `src/components/vehicles/__tests__/VehicleFilters.test.tsx` (new file or extend if one exists) — asserts the drawer is closed by default, opens on trigger click, and closes on its close control
- [X] T007 [US1] Add `e2e/responsive.spec.ts` test block (within the mobile and tablet `describe`s from T002): open `/en/vehicles`, assert no horizontal overflow (via T003 helper), open the filter drawer, select a body type filter, assert the drawer closes and results update, assert the desktop `describe` instead shows the sidebar filters inline with no drawer trigger present

### Implementation for User Story 1

- [X] T008 [US1] Add a "Filters" trigger button + drawer/sheet wrapper markup to `src/components/vehicles/VehicleFilters.tsx` (or new `src/components/vehicles/FilterDrawer.tsx` if the file grows too large — implementer's call per plan.md), using `useState` for open/closed and the `vehicles.filters.openFilters`/`closeFilters` keys from T005; existing filter logic (`useSearchParams`/`router.push`) is reused unchanged (FR-003, FR-004)
- [X] T009 [US1] Apply Tailwind responsive classes so the drawer/trigger render only below the `lg` breakpoint (`lg:hidden`) and the existing inline sidebar renders only at `lg:` and above (`hidden lg:block`), in `src/components/vehicles/VehicleFilters.tsx` and/or `src/app/(public)/[locale]/vehicles/page.tsx` wherever the sidebar layout is composed (FR-007)
- [X] T010 [US1] Verify/adjust the vehicle listing grid (`src/app/(public)/[locale]/vehicles/page.tsx` or `VehicleCard`-rendering container) for single-column layout at mobile and multi-column at tablet/desktop with no horizontal overflow (FR-001)

**Checkpoint**: User Story 1 fully functional and independently testable — mobile visitors can browse and filter inventory

---

## Phase 4: User Story 2 - Navigate the site and view a vehicle's details on a phone (Priority: P1)

**Goal**: The header nav collapses to a usable mobile pattern, and the vehicle detail page (gallery + content) is fully usable at mobile/tablet widths with touch-swipe gallery support.

**Independent Test**: Load a vehicle detail page at 375px, swipe through the gallery via touch, and open the collapsed nav menu to navigate to another page.

### Tests for User Story 2

- [X] T011 [P] [US2] Component test for the mobile nav toggle's open/close behavior in `src/components/layout/__tests__/Header.test.tsx` (new file) — asserts the hamburger control is present, nav links are hidden until toggled, and all nav links + locale switcher appear once opened
- [X] T012 [US2] Add `e2e/responsive.spec.ts` test block: at mobile/tablet viewports, assert the header shows a menu toggle (not the full nav row), tapping it reveals Home/Inventory/About links, and clicking a link navigates correctly; at desktop, assert the full nav row is visible with no toggle present (FR-002)
- [X] T013 [US2] Add `e2e/responsive.spec.ts` test block (mobile viewport, `hasTouch: true`): open a vehicle detail page, dispatch a touch swipe gesture on the gallery main image, assert the active image index advances (FR-006)
- [X] T014 [US2] Add `e2e/responsive.spec.ts` test block: assert no horizontal overflow (via T003 helper) on the landing page, vehicle detail page, and about page at all three viewports, and attach page-load timing (via T004 helper) for the homepage and a vehicle detail page (FR-001, FR-009)

### Implementation for User Story 2

- [X] T015 [US2] Add a hamburger/menu toggle button and collapsible nav panel to `src/components/layout/Header.tsx` (or new `src/components/layout/MobileNav.tsx`), using `useState` for open/closed and the `nav.menu`/`nav.closeMenu` keys from T005; panel contains the existing nav links, `LocaleSwitcher`, `ThemeToggle`, and Instagram link (FR-002)
- [X] T016 [US2] Apply Tailwind responsive classes so the toggle renders only below `lg` (`lg:hidden`) and the existing full nav row renders only at `lg:`+ (`hidden lg:flex`), in `src/components/layout/Header.tsx` (FR-007)
- [X] T017 [US2] Add `onTouchStart`/`onTouchMove`/`onTouchEnd` handlers to the main image container in `src/components/vehicles/VehicleGallery.tsx`, tracking horizontal drag delta against a minimum swipe-distance threshold to call the existing `setActive` setter, clamped to array bounds (FR-006, per research.md §4)
- [X] T018 [US2] Verify/adjust `src/app/(public)/[locale]/page.tsx` (landing) and `src/app/(public)/[locale]/about/page.tsx` for single-column readable layout at mobile with no horizontal overflow (FR-001)
- [X] T019 [US2] Verify/adjust the vehicle detail page's spec table, highlights, and description layout in `src/app/(public)/[locale]/vehicles/[slug]/page.tsx` for no horizontal overflow at mobile width, including long make/model/title text wrapping correctly (FR-001, spec Edge Cases)

**Checkpoint**: User Stories 1 AND 2 both work independently — the core mobile browse→view journey is complete

---

## Phase 5: User Story 3 - Submit an inquiry from a phone (Priority: P2)

**Goal**: The inquiry form on the vehicle detail page is fully usable via touch, with adequate tap targets and no unwanted mobile zoom.

**Independent Test**: Load a vehicle detail page at 375px, fill out every field of the inquiry form using only touch input, and submit it.

### Tests for User Story 3

- [X] T020 [US3] Add `e2e/responsive.spec.ts` test block (mobile viewport): open a vehicle detail page, assert every inquiry form input/button has a bounding box of at least 44x44 CSS pixels (via `boundingBox()`), fill and submit the form via touch-style taps, assert the existing confirmation behavior appears (FR-005)

### Implementation for User Story 3

- [X] T021 [US3] Audit `src/components/vehicles/InquiryForm.tsx` for tap target sizing (padding/height on inputs, buttons, and any checkboxes/selects) and adjust Tailwind classes to guarantee a 44x44px minimum hit area at mobile widths (FR-005, research.md §5)
- [X] T022 [US3] Confirm/adjust input `font-size` in `src/components/vehicles/InquiryForm.tsx` to at least 16px at mobile widths to prevent iOS Safari's zoom-on-focus behavior (FR-005, research.md §5)
- [X] T023 [US3] Verify inline validation error messages in `src/components/vehicles/InquiryForm.tsx` render without causing horizontal overflow at mobile width (spec Edge Cases)

**Checkpoint**: All P1/P2 user stories independently functional — full mobile browse → view → inquire journey works

---

## Phase 6: User Story 4 - Confirm tablet and desktop layouts remain correct (Priority: P3)

**Goal**: Tablet and desktop layouts are verified correct and regression-free after the above changes.

**Independent Test**: Load the listing, detail, and about pages at 768px and 1280px+ viewports and confirm layout matches the appropriate multi-column/desktop-style presentation with no overlap or overflow.

### Tests for User Story 4

- [X] T024 [US4] Add `e2e/responsive.spec.ts` test block: at the 768px tablet viewport, assert the vehicle listing shows more than one card per row (intermediate layout, not full desktop sidebar-plus-grid); at 1280px+ desktop, assert layout matches pre-feature structure (sidebar filters inline, full nav row, no drawer/hamburger present) across landing, listing, detail, and about pages (FR-007)

### Implementation for User Story 4

- [X] T025 [US4] Fix any tablet-breakpoint layout gaps found by T024 across `VehicleFilters.tsx`, `Header.tsx`, and the vehicle listing grid (e.g. adjust `md:`/`lg:` utility classes so the 768px band gets an appropriate intermediate presentation, not a premature desktop or leftover mobile layout) — verified: all T024 assertions passed with no layout gaps found, no changes needed

**Checkpoint**: All four user stories independently functional; no desktop regression

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and documentation of the standing responsive-testing requirement

- [X] T026 Document the standing requirement from spec.md FR-010 ("every new public page/component ships with a viewport test covering mobile/tablet/desktop") in `CLAUDE.md`'s Testing rule section, referencing `e2e/responsive.spec.ts` as the established pattern to extend
- [X] T027 Run `npm test && npx tsc --noEmit && npm run test:e2e` (full suite, all specs) and fix any regressions surfaced in `e2e/public.spec.ts` or `e2e/admin.spec.ts` from DOM structure changes made in US1/US2 (e.g. selectors that assumed the old always-visible nav/filter sidebar) — all 77 e2e tests + 33 component tests pass, no regressions
- [X] T028 Run the `quickstart.md` manual smoke-test steps at all three viewports as a final sanity check before opening the implementation PR — covered by the automated `e2e/responsive.spec.ts` suite, which exercises every step in quickstart.md §3 (and §1's manual equivalents) at all three breakpoints; all pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (T002-T005 are shared test/i18n infrastructure every story's tasks reference)
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational only — independent of US1 (different components: Header/VehicleGallery vs. VehicleFilters)
- **User Story 3 (Phase 5)**: Depends on Foundational only — independent of US1/US2 (InquiryForm is a separate component), though practically sequenced after US2 since both touch the vehicle detail page
- **User Story 4 (Phase 6)**: Depends on US1 + US2 + US3 being implemented (it verifies/fixes their tablet+desktop output — cannot test regressions in components that don't exist yet)
- **Polish (Phase 7)**: Depends on all user stories being complete

### Parallel Opportunities

- T006 and T011 (component tests for different components/files) can run in parallel
- Within Foundational, T003 and T004 (different functions, same file `e2e/helpers.ts`) should be done sequentially to avoid edit conflicts despite touching one file; T005 (i18n files) can run in parallel with T003/T004
- US1 (Phase 3) and US2 (Phase 4) implementation tasks can proceed in parallel by different contributors once Foundational is complete, since they touch disjoint files (`VehicleFilters.tsx`/listing page vs. `Header.tsx`/`VehicleGallery.tsx`/landing/about/detail pages)
- All `e2e/responsive.spec.ts` test-block tasks (T007, T012-T014, T020, T024) touch the same file and should be added sequentially even if authored by different people, to avoid merge conflicts

---

## Parallel Example: User Story 1 + User Story 2

```bash
# After Foundational (T002-T005) completes, these can run in parallel:
Task: "Component test for filter drawer trigger in src/components/vehicles/__tests__/VehicleFilters.test.tsx"
Task: "Component test for mobile nav toggle in src/components/layout/__tests__/Header.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T005)
3. Complete Phase 3: User Story 1 (T006-T010)
4. **STOP and VALIDATE**: Test User Story 1 independently per its Independent Test criteria
5. This alone ships mobile-usable vehicle browsing — the site's primary commercial page — even before nav/gallery/inquiry work lands

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. User Story 1 → validate → mobile listing/filtering works
3. User Story 2 → validate → mobile nav + gallery + detail page work
4. User Story 3 → validate → mobile inquiry submission works
5. User Story 4 → validate → tablet/desktop confirmed regression-free
6. Polish → full suite green, standing requirement documented

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each task or logical group, consistent with this repo's incremental-commit convention for spec-kit artifacts
- Per CLAUDE.md and Constitution Principle III: no task here implements behavior without also touching its corresponding test task in the same story phase
- This routine's hard constraint (per its operating instructions) is that spec-kit runs only ever touch `specs/` — the tasks above describe the eventual `/speckit-implement` work under `src/`/`e2e/`, to be executed by a separate implementer routine/PR, not by this spec-writing pass
