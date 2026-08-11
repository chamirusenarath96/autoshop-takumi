# Phase 1 Data Model: Paired JA/EN Content and JPY/USD Pricing on Vehicle Listings

## Entity: Vehicle Listing (`Vehicles` collection)

### Field changes

| Current field | Type | Localized? | Replacement field(s) | Type | Notes |
|---|---|---|---|---|---|
| `title` | text | yes | `titleJa`, `titleEn` | text | Required + localized with `defaultLocale: 'ja'` today, so a successfully-created document should have a Japanese value — but this is not a guarantee for every historical row (a pre-existing data gap is possible; see spec.md Edge Cases). Migration copies whatever exists; it does not assume `titleJa` is non-blank. |
| `exteriorColor` | text | yes | `exteriorColorJa`, `exteriorColorEn` | text | |
| `summary` | textarea | yes | `summaryJa`, `summaryEn` | textarea | |
| `highlights[].text` | text (array item) | yes | `highlights[].textJa`, `highlights[].textEn` | text (array item) | Array structure unchanged; only the item's text field is paired |
| `description` | richText | yes | `descriptionJa`, `descriptionEn` | richText | Blank detection for this field is **not** a simple truthiness/trim check — see "Blank detection per field type" below |
| `specs[].label` | text (array item) | yes | `specs[].labelJa`, `specs[].labelEn` | text (array item) | |
| `specs[].value` | text (array item) | yes | `specs[].valueJa`, `specs[].valueEn` | text (array item) | |
| `seoTitle` | text | yes | `seoTitleJa`, `seoTitleEn` | text | |
| `seoDescription` | textarea | yes | `seoDescriptionJa`, `seoDescriptionEn` | textarea | |
| `price` | number | no | `priceJpy` | number | Migrated value if old `currency === 'JPY'` (or `currency` is blank/unrecognized — see Migration mapping), else blank |
| — (new) | — | — | `priceUsd` | number | Migrated value if old `currency === 'USD'`, else blank |
| `currency` | select (JPY/USD) | no | *(removed)* | — | No replacement field — currency is now implied by which price field is set |
| `priceOnRequest` | checkbox | no | `priceOnRequest` | checkbox | **Unchanged** — carried forward as-is |
| `gallery[].caption` | text (array item) | yes | *(unchanged — out of scope)* | — | See spec.md Assumptions: this feature does not touch this field |
| `slug`, `status`, `make`, `model`, `year`, `mileageKm`, `transmission`, `bodyType`, `shakenExpiry`, `heroImage`, `gallery[].image`, `featured`, `relatedVehicles` | (various) | no | *(unchanged)* | — | Out of scope for this feature |

### Blank detection per field type

Presence/blank checks used by both the publish gate and the locale-fallback helper are **not** a single uniform truthiness check — each field type needs its own rule:

- **Plain text/textarea fields** (`titleJa`/`titleEn`, `exteriorColorJa`/`En`, `summaryJa`/`En`, `seoTitleJa`/`En`, `seoDescriptionJa`/`En`, spec label/value, highlight text): a value is "present" if it is a non-empty string after trimming leading/trailing whitespace. A whitespace-only string counts as blank.
- **`richText` fields** (`descriptionJa`/`descriptionEn`): Payload's Lexical editor does not necessarily persist `null`/empty-string when a user clears all content — it can leave behind a JSON structure with an empty paragraph node. A raw truthiness or string-length check on this JSON value would treat that structure as "present" when it is functionally empty, silently suppressing the other language's fallback (FR-006) or the publish gate's title check. Use Payload's own semantic-blank predicate for this field type (e.g. `!hasText(value)` from `@payloadcms/richtext-lexical/shared`, or the equivalent available in the installed Payload version — verify against the exact version in `package.json` during implementation) rather than a plain truthiness/trim check.
- **Number fields** (`priceJpy`, `priceUsd`): a value is "present" if it is a finite number, including `0` — `0` is a valid price and MUST NOT be treated as absent. Presence is `typeof value === 'number' && Number.isFinite(value)`, not JavaScript truthiness (which would treat `0` as falsy/absent).
- **`priceOnRequest`**: the publish gate's price condition is satisfied by `priceOnRequest === true` specifically — `false` (its default) does not satisfy the condition on its own; a listing still needs a JPY or USD price, or an explicit `priceOnRequest: true`, to pass.

### Validation rules

- All eighteen paired content fields remain individually optional at the schema level (no `required: true`) — drafts must stay freely saveable incomplete, per Constitution Principle V.
- `priceJpy` and `priceUsd` remain individually optional at the schema level, same reasoning.
- **Publish gate** (extends the existing `beforeChange` hook that today only checks `heroImage` before allowing `status: 'available'`): additionally requires (`titleJa` present OR `titleEn` present, per the text-field blank-detection rule above) AND (`priceJpy` present OR `priceUsd` present OR `priceOnRequest === true`, per the number-field/checkbox rules above). Error message follows the existing precedent's tone (e.g. `'A title and a price (or "price on request") are required before a vehicle can be set to Available.'`) — a plain, English-only Payload-admin error, consistent with the existing `heroImage` error's precedent (see roadmap issue #19-adjacent spec `002-reduce-required-fields`'s Constitution Check discussion of this same non-localized-error-string precedent).
- **Effective-state evaluation**: like the existing `heroImage` check and the precedent set by `002-reduce-required-fields`'s publish gate, this check MUST evaluate the record's *effective* state — the incoming `PATCH`/update request's data merged over what's already persisted — not just the fields included in a particular request. A `PATCH` that sends only `{ status: 'available' }` against a record that already has `titleJa` and `priceJpy` persisted from an earlier edit MUST pass, since those fields are present in the effective state even though this specific request didn't resend them.
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
| `price` when `currency === 'JPY'`, OR `currency` is blank/`null`/not one of `'JPY'`/`'USD'` | `priceJpy` (defaults to treating an unrecognized/missing currency as JPY, matching the field's existing schema default — see spec.md Assumptions) |
| `price` when `currency === 'USD'` | `priceUsd` (else left blank) |
| `priceOnRequest` | `priceOnRequest` (unchanged) |

**Idempotency is evaluated per target field, not per document.** A document that was only partially migrated (e.g. by an interrupted earlier run) may have `titleJa` already populated while `titleEn`, `priceJpy`, etc. are still blank. The migration MUST check each individual target field before writing it — write a target field only if it is currently blank (`null`, `undefined`, or an empty string; a legitimate empty-string value and an unmigrated blank are indistinguishable, so an already-blank target is always safe to (re)write from its source) — rather than skipping the entire document because *some* new field already has a value. This guarantees a document with any mix of migrated/unmigrated fields converges to fully migrated on re-run, and running the migration twice against a fully-migrated document is a true no-op (every target already has its source's value, so re-writing it is harmless).

## Derived concept: Locale-resolved field (render time only, not persisted)

Not a stored entity — a computed value produced by the `vehicle-locale.ts` helper (see plan.md, research.md §3) at render time, for the nine **content** field pairs only (NOT the price fields — see FR-004 in spec.md, price display is currency-driven, not a locale-fallback concept):

- **Input**: a paired content field's two values (`fieldJa`, `fieldEn`) and the active route locale (`'ja'` | `'en'`).
- **Output**: the value matching the active locale if present (per the field-type-specific blank-detection rule above); otherwise the other language's value if present; otherwise `undefined` (field/row omitted from display, per spec FR-007).
- Applies independently per field — e.g. a spec row's label and value each resolve independently, so a row can legitimately show a Japanese label next to an English value if that's the only content that exists for each half (spec.md Edge Cases).
