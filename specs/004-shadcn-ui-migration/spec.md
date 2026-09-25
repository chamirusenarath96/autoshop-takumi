# Feature Specification: shadcn/ui Component Migration

**Feature Branch**: `004-shadcn-ui-migration`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "Replace all UI components on the public site (Home, Vehicles listing, Vehicle detail, About) with shadcn/ui components. Preserve the existing color palette and design tokens already defined in src/app/globals.css (the Takumi design system: --primary #f36f20 orange, dark-only theme, --background/--card/--muted/etc.) — this is a component-library migration, not a redesign. Public site currently has a handful of hand-written components in src/components/ui/ (button.tsx, card.tsx, badge.tsx, input.tsx) built to look shadcn-shaped but not generated via the shadcn CLI/MCP, plus many raw HTML elements (native <select>, <img>, custom dialogs/drawers) across VehicleFilters, VehicleGallery, InquiryForm, Header, Footer, LocaleSwitcher, and the page-level layouts. The goal is to replace these with real shadcn/ui primitives (Select, Dialog/Sheet, Avatar, etc. as appropriate) restyled with the existing color tokens, while preserving all existing behavior, accessibility attributes, data-testids, and test coverage (component tests + e2e including responsive/visual regression suites)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor experience is unchanged (Priority: P1)

A site visitor browsing the public site (home, vehicle listing, vehicle detail, about) sees the same look, colors, and layout as before, and every interactive control (language switcher, theme-consistent filters, mobile filter drawer, image gallery, inquiry form, navigation menu) behaves exactly as it did before the migration.

**Why this priority**: This is a like-for-like component-library swap, not a redesign. Any visible or behavioral regression defeats the purpose of the migration and directly harms real visitors and the business (inquiry submissions, vehicle browsing).

**Independent Test**: Run the existing visual regression suite (`e2e/visual.spec.ts`) and responsive suite (`e2e/responsive.spec.ts`) against the migrated site — all existing baselines and assertions must still pass without modification to their expected values (only implementation-detail selectors may change, never user-visible outcomes).

**Acceptance Scenarios**:

1. **Given** the public homepage rendered before and after migration, **When** compared visually across desktop, tablet, and mobile breakpoints, **Then** there is no unintended visual difference (colors, spacing, typography all match the existing design tokens).
2. **Given** a visitor on the vehicle listing page on a mobile viewport, **When** they open the filter drawer and select a body type, **Then** the drawer opens, the filter applies, and the drawer closes exactly as before.
3. **Given** a visitor on a vehicle detail page, **When** they swipe through the gallery or submit the inquiry form, **Then** both interactions produce the same result as before (image changes, success/error message).
4. **Given** a visitor using a screen reader or keyboard-only navigation, **When** they interact with the mobile nav menu, filter drawer, or any dialog-like control, **Then** focus management and ARIA roles behave at least as well as before the migration (shadcn/Radix primitives provide built-in focus trapping and ARIA wiring the hand-rolled versions did not).

---

### User Story 2 - Maintainers work with a consistent, standard component library (Priority: P2)

A developer extending or fixing the public site works with genuine shadcn/ui components (sourced from the shadcn registry, not hand-written approximations), so behavior, prop names, and styling conventions match shadcn's documentation and any future shadcn component added to the project follows the same patterns already in place.

**Why this priority**: Reduces future maintenance cost and onboarding friction; secondary to not breaking the live site.

**Independent Test**: Every component under `src/components/ui/` can be diffed against the corresponding file the shadcn CLI/MCP would generate, with only token/class-name customizations layered on top (no behavioral divergence).

**Acceptance Scenarios**:

1. **Given** a new shadcn component is needed in the future, **When** a developer runs the shadcn generator, **Then** it integrates without conflicting with existing `src/components/ui/` files or theme setup.

---

### User Story 3 - Native interactive elements gain proper accessibility semantics (Priority: P3)

Elements that were previously native HTML (e.g., the vehicle filter `<select>` dropdowns, the mobile filter drawer built from a plain `<div role="dialog">`) are replaced with shadcn's Radix-based equivalents (Select, Sheet/Dialog), gaining keyboard navigation, focus trapping, and screen-reader announcements out of the box.

**Why this priority**: A real improvement, but not required for the migration to be considered successful — it's a byproduct of using the real components rather than an explicit goal being tested for independently of User Story 1.

**Independent Test**: Run an automated accessibility check (e.g., axe) against the vehicle listing filters and mobile navigation before and after migration; the after state has no new violations and ideally fewer.

**Acceptance Scenarios**:

1. **Given** the vehicle filter drawer is open, **When** a keyboard user presses Tab repeatedly, **Then** focus stays trapped within the drawer until it is closed.
2. **Given** the body-type filter, **When** a screen reader user opens it, **Then** it is announced as a listbox/combobox with selectable options, not just a plain form control.

### Edge Cases

