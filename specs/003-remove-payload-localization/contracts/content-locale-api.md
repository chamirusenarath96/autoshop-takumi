# Contract: Makes / Models / Media / SiteSettings / Homepage REST + Local API

No new endpoint is introduced. This documents the observable **REST** and **Local API** contract changes to the existing, auto-generated Payload endpoints for `makes`, `models`, `media`, the `site-settings` global, and the `homepage` global, resulting from this feature's field changes.

**GraphQL is deliberately not documented here — status unverified, likely non-functional**: `src/app/(payload)/api/[...slug]/route.ts` (this app's REST catch-all) exports only REST handlers, no `GRAPHQL_POST`; the only GraphQL-related route file, `src/app/(payload)/graphql/route.ts`, mounts solely `GRAPHQL_PLAYGROUND_GET` (the interactive query UI) with no POST handler for it to call. This strongly suggests GraphQL queries are not actually reachable in this app today — a pre-existing condition, not something this feature changes. Per spec.md FR-009a, this must be verified empirically (not assumed from this note) before treating any GraphQL claim in spec.md as binding; if implementation confirms GraphQL is functional after all, this contract doc should be extended with GraphQL request/response examples at that point, mirroring the REST examples below.

**Local API scope**: `payload.find({ collection: 'makes' | 'models' | 'media' })` and `payload.findGlobal({ slug: 'site-settings' | 'homepage' })` run through the identical field logic as REST — same field names — but their return shapes differ from REST's envelope, matching the precedent already documented in spec 002/issue #19's `contracts/vehicles-api.md`: `payload.find(...)` returns a paginated `{ docs: [...], totalDocs, ... }` object, not a bare array; the migration script must paginate through `makes`/`models`/`media` (`payload.find()` defaults to 10 results per page) rather than assuming one call returns the full collection. `payload.findGlobal(...)` returns the global document directly, no wrapper.

**Locale scope removed**: before this feature, reading/writing `name` (Makes/Models), `alt` (Media), or any of the SiteSettings/Homepage fields listed in data-model.md required a `?locale=` query param (REST) or `{ locale: 'ja' | 'en' }` option (Local API) to select which language's value was returned — omitting it defaulted to `ja` (the collection's `defaultLocale`). After this feature, every request reads/writes these fields explicitly by paired field name (`nameJa`/`nameEn`, etc.) — `?locale=`/`{ locale }` no longer has any effect on them. Once issue #19 has also completed its equivalent migration for `Vehicles`, and this feature's FR-008 removes the `localization` block from `payload.config.ts` entirely, `?locale=`/`{ locale }` becomes a no-op across the whole API surface — see spec.md FR-009/Edge Cases: this must be verified empirically against the running server before that removal, not assumed.

## `GET /api/makes` / `GET /api/models` (read)

### Before this feature

```
GET /api/makes?locale=en
```
```json
{ "docs": [ { "id": "m1", "name": "Toyota" } ], "totalDocs": 1 }
```
A separate request with `?locale=ja` would return the same documents with `name` resolved to the Japanese value instead.

### After this feature

```
GET /api/makes
```
```json
{ "docs": [ { "id": "m1", "nameJa": "トヨタ", "nameEn": "Toyota" } ], "totalDocs": 1 }
```
Both languages are present in a single response, regardless of any `?locale=` param. The vehicle listing page's filter labels pick which one to display using the active site locale, with the fallback rule from data-model.md when one language is blank (spec FR-012).

## `GET /api/globals/site-settings` / `GET /api/globals/homepage` (global read)

### Before this feature

```
GET /api/globals/site-settings?locale=en
```
```json
{ "shopName": "Autoshop Takumi", "address": "1-2-3 Example St, Tokyo" }
```

### After this feature

```
GET /api/globals/site-settings
```
```json
{
  "shopNameJa": "オートショップ匠",
  "shopNameEn": "Autoshop Takumi",
  "addressJa": "東京都...",
  "addressEn": "1-2-3 Example St, Tokyo"
}
```
`src/lib/site-settings.ts`'s `getSiteSettings(locale)` is the sole consumer that resolves these paired fields down to the shape its own callers (Header, Footer, About page) already expect — see research.md §4. Callers of `getSiteSettings(locale)` itself see no contract change; only the internal Local API call it makes changes.

