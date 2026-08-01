# Feature Specification: Mobile and Tablet Responsive Support

**Feature Branch**: `docs/spec-mobile-responsive-support`

**Created**: 2026-08-01

**Status**: Draft

**Input**: User description: "Add full mobile and tablet responsive support across the entire public-facing site of Autoshop Takumi ... landing page, vehicle inventory listing with filters, vehicle detail with image gallery and inquiry form, and About page, plus the shared Header/Footer/nav ... must work correctly at mobile (~375px), tablet (~768px), and desktop (~1280px+) breakpoints ... header/nav must collapse to a usable mobile pattern ... vehicle filter UI needs a mobile-appropriate pattern such as a drawer/sheet ... inquiry form must be usable on small screens ... image galleries/carousels must support touch gestures (swipe) ... no horizontal overflow and no unusable tap targets at all three breakpoints ... add Playwright e2e coverage asserting layout/visibility at the three breakpoints ... add a way to measure and report page load time ... responsive support becomes a standing requirement for every future page or component. This spec addresses GitHub issue #5."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse vehicle inventory on a phone (Priority: P1)

A prospective buyer visits the site on their phone while out and about, opens the vehicle listing page, and wants to narrow down inventory by make, body type, or price without the page becoming unusable or requiring pinch-zooming and sideways scrolling.

**Why this priority**: The vehicle listing is the core commercial page of the site (inventory browsing is the primary conversion path), and mobile traffic is typically the majority of visits to a local dealership site. If this page doesn't work on mobile, the site fails its main purpose for most visitors.

**Independent Test**: Load `/[locale]/vehicles` at a 375px-wide viewport, open the filter control, apply a filter (e.g. body type), confirm the results update and the page has no horizontal scroll at any point in the interaction.

**Acceptance Scenarios**:

1. **Given** a visitor on a 375px-wide phone viewport, **When** they open `/[locale]/vehicles`, **Then** the page renders with no horizontal overflow and vehicle cards are laid out in a single readable column.
2. **Given** the vehicle listing on a phone viewport, **When** the visitor taps the filter control, **Then** filter options open in a mobile-appropriate pattern (e.g. a drawer/sheet) that doesn't require horizontal scrolling or squeeze the desktop sidebar into an unusable width.
3. **Given** the filter drawer is open, **When** the visitor selects a filter value and applies it, **Then** the drawer closes (or otherwise returns focus to the results) and the listing updates to match, consistent with desktop filtering behavior.

---

### User Story 2 - Navigate the site and view a vehicle's details on a phone (Priority: P1)

A visitor on a phone taps into a specific vehicle from the listing, swipes through its photo gallery, reads the specs, and uses the header navigation to move between site sections (Home / Inventory / About), all without misaligned layout or content cut off the edge of the screen.

**Why this priority**: Navigation and the vehicle detail page are the second half of the core browsing journey (browse → view detail); an unusable nav or a broken gallery on mobile blocks visitors from completing the journey the P1 listing page started.

**Independent Test**: Load a vehicle detail page at a 375px-wide viewport, swipe through the gallery images with touch gestures, and open the collapsed nav menu to navigate to another page.

**Acceptance Scenarios**:

1. **Given** a visitor on a phone viewport, **When** they view any public page, **Then** the header nav is collapsed into a usable mobile pattern (e.g. a hamburger menu) that expands to reveal all nav links (Home / Inventory / About) and the locale switcher without overlapping content or causing horizontal overflow.
2. **Given** a vehicle detail page open on a phone viewport, **When** the visitor swipes left/right on the gallery image, **Then** the gallery advances to the next/previous image via touch gesture, not just via mouse-driven controls.
3. **Given** a vehicle detail page open on a phone viewport, **When** the visitor scrolls through specs, highlights, and description, **Then** all content is readable in a single column with no horizontal scroll and no text or table overflowing the viewport width.

---

### User Story 3 - Submit an inquiry from a phone (Priority: P2)

A visitor interested in a specific vehicle fills out and submits the inquiry form on their phone.

**Why this priority**: This is the site's primary lead-generation action, but it depends on User Story 2 (reaching the vehicle detail page) first, and typically has lower traffic volume than browsing, so it's ranked below the core browse/view journeys.

