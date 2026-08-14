---

description: "Task list for retiring Payload localization on Makes/Models/Media/SiteSettings/Homepage"
---

# Tasks: Retire Payload Localization on Makes, Models, Media, SiteSettings, and Homepage

**Input**: Design documents from `/specs/003-remove-payload-localization/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/content-locale-api.md, quickstart.md

**Tests**: Included throughout — this repo's Constitution Principle III ("Every Change Ships With a Test", NON-NEGOTIABLE) and CLAUDE.md's testing rule require a test change alongside every code change, so test tasks are not optional here.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing of each story.

**Sequencing precondition**: This feature depends on issue #19's `Vehicles` migration (spec 002) as a reference implementation for the shared fallback helper (research.md §2), and Phase 5's `payload.config.ts` change is hard-gated on #19 having also fully removed `localized: true` from `Vehicles` — see T027 for the explicit check. Every other phase (1–4, and most of 6) can proceed independently of #19's merge status.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are relative to the repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the twenty-two new paired fields alongside the existing localized ones (old fields are not removed yet — see Phase 6)

- [ ] T001 [P] Add `nameJa`/`nameEn` fields to `src/collections/Makes.ts`, positioned adjacent to the existing `name` field, per data-model.md
- [ ] T002 [P] Add `nameJa`/`nameEn` fields to `src/collections/Models.ts`, positioned adjacent to the existing `name` field, per data-model.md
- [ ] T003 [P] Add `altJa`/`altEn` fields to `src/collections/Media.ts`, positioned adjacent to the existing `alt` field, per data-model.md
- [ ] T004 [P] Add `shopNameJa`/`shopNameEn`, `addressJa`/`addressEn`, `defaultSeoTitleJa`/`defaultSeoTitleEn`, `defaultSeoDescriptionJa`/`defaultSeoDescriptionEn` fields to `src/globals/SiteSettings.ts`, each positioned adjacent to its existing localized counterpart, per data-model.md
- [ ] T005 [P] Add `heroHeadingJa`/`heroHeadingEn`, `heroSubheadingJa`/`heroSubheadingEn`, `aboutBlurbJa`/`aboutBlurbEn`, `whyUsPoints[].headingJa`/`headingEn`, `whyUsPoints[].bodyJa`/`bodyEn`, `contactSummaryJa`/`contactSummaryEn` fields to `src/globals/Homepage.ts`, each positioned adjacent to its existing localized counterpart, per data-model.md
- [ ] T006 Regenerate `payload-types.ts` via `npm run generate:types` after T001–T005 are all complete, to include the new fields (not marked [P] — running it before the schema fields exist would regenerate types without them)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared locale-fallback logic and migration tooling — all three user stories depend on these existing first

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Check whether `src/lib/vehicle-locale.ts` already exists on `master` (i.e. issue #19/spec 002 has merged). If it exists, extend/rename it into a generically-typed shared helper at `src/lib/content-locale.ts` exporting `resolveLocalizedField(activeValue, fallbackValue)` with no `Vehicle`-specific typing, and update `Vehicles`' own consumers to import from the new path (a pure import-path change per research.md §2 — no behavior change to `Vehicles`). If it does not yet exist, create `src/lib/content-locale.ts` directly in the same generic shape, so `Vehicles`' consumers can adopt it later with only an import-path change. Use the field-type-specific blank-detection rules from data-model.md ("Blank detection per field type"): trimmed non-empty check for text/textarea, and a semantic Lexical blank check (not truthiness) for the `aboutBlurb`/`contactSummary` richText pairs.
- [ ] T008 [P] Unit tests for `resolveLocalizedField()` in `src/lib/content-locale.test.ts` — both-values-blank, one-value-blank fallback, and a richText case where the Lexical value is a technically-non-null empty-paragraph structure (must be treated as blank, not as present), per data-model.md
- [ ] T009 [P] Extract the pure migration-mapping function (e.g. `mapLegacyContentFields()`) in `scripts/lib/content-field-mapping.ts`, implementing data-model.md's Migration mapping table for all five schemas (Makes, Models, Media, SiteSettings, Homepage), including per-target-field idempotency (write a target field only if it is currently blank, independent of whether other target fields on the same document/global are already populated) and correct handling of the `whyUsPoints[]` array (mapping each item by index)
- [ ] T010 [P] Unit tests for `mapLegacyContentFields()` in `scripts/lib/content-field-mapping.test.ts` — per-schema field mapping correctness, per-field idempotency on a partially-migrated input (e.g. `nameJa` already populated but `nameEn` still blank), a fully-migrated input producing no changes, a source field with neither language populated (both targets stay blank, not fabricated), and `whyUsPoints[]` array-index mapping with a mix of migrated/unmigrated items
- [ ] T011 Implement `scripts/migrate-content-locale-fields.ts`: reads every Make, Model, and Media document, and the SiteSettings and Homepage globals, via Payload's Local API — paginating through each collection (`payload.find()` defaults to 10 results per page; iterate `page`/`limit` or use `pagination: false`/`limit: 0`, per contracts/content-locale-api.md). For each, explicitly read **both** legacy locale values for every old localized field before calling `mapLegacyContentFields()` — e.g. `payload.find({ collection, locale: 'ja' })`/`{ locale: 'en' }` (or the global equivalent), since a single unscoped read only resolves one locale's value. Write the mapped results back via `payload.update`/`payload.updateGlobal`, following `scripts/seed.ts`'s existing script pattern and its documented `tsx`/`@next/env` interop caveat (README Known Issues)

**Checkpoint**: Schema fields, fallback helper, and migration tooling are all in place — user story implementation can now begin.

---

## Phase 3: User Story 1 - Shop staff edit taxonomy and site copy without a locale switcher (Priority: P1) 🎯 MVP

**Goal**: Every one of the twenty-two paired fields is visible and independently editable on its admin screen in a single pass, with no locale-switcher interaction required.

**Independent Test**: Open Makes, Models, Media, Site Settings, and Homepage admin screens and confirm each shows separate, simultaneously-editable Japanese and English inputs for every migrated field.

### Implementation for User Story 1

- [ ] T012 [US1] Order the new paired fields' admin field config in `src/collections/Makes.ts` and `src/collections/Models.ts` so `nameJa` appears adjacent to `nameEn`, with clear field labels ("Name (Japanese)" / "Name (English)")
- [ ] T013 [P] [US1] Order the new paired fields' admin field config in `src/collections/Media.ts` so `altJa` appears adjacent to `altEn`, with clear field labels
- [ ] T014 [P] [US1] Order the new paired fields' admin field config in `src/globals/SiteSettings.ts` so each pair (`shopNameJa`/`En`, `addressJa`/`En`, `defaultSeoTitleJa`/`En`, `defaultSeoDescriptionJa`/`En`) appears adjacently, with clear field labels
- [ ] T015 [P] [US1] Order the new paired fields' admin field config in `src/globals/Homepage.ts` so each pair (`heroHeadingJa`/`En`, `heroSubheadingJa`/`En`, `aboutBlurbJa`/`En`, `whyUsPoints[].headingJa`/`En`, `whyUsPoints[].bodyJa`/`En`, `contactSummaryJa`/`En`) appears adjacently, with clear field labels

### Tests for User Story 1

- [ ] T016 [P] [US1] `e2e/admin.spec.ts`: add a case creating a Make and a Model, asserting both language inputs for `name` are visible/editable in a single form render, with no locale-switcher interaction (spec Acceptance Scenario 1.1)
- [ ] T017 [P] [US1] `e2e/admin.spec.ts`: add a case saving a new Model with only `nameJa` filled in, confirming it saves successfully (spec Acceptance Scenario 1.2)
- [ ] T018 [P] [US1] `e2e/admin.spec.ts`: add cases for Media, Site Settings, and Homepage confirming both language inputs for every migrated field render together on one screen (spec Acceptance Scenario 1.3)

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Visitors see correct bilingual content on the public site after the migration (Priority: P1)

**Goal**: Public-facing rendering of every migrated field matches pre-migration behavior in both locales, with graceful fallback when one language is blank.

**Independent Test**: Load the `/ja` and `/en` landing page, vehicle listing filters, and about/contact areas; confirm every migrated field renders correctly with no blanks.

### Implementation for User Story 2

- [ ] T019 [US2] Rewrite `getSiteSettings(locale)` in `src/lib/site-settings.ts` to call `payload.findGlobal({ slug: 'site-settings' })` with no `locale` option, then resolve each paired field (`shopNameJa`/`En` → `shopName`, etc.) via `resolveLocalizedField()`, preserving the function's existing return shape and call signature for its current callers (Header, Footer, About page), per research.md §4
- [ ] T020 [US2] Update the Homepage global consumer in `src/app/(public)/[locale]/page.tsx` to resolve `heroHeading`, `heroSubheading`, `aboutBlurb`, each `whyUsPoints[]` item's `heading`/`body`, and `contactSummary` via `resolveLocalizedField()` instead of relying on Payload's `?locale=` read
- [ ] T021 [US2] Update `src/app/(public)/[locale]/vehicles/page.tsx`'s Make/Model queries (currently `payload.find({ collection: 'makes'/'models', locale })`) to read `nameJa`/`nameEn` directly and resolve the filter label via `resolveLocalizedField()` instead of relying on the `locale` param
- [ ] T022 [P] [US2] Update every component rendering `Media.alt` as an image `alt` attribute to resolve `altJa`/`altEn` via `resolveLocalizedField()` (identify call sites via `Grep` for `.alt` usage on Media-sourced images — at minimum any vehicle gallery/hero image component and the About page's embedded images, per README's Data Model)

### Tests for User Story 2

- [ ] T023 [P] [US2] Unit/component tests for `getSiteSettings(locale)` covering one-language-blank fallback for `shopName`/`address`/`defaultSeoTitle`/`defaultSeoDescription`
- [ ] T024 [P] [US2] `e2e/public.spec.ts`: add a case confirming the landing page renders hero heading/subheading, about blurb, "why us" points, and contact summary correctly in both `/ja` and `/en` (spec Acceptance Scenario 2.2)
- [ ] T025 [P] [US2] `e2e/public.spec.ts`: add a case confirming the vehicle listing's make/model filter labels show the correct language in both locales (spec Acceptance Scenario 2.1), and a fallback case where a Make has only `nameJa` set, confirming `/en/vehicles` shows the Japanese name instead of a blank filter option (spec FR-012)
- [ ] T026 [P] [US2] Component test confirming a Media item's image renders the correct language's `alt` text in both locales, including a one-language-blank fallback case (spec Acceptance Scenario 2.3)

**Checkpoint**: User Stories 1 and 2 are both independently functional.

---

## Phase 5: User Story 3 - The admin locale switcher disappears once no field needs it (Priority: P2)

**Goal**: Once no field anywhere in the codebase uses `localized: true` (this feature plus issue #19 both complete), the Payload `localization` config is removed and the admin locale switcher disappears with it.

**Independent Test**: After confirming no `localized: true` remains anywhere, load `/admin` and confirm the locale switcher is gone, and that REST/GraphQL/Local API calls with a `locale` parameter don't break.

### Implementation for User Story 3

- [ ] T027 Before proceeding, verify empirically that issue #19 has merged and `Vehicles` no longer has any `localized: true` field (check `src/collections/Vehicles.ts` on `master`, or run `grep -rn "localized: true" src/collections src/globals` and confirm the only remaining occurrence, if any, is `Vehicles`' explicitly-out-of-scope `gallery[].caption` per spec 002 — if #19 is not yet merged, STOP this phase here and leave T028–T031 undone until a later run; do not remove `localization` while `Vehicles` still depends on it)
- [ ] T028 Remove the `locales`/`defaultLocale`/`fallback` `localization` block from `payload.config.ts`, per spec FR-008 (only after T027 confirms it's safe)
- [ ] T029 Empirically verify (per spec FR-009 — curl or a fresh unauthenticated request, not source inspection alone) that a `locale` query parameter on `GET /api/makes`, `GET /api/models`, `GET /api/media`, and the SiteSettings/Homepage global endpoints no longer errors after T028, and that `e2e/api.spec.ts`'s existing locale-parameterized assertions (if any) still pass or have been updated to match

### Tests for User Story 3

- [ ] T030 [P] [US3] `e2e/admin.spec.ts`: add a regression case confirming no locale switcher control renders anywhere in the admin UI after T028 (spec Acceptance Scenario 3.1), and re-verify the three existing Payload-theme regression tests noted in CLAUDE.md (`admin renders with Payload theme variables resolved`, `admin nav sidebar renders with Payload's real layout CSS`, `admin styling does not leak from / into the public site`) still pass, since `localization` removal changes the admin shell those tests assert against
- [ ] T031 [P] [US3] `e2e/api.spec.ts`: add or update a case confirming a `GET` request with a `?locale=` query param against Makes/Models/Media/SiteSettings/Homepage endpoints returns successfully (not an error) after `localization` removal (spec Acceptance Scenario 3.2)

