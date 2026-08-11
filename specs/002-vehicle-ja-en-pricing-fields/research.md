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

**Decision**: Continue sorting the vehicle listing by the `priceJpy` field only (asc/desc), unchanged from today's single-`price`-field sort, since JPY was already the collection's default/primary currency.

**Rationale**: Comparing a JPY-denominated listing against a USD-denominated one numerically would be meaningless without a conversion this feature explicitly avoids introducing (see §2). Keeping JPY as the canonical sort key requires no new sort logic and matches spec.md's documented Assumption.

**Alternatives considered**: A conversion-based unified sort key was rejected as out of scope (requires the FX dependency explicitly deprioritized in design issue #18). A dual sort control (sort by JPY price vs. sort by USD price) was considered but adds UI surface with no requirement driving it in spec.md — can be a later feature if real demand appears.

## 5. Migration approach for existing data

**Decision**: A one-time Node/TypeScript script under `scripts/` (following the existing `scripts/seed.ts` pattern) that reads every `Vehicles` document via Payload's Local API, reads each old localized field's `.ja`/`.en` values and the old `price`+`currency` pair, and writes them into the new paired fields — run once against each environment (local, then production) before the old fields are removed from the collection config, then safe to leave in the repo since re-running it against already-migrated documents is a no-op (paired fields already populated, nothing to overwrite).

**Rationale**: Matches this repo's documented precedent and its documented cautionary lesson: the retired `/api/internal-init-schema` route (README Known Issues / PR #14 history) shows the anti-pattern to avoid — a network-exposed route gated only by a static nonce. A script run via the same `tsx`/Node path as `scripts/seed.ts` avoids exposing a new HTTP endpoint entirely. (Note: `scripts/seed.ts` itself has a documented `tsx`/`@next/env` interop gotcha in this repo's Known Issues — the migration script should be validated against that same constraint during implementation, not assumed clean.)

**Alternatives considered**: A Payload database migration (`payload migrate:create`) was considered but rejected for the same reason PR #6's history in this repo already rejected it for schema init — this project's `payload` CLI invocation via `tsx` hits a known ESM/CJS interop failure (see README Known Issues), unresolved as of this feature.

## 6. Scope boundary confirmation

**Decision**: This feature touches only `src/collections/Vehicles.ts` and its consumers. `Makes`, `Models`, `Media`, `SiteSettings`, and `Homepage` keep `localized: true` unchanged; `payload.config.ts`'s `localization` block is NOT removed by this feature (removing it would break those collections/globals, which still rely on it).

**Rationale**: Matches roadmap issue #19's explicit "Explicitly out of scope" section and issue #20's framing of the remaining collections/globals as a separate, later migration that depends on this one landing first as a reference implementation.

**Alternatives considered**: N/A — this boundary is a direct, already-decided constraint from the source roadmap issues, not an open design question.
