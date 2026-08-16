# Feature Specification: Reduce Required Fields on Vehicle Listings

**Feature Branch**: `002-reduce-required-fields`

**Created**: 2026-08-10

**Status**: Draft

**Input**: User description: "Reduce required fields on Vehicle listings in the Payload CMS admin. Currently `src/collections/Vehicles.ts` marks `title`, `slug`, `status`, `make`, `model`, and `year` as `required: true`. The `slug` field's admin description claims it is "auto-generated from English title" but no such hook exists anywhere in the codebase — so staff must currently type a unique slug by hand for every vehicle, which is pure friction contradicting the UI's own claim. This feature: (1) adds a beforeValidate hook to Vehicles that auto-generates `slug` from the vehicle's (English) `title` using the existing `slugify()` util whenever the field is left blank, appending the document ID or a short random suffix on a collision so the `unique: true` constraint never blocks a save, and removes `required: true` from `slug`; existing vehicles with hand-entered slugs must be unaffected. (2) Reviews the remaining required fields (`make`, `model`, `year`) against the precedent already established by `heroImage`, where a `beforeChange` hook blocks only the transition to `status: 'available'` without a value, leaving drafts free to save incomplete. `title` stays required at all times."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save a draft listing without typing a slug (Priority: P1)

A staff member creating a new vehicle listing in the admin fills in the English title and saves the record as a draft, without ever touching the slug field.

**Why this priority**: This is the core friction the issue calls out — the admin UI already tells staff the slug is auto-generated, but today it silently isn't, so this is the most visible and most frequently hit gap between promised and actual behavior.

**Independent Test**: Create a new vehicle with only `title` filled in and no `slug` entered, save it, and confirm the saved record has a non-empty, unique `slug` value derived from the title, without the save being blocked by a missing-slug validation error.

**Acceptance Scenarios**:

1. **Given** a new vehicle record with `titleEn` (or `title`, for whichever fields carry the English value at the time of this feature) set to "1999 Toyota Supra RZ" and `slug` left blank, **When** the staff member saves the record, **Then** the record saves successfully with `slug` auto-populated to a URL-safe value derived from that title (e.g. `1999-toyota-supra-rz`).
2. **Given** a new vehicle record whose auto-generated slug would collide with an existing vehicle's slug, **When** the staff member saves the record, **Then** the record still saves successfully with a disambiguated slug (e.g. a short suffix appended), and no unique-constraint error is shown.
3. **Given** an existing vehicle that already has a hand-entered slug, **When** that vehicle is edited and re-saved without changing the slug field, **Then** the existing slug value is preserved unchanged.
4. **Given** a staff member who wants a custom URL segment, **When** they type a specific value into the slug field before saving, **Then** their entered value is used as-is (subject to the existing uniqueness constraint) and is not overwritten by auto-generation.

---

### User Story 2 - Save a bare-bones draft from the auction floor (Priority: P2)

A staff member at a vehicle auction takes a photo and wants to save a minimal draft listing on the spot, filling in make, model, and year later back at the office.

**Why this priority**: This is the underlying motivation given for reviewing `make`/`model`/`year` required-ness, but it's secondary to the slug fix — it depends on a product decision about which fields genuinely block draft creation in practice, and is lower-frequency than every single listing hitting the slug friction.

**Independent Test**: Create a new draft vehicle with only a title filled in (no make, model, or year), save it, and confirm the save succeeds; then attempt to change that same vehicle's status to "available" without filling in the previously-missing fields and confirm the publish is blocked with a clear message.

**Acceptance Scenarios**:

1. **Given** a new vehicle record with only `title` set (`status` left at its default of `draft`), **When** the staff member saves the record, **Then** the record saves successfully even though `make`, `model`, and `year` are empty.
2. **Given** a draft vehicle missing `make`, `model`, or `year`, **When** a staff member attempts to change its `status` to `available`, **Then** the save is blocked with a message identifying which required-for-publish field(s) are missing.
3. **Given** a draft vehicle with `make`, `model`, and `year` all filled in (and any other publish-blocking condition, such as `heroImage`, already satisfied), **When** a staff member changes its `status` to `available`, **Then** the save succeeds.

---

### Edge Cases