**Checkpoint**: All three user stories are independently functional (T027–T031 conditional on issue #19's merge status).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Data cutover and final cleanup, once all consumers read only the new paired fields

- [ ] T032 Create a small, fixed legacy-shaped test fixture (e.g. a JSON fixture or an inline Local API seed used only by this validation) representing pre-migration Makes/Models/Media/SiteSettings/Homepage content — including at least one record with only one language populated — decoupled from `scripts/seed.ts` so this validation doesn't depend on that script's current (soon-to-change) shape
- [ ] T033 Run `scripts/migrate-content-locale-fields.ts` against the T032 fixture (and against local data seeded by the *current*, not-yet-updated `scripts/seed.ts`) and validate against quickstart.md Scenario 2 (pre/post field-value comparison matched by document `id`) — repeat against production data as part of the eventual deploy, not as part of this local validation pass
- [ ] T034 [P] Update `scripts/seed.ts` to populate the new paired fields instead of the old localized ones for Makes, Models, Media, SiteSettings, and Homepage — run only after T033, since T033's legacy-shaped validation depends on `scripts/seed.ts` still producing the old field shape
- [ ] T035 [P] Update `scripts/seed-e2e-admin.ts` (if it seeds any of these five schemas) to populate the new paired fields instead of the old ones
- [ ] T036 Update `e2e/api.spec.ts` where it sends/asserts the legacy `name`/`alt`/`shopName`/etc. fields directly against Makes/Models/Media/SiteSettings/Homepage endpoints, to use the new paired field names instead; this MUST land before T038 removes the fields this spec currently exercises
- [ ] T037 [P] Update `e2e/admin.spec.ts` and `e2e/public.spec.ts` create/edit assertions that still reference the old single-locale field names for these five schemas, to use the new paired field names
- [ ] T038 Remove the old localized fields (`name` from Makes/Models, `alt` from Media, `shopName`/`address`/`defaultSeoTitle`/`defaultSeoDescription` from SiteSettings, `heroHeading`/`heroSubheading`/`aboutBlurb`/`whyUsPoints[].heading`/`whyUsPoints[].body`/`contactSummary` from Homepage) from their respective schema files, now that every consumer and test (T019–T022, T036, T037) no longer references them and the migration has been validated
- [ ] T039 [P] Regenerate `payload-types.ts` again after old-field removal and resolve any resulting type errors (`npx tsc --noEmit`)
- [ ] T040 Update CLAUDE.md/README.md's i18n section describing `localized: true` to describe the paired-field pattern instead (spec's "Update work items" from issue #20), covering both this feature and issue #19's equivalent `Vehicles` change
- [ ] T041 If T027–T031 (Phase 5) were skipped because issue #19 had not yet merged, re-run Phase 5 now (T027 first) before this final full-suite run
- [ ] T042 Run the full suite (`npm test`, `npx tsc --noEmit`, `npm run test:e2e`) and confirm all green, per this repo's CLAUDE.md workflow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–4)**: Both depend on Foundational phase completion; can proceed in parallel or in priority order (US1 → US2). **User Story 3 (Phase 5)** additionally depends on issue #19 having merged (T027's gate) — it may be skipped and resumed later without blocking Phases 1–4 or most of Phase 6.
- **Polish (Phase 6)**: Depends on User Stories 1 and 2 being complete (old fields can only be removed once nothing reads them). T032→T033→T034 must run in that order (T034 changes what `scripts/seed.ts` produces, which T033's legacy-shaped validation depends on). T036→T038 must run in that order (tests must stop referencing old fields before those fields are removed). T041 re-checks Phase 5's gate before the final field removal/suite run, since Phase 5 may have been skipped earlier in the same implementation pass.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on US2/US3 — independently testable once Foundational is done
- **User Story 2 (P1)**: No dependency on US1/US3 — independently testable once Foundational is done
- **User Story 3 (P2)**: Depends on issue #19 (external dependency, not on US1/US2's own tasks) — see T027

### Parallel Opportunities

- T001–T005 (Setup) can all run in parallel with each other (different schema files)
- T008–T010 (Foundational: helper tests + migration mapping + its tests) can run in parallel with each other, after T007
- Once Foundational is complete, US1 and US2 implementation can proceed in parallel by different contributors; US3 (Phase 5) can start independently whenever its T027 gate clears, even mid-way through US1/US2
- Within each story, tasks marked [P] (different files) can run in parallel
- T034 is marked [P] relative to other Phase 6 tasks' *files*, but is still sequenced strictly after T033 (see Phase Dependencies) — the [P] marker here means "different file from T036/T037/etc.," not "no ordering constraint"

---

## Parallel Example: Foundational Phase

```bash
Task: "Unit tests for resolveLocalizedField() in src/lib/content-locale.test.ts"
Task: "Extract mapLegacyContentFields() in scripts/lib/content-field-mapping.ts"
Task: "Unit tests for mapLegacyContentFields() in scripts/lib/content-field-mapping.test.ts"
```
(All depend on T007 completing first, since T007 decides whether `content-locale.ts` is a rename of `vehicle-locale.ts` or a fresh file — the other three tasks read/import from its final path.)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: confirm staff can edit both languages of every migrated field without a locale switch
5. Demo if ready — US1 alone delivers the admin-UX fix that motivated the source roadmap issue (#18)

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate independently (MVP)
3. Add User Story 2 → validate independently (visitor-facing fallback live)
4. Add User Story 3 (once issue #19 has merged) → validate independently (locale switcher gone)
5. Phase 6 → run the production migration, update seed scripts and tests, remove the old fields, ship

---

## Notes

- [P] tasks touch different files with no dependency on an incomplete task, except where Phase Dependencies above notes an explicit ordering constraint even on a [P]-marked task
- Old localized fields are deliberately kept alongside the new ones through Phases 1–5, so the migration (T032–T033) always has both shapes available to read from/write to during cutover — they are only removed in Phase 6 (T038), after every consumer and test (T019–T022, T036, T037) no longer references them
- `Vehicles` is out of scope throughout — no task in this file touches `src/collections/Vehicles.ts` except T007's conditional rename of its `vehicle-locale.ts` helper, which does not change `Vehicles`' own field schema or behavior
- Commit after each task or logical group, per this repo's incremental-commit convention
- Verify tests fail before implementing, where a test task precedes its implementation task
