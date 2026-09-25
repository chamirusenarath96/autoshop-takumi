# Tasks: shadcn/ui Component Migration

**Input**: Design documents from `/specs/004-shadcn-ui-migration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Required — this repo's constitution (Principle III, NON-NEGOTIABLE) and CLAUDE.md's testing rule mandate a test change in the same PR as any behavior-affecting code change. Since this feature is a refactor (preserve existing behavior, not add new behavior), test tasks are placed immediately alongside the implementation task they cover rather than "written first to fail" — there is no new behavior to fail against, only existing behavior to keep passing against changed markup.

**Organization**: Tasks are grouped by user story from `spec.md` (US1 = P1 visitor-experience-unchanged, US2 = P2 maintainer-consistency, US3 = P3 accessibility).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- All file paths are relative to the repository root

---

## Phase 1: Setup

**Purpose**: Add the one new dependency and fetch every new shadcn primitive this feature needs, before any existing component is touched.

- [X] T001 Add `radix-ui` (the unified Radix package) to `package.json` dependencies and run `npm install`
- [X] T002 [P] Fetch shadcn v4 `select` via the Shadcn_UI MCP, rewrite its `cn` import to `@/lib/utils`, strip any `dark:` variant classes, and save as `src/components/ui/select.tsx`
- [X] T003 [P] Fetch shadcn v4 `sheet` via the Shadcn_UI MCP, rewrite its `cn` import to `@/lib/utils`, strip any `dark:` variant classes, and save as `src/components/ui/sheet.tsx`
- [X] T004 [P] Fetch shadcn v4 `collapsible` via the Shadcn_UI MCP and save as `src/components/ui/collapsible.tsx` (no styling to adapt — this primitive ships unstyled)
- [X] T005 [P] Fetch shadcn v4 `label` via the Shadcn_UI MCP, rewrite its `cn` import to `@/lib/utils`, and save as `src/components/ui/label.tsx`
- [X] T006 [P] Fetch shadcn v4 `separator` via the Shadcn_UI MCP, rewrite its `cn` import to `@/lib/utils`, strip any `dark:` variant classes, and save as `src/components/ui/separator.tsx`
- [X] T007 [P] Fetch shadcn v4 `avatar` via the Shadcn_UI MCP, rewrite its `cn` import to `@/lib/utils`, strip any `dark:` variant classes, and save as `src/components/ui/avatar.tsx`

**Checkpoint**: `npx tsc --noEmit` passes with the six new unused-but-present primitive files (no consumer wired up yet).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reconcile the four *existing* hand-written primitives against genuine shadcn v4 output before any feature component (which already consumes them) is touched — this must land first so `VehicleCard`, `InquiryForm`, etc. don't break mid-migration.

**⚠️ CRITICAL**: No User Story task may begin until this phase's checkpoint passes.

- [ ] T008 [P] Reconcile `src/components/ui/button.tsx` against shadcn v4 `button` registry output (adopt shadcn's exact `cva` variant/size config and `data-slot="button"` attribute; keep the project's existing token-based class values, e.g. `bg-primary text-primary-foreground`)
- [ ] T009 [P] Reconcile `src/components/ui/card.tsx` against shadcn v4 `card` registry output (adopt `data-slot` attributes on `Card`/`CardHeader`/`CardTitle`/`CardContent`/`CardFooter`)
- [ ] T010 [P] Reconcile `src/components/ui/badge.tsx` against shadcn v4 `badge` registry output — preserve the existing `success`/`warning` custom variants used for vehicle status pills (not present in shadcn's default variant set, must be added back on top of the reconciled base)
- [ ] T011 [P] Reconcile `src/components/ui/input.tsx` against shadcn v4 `input` registry output
- [ ] T012 Run `npm test && npx tsc --noEmit` to confirm the reconciled primitives haven't changed any existing consumer's rendered output or types (checkpoint — depends on T008-T011)

**Checkpoint**: Foundation ready — all four existing primitives now match genuine shadcn v4 source, all six new primitives exist unconsumed, full test suite still green.

---

## Phase 3: User Story 1 - Visitor experience is unchanged (Priority: P1) 🎯 MVP

**Goal**: Every native-HTML or hand-rolled interactive element on the public site is replaced by the shadcn primitive from Phase 1/2, with zero behavioral or visual regression.

**Independent Test**: Run `e2e/responsive.spec.ts` and `e2e/visual.spec.ts` end-to-end after this phase — all existing assertions (rewritten only where the interaction *mechanism* changed, e.g. `selectOption()` → click-based) must pass, and no unintended visual diff appears.

### Implementation for User Story 1

- [ ] T013 [US1] Replace the native `<select>` inside `FilterSelect` (in `src/components/vehicles/VehicleFilters.tsx`) with shadcn `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`, keeping `FilterSelect`'s existing external props (`label`, `value`, `onChange`, `options`, `allLabel`) unchanged
- [ ] T014 [US1] Replace the mobile filter drawer's `<div role="dialog" aria-modal="true">` (same file, `src/components/vehicles/VehicleFilters.tsx`) with `Sheet`/`SheetContent` (`side="right"`, `showCloseButton={false}` to preserve the existing custom close button and its `aria-label={t('closeFilters')}`), wiring `SheetContent`'s `aria-labelledby` to the existing `id="filter-drawer-heading"` heading (depends on T013 for file consistency, can be done in the same edit pass)
- [ ] T015 [US1] Update `src/components/vehicles/__tests__/VehicleFilters.test.tsx` so its dialog/role/button-name assertions pass against the Sheet/Select-based markup (depends on T013, T014)
- [ ] T016 [US1] Rewrite the `dialog.getByLabel('Body type').selectOption('suv')` interaction in `e2e/responsive.spec.ts` to shadcn `Select`'s click-open-then-click-option pattern (depends on T013)
- [ ] T017 [US1] Update the dark-mode background-color check in `e2e/public.spec.ts` (currently `page.locator('select')`) to target the new `Select` trigger element instead of a native `<select>` (depends on T013)
- [ ] T018 [US1] Replace the mobile nav panel `<div className="lg:hidden ...">` in `src/components/layout/Header.tsx` with `Collapsible`/`CollapsibleContent`, keeping the `data-testid="mobile-nav-panel"` on the content element and the hamburger button's existing `aria-label`/`aria-expanded` wiring unchanged
- [ ] T019 [US1] [P] Replace the site logo `<img src="/logo.png">` in `src/components/layout/Header.tsx` with `Avatar`/`AvatarImage`/`AvatarFallback`, preserving the existing `alt="Autoshop Takumi"` text on `AvatarImage`
- [ ] T020 [US1] [P] Replace the manual divider `<div className="w-px h-4" ...>` elements in `src/components/layout/Header.tsx` with `Separator` (`orientation="vertical"`)
- [ ] T021 [US1] Update `src/components/layout/__tests__/Header.test.tsx` to confirm its `mobile-nav-panel` testid and hamburger `aria-expanded`/accessible-name assertions still pass against the Collapsible-based markup (depends on T018)
- [ ] T022 [US1] [P] Replace the team-member photo `<img>` in `src/components/about/TeamMemberCard.tsx` with `Avatar`/`AvatarImage`/`AvatarFallback`, reproducing the existing empty-muted-box fallback behavior via `AvatarFallback` when `photo` is absent
- [ ] T023 [US1] [P] Pair `InquiryForm`'s existing `Input`/`textarea` fields (`src/components/vehicles/InquiryForm.tsx`) with the new `Label` primitive (`htmlFor` wired to each field's existing `id`), keeping every field's `name` attribute unchanged
- [ ] T024 [US1] [P] Reconcile `src/components/vehicles/VehicleCard.tsx` against the Phase 2 `Card`/`Badge` changes — verify the `success`/`warning`/`secondary` status-variant-to-color mapping still resolves to the same visible colors
- [ ] T025 [US1] Run `npm test`, `npx tsc --noEmit`, `npm run test:e2e`, and the visual regression suite; regenerate only genuinely-diffing baselines (none expected) via the `update-visual-baselines` workflow — do not blanket-regenerate (checkpoint — depends on T013-T024)

**Checkpoint**: User Story 1 fully functional and independently testable — the public site is visually and behaviorally identical, now backed entirely by shadcn primitives.

---

## Phase 4: User Story 2 - Maintainers work with a consistent, standard component library (Priority: P2)

**Goal**: Future shadcn additions integrate cleanly with what this feature establishes.

**Independent Test**: A developer can run the shadcn CLI/MCP to add a brand-new component (e.g. `tooltip`) and it drops into `src/components/ui/` without needing to touch `globals.css` or fight an existing convention mismatch.

### Implementation for User Story 2

- [ ] T026 [US2] Add a minimal `components.json` at the repo root reflecting this project's actual conventions (Tailwind v4, `src/components/ui` alias, `@/lib/utils` for `cn`, no separate light/dark theme file) so `npx shadcn add` resolves paths correctly for any future addition
- [ ] T027 [US2] Add a short section to `CLAUDE.md` (near "Styling architecture") documenting the shadcn migration convention: primitives are fetched via the Shadcn_UI MCP, `cn` import rewritten to `@/lib/utils`, `dark:` classes stripped since the site is dark-only — so the next contributor adding a shadcn component follows the same pattern

**Checkpoint**: User Stories 1 AND 2 both hold — the site behaves identically and the component library is now genuinely shadcn-standard.

---

## Phase 5: User Story 3 - Native interactive elements gain proper accessibility semantics (Priority: P3)

**Goal**: Confirm the accessibility improvements that come for free with real Radix primitives.

**Independent Test**: Manual keyboard-only pass through the mobile filter drawer and mobile nav menu.

### Implementation for User Story 3

- [ ] T028 [US3] Manually verify keyboard focus is trapped inside the mobile filter `Sheet` while open (Tab cycles only through drawer contents until closed) — record the result in the PR description per `quickstart.md` step 6
- [ ] T029 [US3] [P] Manually verify Tab order flows naturally through the revealed nav links in the `Collapsible` mobile menu (no focus trap expected — it is intentionally non-modal, per `research.md`'s Collapsible-vs-Sheet decision)

**Checkpoint**: All user stories independently functional; accessibility improvements confirmed, not just assumed.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup before opening the PR.

- [ ] T030 [P] Run the full suite one more time end-to-end: `npm test && npx tsc --noEmit && npm run test:e2e` — all green, zero net-new failures
- [ ] T031 Follow `quickstart.md` in full (including the visual regression suite) as a final pre-PR validation pass
- [ ] T032 Open the PR on a `feat/shadcn-ui-migration` branch per CLAUDE.md's git workflow, referencing `specs/004-shadcn-ui-migration/spec.md`; wait for CI (Component Tests → Type Check → E2E Tests → Build Check) and CodeRabbit review before merging

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — six new primitive files can all be fetched in parallel
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories (existing components already consume `Button`/`Card`/`Badge`/`Input`, so these must be reconciled first or User Story 1's edits would be reconciling twice)
- **User Story 1 (Phase 3)**: Depends on Foundational — this is the actual migration and the MVP
- **User Story 2 (Phase 4)**: Depends on Foundational; independent of User Story 1's specific edits but most naturally done after US1 so the documented convention reflects the finished pattern
- **User Story 3 (Phase 5)**: Depends on User Story 1 (there's nothing to accessibility-test until the Sheet/Collapsible exist)
- **Polish (Phase 6)**: Depends on all prior phases

### Parallel Opportunities

- All of Phase 1 (T002-T007) can run in parallel — six independent new files
- All of Phase 2 (T008-T011) can run in parallel — four independent existing files
- Within Phase 3: T019, T020, T022, T023, T024 are marked [P] (different files from T013/T014/T018 and from each other)
- T029 in Phase 5 is independent of T028

---

## Parallel Example: Phase 1 (Setup)

```bash
Task: "Fetch shadcn v4 select → src/components/ui/select.tsx"
Task: "Fetch shadcn v4 sheet → src/components/ui/sheet.tsx"
Task: "Fetch shadcn v4 collapsible → src/components/ui/collapsible.tsx"
Task: "Fetch shadcn v4 label → src/components/ui/label.tsx"
Task: "Fetch shadcn v4 separator → src/components/ui/separator.tsx"
Task: "Fetch shadcn v4 avatar → src/components/ui/avatar.tsx"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks everything)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run `quickstart.md` in full
5. This alone is a completable, mergeable PR — User Stories 2 and 3 are additive polish, not required for the migration to be "done"

### Incremental Delivery

1. Setup + Foundational → primitives exist and are reconciled, nothing consumes the new ones yet
2. User Story 1 → the actual migration, fully tested → this is what ships
3. User Story 2 → `components.json` + documentation, low-risk follow-up
4. User Story 3 → accessibility verification, can be folded into the same PR's description or done as a fast follow

## Notes

- Every task in Phase 3 that touches a shared file (`VehicleFilters.tsx`, `Header.tsx`) is sequenced (no `[P]`) against the other tasks touching the *same* file, to avoid edit conflicts; tasks touching different files within the same phase are marked `[P]`.
- Per CLAUDE.md's mobile-responsive-support standing rule, no *new* page or component is being added here (existing components are being re-implemented in place), so no new `e2e/responsive.spec.ts` viewport test block is required — only updates to the existing assertions listed in T016.
- Per CLAUDE.md's visual-regression-testing standing rule, this migration should ideally produce zero new baseline diffs; if a diff appears, that's a signal the migration introduced an unintended visual change and should be fixed, not silently approved.
