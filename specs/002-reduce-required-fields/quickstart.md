# Quickstart: Validating Reduced Required Fields on Vehicle Listings

Manual/scripted validation scenarios proving this feature works end-to-end. See [data-model.md](./data-model.md) for field details and [contracts/vehicles-api.md](./contracts/vehicles-api.md) for the exact request/response shapes referenced below.

## Prerequisites

```bash
npm install
cp .env.example .env   # set PAYLOAD_SECRET to any string, if not already set
npm run dev            # → http://localhost:3000, /admin
```

Log in at `/admin/create-first-user` (or an existing account) before using the admin UI scenarios below.

## Scenario 1 — Save a draft with only a title (User Story 1 + 2, SC-001)

**Via admin UI**: `/admin/collections/vehicles/create` → fill in only the English title (e.g. "1999 Toyota Supra RZ") → Save.

**Expected**: Save succeeds. Reopen the record — `slug` shows an auto-generated value (e.g. `1999-toyota-supra-rz`); `make`/`model`/`year` remain empty with no validation error shown.

**Via API** (matches `e2e/admin.spec.ts`'s existing pattern):

```bash
curl -X POST http://localhost:3000/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT <token>" \
  -d '{"title": "1999 Toyota Supra RZ", "status": "draft"}'
```

**Expected**: `201`, `doc.slug` is non-empty and derived from the title, `doc.make`/`doc.model`/`doc.year` are absent/null.

## Scenario 2 — Slug collision is auto-resolved (SC-002)

Create two vehicles with the same title (or titles that produce the same base slug) back to back.

**Expected**: Both saves succeed with `201`; the second vehicle's `slug` differs from the first (e.g. `...-2` suffix). No unique-constraint error surfaces to the caller.

## Scenario 3 — Existing hand-entered slug is preserved (SC-003)

Take an existing vehicle with a manually-set `slug` (e.g. one seeded by `npm run seed`). Edit an unrelated field (e.g. `price`) and save without touching `slug`.

**Expected**: `slug` value after save is byte-for-byte identical to before.

## Scenario 4 — Manual slug entry still works (FR-006)

Create a new vehicle, explicitly typing a custom value into the `slug` field (e.g. `my-custom-url`), and save.

**Expected**: The saved record's `slug` is exactly `my-custom-url`, not overwritten by auto-generation.

## Scenario 5 — Publish is blocked without make/model/year (User Story 2, SC-004)

Create a draft vehicle with `heroImage` set but `make`/`model`/`year` left blank. Attempt to change `status` to `available`.

```bash
curl -X PATCH http://localhost:3000/api/vehicles/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT <token>" \
  -d '{"status": "available"}'
```

**Expected**: `400`, error message names the missing field(s) among `make`/`model`/`year`/`heroImage`. Repeat with only one of the three fields missing at a time to confirm each is individually checked (SC-004).

## Scenario 6 — Publish succeeds once complete

Fill in `heroImage`, `make`, `model`, and `year` on the same draft vehicle from Scenario 5, then retry the `status: 'available'` update.

**Expected**: `200`, `doc.status` is `available`.

## Scenario 7 — Non-publish transitions are never blocked by the new gate (FR-011, SC-005)

Take a draft vehicle missing `make`/`model`/`year`. `PATCH` it with an unrelated field change (e.g. `{"price": 4500000}`), and separately with `{"status": "draft"}` (a no-op status write).

**Expected**: Both succeed regardless of `make`/`model`/`year` completeness.

## Automated coverage

- `src/lib/slug.test.ts` (Vitest) — unit tests for the pure slug-generation/collision function covering: blank base title guard, no-collision case, single collision, multiple sequential collisions.
- `e2e/admin.spec.ts` — updated `can create a draft vehicle via API` test (or equivalent) to omit `slug`/`make`/`model`/`year` and assert a successful `201` with an auto-generated `slug`; new test asserting the extended publish gate blocks `status: 'available'` when `make`/`model`/`year` are missing, alongside the existing `heroImage` gate test.

Run before opening a PR, per this repo's testing rule:

```bash
npm test
npx tsc --noEmit
npm run dev &          # if not already running
npm run test:e2e
```
