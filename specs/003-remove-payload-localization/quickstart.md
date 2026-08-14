# Quickstart: Retire Payload Localization on Makes, Models, Media, SiteSettings, and Homepage

Validation scenarios for this feature, once implemented. Run against local dev (`npm run dev`) with `npm run seed` data present.

## Prerequisites

```bash
npm install
cp .env.example .env   # PAYLOAD_SECRET set to any string
npm run dev             # http://localhost:3000, /admin
```

If validating against pre-existing seed/local data created before this feature, run the migration script first (see data-model.md's Migration mapping):

```bash
npx tsx scripts/migrate-content-locale-fields.ts
```

**Deployment ordering note**: this command reads the old per-locale field values to populate the new paired fields — it MUST run during the pre-cutover deployment/release step, before tasks.md's field-removal task ships to that environment. Running it after the old fields are gone leaves it with nothing to read from.

**Sequencing precondition**: this feature's last task (removing the `localization` block from `payload.config.ts`) is gated on issue #19 having already shipped its equivalent migration for `Vehicles`. If validating this feature before #19 has merged, skip that final step and its Scenario 4 below — every other scenario is independently testable against Makes/Models/Media/SiteSettings/Homepage alone.

## Scenario 1 — Staff edit both languages without a switch (User Story 1)

1. Go to `/admin/collections/makes/create` (or edit an existing Make).
2. Confirm `Name (Japanese)` and `Name (English)` are both visible and editable on the same screen, with no locale switcher needing to be toggled.
3. Repeat for a Model, a Media item's alt text, `/admin/globals/site-settings`, and `/admin/globals/homepage` (including a `whyUsPoints` array item's heading/body).
4. Save a new Model with only `nameJa` filled in; confirm it saves successfully (independently-optional fields, matching current per-locale behavior).

**Expected**: All twenty-two paired fields visible in one edit pass, across all five schemas; saving with only one language populated succeeds.

## Scenario 2 — Existing content survives the migration (Story 1, Acceptance Scenario 1/3; SC-001)

1. Before running the migration script, note an existing Make/Model name, Site Settings address, and Homepage hero heading in both languages (via the admin locale switcher, one language at a time, as today).
2. Run `npx tsx scripts/migrate-content-locale-fields.ts`.
3. Reopen each of those admin screens. Confirm `nameJa`/`nameEn` (or the equivalent pair) match exactly what was noted in step 1 — no content lost, no values swapped between languages.
4. Re-run the migration script a second time. Confirm it completes without error and without altering any already-migrated field (idempotent, per data-model.md).

**Expected**: Zero content loss across the migration; a second run is a true no-op.

## Scenario 3 — Visitor-facing language fallback (User Story 2, FR-012)

1. Edit a Make so `nameJa` is set and `nameEn` is left blank. Save.
2. Visit `/en/vehicles` (listing page). Confirm the make filter shows the Japanese name (fallback), not a blank filter option.
3. Edit the Homepage global so `heroHeadingJa` is set and `heroHeadingEn` is left blank. Save.
4. Visit `/en` (landing page). Confirm the Japanese heading displays (fallback), not a blank hero section.
5. Edit a `whyUsPoints[]` item so only `headingJa` and only `bodyEn` are populated (deliberately mismatched languages). Confirm the rendered point shows the Japanese heading next to the English body — not a blank point.

**Expected**: Fallback to the other language when one is blank, per field, matching issue #19's identical precedent — never a visible blank when a fallback value exists.

## Scenario 4 — Locale switcher disappears once both migrations are complete (User Story 3, FR-008/FR-010)

**Precondition**: Issue #19's `Vehicles` migration has also merged, so no field anywhere still uses `localized: true`.

1. Confirm `payload.config.ts`'s `localization` block (`locales`, `defaultLocale`, `fallback`) has been removed.
2. Load `/admin` and any collection/global edit screen. Confirm no locale switcher control renders anywhere.
3. Issue a request to `GET /api/makes?locale=en` (an old-style request a bookmarked link might still send). Confirm it does not error — the now-meaningless `locale` param is ignored gracefully (verify empirically per FR-009, not from documentation alone).

**Expected**: No locale switcher anywhere in the admin UI; no previously-working request becomes an error.
