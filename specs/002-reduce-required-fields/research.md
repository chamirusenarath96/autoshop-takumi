# Phase 0 Research: Reduce Required Fields on Vehicle Listings

No `[NEEDS CLARIFICATION]` markers were left in the Technical Context — this feature is small and constrained enough (one collection, two hooks) that every open question had a clear answer from existing repo precedent. This document records those decisions for traceability.

## Decision: Hook type for slug auto-generation

**Decision**: Use a `beforeValidate` hook, not `beforeChange`.

**Rationale**: `slug` has `unique: true`, and Payload validates uniqueness as part of its field-validation pass, which runs after `beforeValidate` hooks but is influenced by `beforeChange` only for hooks that run *before* validation in the request lifecycle. Payload's documented hook order is `beforeValidate` → field validation (including `unique`) → `beforeChange`. Generating the slug in `beforeValidate` means the uniqueness check that follows sees the final, auto-generated value — exactly what's needed for FR-004 (collision must be resolved before the save can fail on it). Generating it in `beforeChange` would run too late to affect the built-in unique-field validation.

**Alternatives considered**:
- `beforeChange` hook: rejected — runs after Payload's own uniqueness validation, so a blank-slug save would still fail the `unique`/`required`... wait, `required` is being removed, but a *blank* slug reaching the uniqueness check isn't the risk; the risk is two blank-then-generated slugs colliding. Since Payload's uniqueness check happens before `beforeChange`, a collision resolved only in `beforeChange` still passes validation but writes a duplicate value to a `unique`-constrained column, which the database would then reject with a low-level constraint error instead of a clean Payload validation message. `beforeValidate` avoids this.
- Client-side (admin UI) slug generation via a custom field component: rejected — heavier than necessary (Constitution VI), and doesn't cover the REST/Local API create path used directly (e.g. `e2e/admin.spec.ts`'s `POST /api/vehicles` calls, and any future programmatic import), only the browser-rendered admin form.

## Decision: Collision suffix format

**Decision**: On collision, append a short suffix derived from a counter/random token (e.g. `-2`, `-3`, ...) to the base slug, checking uniqueness against currently-persisted vehicles by querying for existing slugs matching the base pattern.

**Rationale**: Matches common CMS/e-commerce slug conventions (predictable, human-readable, still URL-safe) and is simple to unit-test deterministically (unlike a random suffix, which would need to mock randomness in tests). The spec's Assumptions section already treats the exact suffix format as an implementation detail with no user-facing behavioral difference, so this plan picks the simplest, most testable option consistent with Constitution VI. This query-then-increment approach guarantees uniqueness for sequential saves (FR-004's actual scope, per spec.md's Edge Cases) — it is not a substitute for the database's own `unique` constraint, which remains the backstop for the out-of-scope same-instant-race case.

**Alternatives considered**:
- Appending the document ID: rejected as primary approach — on `create`, Payload does not always have a final document ID available inside `beforeValidate` (ID assignment timing varies by adapter/operation), making it a less reliable source of a suffix than a query-and-increment approach. Documented as a fallback only if the increment approach cannot resolve a collision within a small bounded number of attempts.
- Random string suffix (e.g. nanoid): rejected as primary approach — harder to unit test deterministically without dependency-injecting a random source, which is more machinery than this small feature needs (Constitution VI).

## Decision: Where the slug logic lives (testability)

**Decision**: Extract the "given a base title and a set of already-taken slugs, produce a final unique slug" logic into a pure function in a new `src/lib/slug.ts` module (reusing the existing `slugify()` from `src/lib/utils.ts` for the formatting step), and have the Payload `beforeValidate` hook in `Vehicles.ts` call it, passing in existing slugs fetched via the Payload Local API.

