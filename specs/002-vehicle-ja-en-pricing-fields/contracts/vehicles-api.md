# Contract: `/api/vehicles` (existing Payload-generated REST endpoint)

No new endpoint is introduced. This documents the observable **REST** request/response contract changes to the existing, auto-generated Payload endpoints for the `vehicles` collection (`POST /api/vehicles`, `PATCH /api/vehicles/:id`, `GET /api/vehicles`, `GET /api/vehicles/:id`) that result from this feature's field changes.

**Local API scope**: the Local API (`payload.create()`/`payload.update()`/`payload.find()`, used server-side by the public pages and admin UI) runs through the identical field/hook logic — same field names, same publish-gate behavior — but its return shape differs by operation, and differs from REST's envelope:
- `payload.create(...)` and a single-document `payload.update({ id, ... })` return the resulting document **directly** (no `{ doc: ... }` wrapper, no HTTP status), throwing a JS error on failure rather than returning an `errors` array.
- `payload.find(...)` returns a **paginated result object** — `{ docs: [...], totalDocs, limit, page, totalPages, hasNextPage, hasPrevPage, ... }` — not an array of documents directly and not a `{ doc: ... }` shape. Code reading vehicle listings via `payload.find()` (the public listing page, the migration script) must read `.docs`, and the migration script in particular must paginate through every page (`payload.find()` defaults to 10 results per page) rather than assuming one call returns the full collection.

**Locale scope removed**: before this feature, reading/writing the nine content fields required a `?locale=` query param (REST) or `{ locale: 'ja' | 'en' }` option (Local API) to select which language's value was returned — omitting it defaulted to `ja` (the collection's `defaultLocale`). After this feature, every request reads/writes both languages explicitly by field name (`titleJa`, `titleEn`, etc.) — `?locale=`/`{ locale }` no longer has any effect on this collection's own fields (it may still matter for relationship lookups into still-localized collections like `Makes`/`Models`, which are unaffected by this feature).

## `GET /api/vehicles` / `GET /api/vehicles/:id` (read)

### Before this feature

```
GET /api/vehicles/abc123?locale=en
```
```json
{
  "id": "abc123",
  "title": "1999 Toyota Supra RZ",
  "price": 4500000,
  "currency": "JPY",
  "priceOnRequest": false
}
```
A separate request with `?locale=ja` would return the same document with `title` resolved to its Japanese value instead — the two languages were never visible in the same response.

### After this feature

```
GET /api/vehicles/abc123
```
```json
{
  "id": "abc123",
  "titleJa": "1999 トヨタ スープラ RZ",
  "titleEn": "1999 Toyota Supra RZ",
  "priceJpy": 4500000,
  "priceUsd": null,
  "priceOnRequest": false
}
```
Both languages and both currency fields are present in a single response, regardless of any `?locale=` param — the caller (public page, admin UI) picks which field to display using the active site locale, with the fallback rule from data-model.md when one language is blank.

## `POST /api/vehicles` (create)

### Before this feature

```json
// POST /api/vehicles?locale=ja
{
  "title": "1999 トヨタ スープラ RZ",
  "price": 4500000,
  "currency": "JPY",
  "status": "draft"
}
```
A second, separate `PATCH ?locale=en` request was required to add the English title.

### After this feature

```json
// POST /api/vehicles (no locale param needed)
{
  "titleJa": "1999 トヨタ スープラ RZ",
  "titleEn": "1999 Toyota Supra RZ",
  "priceJpy": 4500000,
  "status": "draft"
}
```
```json
// Response: 201
{
  "doc": {
    "id": "...",
    "titleJa": "1999 トヨタ スープラ RZ",
    "titleEn": "1999 Toyota Supra RZ",
    "priceJpy": 4500000,
    "priceUsd": null,
    "priceOnRequest": false,
    "status": "draft"
  }
}
```
Both languages are set in a single request. `titleEn`, `priceUsd`, and every other paired field remain optional — a request supplying only `titleJa` and `priceJpy` succeeds identically for a draft.

## `PATCH /api/vehicles/:id` (update, including publish)

### Before this feature

Only `heroImage` was checked before allowing `status: 'available'`.

### After this feature

The publish-gate `beforeChange` hook additionally requires, evaluated against the record's **effective** state (this request's body merged over what's already persisted): (`titleJa` OR `titleEn`) non-empty, AND (`priceJpy` OR `priceUsd` OR `priceOnRequest`) set.

```json
// Vehicle currently persisted with heroImage and titleJa already set, no price fields set,
// priceOnRequest false — this PATCH only sends the status change:
{ "status": "available" }
```
```json
// Response: 400
{
  "errors": [
    { "message": "A title and a price (or \"price on request\") are required before a vehicle can be set to Available." }
  ]
}
```

```json
// Same vehicle, this PATCH also sets priceOnRequest:
{ "status": "available", "priceOnRequest": true }
```
```json
// Response: 200 — title (titleJa) and a price condition (priceOnRequest) are both now
// satisfied; titleEn and priceJpy/priceUsd may remain blank
{
  "doc": {
    "id": "...",
    "status": "available",
    "priceOnRequest": true
  }
}
```

## Listing filter/sort query params

`make`/`model`/`bodyType`/`transmission` filter query params are unchanged. Price filtering and sorting change field targets — this is a real, code-level change, not just an internal detail, since `src/app/(public)/[locale]/vehicles/page.tsx` currently constructs `where.price.greater_than_equal`/`less_than_equal` from `sp.priceFrom`/`sp.priceTo`, and maps `sp.sort` values `priceLow`/`priceHigh` to Payload `sort` values `'price'`/`'-price'` — all three target the field this feature removes.

### Before this feature

```
GET /api/vehicles?where[price][greater_than_equal]=1000000&where[price][less_than_equal]=5000000&sort=price
```

### After this feature

```
GET /api/vehicles?where[priceJpy][greater_than_equal]=1000000&where[priceJpy][less_than_equal]=5000000&sort=priceJpy
```

The user-facing query param names the listing page itself accepts (`priceFrom`, `priceTo`, `sort=priceLow`/`priceHigh`) are unchanged — only the internal Payload `where`/`sort` field name they're translated into changes, from `price` to `priceJpy`.

**Missing-`priceJpy` behavior** (a listing with a USD price but no JPY price, per research.md §4): such a listing is excluded from a `where[priceJpy]`-filtered result (there is no JPY value to compare against the range) and sorts after every JPY-priced listing under both `sort=priceJpy` and `sort=-priceJpy` — implementations must not rely on the database's native `NULL`-ordering default, since SQLite (local dev) and Postgres (production) order nulls differently by default. The listing remains visible via normal pagination when no price filter/sort is applied.
