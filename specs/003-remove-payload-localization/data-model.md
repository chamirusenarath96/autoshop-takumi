# Phase 1 Data Model: Retire Payload Localization on Makes, Models, Media, SiteSettings, and Homepage

## Entity: Make (`Makes` collection)

| Current field | Type | Localized? | Replacement field(s) | Type | Notes |
|---|---|---|---|---|---|
| `name` | text | yes | `nameJa`, `nameEn` | text | Used as the vehicle listing's make filter label |
| `slug` (if present) | text | no | *(unchanged)* | — | Out of scope |

## Entity: Model (`Models` collection)

| Current field | Type | Localized? | Replacement field(s) | Type | Notes |
|---|---|---|---|---|---|
| `name` | text | yes | `nameJa`, `nameEn` | text | Used as the vehicle listing's model filter label |
| `make` (relationship) | relationship | no | *(unchanged)* | — | Out of scope |

## Entity: Media (`Media` collection)

| Current field | Type | Localized? | Replacement field(s) | Type | Notes |
|---|---|---|---|---|---|
| `alt` | text | yes | `altJa`, `altEn` | text | Accessibility/SEO `<img>`/`<Image>` alt attribute on the public site |
| size variants, upload data | (various) | no | *(unchanged)* | — | Out of scope |

## Entity: SiteSettings (global, singleton)

| Current field | Type | Localized? | Replacement field(s) | Type | Notes |
|---|---|---|---|---|---|
| `shopName` | text | yes | `shopNameJa`, `shopNameEn` | text | |
| `address` | textarea | yes | `addressJa`, `addressEn` | textarea | |
| `defaultSeoTitle` | text | yes | `defaultSeoTitleJa`, `defaultSeoTitleEn` | text | |
| `defaultSeoDescription` | textarea | yes | `defaultSeoDescriptionJa`, `defaultSeoDescriptionEn` | textarea | |
| `contactEmail`, `contactPhone`, `logo`, `socialLinks`, `notificationEmails`, `showSoldVehicles` | (various) | no | *(unchanged)* | — | Not localized today; out of scope |

## Entity: Homepage (global, singleton)

| Current field | Type | Localized? | Replacement field(s) | Type | Notes |
|---|---|---|---|---|---|
| `heroHeading` | text | yes | `heroHeadingJa`, `heroHeadingEn` | text | |
| `heroSubheading` | text | yes | `heroSubheadingJa`, `heroSubheadingEn` | text | |
| `aboutBlurb` | richText | yes | `aboutBlurbJa`, `aboutBlurbEn` | richText | Blank detection for this field is **not** a simple truthiness/trim check — see "Blank detection per field type" below |
| `whyUsPoints[].heading` | text (array item) | yes | `whyUsPoints[].headingJa`, `whyUsPoints[].headingEn` | text (array item) | Array structure unchanged; only the item's text fields are paired |
| `whyUsPoints[].body` | text (array item) | yes | `whyUsPoints[].bodyJa`, `whyUsPoints[].bodyEn` | text (array item) | |
| `contactSummary` | richText | yes | `contactSummaryJa`, `contactSummaryEn` | richText | Same non-trivial blank-detection rule as `aboutBlurb` |
| `heroImage`, featured-vehicle picks | (various) | no | *(unchanged)* | — | Out of scope |

## Blank detection per field type

Presence/blank checks used by the locale-fallback helper (§ below) are **not** a single uniform truthiness check — matching the precedent already established in issue #19/spec 002's data-model.md:

- **Plain text/textarea fields** (`nameJa`/`En`, `altJa`/`En`, `shopNameJa`/`En`, `addressJa`/`En`, `defaultSeoTitleJa`/`En`, `defaultSeoDescriptionJa`/`En`, `heroHeadingJa`/`En`, `heroSubheadingJa`/`En`, `whyUsPoints[].headingJa`/`En`, `whyUsPoints[].bodyJa`/`En`): a value is "present" if it is a non-empty string after trimming leading/trailing whitespace. A whitespace-only string counts as blank.
- **`richText` fields** (`aboutBlurbJa`/`En`, `contactSummaryJa`/`En`): Payload's Lexical editor does not necessarily persist `null`/empty-string when a user clears all content — it can leave behind a JSON structure with an empty paragraph node. Use Payload's own semantic-blank predicate for this field type (e.g. `!hasText(value)` from `@payloadcms/richtext-lexical/shared`, or the equivalent available in the installed Payload version — verify against the exact version in `package.json` during implementation), matching issue #19's identical precedent for `descriptionJa`/`descriptionEn`, rather than a plain truthiness/trim check.

## Validation rules

