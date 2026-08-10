# Phase 0 Research: Reduce Required Fields on Vehicle Listings

No `[NEEDS CLARIFICATION]` markers were left in the Technical Context — this feature is small and constrained enough (one collection, two hooks) that every open question had a clear answer from existing repo precedent. This document records those decisions for traceability.

## Decision: Hook type for slug auto-generation

**Decision**: Use a `beforeValidate` hook, not `beforeChange`.

**Rationale**: `slug` has `unique: true`. Payload's *documented* hook order is `beforeValidate` → field validation (including `unique`) → `beforeChange`, which would make `beforeValidate` the only hook guaranteed to run before the uniqueness check sees the final, auto-generated value. However, this project's pinned `payload@^3.85.1` is affected by at least one open upstream issue ([payloadcms/payload#12065](https://github.com/payloadcms/payload/issues/12065), [#11169](https://github.com/payloadcms/payload/issues/11169)) reporting that actual runtime order can diverge from the documented one (field `validate` observed running *after* `beforeChange`, not between it and `beforeValidate`) — so the "runs too late" claim this decision originally leaned on isn't a reliable distinguishing factor between the two hooks on this exact dependency version, and this document doesn't rely on it. The choice of `beforeValidate` over `beforeChange` instead rests on **semantic fit**, which holds regardless of that upstream ordering nuance: `beforeValidate` is Payload's documented hook specifically for shaping/defaulting field data *before* validation is meant to run, which is exactly this hook's job (supply a value the field doesn't yet have) — `beforeChange` is documented as the hook for side effects once a change is already considered valid, a worse conceptual fit for "the data isn't complete yet." Using the semantically-intended hook is also the more future-proof choice if/when the upstream ordering bug is fixed.

**Alternatives considered**:
- `beforeChange` hook: rejected on fit, not on a specific ordering guarantee this document can currently stand behind — see Rationale. Whichever hook validation actually runs relative to on this Payload version, `beforeValidate` is the one documented to exist for supplying missing data ahead of validation, so it's the more defensible and idiomatic choice either way.
- Client-side (admin UI) slug generation via a custom field component: rejected — heavier than necessary (Constitution VI), and doesn't cover the REST/Local API create path used directly (e.g. `e2e/admin.spec.ts`'s `POST /api/vehicles` calls, and any future programmatic import), only the browser-rendered admin form.

## Decision: Collision suffix format

**Decision**: On collision, append an incrementing numeric suffix (`-2`, `-3`, `-4`, ...) to the base slug — never a random token — checking uniqueness against currently-persisted vehicles by querying for existing slugs matching the base pattern and picking the first free number.

**Rationale**: Matches common CMS/e-commerce slug conventions (predictable, human-readable, still URL-safe) and is simple to unit-test deterministically. The spec's Assumptions section treats the exact suffix format as an implementation detail with no user-facing behavioral difference, but this document commits to one concrete, deterministic format specifically so T002/T006's unit tests (and the collision examples throughout `contracts/vehicles-api.md`/`quickstart.md`) can assert exact, reproducible output rather than "some non-colliding value." This query-then-increment approach guarantees uniqueness for sequential saves (FR-004's actual scope, per spec.md's Edge Cases) — it is not a substitute for the database's own `unique` constraint, which remains the backstop for the out-of-scope same-instant-race case.

**Alternatives considered**:
- Appending the document ID: rejected — on `create`, Payload does not always have a final document ID available inside `beforeValidate` (ID assignment timing varies by adapter/operation), making it a less reliable source of a suffix than a query-and-increment approach.
- Random string suffix (e.g. nanoid): rejected — non-deterministic output can't be asserted exactly in T002/T006's unit tests without dependency-injecting a random source, which is more machinery than this small feature needs (Constitution VI), and the earlier draft of this decision listing it as an option alongside the numeric-suffix examples was an inconsistency in this document, not an intentionally open choice.

## Decision: Behavior when a non-blank title normalizes to an empty base slug

**Decision**: If `slugify(title)` itself produces an empty string (e.g. a title consisting entirely of characters `slugify()`'s `[^a-z0-9]+` strips — symbols-only, or non-Latin-script text with no digits, such as `"★★★"` or a title consisting only of Japanese characters saved under the `en` locale by mistake), `generateUniqueSlug` falls back to a fixed, non-empty base (`"vehicle"`) before applying the normal collision-suffix logic — it does not throw in this case, since the title itself isn't blank/invalid, only its slugified form happens to be empty, and rejecting the save entirely over an unlucky title would be worse UX than a generic-but-functional slug.

**Rationale**: This is distinct from the blank/whitespace-only *title* case (which does throw — see the Blank-title defensive behavior in spec.md's Assumptions): a blank title reaching the generator at all would indicate a caller bug (the collection's `title` field is always required), whereas a non-blank title that happens to slugify to nothing is a legitimate, if unusual, real-world input this feature must handle gracefully rather than erroring on. Falling back to a fixed base plus the existing numeric-suffix collision logic (e.g. `vehicle`, `vehicle-2`, ...) reuses machinery already being built for T006, rather than introducing a second disambiguation strategy.

**Alternatives considered**:
- Throwing an error in this case too: rejected — conflates "caller passed no title" (a real bug worth surfacing loudly) with "title normalized to nothing" (an edge case of real input that should still produce a working, saveable record, consistent with this feature's overall goal of removing friction from saving a draft).
- Falling back to a random/timestamp-based base instead of a fixed string: rejected for the same reason random suffixes were rejected above — no need for non-determinism here, and a fixed base plus the numeric collision suffix already guarantees uniqueness across multiple such vehicles.

## Decision: Where the slug logic lives (testability)

**Decision**: Extract the "given a base title and a set of already-taken slugs, produce a final unique slug" logic into a pure function in a new `src/lib/slug.ts` module (reusing the existing `slugify()` from `src/lib/utils.ts` for the formatting step), and have the Payload `beforeValidate` hook in `Vehicles.ts` call it, passing in existing slugs fetched via the Payload Local API.

**Rationale**: Constitution III requires a test for the collision-handling logic. Testing a Payload collection hook directly would require either spinning up a real Payload/database instance in the unit-test layer (this repo's Vitest config is `happy-dom`/component-focused, not a Payload-integration harness) or mocking Payload's internal hook argument shape, both heavier than necessary. A pure function `generateUniqueSlug(title: string, existingSlugs: string[]): string` is trivially unit-testable with Vitest and keeps the actual Payload-facing hook a thin wrapper (fetch existing slugs, call the pure function, assign the result) — consistent with how `slugify()` itself is already a standalone, tested-in-isolation utility.

**Alternatives considered**:
- Inline all logic directly in the `Vehicles.ts` hook: rejected — not independently unit-testable without a Payload runtime, conflicting with Constitution III.
- A full Payload-integration test harness (real SQLite instance, actual `payload.create()` calls) as the only test: rejected as the *sole* test — valuable as e2e coverage (already planned in `e2e/admin.spec.ts` via the `/api/vehicles` REST path) but too slow/heavy to be the unit-level regression guard for pure collision-math edge cases; the plan uses both, at their appropriate layers.

## Decision: Reading the title's English value

**Decision**: The `beforeValidate` hook reads `data.title` if present in the current save, falling back to `originalDoc.title` (available on updates) when the save doesn't touch `title`. Because `title` is `localized: true` and this repo's convention (per `payload.config.ts`) sets `en` as a valid locale with `ja` as default, the hook only does this when the save is scoped to the `en` locale (the admin's English tab or an explicit `?locale=en` write) — under any other locale scope, neither `data.title` nor `originalDoc.title` in the hook's view is the English value, and slug generation is skipped for that save (there's nothing to derive a slug from in that locale context; a blank slug simply stays blank until a save under the `en` locale supplies a title).

**Rationale**: This matches how Payload field/collection hooks already interact with localized fields elsewhere in this codebase (no existing hook does cross-locale reads), and avoids adding new Local API calls beyond the one needed for collision-checking. The `originalDoc` fallback is necessary because Payload's `data` argument to `beforeValidate`/`beforeChange` is only the *delta* being submitted, not the full document — a save that doesn't touch `title` (e.g. only flipping `status`) would otherwise look, incorrectly, like there's no title at all. If issues #19/#20 land first and split `title` into `titleEn`, the hook instead reads `titleEn` from `data` if present there, else from `originalDoc`, directly with no locale-scoping question at all — see spec Assumptions.

**Alternatives considered**:
- Always resolving the `en` locale explicitly inside the hook regardless of request locale (e.g. a Local API `payload.findByID` re-fetch): rejected as unnecessary complexity — slug only needs to be generated once, at creation or whenever a blank slug is saved under the `en` locale write path already used for English-title entry, matching the source issue's own framing ("auto-generated from English title").
- Reading only `data.title` and ignoring `originalDoc`: rejected — would make slug generation silently no-op (or worse, if combined with a naive "is `data.slug` present" check, incorrectly treat a title-less partial update as blank-title) on any save that doesn't happen to include a title in its payload, which is the common case for every save after the first.

## Decision: `originalDoc` merge for slug-blank and publish-completeness checks

**Decision**: Both hooks determine "is this field actually blank/missing" against the vehicle's *effective* value, computed by **presence**, not by nullish-coalescing: if the field's key is present in `data` (submitted in this save — including an explicit `null`, which is Payload's documented way to clear a field), use `data.<field>` as-is; only when the key is absent from `data` entirely does the check fall back to `originalDoc?.<field>`. In code terms, this is `'​<field>' in data ? data.<field> : originalDoc?.<field>` — **not** `data.<field> ?? originalDoc?.<field>`.

**Rationale**: Payload's `beforeValidate`/`beforeChange` hooks receive `data` as only the fields being submitted in the current save; `originalDoc` holds the full pre-change document on updates (`undefined` on create, which is fine — a create's `data` is the whole payload by definition). A naive `??` merge conflates two different situations that must be told apart: a save that never mentions `slug` (where the persisted value must be preserved, per FR-005) versus a save that explicitly sends `slug: null` to clear it (where `??` would incorrectly restore the old value instead of respecting the clear) — Payload's own documented `beforeValidate`/`originalDoc` semantics confirm an explicit `null` is the supported way to unset a field, so this decision's merge logic must not silently override that. Presence-based merging (checking whether the key exists in `data` at all, regardless of its value) is the only form of "effective value" that respects both cases correctly. Without this merge (in either form):
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