- What happens when the title used for slug generation is itself blank or whitespace-only? The auto-generation hook has no source text to work from; the existing `required: true` on `title` prevents this case from reaching the hook, since `title` remains required at all times. A slug-generation function given a blank title directly (e.g. in isolation) MUST NOT silently produce an empty slug — it errors rather than returning one.
- What happens when two vehicles are saved at the exact same instant with titles that generate the same base slug? This spec's uniqueness guarantee (FR-004) applies to sequential saves — each save checks against the slugs persisted at the time it runs. A true same-instant race between two in-flight saves is out of scope for this feature, consistent with there being no other concurrent-write handling elsewhere in this admin; a same-instant collision that somehow reaches the database's own `unique` constraint fails with that constraint's ordinary error rather than being silently allowed to duplicate.
- What happens when a staff member manually clears a previously-auto-generated slug on an existing vehicle and re-saves? Since the hook only fires when the field is blank at save time, an intentionally-cleared field is treated as blank and a new slug is generated from the current title.
- What happens when `make`, `model`, or `year` were already filled in and a listing is later edited back to `draft` status? Clearing or downgrading status must not be blocked by the same fields that gate publishing, consistent with drafts always being freely editable.
- What happens when only a subset of fields is submitted in an update (e.g. a "mark as available" action that sends just `{"status": "available"}`, without re-sending `make`/`model`/`year`/`slug` that were already saved on a prior edit)? Both the slug-preservation check (FR-005) and the publish-completeness check (FR-009) MUST evaluate the vehicle's full, currently-persisted field values merged with whatever the update submits — not just the fields present in that particular update request. Otherwise a save that legitimately omits already-set fields would be misread as "these fields are blank," incorrectly regenerating a slug that was never touched or blocking a publish for fields that are actually already filled in.
- What happens when a vehicle already in `reserved` or `sold` status is moved back to `status: 'available'` (not just a `draft`)? The same completeness check (FR-009) applies — it's keyed on the destination status being `available`, not on which status the vehicle is coming from.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST auto-generate a value for a vehicle's `slug` field from its English title whenever the `slug` field is left blank at save time.
- **FR-002**: The system MUST derive the auto-generated slug using the same slug-formatting convention already used elsewhere in the codebase (URL-safe, lowercase, hyphen-separated).
- **FR-003**: The system MUST NOT require staff to manually enter a value into the `slug` field in order to save a vehicle record.
- **FR-004**: For any two saves that do not occur at the exact same instant (i.e. the second save's collision check runs after the first save's slug is persisted), the system MUST guarantee that an auto-generated slug never collides with another vehicle's existing slug — on collision, it MUST deterministically disambiguate (e.g. by appending an identifier or short suffix) and save successfully rather than failing validation. True same-instant concurrent saves are out of scope (see Edge Cases).
- **FR-005**: The system MUST leave an existing, previously-set slug value untouched when a vehicle record is saved without modifying that field — determined by the value already persisted on the record (not merely by whether the current save's request happens to include that field), so that an update which simply omits `slug` is never misread as "the slug is blank."
- **FR-006**: The system MUST continue to allow a staff member to manually enter a custom slug value, and that manually-entered value MUST take precedence over auto-generation.
- **FR-007**: The system MUST continue to require a `title` value on every vehicle record, at every status, with no change to this behavior.
- **FR-008**: The system MUST allow a vehicle record to be saved as a draft (`status: 'draft'`) with `make`, `model`, and `year` left empty.
- **FR-009**: The system MUST prevent a vehicle's `status` from being changed to `available` — from `draft`, `reserved`, `sold`, or any other status a vehicle could be saved in — while `make`, `model`, or `year` is empty, mirroring the existing pattern that blocks publishing without a `heroImage`. This check MUST evaluate the vehicle's full, effective field values (existing persisted values merged with whatever the current save submits), not only the fields present in that specific save request, so that a save which legitimately omits already-set fields is not misread as those fields being blank.
- **FR-010**: When a publish attempt is blocked under FR-009, the system MUST communicate which specific field(s) are missing, rather than a generic failure.
- **FR-011**: The system MUST NOT apply the publish-gating in FR-009 to any status transition other than into `available` (e.g. saving a draft, or moving between `draft`/`reserved`/`sold`, must not trigger this check where it did not previously apply).

### Key Entities

- **Vehicle listing**: The existing Payload `vehicles` collection record. Relevant attributes for this feature: `title` (or its English-language field, depending on which localization scheme is active on this collection at implementation time — see Assumptions), `slug`, `status`, `make`, `model`, `year`, `heroImage`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A staff member can create and save a new draft vehicle listing by filling in only the title, with zero manual data entry required for slug, make, model, or year.
- **SC-002**: 100% of sequential (non-same-instant) vehicle saves with a blank slug field produce a unique, non-empty slug without a validation error being shown to the user.
- **SC-003**: 100% of existing vehicle records retain their current slug value after this feature ships and after any subsequent unrelated edit-and-save — including a save that omits the `slug` field entirely — with no unexpected slug changes.
- **SC-004**: Every attempt to publish (set to `available`, from any originating status) a vehicle missing `make`, `model`, or `year` is blocked, and the resulting message names the specific missing field(s), verified across all three fields individually and in every combination (including all three missing at once).
- **SC-005**: Draft-status saves and status transitions other than "move to available" are never blocked by the make/model/year check introduced in this feature.

## Assumptions

- **Localized-field naming at implementation time**: This spec's parent issue (#17) describes the current schema, where `title` is a single `localized: true` field with `defaultLocale: 'ja'` configured project-wide (`payload.config.ts`). Two other open roadmap issues (#19, #20) propose splitting several localized fields — including `title` — into explicit `titleJa`/`titleEn` pairs. This feature is written against whichever schema is live in `master` at the time it's implemented: if `title` is still a single localized field, the slug hook must resolve its **English-locale (`en`)** value specifically — since the collection's default locale is Japanese, any example or test that omits an explicit locale scope (e.g. a bare `POST`/`PATCH` with no `?locale=en`, or a Local API call with no `locale: 'en'` option) writes/reads the *Japanese* value instead, which is not the source this feature's slug generation needs; if the `titleEn`/`titleJa` split has already landed, the hook reads `titleEn` directly with no locale-scoping question at all. Either way, the hook always sources from the English-language title, consistent with the existing (nonfunctional) admin field description. Any request/response example in this feature's contracts or quickstart that involves `title` under the current (not-yet-split) schema must be explicit about targeting the `en` locale.
- **Collision-disambiguation format**: The exact suffix format for a colliding slug (document ID vs. short random string) is left as an implementation detail with no user-facing behavioral difference — both satisfy FR-004's requirement of a unique, deterministic, non-blocking result. A short random or incrementing suffix is assumed unless the document ID is more convenient to access at hook-execution time.
- **`status` stays required**: The parent issue's acceptance criteria only asks for a decision on `make`/`model`/`year`; `status` already has a `draft` default value, making its `required: true` effectively free (a save can never actually fail on a missing `status`), so no behavior change is proposed for it here.
- **Scope of "publish"**: "Publish-gated" in this spec means specifically the transition to `status: 'available'`, matching the existing `heroImage` precedent exactly. `reserved` and `sold` are not treated as additional gated transitions, since only `available` currently carries a completeness gate in this collection.
- **No change to `reserved`/`sold` requirements**: This feature does not introduce any new validation when moving a vehicle *to* `reserved` or `sold` status; those transitions (as destinations) are out of scope and behave exactly as they do today. This is distinct from moving a vehicle *out of* `reserved`/`sold` *into* `available`, which — per FR-009 — is gated exactly the same as a `draft`→`available` transition, since the gate is keyed on the destination status, not the origin.
- **Partial-update behavior**: FR-005 and FR-009 are both written to key off the vehicle's already-persisted values, not merely what a given save request happens to include — see the "only a subset of fields is submitted" Edge Case above. How that's satisfied at the implementation level is covered in `plan.md`/`research.md`/`data-model.md`.
- **Blank-title defensive behavior**: FR-001's slug-generation logic, if ever invoked with a blank/whitespace-only title directly (rather than through the collection hook, where `title`'s own `required: true` already prevents this), must not silently return an empty string as a "slug" — it should raise an error instead, since an empty slug would be a meaningless, likely-colliding URL segment. This only matters for the underlying implementation/tests; it's not reachable through the collection's normal save path.