- Thirteen source fields become twenty-six paired fields: Makes 1 (`name`) → 2, Models 1 (`name`) → 2, Media 1 (`alt`) → 2, SiteSettings 4 (`shopName`, `address`, `defaultSeoTitle`, `defaultSeoDescription`) → 8, Homepage 6 (`heroHeading`, `heroSubheading`, `aboutBlurb`, `whyUsPoints[].heading`, `whyUsPoints[].body`, `contactSummary`) → 12. Total: 2+2+2+8+12 = 26.
- **Most paired fields remain individually optional** at the schema level (no `required: true` on either half) — drafts and singleton globals must stay freely saveable incomplete, per Constitution Principle V. This matches current behavior for fields that are not schema-required today.
- **Exception — four currently-required fields**: `Makes.name`, `Models.name`, `SiteSettings.shopName`, and `Homepage.whyUsPoints[].heading` are `required: true` in the schema today (verified against `src/collections/Makes.ts`, `src/collections/Models.ts`, `src/globals/SiteSettings.ts`, `src/globals/Homepage.ts`). Simply making both `nameJa`/`nameEn` (etc.) independently optional, with no replacement check, would silently permit a record with *neither* language filled in — a regression from today, where the field can never be entirely blank. Per spec FR-013, each of these four fields' paired replacement needs a validation step (a Payload field-level `validate` function on one half of the pair, or a collection/global-level `beforeValidate`/`beforeChange` hook) requiring at least one of the two language values be non-blank, using the same blank-detection rule as above (trimmed non-empty check — none of these four are richText fields). Each half remains individually editable/optional on its own — the constraint is "at least one of the two," not "both."
- No schema-level validation otherwise ties a field's `*Ja`/`*En` pair to each other beyond the FR-013 exception above — a Make, Model, Media item, or globals field may legitimately have only one language populated, same as today.
- None of these five schemas has a publish-gate concept comparable to `Vehicles`' `status: 'available'` check — no new `beforeChange` *publish* gate is introduced by this feature; the FR-013 at-least-one-language check above is a save-time field validation, not a status-transition gate (see plan.md Constitution Check, Principle V).

## Migration mapping (one-time, existing documents/globals only)

For every existing Make, Model, and Media document, and the SiteSettings and Homepage globals, before the old fields are removed from their schemas:

**Critical**: `payload.config.ts` currently sets `fallback: true` on its `localization` config. Every locale-scoped read below MUST pass `fallbackLocale: false` (Payload's Local API option to disable this) — otherwise a genuinely-blank `en` value would silently resolve to the `ja` value instead of `null`/empty, and the migration would fabricate an English value that staff never actually entered (spec FR-014). This applies to every row in the table below.

| Source (old, per-locale, read with `fallbackLocale: false`) | Target (new, paired) |
|---|---|
| `Makes.name` read with `locale: 'ja'` / `'en'` | `nameJa` / `nameEn` |
| `Models.name` read with `locale: 'ja'` / `'en'` | `nameJa` / `nameEn` |
| `Media.alt` read with `locale: 'ja'` / `'en'` | `altJa` / `altEn` |
| `SiteSettings.shopName` (ja / en) | `shopNameJa` / `shopNameEn` |
| `SiteSettings.address` (ja / en) | `addressJa` / `addressEn` |
| `SiteSettings.defaultSeoTitle` (ja / en) | `defaultSeoTitleJa` / `defaultSeoTitleEn` |
| `SiteSettings.defaultSeoDescription` (ja / en) | `defaultSeoDescriptionJa` / `defaultSeoDescriptionEn` |
| `Homepage.heroHeading` (ja / en) | `heroHeadingJa` / `heroHeadingEn` |
| `Homepage.heroSubheading` (ja / en) | `heroSubheadingJa` / `heroSubheadingEn` |
| `Homepage.aboutBlurb` (ja / en) | `aboutBlurbJa` / `aboutBlurbEn` |
| `Homepage.whyUsPoints[].heading` (ja / en), per array index | `whyUsPoints[].headingJa` / `headingEn`, same index |
| `Homepage.whyUsPoints[].body` (ja / en), per array index | `whyUsPoints[].bodyJa` / `bodyEn`, same index |
| `Homepage.contactSummary` (ja / en) | `contactSummaryJa` / `contactSummaryEn` |

A source field with neither language populated (a pre-existing data gap) migrates as both new paired fields blank — the migration never fabricates a value (spec.md Edge Cases).

**Idempotency is evaluated per target field, not per document/global**, matching issue #19's identical precedent: the migration checks each individual target field before writing it — write a target field only if it is currently blank — rather than skipping an entire document/global because *some* new field already has a value. A document/global with any mix of migrated/unmigrated fields converges to fully migrated on re-run; re-running against fully-migrated data is a true no-op.

## Derived concept: Locale-resolved field (render time only, not persisted)

Not a stored entity — a computed value produced by the shared `content-locale.ts` helper (see plan.md, research.md §2), reused identically by this feature's five schemas and issue #19's `Vehicles` migration.

**Canonical signature** (the one form every reference in this spec/plan/research/tasks set uses — resolving the value, not pre-selecting it, is the helper's job): `resolveLocalizedField(fieldJa: T, fieldEn: T, activeLocale: 'ja' | 'en'): T | undefined`

- **Input**: a paired field's two raw values (`fieldJa`, `fieldEn`) and the active route locale — the caller does NOT pre-decide which value is "active" vs. "fallback"; the helper does that internally based on `activeLocale`.
- **Output**: the value matching `activeLocale` if present (per the field-type-specific blank-detection rule above); otherwise the other language's value if present; otherwise `undefined`.
- Applies independently per field — e.g. a `whyUsPoints[]` array item's heading and body each resolve independently, so an item can legitimately show a Japanese heading next to an English body if that's the only content that exists for each half.
