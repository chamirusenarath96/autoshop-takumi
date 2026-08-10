# Contract: `/api/vehicles` (existing Payload-generated REST endpoint)

No new endpoint is introduced. This documents the observable request/response contract changes to the existing, auto-generated Payload REST endpoints for the `vehicles` collection (`POST /api/vehicles`, `PATCH /api/vehicles/:id`) that result from this feature's field and hook changes. The Local API (`payload.create()`/`payload.update()`, used server-side by admin UI submissions) follows the same contract.

## `POST /api/vehicles` (create)

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

- `slug` is present in the response even though it was omitted from the request (auto-generated).
- `make`/`model`/`year` may be `null`/absent — no longer rejected at create time for a draft.
- If a request supplies a non-blank `slug`, that exact value is used (subject to the pre-existing uniqueness constraint) and is not overwritten.
- If the auto-generated slug would collide with an existing vehicle's `slug`, the response's `doc.slug` is a disambiguated value (e.g. `1999-toyota-supra-rz-2`) rather than a `409`/validation error.

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

The same transition additionally checks `make`, `model`, `year`:

```json
// PATCH body
{ "status": "available" }
```
```json
// Response if heroImage AND/OR make/model/year missing: 400
{ "errors": [{ "message": "<lists each missing field among heroImage, make, model, year>" }] }
```
```json
// Response once heroImage, make, model, and year are all present: 200
{ "doc": { "status": "available", ... } }
```

- A `PATCH` that does **not** attempt to change `status` to `available` (e.g. editing `price`, or moving `draft` → `draft`) is unaffected by this gate, per FR-011 — it succeeds regardless of `make`/`model`/`year`/`heroImage` completeness.
- A `PATCH` moving between any two non-`available` statuses (e.g. `reserved` → `sold`) is unaffected by this gate.

## Backward compatibility

- Existing vehicle records with a hand-entered `slug` are read and re-saved unchanged — a `PATCH` that doesn't touch `slug` never triggers the auto-generation hook (it only fires when the field is blank at save time).
- Existing vehicle records already `status: 'available'` are not re-validated retroactively by this feature — the gate only runs on a `beforeChange` write that sets `status` to `available`, not on reads or on saves that leave `status` unchanged.