**Rationale**: Constitution III requires a test for the collision-handling logic. Testing a Payload collection hook directly would require either spinning up a real Payload/database instance in the unit-test layer (this repo's Vitest config is `happy-dom`/component-focused, not a Payload-integration harness) or mocking Payload's internal hook argument shape, both heavier than necessary. A pure function `generateUniqueSlug(title: string, existingSlugs: string[]): string` is trivially unit-testable with Vitest and keeps the actual Payload-facing hook a thin wrapper (fetch existing slugs, call the pure function, assign the result) — consistent with how `slugify()` itself is already a standalone, tested-in-isolation utility.

**Alternatives considered**:
- Inline all logic directly in the `Vehicles.ts` hook: rejected — not independently unit-testable without a Payload runtime, conflicting with Constitution III.
- A full Payload-integration test harness (real SQLite instance, actual `payload.create()` calls) as the only test: rejected as the *sole* test — valuable as e2e coverage (already planned in `e2e/admin.spec.ts` via the `/api/vehicles` REST path) but too slow/heavy to be the unit-level regression guard for pure collision-math edge cases; the plan uses both, at their appropriate layers.

## Decision: Reading the title's English value

**Decision**: The `beforeValidate` hook reads `data.title` if present in the current save, falling back to `originalDoc.title` (available on updates) when the save doesn't touch `title`. Because `title` is `localized: true` and this repo's convention (per `payload.config.ts`) sets `en` as a valid locale with `ja` as default, the hook only does this when the save is scoped to the `en` locale (the admin's English tab or an explicit `?locale=en` write) — under any other locale scope, neither `data.title` nor `originalDoc.title` in the hook's view is the English value, and slug generation is skipped for that save (there's nothing to derive a slug from in that locale context; a blank slug simply stays blank until a save under the `en` locale supplies a title).

**Rationale**: This matches how Payload field/collection hooks already interact with localized fields elsewhere in this codebase (no existing hook does cross-locale reads), and avoids adding new Local API calls beyond the one needed for collision-checking. The `originalDoc` fallback is necessary because Payload's `data` argument to `beforeValidate`/`beforeChange` is only the *delta* being submitted, not the full document — a save that doesn't touch `title` (e.g. only flipping `status`) would otherwise look, incorrectly, like there's no title at all. If issues #19/#20 land first and split `title` into `titleEn`, the hook instead reads `data.titleEn ?? originalDoc?.titleEn` directly with no locale-scoping question at all — see spec Assumptions.

**Alternatives considered**:
- Always resolving the `en` locale explicitly inside the hook regardless of request locale (e.g. a Local API `payload.findByID` re-fetch): rejected as unnecessary complexity — slug only needs to be generated once, at creation or whenever a blank slug is saved under the `en` locale write path already used for English-title entry, matching the source issue's own framing ("auto-generated from English title").
- Reading only `data.title` and ignoring `originalDoc`: rejected — would make slug generation silently no-op (or worse, if combined with a naive "is `data.slug` present" check, incorrectly treat a title-less partial update as blank-title) on any save that doesn't happen to include a title in its payload, which is the common case for every save after the first.

## Decision: `originalDoc` merge for slug-blank and publish-completeness checks

**Decision**: Both hooks determine "is this field actually blank/missing" against the vehicle's *effective* value — `data.<field> ?? originalDoc?.<field>` — not against `data.<field>` alone.

**Rationale**: Payload's `beforeValidate`/`beforeChange` hooks receive `data` as only the fields being submitted in the current save; `originalDoc` holds the full pre-change document on updates (`undefined` on create, which is fine — a create's `data` is the whole payload by definition). Without this merge:
- FR-005 (preserve existing slug) would break on any update that legitimately omits `slug` from its payload (e.g. changing only `price`) — `data.slug` would be `undefined`, which a naive "is it blank" check can't distinguish from "the user cleared it," incorrectly re-triggering slug generation on unrelated edits.
- FR-009 (publish completeness) would break on a "mark available" action that sends only `{"status": "available"}` without re-sending `make`/`model`/`year` that were already saved in a prior edit — the gate would incorrectly report those fields as missing even though the record has them.

This was caught during spec review (see spec.md's Edge Cases and Assumptions) before implementation began, rather than being discovered as a bug afterward.

**Alternatives considered**:
- Requiring every save to resubmit every field (i.e. treating `data` as if it were always the full document): rejected — this isn't how Payload's admin UI or partial `PATCH` requests behave; imposing that constraint would silently break normal partial-update usage throughout the admin, far outside this feature's scope.

## Decision: Publish-gate error message format

**Decision**: Extend the existing `beforeChange` hook's `status === 'available'` check with additional conditions for `make`, `model`, and `year`, throwing an `Error` whose message lists which of the missing field(s) triggered the block (e.g. `"A hero image is required before a vehicle can be set to Available."` becomes a template that names each of `heroImage`/`make`/`model`/`year` found missing). The check fires whenever the *effective* `status` (see the `originalDoc` merge decision above) is being set to `'available'`, regardless of what status the record is transitioning from — `draft`→`available`, `reserved`→`available`, and `sold`→`available` are all gated identically, matching FR-009's origin-agnostic wording.

**Rationale**: Directly extends the current single-condition pattern with the minimum change needed to satisfy FR-010 (name the specific missing fields), keeping the existing `heroImage` check and message format as the precedent to follow rather than introducing a new error-reporting convention.

**Alternatives considered**:
- Returning Payload field-level validation errors instead of throwing a collection-level `Error`: rejected — the existing `heroImage` check already uses `throw new Error(...)`, and changing that established pattern is out of scope for this feature (would touch more of the file/tests than necessary, Constitution VI).