- What happens to existing component tests and e2e tests that assert on specific class names or DOM structure (e.g., `LocaleSwitcher.test.tsx` asserting on `style.backgroundColor`, or e2e tests locating `page.locator('select')`) once the underlying markup changes to Radix-based primitives? These assertions MUST be updated to assert on behavior/role/testid rather than incidental markup, in the same PR.
- What happens to the dark-only theme (no light/dark toggle) when shadcn components are generated with both light and dark variants by default? The generated components MUST be adapted to reference only the existing single (dark) token set — no light-mode branch should be introduced.
- What happens to the mobile filter drawer and mobile nav menu, which currently use bespoke `role="dialog"` implementations with manual open/close state — do they become shadcn `Sheet` components? Yes; their existing `data-testid` values and trigger button accessible names MUST be preserved so existing e2e tests keep working (see FR-006).
- What happens to `<img>` elements used for vehicle photos, gallery images, and the site logo — are they replaced with a shadcn/Radix `Avatar` or left as-is? Only the site logo and team-member photos (small, fixed-aspect avatar-style images) are candidates for `Avatar`; vehicle photography (hero images, galleries) remains plain `<img>`/Next `<Image>`-style usage since shadcn has no "photo gallery" primitive and forcing one would be a redesign, not a migration.
- What happens if a needed shadcn component (e.g., a filter drawer) depends on a Radix package not yet installed in this project? The dependency MUST be added as part of this feature's implementation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The public site's UI primitives (button, card, badge, input, and any newly introduced select/sheet/dialog/avatar/label/separator components) MUST be sourced from the shadcn/ui component registry (via the shadcn CLI or MCP), not hand-written approximations.
- **FR-002**: Every migrated component MUST use the existing color tokens and design system defined in `src/app/globals.css` (the Takumi design system: `--primary`, `--background`, `--card`, `--muted`, `--border`, `--destructive`, `--success`, `--warning`, etc.) — no new colors, gradients, or tokens may be introduced, and the site MUST remain dark-only (no light-mode variant added).
- **FR-003**: The native `<select>` elements in the vehicle filters (sort, make, model, body type, transmission) MUST be replaced with the shadcn `Select` component while preserving the existing filter/URL-param update logic.
- **FR-004**: The mobile filter drawer (`VehicleFilters`) and the mobile navigation panel (`Header`) MUST be replaced with the shadcn `Sheet` (or `Dialog`, whichever the design calls for) component while preserving their existing open/close triggers, `data-testid` attributes, and accessible names used by existing tests.
- **FR-005**: All existing component tests (Vitest) and e2e tests (Playwright: `public.spec.ts`, `responsive.spec.ts`, `visual.spec.ts`, `admin.spec.ts` where relevant) MUST be updated in the same PR so that any assertion coupled to now-obsolete markup/class names is replaced with an equivalent assertion on behavior, ARIA role, or `data-testid` — and the full suite MUST pass.
- **FR-006**: Every `data-testid`, `aria-label`, `aria-expanded`, `role`, and form element `name` attribute that existing tests depend on MUST be preserved on the migrated components (documented in `e2e/helpers.ts` and the relevant spec files) so behavior-level test coverage does not regress.
- **FR-007**: The 44×44px minimum touch-target size on mobile (established by the mobile-responsive-support feature) MUST be preserved on every migrated interactive control.
- **FR-008**: Visual regression baselines (`e2e/visual.spec.ts` snapshots) MUST be regenerated only if a visual difference is intentional and approved; if the migration is successful, most pages should require no baseline changes.
- **FR-009**: New shadcn components MUST be added via the standard shadcn CLI/MCP workflow so `src/components/ui/` remains consistent with future shadcn additions (component files match shadcn's own file structure and export names).
- **FR-010**: The migration MUST NOT change any Payload CMS schema, content-fetching logic, routing, or business logic — this is strictly a presentation-layer / component-library change.

### Key Entities

- **UI primitive component** (`src/components/ui/*.tsx`): A reusable, presentation-only building block (Button, Card, Badge, Input, Select, Sheet, Avatar, Label, Separator, etc.) sourced from shadcn/ui and restyled with the project's existing design tokens.
- **Public-site feature component**: A composed component specific to this app's domain (`VehicleCard`, `VehicleFilters`, `VehicleGallery`, `InquiryForm`, `Header`, `Footer`, `LocaleSwitcher`, `ServiceCard`, `StepItem`, `ValueItem`, `TeamMemberCard`, `FacilityGallery`) that consumes one or more UI primitives.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of interactive form controls and overlay/drawer components on the public site are implemented using shadcn/ui-sourced primitives (verified by code review / diff against shadcn's registry output), with zero remaining hand-written approximations of shadcn components.
- **SC-002**: The full existing automated test suite (component tests, e2e public/responsive/visual/admin suites) passes with zero net-new failures after migration.
- **SC-003**: Zero unintended visual differences are observed across desktop, tablet, and mobile viewports for the homepage, vehicle listing, vehicle detail, and about pages (verified via the visual regression suite).
- **SC-004**: All previously-established accessibility guarantees (44px touch targets, keyboard focus trapping in drawers/menus, ARIA roles on interactive controls) are present after migration, with no new automated accessibility violations introduced.
- **SC-005**: No new color values, fonts, or spacing scales are introduced outside of `src/app/globals.css`'s existing token set (verified by code review — no hardcoded hex/rgb colors added in component files).

## Assumptions

- "All UI components" refers to the public site's presentation layer only (`src/components/ui/`, `src/components/layout/`, `src/components/vehicles/`, `src/components/homepage/`, `src/components/about/`, and the page files under `src/app/(public)/`) — Payload's admin UI (`src/app/(payload)/`) is out of scope, since it uses Payload's own prebuilt stylesheet and component system entirely separately (see CLAUDE.md's "Styling architecture" section).
- Vehicle photography (hero images, gallery images) stays as plain image elements; only small fixed-aspect-ratio images (site logo, team member photos) are candidates for a shadcn `Avatar` component.
- The project does not yet have `components.json` or any Radix packages installed — this feature is responsible for running `shadcn init` (or equivalent MCP flow) and adding whatever Radix dependencies the selected components require.
- The site's existing dark-only theme (no light/dark toggle, removed in an earlier feature) is preserved; shadcn components are generated/adapted to reference only the single existing token set, with no light-mode CSS variables added.
- This is purely a frontend/component-library change; no Payload collection/global schema changes are needed, so no database migration is required for this feature.
