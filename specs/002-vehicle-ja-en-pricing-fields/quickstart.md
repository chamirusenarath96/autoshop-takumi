# Quickstart: Paired JA/EN Content and JPY/USD Pricing on Vehicle Listings

Validation scenarios for this feature, once implemented. Run against local dev (`npm run dev`) with `npm run seed` data present, or a fresh vehicle created in `/admin`.

## Prerequisites

```bash
npm install
cp .env.example .env   # PAYLOAD_SECRET set to any string
npm run dev             # http://localhost:3000, /admin
```

If validating against pre-existing seed/local data created before this feature, run the migration script first (see data-model.md's Migration mapping):

```bash
npx tsx scripts/migrate-vehicle-fields.ts
```

## Scenario 1 — Staff edit both languages without a switch (User Story 1)

1. Go to `/admin/collections/vehicles/create` (or edit an existing listing).
2. Confirm `Title (Japanese)` and `Title (English)` (and the equivalent pairs for exterior color, summary, description, SEO title, SEO description) are both visible and editable on the same screen, with no locale switcher needing to be toggled.
3. Add a highlight and a spec row; confirm each exposes both-language inputs.
4. Save with only the Japanese title filled in; confirm it saves successfully (draft-safe).

**Expected**: All eighteen paired fields visible in one edit pass; saving with only one language populated succeeds.

## Scenario 2 — Independent JPY/USD pricing (User Story 2)

1. On a vehicle listing, enter `priceJpy: 4500000` only. Save.
2. Confirm no USD value is required or auto-populated.
3. On a second listing, enter both `priceJpy` and `priceUsd` with unrelated values (not a currency-converted pair). Save. Confirm both persist independently.
4. On a third listing, check "price on request" with no price fields set. Save. View it on the public site — confirm neither price displays, only the price-on-request messaging.

**Expected**: Each price field is independently optional; `priceOnRequest` suppresses both regardless of their values.

## Scenario 3 — Visitor-facing language fallback (User Story 3)

1. Create/edit a vehicle with `titleJa` set, `titleEn` left blank, and `descriptionJa` set, `descriptionEn` left blank. Set status to `available` (after satisfying the publish gate — see Scenario 4).
2. Visit `/en/vehicles/<slug>`. Confirm the Japanese title and description display (not blank).
3. Visit `/ja/vehicles/<slug>`. Confirm the same content displays for the Japanese locale.
4. Add a spec row with only `labelJa` and only `valueEn` populated (deliberately mismatched languages). Confirm the rendered row shows the Japanese label next to the English value — not a blank row.
5. Leave a second spec row's both label and value fields entirely blank in both languages. Confirm that row does not render at all.

**Expected**: Fallback to the other language when one is blank, per field/sub-field, not per-listing; a fully-empty row is omitted.

## Scenario 4 — Publish gate (FR-008)

**Precondition**: This vehicle already needs a `heroImage` uploaded to pass the collection's existing, unrelated publish check — that check is unchanged by this feature but still applies. Upload a hero image before attempting `status: 'available'` in every step below, otherwise the save will fail on the pre-existing `heroImage` requirement rather than exercising the new title/price check this scenario is validating.

1. Create a new vehicle with a `heroImage` set, no title in either language, no price fields set, `priceOnRequest` false. Attempt to set `status: 'available'`.
2. Confirm the save is rejected with an error naming the missing title/price requirement (see contracts/vehicles-api.md).
3. Fill in `titleJa` only and set `priceOnRequest: true`. Retry setting `status: 'available'`.
4. Confirm the save now succeeds, even though `titleEn`, `priceJpy`, and `priceUsd` remain blank.
5. On a second, already-`available` vehicle that already has `titleJa` and `priceJpy` persisted from an earlier edit, send an update containing only `{ status: 'available' }` (no title/price fields in this particular request). Confirm it succeeds — the gate evaluates the record's effective (merged) state, not just this request's body.

**Expected**: Publish requires only *a* title and *a* price condition (in any language/currency), not full bilingual/dual-currency completeness, and the check correctly sees fields already persisted from earlier requests.

## Scenario 5 — Migration integrity (FR-009, SC-003)

1. Before migration, record the `titleJa`/`titleEn` (via `title` at `?locale=ja`/`?locale=en`), all other paired-field-source values, and `price`+`currency` for **every** existing vehicle document, keyed by document `id` — `payload.find()`/`GET /api/vehicles` default to 10 results per page, so this snapshot must paginate through every page (`page`/`limit` params, or `limit: 0`/`pagination: false` on the Local API) rather than reading only the first page.
2. Run the migration script.
3. Re-fetch every vehicle document's new paired fields (again paginating through the full collection) and compare against the pre-migration snapshot, matched by `id`, not by list position (list order/pagination boundaries are not guaranteed stable across the two reads).

**Expected**: Every document from the pre-migration snapshot has a matching post-migration document with every value present in its corresponding new field, byte-for-byte — zero listings show missing or altered content, and the pre/post document counts match.

## Automated checks (once implemented)

```bash
npm test                  # component tests — VehicleCard/VehicleFilters paired-field + fallback coverage, vehicle-locale.ts unit tests
npx tsc --noEmit           # payload-types.ts reflects new field names cleanly
npm run test:e2e           # e2e/admin.spec.ts (create/edit + publish gate), e2e/public.spec.ts (fallback + dual-price display)
```
