# Phase 1 Data Model: Paired JA/EN Content and JPY/USD Pricing on Vehicle Listings

## Entity: Vehicle Listing (`Vehicles` collection)

### Field changes

| Current field | Type | Localized? | Replacement field(s) | Type | Notes |
|---|---|---|---|---|---|
| `title` | text | yes | `titleJa`, `titleEn` | text | `titleJa` always populated post-migration (was required + default-locale `ja`); `titleEn` may be blank |
| `exteriorColor` | text | yes | `exteriorColorJa`, `exteriorColorEn` | text | |
| `summary` | textarea | yes | `summaryJa`, `summaryEn` | textarea | |
| `highlights[].text` | text (array item) | yes | `highlights[].textJa`, `highlights[].textEn` | text (array item) | Array structure unchanged; only the item's text field is paired |
| `description` | richText | yes | `descriptionJa`, `descriptionEn` | richText | |
| `specs[].label` | text (array item) | yes | `specs[].labelJa`, `specs[].labelEn` | text (array item) | |
| `specs[].value` | text (array item) | yes | `specs[].valueJa`, `specs[].valueEn` | text (array item) | |
| `seoTitle` | text | yes | `seoTitleJa`, `seoTitleEn` | text | |
| `seoDescription` | textarea | yes | `seoDescriptionJa`, `seoDescriptionEn` | textarea | |
| `price` | number | no | `priceJpy` | number | Migrated value if old `currency === 'JPY'`, else blank |
| — (new) | — | — | `priceUsd` | number | Migrated value if old `currency === 'USD'`, else blank |
| `currency` | select (JPY/USD) | no | *(removed)* | — | No replacement field — currency is now implied by which price field is set |
| `priceOnRequest` | checkbox | no | `priceOnRequest` | checkbox | **Unchanged** — carried forward as-is |
| `slug`, `status`, `make`, `model`, `year`, `mileageKm`, `transmission`, `bodyType`, `shakenExpiry`, `heroImage`, `gallery`, `featured`, `relatedVehicles` | (various) | no | *(unchanged)* | — | Out of scope for this feature |

### Validation rules

- All eighteen paired content fields remain individually optional at the schema level (no `required: true`) — drafts must stay freely saveable incomplete, per Constitution Principle V.
- `priceJpy` and `priceUsd` remain individually optional at the schema level, same reasoning.
- **Publish gate** (extends the existing `beforeChange` hook that today only checks `heroImage` before allowing `status: 'available'`): additionally requires (`titleJa` OR `titleEn`) is non-empty AND (`priceJpy` OR `priceUsd` OR `priceOnRequest`) is set. Error message follows the existing precedent's tone (e.g. `'A title and a price (or "price on request") are required before a vehicle can be set to Available.'`) — a plain, English-only Payload-admin error, consistent with the existing `heroImage` error's precedent (see roadmap issue #19-adjacent spec `002-reduce-required-fields`'s Constitution Check discussion of this same non-localized-error-string precedent).
- No schema-level validation ties `titleJa`/`titleEn` (or any other pair) to each other — a listing may legitimately have only one language populated at any status, consistent with spec.md's Assumptions (full bilingual completeness is a display-fallback concern, not a publish blocker).

### Migration mapping (one-time, existing documents only)

For every existing `Vehicles` document, before the old fields are removed from the collection schema:

| Source (old, per-locale) | Target (new, paired) |
|---|---|
| `title` read with `locale: 'ja'` | `titleJa` |
| `title` read with `locale: 'en'` | `titleEn` |
| `exteriorColor` (ja / en) | `exteriorColorJa` / `exteriorColorEn` |
| `summary` (ja / en) | `summaryJa` / `summaryEn` |
| `highlights[].text` (ja / en), per array index | `highlights[].textJa` / `textEn`, same index |
| `description` (ja / en) | `descriptionJa` / `descriptionEn` |
| `specs[].label` (ja / en), per array index | `specs[].labelJa` / `labelEn`, same index |
| `specs[].value` (ja / en), per array index | `specs[].valueJa` / `valueEn`, same index |
| `seoTitle` (ja / en) | `seoTitleJa` / `seoTitleEn` |
| `seoDescription` (ja / en) | `seoDescriptionJa` / `seoDescriptionEn` |
| `price` when `currency === 'JPY'` | `priceJpy` (else left blank) |
| `price` when `currency === 'USD'` | `priceUsd` (else left blank) |
| `priceOnRequest` | `priceOnRequest` (unchanged) |

Migration is idempotent: a document whose new paired fields are already populated is left untouched on a re-run (detected by checking whether any new field already has a non-null value before writing).

## Derived concept: Locale-resolved field (render time only, not persisted)

Not a stored entity — a computed value produced by the `vehicle-locale.ts` helper (see plan.md, research.md §3) at render time:

- **Input**: a paired field's two values (`fieldJa`, `fieldEn`) and the active route locale (`'ja'` | `'en'`).
- **Output**: the value matching the active locale if non-empty; otherwise the other language's value if non-empty; otherwise `undefined` (field/row omitted from display, per spec FR-006).
- Applies independently per field — e.g. a spec row's label and value each resolve independently, so a row can legitimately show a Japanese label next to an English value if that's the only content that exists for each half (spec.md Edge Cases).