**Independent Test**: Load a vehicle detail page at a 375px-wide viewport, fill out every field of the inquiry form using only touch input, and submit it.

**Acceptance Scenarios**:

1. **Given** the inquiry form on a phone viewport, **When** the visitor taps into each input field, **Then** every field is large enough to tap accurately (no overlapping or sub-44px tap targets) and does not trigger unwanted browser zoom.
2. **Given** the inquiry form on a phone viewport, **When** the visitor fills in all required fields and taps submit, **Then** the form submits successfully and shows the same confirmation behavior as on desktop.
3. **Given** the inquiry form on a tablet viewport (~768px), **When** the visitor interacts with the form, **Then** the layout adapts appropriately (e.g. does not remain squeezed into a single narrow desktop-width column with excess whitespace, and does not break into the mobile drawer pattern unnecessarily).

---

### User Story 4 - Confirm tablet and desktop layouts remain correct (Priority: P3)

A visitor on a tablet (~768px) or desktop (~1280px+) browses the same pages, and the layout takes appropriate advantage of the extra width (e.g. multi-column vehicle grid, visible filter sidebar on desktop) without regressing from current desktop behavior.

**Why this priority**: Desktop behavior already mostly works today; this story is about verifying no regression and about the tablet breakpoint specifically, which is a narrower slice than the mobile-first stories above.

**Independent Test**: Load the listing, detail, and about pages at 768px and 1280px+ viewports and confirm layout matches the appropriate multi-column/desktop-style presentation with no overlap or overflow.

**Acceptance Scenarios**:

1. **Given** a visitor at a 768px tablet viewport, **When** they load the vehicle listing, **Then** the layout uses an intermediate presentation appropriate to the available width (e.g. more than one card per row, but not necessarily the full desktop sidebar-plus-grid layout).
2. **Given** a visitor at a 1280px+ desktop viewport, **When** they load any public page, **Then** the layout is unchanged from current desktop behavior (no regression introduced by the responsive work).

---

### Edge Cases

