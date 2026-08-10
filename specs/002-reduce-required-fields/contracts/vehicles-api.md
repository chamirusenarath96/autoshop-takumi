# Contract: `/api/vehicles` (existing Payload-generated REST endpoint)

No new endpoint is introduced. This documents the observable **REST** request/response contract changes to the existing, auto-generated Payload endpoints for the `vehicles` collection (`POST /api/vehicles`, `PATCH /api/vehicles/:id`) that result from this feature's field and hook changes — HTTP status codes and the `{ doc: ... }` / `{ errors: [...] }` response envelope shown below are REST-specific.

**Local API scope**: the Local API (`payload.create()`/`payload.update()`, used server-side by the admin UI and any server-side code) runs through the identical field/hook logic, so the same completeness and slug-generation *behavior* applies — but its interface shape differs from REST: it returns the resulting document directly (no `{ doc: ... }` wrapper, no HTTP status) and throws a JS error on failure rather than returning an `errors` array. See plan.md's Technical Context for where the Local API is used in this codebase.

**Locale scope**: `title` (or `titleEn`, depending on schema — see spec.md Assumptions) is a **localized** field with the collection's `defaultLocale` set to `ja`. Every example below that reads or writes `title` under the not-yet-split schema explicitly targets the `en` locale (`?locale=en` on REST, `{ locale: 'en' }` on the Local API) — a request with no locale scope would read/write the *Japanese* value instead, which is not what this feature's slug generation sources from.

## `POST /api/vehicles?locale=en` (create)

### Before this feature

```json
// Request missing slug/make/model/year
{
  "title": "1999 Toyota Supra RZ",
  "status": "draft"
}
```
```json
// Response: 400 — validation errors on slug, make, model, year (all required)
```

### After this feature

```json
// Same request
{
  "title": "1999 Toyota Supra RZ",
  "status": "draft"
}
```
```json
// Response: 201
{
  "doc": {
    "id": "...",
    "title": "1999 Toyota Supra RZ",
    "slug": "1999-toyota-supra-rz",
    "status": "draft",
    "make": null,
    "model": null,
    "year": null
    // ...other fields
  }
}
```

- `slug` is present in the response even though it was omitted from the request (auto-generated from the `en`-locale `title` in this request).
- `make`/`model`/`year` may be `null`/absent — no longer rejected at create time for a draft.
- If a request supplies a non-blank `slug`, that exact value is used (subject to the pre-existing uniqueness constraint) and is not overwritten.
- If the auto-generated slug would collide with an existing vehicle's `slug`, the response's `doc.slug` is a disambiguated value (e.g. `1999-toyota-supra-rz-2`) rather than a `409`/validation error — this guarantee holds for sequential (non-same-instant) creates; see spec.md's Edge Cases for the out-of-scope same-instant race case.

## `PATCH /api/vehicles/:id` (update, including publish)

### Before this feature

Only `heroImage` was checked before allowing `status: 'available'`:

```json
// PATCH body
{ "status": "available" }
```
```json
// Response if heroImage missing: 400
{ "errors": [{ "message": "A hero image is required before a vehicle can be set to Available." }] }
```

### After this feature

The same transition additionally checks `make`, `model`, `year` — evaluated against the record's **effective** state (this request's body merged over what's already persisted), not just the fields this particular `PATCH` happens to include:

```json
// Vehicle currently persisted with heroImage, make, model, and year all already set
// (from an earlier edit) — this PATCH only sends the status change:
{ "status": "available" }
```
```json
// Response: 200 — make/model/year aren't in this request body, but ARE already
// on the record, so the effective check sees them as present:
{ "doc": { "status": "available", "make": "...", "model": "...", "year": 1999, ... } }
```

```json
// A different vehicle, currently persisted with make and year set but model still empty:
{ "status": "available" }
```
```json
// Response: 400 — only `model` is actually missing, so only it is named:
{ "errors": [{ "message": "A model is required before a vehicle can be set to Available." }] }
```

- A `PATCH` that does **not** attempt to change `status` to `available` (e.g. editing `price`, or moving `draft` → `draft`) is unaffected by this gate, per FR-011 — it succeeds regardless of `make`/`model`/`year`/`heroImage` completeness.
- A `PATCH` moving between any two non-`available` statuses (e.g. `reserved` → `sold`) is unaffected by this gate.
- A `PATCH` moving a `reserved` or `sold` vehicle back to `available` is gated identically to a `draft` → `available` transition — the check is keyed on the destination status, not the origin.

## Backward compatibility

- Existing vehicle records with a hand-entered `slug` are read and re-saved unchanged — a `PATCH` that doesn't touch `slug` never triggers the auto-generation hook, because the hook checks the record's *effective* slug (this request merged over what's persisted), not merely whether `slug` is present in this particular request body.
- Existing vehicle records already `status: 'available'` are not re-validated retroactively by this feature — the gate only runs on a `beforeChange` write whose effective destination `status` is `available`, not on reads or on saves that leave `status` unchanged.
