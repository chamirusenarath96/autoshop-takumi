# Contract: `/api/vehicles` (existing Payload-generated REST endpoint)

No new endpoint is introduced. This documents the observable **REST** request/response contract changes to the existing, auto-generated Payload endpoints for the `vehicles` collection (`POST /api/vehicles`, `PATCH /api/vehicles/:id`, `GET /api/vehicles`, `GET /api/vehicles/:id`) that result from this feature's field changes.

**Local API scope**: the Local API (`payload.create()`/`payload.update()`/`payload.find()`, used server-side by the public pages and admin UI) runs through the identical field/hook logic — same field names, same publish-gate behavior — but returns the resulting document(s) directly with no `{ doc: ... }`/`{ docs: ... }` wrapper and no HTTP status, and throws a JS error on failure rather than returning an `errors` array.

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

## Listing filter/sort query params (unchanged shape, new underlying field)

`GET /api/vehicles?where[make][equals]=...&sort=price` continues to accept the same query param names as today (`make`, `model`, `bodyType`, `transmission`, `sort=price`/`sort=-price`). Internally, `sort=price` now sorts by the `priceJpy` field (see research.md §4) rather than the old single `price` field — the query param name itself is unchanged, so no caller-visible contract break for filtering/sorting.
