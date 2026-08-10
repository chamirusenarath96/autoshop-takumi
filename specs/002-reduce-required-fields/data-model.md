# Phase 1 Data Model: Reduce Required Fields on Vehicle Listings

No new collections, globals, or database columns. This feature changes field-level constraints and hook behavior on the existing `vehicles` collection (`src/collections/Vehicles.ts`). Documented here as the "entity" this spec's Key Entities section refers to.

## Vehicle (existing `vehicles` collection)

Only the fields whose constraints change are listed; all other existing fields are unaffected.

| Field | Type | Before this feature | After this feature |
|---|---|---|---|
| `title` (or `titleEn`, depending on which schema is live — see spec Assumptions) | text, localized | `required: true` | Unchanged — still `required: true` at all times |
| `slug` | text, unique | `required: true`; no generation logic; admin description claims auto-generation (false) | `required: false`; auto-generated via `beforeValidate` hook when blank; admin description updated to reflect actual behavior |
| `status` | select, default `draft` | `required: true` | Unchanged |
| `make` | relationship → `makes` | `required: true` | `required: false`; enforced instead by the extended publish-gate `beforeChange` hook when transitioning to `status: 'available'` |
| `model` | relationship → `models` | `required: true` | `required: false`; same publish-gate treatment as `make` |
| `year` | number | `required: true` | `required: false`; same publish-gate treatment as `make`/`model` |
| `heroImage` | upload → `media` | Not schema-required; already gated by `beforeChange` on publish | Unchanged — remains part of the same (now-extended) publish gate |

### Validation rules

Both rules below operate on the vehicle's **effective** field values for this save — the incoming `data` merged over `originalDoc` (the full, currently-persisted document, present on updates; absent on create, where `data` already is the whole payload) **by presence, not by nullish-coalescing**: if a field's key is present in `data` at all (including an explicit `null`, Payload's documented way to clear a field), that value is used as-is; only a field genuinely absent from `data` falls back to `originalDoc`. This matters because Payload's `beforeValidate`/`beforeChange` hooks receive `data` as only the delta being submitted, not the full document, and a naive `data.field ?? originalDoc.field` merge would incorrectly restore a field's old value on an explicit clear — see research.md's "`originalDoc` merge" decision. `effective.<field>` below means "`data.<field>` if `'<field>' in data`, else `originalDoc?.<field>`."

- **Slug generation** (`beforeValidate`): if `effective.slug` is blank/whitespace-only, derive a base slug from `effective.title` (or `effective.titleEn`, depending on schema — see spec Assumptions) via the existing `slugify()` util, then resolve collisions against currently-persisted vehicle slugs (excluding the document's own current ID on update) by appending an incrementing numeric suffix (`-2`, `-3`, ...) until unique, and assign the result to `data.slug`. If `effective.slug` already has a non-blank value (auto-generated on a prior save, manually entered, or simply not part of this save's payload but already persisted), it is left untouched — critically, an update that omits `slug` from its payload must NOT be treated as "slug is blank" just because `data.slug` is `undefined`.
- **Publish gate** (`beforeChange`, extended): when `effective.status === 'available'`, all of `effective.heroImage`, `effective.make`, `effective.model`, and `effective.year` must be present; if any are missing, the save is rejected with an error message naming the specific missing field(s). This check does not run for any other destination status, and applies identically regardless of the vehicle's status *before* this save (`draft`, `reserved`, or `sold` are all treated the same way when the destination is `available`).

### State transitions affected

```
draft ──(save, any completeness)──> draft                                    [always allowed]
draft/reserved/sold ──(save, missing any of heroImage/make/model/year)──> available   [BLOCKED — extended by this feature]
draft/reserved/sold ──(save, all of heroImage/make/model/year present)──> available   [ALLOWED — existing heroImage-only gate today for draft→available; extended gate after this feature, applied uniformly regardless of origin status]
available ──(save, any change not touching status, or status unchanged)──> available  [unaffected by this feature's gate]
any status ──(save, destination status ≠ 'available')──> draft/reserved/sold  [unaffected by this feature's gate, per FR-011 — e.g. available→reserved, draft→sold, or a same-status no-op save]
```

**Note on the previous version of this diagram**: an earlier draft of this section only showed `draft→available` as gated and described `available/reserved/sold ──(save)──> any status` as uniformly "unaffected," which read as excluding `reserved→available` and `sold→available` from the gate — that was a documentation error, not the intended behavior. FR-009 has always been origin-agnostic ("prevent a vehicle's `status` from being changed to `available`," full stop); this revision corrects the diagram to match.

### Relationships

Unchanged — `make`/`model`/`year` remain plain fields/relationships on `Vehicles`; no new relationship is introduced. `slug`'s uniqueness constraint against other `vehicles` rows is unchanged in kind (still collection-unique), only in how a value reaches that check (generated vs. manually typed).