- What happens when the visitor rotates their phone from portrait to landscape mid-session (e.g. while the filter drawer or nav menu is open)? The open UI element must remain usable and not become clipped or misaligned.
- How does the vehicle gallery behave when there is only one image (no swipe target) versus many images (need clear indication more content exists via swipe)?
- How does the mobile filter drawer behave when no filters are currently applied versus when several are applied (visibility of "reset"/active filter count)?
- How does the layout handle a vehicle title, spec label, or make/model name long enough to otherwise overflow a narrow (375px) column?
- What happens to the inquiry form's validation error messages on a small viewport — do they still appear inline near their field without pushing layout into overflow?
- How is page load time measured/reported when a test runs in CI versus locally, given CI runners can have different performance characteristics than a developer machine? (Reporting should be informational/logged, not a hard pass/fail gate, to avoid CI flakiness tied to runner variance.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The public site (landing, vehicle listing, vehicle detail, about, and shared header/footer) MUST render with no horizontal overflow (no sideways page scroll) at mobile (~375px), tablet (~768px), and desktop (~1280px+) viewport widths.
- **FR-002**: The header navigation MUST collapse to a mobile-appropriate pattern (e.g. a hamburger/menu toggle) below the tablet breakpoint, and MUST expand on demand to reveal all nav links and the locale switcher.
- **FR-003**: The vehicle listing's filter UI MUST present as a mobile-appropriate pattern (e.g. a drawer/sheet triggered by a control) at mobile and tablet widths, distinct from the desktop sidebar layout, rather than a shrunk version of the desktop sidebar.
- **FR-004**: The vehicle listing filter interaction (open, select a value, apply, reset) MUST produce the same filtered results as the existing desktop filtering behavior, regardless of viewport.
- **FR-005**: The inquiry form on the vehicle detail page MUST be fully usable at mobile widths: every input/button MUST have a tap target of at least 44x44 CSS pixels, and inputs MUST NOT trigger unwanted mobile browser zoom-on-focus.
- **FR-006**: The vehicle detail page's image gallery MUST support touch swipe gestures to move between images, in addition to any existing mouse-driven controls.
- **FR-007**: All public pages MUST remain visually correct and regression-free at the existing ~1280px+ desktop breakpoint after this work — the responsive changes MUST NOT alter current desktop layout behavior.
- **FR-008**: Every new e2e test added for this feature MUST run against all three target breakpoints (~375px mobile, ~768px tablet, ~1280px+ desktop) using Playwright's viewport/device emulation, covering at minimum: nav collapse/expand, filter drawer open/apply/close, and absence of horizontal overflow on each of the landing, listing, detail, and about pages.
- **FR-009**: The test suite MUST include a way to capture and report page load timing (e.g. navigation timing) for the homepage, vehicle listing, and vehicle detail pages across the tested viewport sizes, for visibility into mobile load performance. This reporting is informational (logged/asserted against a generous upper bound) rather than a strict performance gate, since CI runner performance varies (see Edge Cases).
- **FR-010**: Going forward, any new public page or component added to this project MUST ship with a viewport test covering the three breakpoints in the same PR — this is a standing project requirement from this feature onward, not a one-time cleanup, and should be documented as such (e.g. in the project's contribution/testing guidance) so future spec/implementation work knows to follow it.

### Key Entities

This feature is UI/layout/behavior-focused and does not introduce or modify any Payload CMS collections, globals, or other data entities.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of public pages (landing, vehicle listing, vehicle detail, about) render with zero horizontal scroll at mobile (375px), tablet (768px), and desktop (1280px+) viewport widths, verified by automated test.
- **SC-002**: A visitor on a mobile viewport can go from landing on the vehicle listing page to viewing a filtered result set using only the mobile filter pattern, in the same number of logical steps as the desktop filter flow (open filters, choose a value, see updated results).
- **SC-003**: A visitor on a mobile viewport can navigate to any of the site's main sections (Home / Inventory / About) within two taps (open menu, tap link) from any public page.
- **SC-004**: A visitor on a mobile viewport can complete and submit the inquiry form using only touch input, with no mis-tap-inducing control smaller than the standard 44x44px minimum tap target.
- **SC-005**: 100% of new automated tests added for this feature pass across all three tested breakpoints in CI.
- **SC-006**: Page load timing for the homepage, vehicle listing, and vehicle detail pages is captured and visible in test output/reports for every tested viewport size, giving the team ongoing visibility into mobile performance trends.

## Assumptions

- **Breakpoint definitions**: "Mobile" = ~375px viewport width, "tablet" = ~768px, "desktop" = ~1280px+, matching the values given in the issue and matching Playwright's commonly used device presets (e.g. iPhone-class widths ≈375px, iPad-class widths ≈768px). No project-specific breakpoint tokens exist yet in `globals.css`/Tailwind config, so this feature is expected to introduce/standardize on Tailwind's default `sm`/`md`/`lg` breakpoint scale (640/768/1024px) or equivalent, unless implementation planning finds an existing convention to follow instead.
- **Mobile filter pattern**: A drawer/sheet triggered by a visible "Filters" control is assumed to be the mobile pattern (as suggested directly in the issue text), rather than e.g. a separate full-page filter route. This is a UI-pattern choice left to implementation planning as long as it meets FR-003/FR-004.
- **Performance measurement is informational, not a hard gate**: Given CI runner performance can vary independently of the app, the load-time reporting requirement (FR-009/SC-006) is treated as "measure and report" rather than "enforce a strict SLA that fails CI," to avoid flaky, environment-dependent test failures. If the team later wants a hard performance budget, that would be reasonable follow-up scope, not part of this feature.
- **Scope boundary — Payload admin excluded**: Per the issue's explicit "out of scope" note, `/admin` (Payload's auto-generated admin UI) is not covered by this feature; the project does not maintain custom responsive CSS for it.
- **No new content/data model changes**: This is a layout/interaction/testing feature only; no Payload collection or global schema changes are anticipated (see Key Entities).
- **Existing component reuse**: Where the codebase's `shadcn/ui` component library already includes accessible drawer/sheet and mobile-nav-friendly primitives, implementation planning is expected to prefer those over building new bespoke components, consistent with the project's Simplicity Over Premature Abstraction principle.
