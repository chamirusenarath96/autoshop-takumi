# Phase 0 Research: Paired JA/EN Content and JPY/USD Pricing on Vehicle Listings

## 1. Field pairing mechanism

**Decision**: Replace each `localized: true` field with two plain (non-localized) sibling fields, using a `<base>Ja` / `<base>En` naming convention (e.g. `title` → `titleJa`/`titleEn`), matching exactly the naming already specified in roadmap issue #19's field-level table.

**Rationale**: This is the simplest mechanism available in Payload — no custom field component, no new UI package. It keeps both languages visible in the same admin form render (satisfying spec User Story 1) without any bespoke React work, honoring Constitution Principle VI (no new abstraction without concrete need).

**Alternatives considered**:
- *Payload `tabs` field grouping* (design issue #18's "Option A") — would visually group EN/JA under tabs within the vehicle screen. Rejected for this pass: the roadmap's own follow-up issue (#19) already specifies flat paired fields, not a tabs wrapper, and a tabs UI is presentation-layer polish that can be layered on top of plain paired fields later without another data migration, whereas starting with tabs and later flattening would risk a second migration.
- *Custom side-by-side field component* (design issue #18's "Option C") — more UI engineering for no schema benefit; explicitly deprioritized by the already-decided implementation issues.
- *Keep `localized: true`, add a missing-translation warning* (design issue #18's "Option B") — rejected in the prior decision (see plan.md Complexity Tracking); doesn't remove the admin-wide switcher, which is the stated goal of #18–#20.

## 2. Pricing fields

**Decision**: Replace `price` (number) + `currency` (select: JPY/USD) with two independent number fields, `priceJpy` and `priceUsd`, both optional, no conversion between them. `priceOnRequest` (checkbox) is unchanged and continues to suppress price display regardless of which price field(s) are populated.

**Rationale**: Matches roadmap issue #19's explicit field table. Avoids introducing a currency-conversion dependency or stale FX-rate data (explicitly deprioritized in design issue #18's "Option 3" discussion) — staff enter whatever price(s) they know to be accurate in each currency.

**Alternatives considered**: A single `priceSecondary` + `secondaryCurrency` pair (design issue #18's "Option 1") was the original design recommendation, but the actual implementation issue (#19) that this plan follows specifies two named currency fields instead, which is more explicit and avoids a runtime currency-selector field. This plan follows #19 as the authoritative, already-decided spec.

## 3. Locale-fallback rendering

**Decision**: A small pure helper function (`resolveLocalizedField` or similar, in `src/lib/vehicle-locale.ts`) takes a paired field's two values and the active route locale, returning the active-locale value if non-empty, else the other language's value, else `undefined`. Every public consumer (listing page, detail page, `VehicleCard`) calls this helper instead of reading `titleJa`/`titleEn` directly.

**Rationale**: Centralizing the fallback rule in one tested function (Constitution Principle III/VI) avoids each consumer re-implementing the same `value || fallback` check inconsistently, and gives a single place to unit-test the edge cases from spec.md (both blank, one blank, row-partial fallback for spec label/value pairs).

**Alternatives considered**: Inlining the `?? ` fallback check at each call site was rejected — it's the kind of small-but-repeated logic this repo's existing `formatPrice()` and `slugify()` helpers already demonstrate should be extracted, and duplicating it across the listing page, detail page, and `VehicleCard` risks the checks silently drifting apart.

## 4. Price sort key across two currencies

**Decision**: Sort and range-filter the vehicle listing by the `priceJpy` field only (asc/desc, `priceFrom`/`priceTo`), replacing the current single-`price`-field sort/filter (`where.price.greater_than_equal`/`less_than_equal`, `sort: 'price'`/`'-price'` in `src/app/(public)/[locale]/vehicles/page.tsx`), since JPY was already the collection's default/primary currency. A listing with only a USD price (no `priceJpy`) is excluded from a `priceFrom`/`priceTo`-filtered result, since there is no JPY value to compare against the range, and remains fully visible via normal browsing/pagination when no price filter or sort is applied. Its position under `sort=price`/`sort=-price` is left to whichever `NULL`-ordering the active database applies natively — this feature does **not** attempt to normalize that ordering across databases (see Rationale).

**Rationale**: Comparing a JPY-denominated listing against a USD-denominated one numerically would be meaningless without a conversion this feature explicitly avoids introducing (see §2). Keeping JPY as the canonical sort/filter key requires no new sort logic beyond a field-name swap, and matches spec.md's documented Assumption (FR-012). Payload does not expose nulls-first/nulls-last control on its `sort` parameter — ordering of a `NULL` value is left entirely to the database adapter, with no supported way to override it through a plain `where`/`sort` query (confirmed against Payload's own sort documentation). This repo runs SQLite locally and Postgres in production, and the two engines do not order `NULL` the same way by default, so a USD-only listing's exact position when `sort=priceJpy` is applied will differ between dev and production. Building a guarantee around this (a computed sort field, a raw SQL view, or client-side re-sorting across paginated Local API results) was considered and rejected as disproportionate engineering for what is expected to be a rare edge case, per Constitution Principle VI (no premature abstraction without concrete need) — the dev/prod difference is instead documented as a known, accepted limitation (contracts/vehicles-api.md), not silently left undocumented.

**Alternatives considered**: A conversion-based unified sort key was rejected as out of scope (requires the FX dependency explicitly deprioritized in design issue #18). A dual sort control (sort by JPY price vs. sort by USD price) was considered but adds UI surface with no requirement driving it in spec.md — can be a later feature if real demand appears. Excluding USD-only listings from the listing page entirely (rather than just from price-filtered/sorted views) was rejected as a regression — a USD-priced vehicle is still for sale and must remain browsable. A custom cross-database null-ordering mechanism was considered (see Rationale) and rejected as unwarranted engineering for this feature's scope; it can be revisited if USD-only listings become common enough that the dev/prod sort-position difference causes real confusion.

## 5. Migration approach for existing data

**Decision**: A one-time Node/TypeScript script under `scripts/` (following the existing `scripts/seed.ts` pattern) that reads every `Vehicles` document via Payload's Local API (paginating through the full collection — `payload.find()` defaults to 10 results per page, so the script must iterate `page`/`limit` or request `pagination: false`/`limit: 0`, not assume a single page covers all documents), reads each old localized field's `.ja`/`.en` values and the old `price`+`currency` pair, and writes them into the new paired fields — run once against each environment (local, then production) before the old fields are removed from the collection config. Idempotency is checked **per target field**, not per document (see data-model.md's "Idempotency is evaluated per target field" note) — a document left partially migrated by an interrupted run converges to fully migrated on the next run, and a fully-migrated document's re-run is a true no-op. A legacy `price` with a blank/unrecognized `currency` is mapped to `priceJpy` (see data-model.md's Migration mapping table and spec.md's Assumptions), not silently dropped.

**Rationale**: Matches this repo's documented precedent and its documented cautionary lesson: the retired `/api/internal-init-schema` route (README Known Issues / PR #14 history) shows the anti-pattern to avoid — a network-exposed route gated only by a static nonce. A script run via the same `tsx`/Node path as `scripts/seed.ts` avoids exposing a new HTTP endpoint entirely. (Note: `scripts/seed.ts` itself has a documented `tsx`/`@next/env` interop gotcha in this repo's Known Issues — the migration script should be validated against that same constraint during implementation, not assumed clean.)

**Alternatives considered**: A Payload database migration (`payload migrate:create`) was considered but rejected for the same reason PR #6's history in this repo already rejected it for schema init — this project's `payload` CLI invocation via `tsx` hits a known ESM/CJS interop failure (see README Known Issues), unresolved as of this feature.

## 6. Scope boundary confirmation

**Decision**: This feature touches only `src/collections/Vehicles.ts` and its consumers. `Makes`, `Models`, `Media`, `SiteSettings`, and `Homepage` keep `localized: true` unchanged; `payload.config.ts`'s `localization` block is NOT removed by this feature (removing it would break those collections/globals, which still rely on it).

**Rationale**: Matches roadmap issue #19's explicit "Explicitly out of scope" section and issue #20's framing of the remaining collections/globals as a separate, later migration that depends on this one landing first as a reference implementation.

**Alternatives considered**: N/A — this boundary is a direct, already-decided constraint from the source roadmap issues, not an open design question.
