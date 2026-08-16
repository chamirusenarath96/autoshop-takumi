# Implementation Plan: Reduce Required Fields on Vehicle Listings

**Branch**: `002-reduce-required-fields` | **Date**: 2026-08-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-reduce-required-fields/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

The Payload `vehicles` collection's `slug` field is schema-`required` even though its admin description promises it's "auto-generated from English title" — no such generation logic exists, so every listing currently demands manual, unique slug entry. This feature adds a `beforeValidate` hook (extracting its collision/format logic into a small, independently unit-testable pure function alongside the existing `slugify()` util) that fills `slug` from `title` whenever it's blank, with a deterministic suffix on collision, and drops `slug`'s `required: true`. It also extends the collection's existing `beforeChange` publish gate — today it only checks `heroImage` before allowing `status: 'available'` — to additionally require `make`, `model`, and `year`, and removes `required: true` from those three fields so drafts can be saved without them. `title` and `status` are unchanged.

## Technical Context

**Language/Version**: TypeScript (Next.js 15 / Node, per repo's Volta-pinned version)

**Primary Dependencies**: Payload CMS 3.x (`CollectionConfig`, field hooks), existing `slugify()` in `src/lib/utils.ts`

**Storage**: SQLite (local dev) / Postgres-Neon (production) via Payload's ORM — no schema migration needed, since `required`/hook changes are Payload-config-level, not column-level

**Testing**: Vitest + happy-dom (component/unit — new pure-function tests for slug generation and collision handling), Playwright (`e2e/admin.spec.ts` — update the existing vehicle-create coverage for the new minimum required fields, add a publish-gate case for make/model/year)

**Target Platform**: Payload admin (`/admin/collections/vehicles`) and the `/api/vehicles` REST/Local API surface it shares with the public site's create/update path. The hooks themselves run identically for both interfaces (same `CollectionConfig`), but the two interfaces' request/response shapes differ: REST (`POST`/`PATCH /api/vehicles...`) returns HTTP status codes and a `{ doc: ... }` / `{ errors: [...] }` envelope, documented in `contracts/vehicles-api.md`; the Local API (`payload.create()`/`payload.update()`, used server-side by the admin UI's own form submissions) returns the resulting document directly and throws a JS error on failure — no separate contract doc is needed for it since its behavior is identical to REST's, only its calling convention differs.

**Project Type**: Web application (Next.js App Router + embedded Payload CMS) — single project, no frontend/backend split

**Performance Goals**: N/A — this is a validation/hook change on a low-frequency admin write path, not a performance-sensitive surface

**Constraints**: Must not change behavior for any existing vehicle record that already has a slug (FR-005); must not introduce a new admin screen or dependency (Constitution Principle VI)

**Scale/Scope**: Single collection (`Vehicles`), one hook function plus one extended hook; no new entities, routes, or globals

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. CMS-Driven Content, Not Hardcoded** — N/A. No shop identity data involved; this only changes validation/hook behavior on an existing collection's own fields.
- **II. No Hardcoded UI Strings** — N/A to this backend-validation feature. The one new user-facing string (the "missing field(s) before publish" error message on the `beforeChange` hook) follows the existing precedent: the current `heroImage` error (`'A hero image is required before a vehicle can be set to Available.'`) is also a plain, non-`next-intl` string surfaced only in the Payload admin's own English-language error UI, not the bilingual public site — so this is consistent with existing practice, not a new gap. **PASS.**
- **III. Every Change Ships With a Test (NON-NEGOTIABLE)** — Directly addressed: a new unit test for the slug-generation/collision function, and updates to `e2e/admin.spec.ts`'s vehicle-create test plus a new publish-gate assertion. **PASS**, contingent on `/speckit-tasks` generating these as concrete tasks (it will).
- **IV. Verify Access Control Empirically** — N/A. No access-control rule changes; `access.read` on `Vehicles` is untouched.
- **V. Draft-Safe, Publish-Gated** — This principle *is* the feature: moving `make`/`model`/`year` completeness from schema-`required` to a `beforeChange` gate on the `available` transition is exactly the pattern this principle prescribes, mirroring `heroImage`. **PASS.**
- **VI. Simplicity Over Premature Abstraction** — The plan extracts slug-collision logic into a small pure function only because Principle III requires it to be unit-testable without a running Payload instance; no new dependency, admin screen, or unrelated abstraction is introduced. **PASS.**

No violations — Complexity Tracking section is not needed.

## Post-Design Constitution Check

*Re-checked after Phase 1 (data-model.md, contracts/, quickstart.md).*

No new entities, routes, or external dependencies were introduced during design — the data model is the existing `Vehicles` collection with two hooks. All gates above still hold unchanged. **PASS.**

## Project Structure

### Documentation (this feature)

```text
specs/002-reduce-required-fields/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

This feature touches the existing single Next.js + embedded-Payload project; no new top-level directories:

```text
src/
├── collections/
│   └── Vehicles.ts          # slug/make/model/year required-ness + beforeValidate/beforeChange hooks
├── lib/
│   ├── utils.ts              # existing slugify() — reused, not duplicated
│   └── slug.ts                # NEW — pure, unit-testable slug-generation/collision helper
│   └── slug.test.ts           # NEW — Vitest unit tests (collision handling, blank-title guard)
└── (no other src/ paths touched)

e2e/
└── admin.spec.ts              # UPDATED — vehicle-create test reflects new minimum required fields;
                                #  new case asserting the make/model/year publish gate
```

**Structure Decision**: Single project (this repo has no frontend/backend split — Payload is embedded in the Next.js app). All production code changes are confined to `src/collections/Vehicles.ts` and one new small helper module under `src/lib/`; test changes are a new Vitest unit file next to that helper and an update to the existing `e2e/admin.spec.ts`. No new routes, globals, or admin screens.

## Complexity Tracking

No Constitution Check violations — this section is not applicable.