## `PATCH /api/makes/:id` (write) — representative of Makes/Models

### Before this feature

```json
// PATCH /api/makes/m1?locale=ja
{ "name": "トヨタ" }
```
A second, separate `PATCH ?locale=en` request was required to add the English name.

### After this feature

```json
// PATCH /api/makes/m1 (no locale param needed or meaningful)
{ "nameJa": "トヨタ", "nameEn": "Toyota" }
```
Both languages can be set in a single request; each half remains individually editable — except `Makes.name`/`Models.name` themselves, which per spec FR-013 require at least one of `nameJa`/`nameEn` be non-blank (they are schema-`required: true` today; see data-model.md).

## `PATCH /api/media/:id` (write)

```json
// After this feature
{ "altJa": "赤いトヨタ・スープラの側面写真", "altEn": "Side view of a red Toyota Supra" }
```
Both independently optional (Media's `alt` is not schema-required today).

## `PATCH /api/globals/site-settings` (write)

```json
// After this feature
{
  "shopNameJa": "オートショップ匠",
  "shopNameEn": "Autoshop Takumi",
  "addressJa": "東京都...",
  "addressEn": "1-2-3 Example St, Tokyo",
  "defaultSeoTitleJa": "オートショップ匠 | 中古車販売",
  "defaultSeoTitleEn": "Autoshop Takumi | Used Cars",
  "defaultSeoDescriptionJa": "...",
  "defaultSeoDescriptionEn": "..."
}
```
`shopNameJa`/`shopNameEn` require at least one non-blank (FR-013, `shopName` is schema-`required: true` today); `address`/`defaultSeoTitle`/`defaultSeoDescription` pairs remain fully optional in both languages.

## `PATCH /api/globals/homepage` (write)

```json
// After this feature
{
  "heroHeadingJa": "匠の技術で選ぶ、あなたの一台",
  "heroHeadingEn": "Your car, chosen with a craftsman's eye",
  "heroSubheadingJa": "...",
  "heroSubheadingEn": "...",
  "aboutBlurbJa": { "root": { "children": [ /* Lexical JSON */ ] } },
  "aboutBlurbEn": { "root": { "children": [ /* Lexical JSON */ ] } },
  "whyUsPoints": [
    { "headingJa": "豊富な在庫", "headingEn": "Wide selection", "bodyJa": "...", "bodyEn": "..." }
  ],
  "contactSummaryJa": { "root": { "children": [ /* Lexical JSON */ ] } },
  "contactSummaryEn": { "root": { "children": [ /* Lexical JSON */ ] } }
}
```
`whyUsPoints[].headingJa`/`headingEn` require at least one non-blank per array item (FR-013, `whyUsPoints[].heading` is schema-`required: true` today); every other field pair here (`heroHeading`, `heroSubheading`, `aboutBlurb`, `whyUsPoints[].body`, `contactSummary`) remains fully optional in both languages.

## Migration script (Local API, one-time, not a public contract)

`scripts/migrate-content-locale-fields.ts` reads existing per-locale values via `payload.find({ collection, locale: 'ja', fallbackLocale: false })` / `{ locale: 'en', fallbackLocale: false }` (and the global equivalent) for each of the five schemas, and writes the paired fields via `payload.update`/`payload.updateGlobal` with no `locale` option — per data-model.md's migration mapping and per-field idempotency rule. **`fallbackLocale: false` is required on every read**: `payload.config.ts` sets `fallback: true`, so omitting it would let a blank `en` value silently resolve to the `ja` value instead of staying blank (spec FR-014). This is an internal one-time operation, not a REST/Local API contract consumed by the application at runtime, and is removed or left inert after it has been run against production (matching issue #19's precedent and this repo's `/api/internal-init-schema` cautionary lesson).
