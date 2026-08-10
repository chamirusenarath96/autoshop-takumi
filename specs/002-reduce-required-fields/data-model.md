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

- **Slug generation** (`beforeValidate`): if `data.slug` is blank/whitespace-only, derive a base slug from the title value via the existing `slugify()` util, then resolve collisions against currently-persisted vehicle slugs (excluding the document's own current ID on update) by appending an incrementing numeric suffix (`-2`, `-3`, ...) until unique. If `data.slug` already has a non-blank value (auto-generated on a prior save, or manually entered), it is left untouched.
- **Publish gate** (`beforeChange`, extended): when `data.status === 'available'`, all of `heroImage`, `make`, `model`, and `year` must be present; if any are missing, the save is rejected with an error message naming the specific missing field(s). This check does not run for any other status value or transition.

### State transitions affected

```
draft ──(save, any completeness)──> draft            [always allowed]
draft ──(save, missing any of heroImage/make/model/year)──> available   [BLOCKED — extended by this feature]
draft ──(save, all of heroImage/make/model/year present)──> available   [ALLOWED — existing heroImage-only gate today; extended gate after this feature]
available/reserved/sold ──(save)──> any status         [unaffected by this feature's gate — only the transition INTO 'available' is checked, per FR-011]
```

### Relationships

Unchanged — `make`/`model`/`year` remain plain fields/relationships on `Vehicles`; no new relationship is introduced. `slug`'s uniqueness constraint against other `vehicles` rows is unchanged in kind (still collection-unique), only in how a value reaches that check (generated vs. manually typed).
