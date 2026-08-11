---

description: "Task list for paired JA/EN + JPY/USD vehicle fields"
---

# Tasks: Paired JA/EN Content and JPY/USD Pricing on Vehicle Listings

**Input**: Design documents from `/specs/002-vehicle-ja-en-pricing-fields/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/vehicles-api.md, quickstart.md

**Tests**: Included throughout — this repo's Constitution Principle III ("Every Change Ships With a Test", NON-NEGOTIABLE) and CLAUDE.md's testing rule require a test change alongside every code change, so test tasks are not optional here.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are relative to the repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the new schema fields alongside the existing ones (old fields are not removed yet — see Phase 6)

- [ ] T001 Add the eighteen new paired content fields (`titleJa`/`titleEn`, `exteriorColorJa`/`exteriorColorEn`, `summaryJa`/`summaryEn`, `highlights[].textJa`/`textEn`, `descriptionJa`/`descriptionEn`, `specs[].labelJa`/`labelEn`, `specs[].valueJa`/`valueEn`, `seoTitleJa`/`seoTitleEn`, `seoDescriptionJa`/`seoDescriptionEn`) to `src/collections/Vehicles.ts`, positioned adjacent to each field's existing localized counterpart, per data-model.md's field table — covers nine of the collection's ten localized fields; `gallery[].caption` is explicitly excluded (out of scope, stays `localized: true` unchanged, per spec.md Assumptions)
- [ ] T002 [P] Add `priceJpy`/`priceUsd` number fields to `src/collections/Vehicles.ts`, positioned adjacent to the existing `price`/`currency` fields
- [ ] T003 [P] Regenerate `payload-types.ts` via `npm run generate:types` to include the new fields

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Locale-fallback logic, migration tooling, and the publish gate — all three user stories depend on these existing first

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 [P] Implement the locale-fallback helper (e.g. `resolveLocalizedField()`) in `src/lib/vehicle-locale.ts`, per data-model.md's "Derived concept: Locale-resolved field" section — applies to the nine content field pairs only, NOT price (price display is currency-driven per spec FR-004, not a locale-fallback concept). Use the field-type-specific blank-detection rules from data-model.md ("Blank detection per field type"): trimmed non-empty check for text/textarea, and a semantic Lexical blank check (not truthiness) for the `description` richText pair.
- [ ] T005 [P] Unit tests for `resolveLocalizedField()` in `src/lib/vehicle-locale.test.ts` — both-languages-blank, one-language-blank fallback, independent per-field resolution (e.g. a spec row's label and value resolving to different languages), and a richText case where the Lexical value is a technically-non-null empty-paragraph structure (must be treated as blank, not as present), per spec.md Edge Cases and data-model.md
- [ ] T006 [P] Extract the pure migration-mapping function (e.g. `mapLegacyVehicleFields()`) in `scripts/lib/vehicle-field-mapping.ts`, implementing data-model.md's Migration mapping table, including: the JPY/USD currency branch, the missing/unrecognized-currency-defaults-to-JPY rule, and per-target-field idempotency (write a target field only if it is currently blank, independent of whether other target fields on the same document are already populated)
- [ ] T007 [P] Unit tests for `mapLegacyVehicleFields()` in `scripts/lib/vehicle-field-mapping.test.ts` — JPY-vs-USD branch selection based on the legacy `currency` value, the blank/unrecognized-currency-defaults-to-JPY case, `priceOnRequest` passthrough, per-field idempotency on a partially-migrated input (e.g. `titleJa` already populated but `titleEn`/price targets still blank), and a fully-migrated input producing no changes
- [ ] T008 Implement `scripts/migrate-vehicle-fields.ts`: reads every `Vehicles` document via Payload's Local API — paginating through the full collection (`payload.find()` defaults to 10 results per page; iterate `page`/`limit` or use `pagination: false`/`limit: 0`, per contracts/vehicles-api.md) — calls `mapLegacyVehicleFields()` per document, and writes the results back — following `scripts/seed.ts`'s existing script pattern and its documented `tsx`/`@next/env` interop caveat (README Known Issues)
- [ ] T009 Extend the existing `beforeChange` publish-gate hook in `src/collections/Vehicles.ts` to additionally require (`titleJa` present OR `titleEn` present) AND (`priceJpy` present OR `priceUsd` present OR `priceOnRequest === true`) before allowing `status: 'available'`, alongside the existing `heroImage` check, using the exact presence rules from data-model.md's "Blank detection per field type" (trimmed non-empty text, numeric presence that treats `0` as present, `priceOnRequest` specifically `=== true`) — evaluated against the record's **effective state** (the incoming request's data merged over what's already persisted), matching the precedent set by this repo's `002-reduce-required-fields` feature's `heroImage`/make/model/year gate, not just the fields included in a given request
- [ ] T010 [P] `e2e/admin.spec.ts`: add cases for the extended publish gate — (a) rejects `status: 'available'` when both title and price are missing; (b) accepts it when only one language/currency plus `priceOnRequest` are set; (c) a status-only `PATCH { status: 'available' }` against a record that already has `titleJa`/`priceJpy` persisted from an earlier edit succeeds (effective-state check); (d) a title of `0` or a JPY price of exactly `0` is treated as present, not missing — per contracts/vehicles-api.md and data-model.md

**Checkpoint**: Schema fields, fallback helper, migration tooling, and publish gate are all in place — user story implementation can now begin.

---

## Phase 3: User Story 1 - Staff edit both languages without a global switch (Priority: P1) 🎯 MVP

**Goal**: Every one of the nine content field pairs is visible and independently editable on a vehicle's edit screen in a single pass, with no locale-switcher interaction required.

**Independent Test**: Open a vehicle listing's edit screen and confirm all nine content field pairs show separate, simultaneously-editable Japanese and English inputs.

### Implementation for User Story 1

- [ ] T011 [US1] Order the new paired fields' admin field config in `src/collections/Vehicles.ts` so each language pair (e.g. `titleJa` next to `titleEn`) appears adjacently for staff, with clear field labels (e.g. "Title (Japanese)" / "Title (English)")

### Tests for User Story 1

- [ ] T012 [P] [US1] `e2e/admin.spec.ts`: add a case creating a vehicle and asserting both language inputs for every content field pair are visible/editable in a single form render, with no locale-switcher interaction (Acceptance Scenarios 1.1–1.2)
- [ ] T013 [US1] `e2e/admin.spec.ts`: add a case saving a listing with only the Japanese half of every pair filled in, confirming it saves successfully as a draft (Acceptance Scenario 1.3)

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Staff price a listing in JPY and/or USD independently (Priority: P1)

**Goal**: Staff can enter a JPY price, a USD price, or mark "price on request," independently of each other with no conversion applied.

**Independent Test**: Enter only a JPY price on one listing and only a USD price on another; confirm each saves and displays correctly with no value assumed for the unset currency.

### Implementation for User Story 2

- [ ] T014 [US2] Simplify `formatPrice()` in `src/lib/utils.ts` to format a single already-resolved price + currency (JPY or USD), removing the old per-vehicle `currency`-selection parameter, per contracts/vehicles-api.md
- [ ] T015 [US2] Update the vehicle detail page (`src/app/(public)/[locale]/vehicles/[slug]/page.tsx`) to display `priceJpy`/`priceUsd` via the updated `formatPrice()` — showing both when both are set, honoring `priceOnRequest` — identically regardless of the page's active site locale (spec FR-004: price display is currency-driven, not a locale-fallback concept)
- [ ] T016 [P] [US2] Update `src/components/vehicles/VehicleCard.tsx` to display the resolved price(s) using the same logic

### Tests for User Story 2

- [ ] T017 [P] [US2] Unit tests for the updated `formatPrice()` covering JPY-only, USD-only, both-set, and price-on-request suppression
- [ ] T018 [P] [US2] `e2e/admin.spec.ts`: add a case saving a listing with only `priceJpy` set, confirming no `priceUsd` is required or auto-populated (Acceptance Scenarios 2.1–2.2)
- [ ] T019 [P] [US2] `e2e/public.spec.ts`: add a case confirming a `priceOnRequest` listing shows neither price on the listing or detail pages (Acceptance Scenario 2.3)

**Checkpoint**: User Stories 1 and 2 are both independently functional.

---

## Phase 5: User Story 3 - Visitors see listing content in their language, with graceful fallback (Priority: P2)

**Goal**: A visitor sees a listing's content in their site language, falling back to the other language when a content field is genuinely blank, rather than seeing an empty gap. Price display (User Story 2) is currency-driven and identical across both site locales — not part of this story's fallback logic.

**Independent Test**: View a listing with content in only one language from both site locales; confirm the populated language's content displays in both cases rather than a blank field.

### Implementation for User Story 3

- [ ] T020 [US3] Update the vehicle listing page (`src/app/(public)/[locale]/vehicles/page.tsx`) to resolve every displayed paired **content** field via `resolveLocalizedField()` instead of relying on Payload's `?locale=` read
- [ ] T021 [US3] Update the vehicle detail page (`src/app/(public)/[locale]/vehicles/[slug]/page.tsx`) to resolve **title** (currently rendered directly as `{vehicle.title}` in the page's `<h1>`), summary, description, highlights, spec rows, and SEO title/description via `resolveLocalizedField()`, applying label/value fallback independently per spec row (per spec.md Edge Cases)
- [ ] T022 [P] [US3] Update `src/components/vehicles/VehicleCard.tsx` to resolve title/exterior color via `resolveLocalizedField()`
- [ ] T023 [US3] Update the vehicle listing page's price filter/sort query construction (currently `where.price.greater_than_equal`/`less_than_equal` from `sp.priceFrom`/`sp.priceTo`, and `sort: 'price'`/`'-price'` from `sp.sort` values `priceLow`/`priceHigh`, in `src/app/(public)/[locale]/vehicles/page.tsx`) to target `priceJpy` instead of `price`, implementing the missing-`priceJpy` exclusion/sort-last rule from research.md §4 — verify the behavior is consistent (not left to the database's native `NULL`-ordering default) against both SQLite (dev) and Postgres (prod); confirm `src/components/vehicles/VehicleFilters.tsx` itself needs no changes (it only builds the query params, doesn't reference `price` directly, per spec.md scope)

### Tests for User Story 3

- [ ] T024 [P] [US3] `e2e/public.spec.ts`: add a case with a USD-only-priced listing confirming it is excluded from a `priceFrom`/`priceTo`-filtered result, sorts after JPY-priced listings under both `sort=priceLow`/`priceHigh`, and remains visible via normal browsing with no price filter/sort applied
- [ ] T025 [P] [US3] Component tests for `VehicleCard` covering one-language-blank fallback and both-languages-blank omission
- [ ] T026 [P] [US3] `e2e/public.spec.ts`: add a case for a listing with only a Japanese description, confirming the English-locale page shows the Japanese description instead of blank (Acceptance Scenario 3.2)
- [ ] T027 [P] [US3] `e2e/public.spec.ts`: add a case for a spec row with a Japanese label and an English value (mismatched languages), confirming both halves render together (Edge Cases)
- [ ] T028 [US3] `e2e/public.spec.ts`: add a case for a spec row left fully blank in both languages, confirming it is omitted from the rendered spec table (Acceptance Scenario 3.5)
- [ ] T029 [P] [US3] `e2e/public.spec.ts`: add a case confirming price display is currency-driven, not locale-driven — a JPY-only listing shows the same JPY price on both `/ja/...` and `/en/...`, and a listing with both prices set shows both on both locales (Acceptance Scenarios 3.3–3.4)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Data cutover and final cleanup, once all consumers read only the new paired fields

- [ ] T030 Create a small, fixed legacy-shaped test fixture (e.g. a JSON fixture or an inline Local API seed used only by this validation) representing pre-migration vehicle documents — including at least one with a blank/unrecognized `currency` and one already-partially-migrated document — decoupled from `scripts/seed.ts` so this validation doesn't depend on that script's current (soon-to-change) shape
- [ ] T031 Run `scripts/migrate-vehicle-fields.ts` against the T030 fixture (and against local data seeded by the *current*, not-yet-updated `scripts/seed.ts`) and validate against quickstart.md Scenario 5 (full-collection, paginated pre/post field-value comparison matched by document `id`) — repeat against production data as part of the eventual deploy, not as part of this local validation pass
- [ ] T032 [P] Update `scripts/seed.ts` to populate the new paired fields instead of the old localized ones — run only after T031, since T031's legacy-shaped validation depends on `scripts/seed.ts` still producing the old field shape
- [ ] T033 Update `src/collections/Vehicles.ts`'s `admin.useAsTitle` (currently `'title'`, a field this feature removes) to a strategy that resolves to a real value using the new paired fields with a single-language fallback, and update `admin.defaultColumns` (currently `['title', 'make', 'year', 'status', 'price']`) to reference retained/new fields instead of the removed `title`/`price` — this MUST land before or together with T035's field removal, never after, since the admin config would otherwise reference undefined fields in between
- [ ] T034 [P] `e2e/admin.spec.ts`: add a regression case asserting the admin vehicle list view renders correctly after T033/T035 — the title column shows a real, non-blank value (via the new fields' fallback) and no column references a removed field
- [ ] T035 Remove the old localized fields (`title`, `exteriorColor`, `summary`, `highlights[].text`, `description`, `specs[].label`/`value`, `seoTitle`, `seoDescription` — NOT `gallery[].caption`, which stays out of scope) and the old `price`/`currency` fields from `src/collections/Vehicles.ts`, now that every consumer reads only the new paired fields, the migration has been validated, and admin metadata (T033) no longer references them
- [ ] T036 [P] Regenerate `payload-types.ts` again after old-field removal and resolve any resulting type errors (`npx tsc --noEmit`)
- [ ] T037 Run the full suite (`npm test`, `npx tsc --noEmit`, `npm run test:e2e`) and confirm all green, per this repo's CLAUDE.md workflow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion; can proceed in parallel or in priority order (US1 → US2 → US3)
- **Polish (Phase 6)**: Depends on all three user stories being complete (old fields can only be removed once nothing reads them). Within Phase 6, T030→T031→T032 must run in that order (T032 changes what `scripts/seed.ts` produces, which T031's legacy-shaped validation depends on), and T033→T035 must run in that order (admin metadata must stop referencing old fields before those fields are removed).

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on US2/US3 — independently testable once Foundational is done
- **User Story 2 (P1)**: No dependency on US1/US3 — independently testable once Foundational is done
- **User Story 3 (P2)**: No hard dependency on US1/US2, but reaching `status: 'available'` to validate on the live public site relies on the Foundational publish gate (T009), not on US1/US2's own tasks

### Parallel Opportunities

- T002/T003 (Setup) can run in parallel with T001
- T004–T007 (Foundational: helper + migration mapping + their tests) can all run in parallel with each other
- Once Foundational is complete, US1, US2, and US3 implementation can proceed in parallel by different contributors
- Within each story, tasks marked [P] (different files) can run in parallel
- T032 is marked [P] relative to other Phase 6 tasks' *files*, but is still sequenced strictly after T031 (see Phase Dependencies) — the [P] marker here means "different file from T033/T034/etc.," not "no ordering constraint"

---

## Parallel Example: Foundational Phase

```bash
Task: "Implement resolveLocalizedField() in src/lib/vehicle-locale.ts"
Task: "Unit tests for resolveLocalizedField() in src/lib/vehicle-locale.test.ts"
Task: "Extract mapLegacyVehicleFields() in scripts/lib/vehicle-field-mapping.ts"
Task: "Unit tests for mapLegacyVehicleFields() in scripts/lib/vehicle-field-mapping.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: confirm staff can edit both languages of every content field without a locale switch
5. Demo if ready — US1 alone delivers the admin-UX fix that motivated the source roadmap issue (#18)

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate independently (MVP)
3. Add User Story 2 → validate independently (dual pricing live)
4. Add User Story 3 → validate independently (visitor-facing fallback + price sort/filter live)
5. Phase 6 → run the production migration, update admin metadata, remove the old fields, ship

---

## Notes

- [P] tasks touch different files with no dependency on an incomplete task, except where Phase Dependencies above notes an explicit ordering constraint even on a [P]-marked task
- Old localized/price/currency fields are deliberately kept alongside the new ones through Phases 1–5, so the migration (T030–T031) always has both shapes available to read from/write to during cutover — they are only removed in Phase 6 (T035), after every consumer and the admin config (T033) have been repointed
- `gallery[].caption` is out of scope throughout — no task in this file touches it
- Commit after each task or logical group, per this repo's incremental-commit convention
- Verify tests fail before implementing, where a test task precedes its implementation task
