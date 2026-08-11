# Implementation Plan: Paired JA/EN Content and JPY/USD Pricing on Vehicle Listings

**Branch**: `docs/spec-vehicle-ja-en-pricing-fields` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-vehicle-ja-en-pricing-fields/spec.md`

## Summary

`src/collections/Vehicles.ts` currently marks nine content fields `localized: true` (title, exteriorColor, summary, highlights[].text, description, specs[].label/value, seoTitle, seoDescription), which Payload only exposes one language at a time behind its admin-wide locale switcher, plus a single `price` number with a `currency` select (JPY/USD, no per-locale link). This plan replaces both with explicit, always-visible paired fields — `titleJa`/`titleEn`, ..., and `priceJpy`/`priceUsd` — removing `localized: true` from every field on this collection and the `currency` select entirely. Public pages pick the paired field matching the visitor's route locale, falling back to the other language when one is blank. A one-time migration copies each existing document's `.ja`/`.en` values and `price`+`currency` into the new fields before the old ones are removed, so no production listing data is lost. Scope is limited to the `Vehicles` collection; `Makes`, `Models`, `Media`, `SiteSettings`, and `Homepage` keep `localized: true` and are explicitly out of scope (tracked separately, per spec.md Assumptions).

## Technical Context

**Language/Version**: TypeScript (Next.js 15 / Node, per repo's Volta-pinned version)

**Primary Dependencies**: Payload CMS 3.x (`CollectionConfig`, field-level config, `beforeChange` hooks), Next.js App Router (`[locale]` route param already threaded through public pages), `next-intl` (unaffected — this feature is Payload content localization only, not UI-string localization)

**Storage**: SQLite (local dev) / Postgres-Neon (production) via Payload's ORM. This is a genuine schema change (new columns for every paired field, removal of the old localized columns and the `currency` column) requiring a one-time, code-driven data migration — not just a Payload-config toggle — since production already holds real vehicle listings in the old shape.

**Testing**: Vitest + happy-dom (component tests for `VehicleCard`/`VehicleFilters` covering paired-field rendering and language fallback), Playwright (`e2e/admin.spec.ts` — vehicle create/edit against the new fields; `e2e/public.spec.ts` — listing/detail assertions for fallback display and dual-price rendering)

**Target Platform**: Payload admin (`/admin/collections/vehicles`) and the public site's vehicle listing/detail pages, which read this collection server-side via Payload's Local API (`src/lib/payload.ts`)

**Project Type**: Web application (Next.js App Router + embedded Payload CMS) — single project, no frontend/backend split

**Performance Goals**: N/A — no new hot-path query behavior; paired fields are read the same way the single localized fields are today, just with a language-pick step at render time instead of relying on Payload's `?locale=` resolution

**Constraints**: Zero data loss for existing vehicle listings across the migration (spec FR-008, SC-003); listing filter/sort behavior (make, model, body type, transmission, price) must be unaffected (FR-011); scope confined to `Vehicles` only (FR-010) — no schema change to `Makes`, `Models`, `Media`, `SiteSettings`, or `Homepage`

**Scale/Scope**: One collection (`Vehicles`); nine content fields become eighteen paired fields; one price+currency pair becomes two independent price fields; every public/admin consumer of the old field names needs updating; one migration script; no new entities, routes, or globals

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. CMS-Driven Content, Not Hardcoded** — PASS. No shop identity is hardcoded; content remains entirely CMS-editable, just restructured from Payload-locale-resolved fields to explicit paired fields.
- **II. No Hardcoded UI Strings** — PARTIAL, justified deviation (see Complexity Tracking). The constitution's current text ("Every localized Payload field needs `localized: true`") describes the pattern this feature deliberately moves the `Vehicles` collection away from, per the decision already recorded across roadmap issues #18–#20. The *spirit* of the principle — every visitor-facing piece of content has a real, non-hardcoded value in both languages — is preserved (arguably strengthened, since FR-005's fallback display closes the "silently blank" gap the old approach had); only the *mechanism* changes from Payload's field localization to explicit paired fields. `next-intl`'s UI-string localization (the other half of this principle) is entirely untouched. Recommend amending `constitution.md`'s Principle II wording once this feature (and its planned follow-up covering Makes/Models/Media/SiteSettings/Homepage) lands, since at that point paired fields — not `localized: true` — will be this project's actual pattern for CMS content localization.
- **III. Every Change Ships With a Test** — PASS (design commitment). Component tests for `VehicleCard`/`VehicleFilters` paired-field rendering and fallback; `e2e/admin.spec.ts` create/edit coverage for the new fields; `e2e/public.spec.ts` coverage for fallback display and dual-price rendering; a unit test for the migration's field-mapping logic (see data-model.md). Enforced concretely by `/speckit-tasks`.
- **IV. Verify Access Control Empirically** — N/A. No `access` config changes on `Vehicles`; read/write permissions are unaffected by this field-shape change.
- **V. Draft-Safe, Publish-Gated** — PASS, and directly extended: FR-007 adds a minimum-completeness check (title in one language, price in one currency or price-on-request) to the existing `beforeChange` publish gate, mirroring the current `heroImage` precedent, while every paired field remains individually optional at the schema level so drafts stay freely saveable incomplete.
- **VI. Simplicity Over Premature Abstraction** — PASS. No new admin screen, no new npm dependency — paired fields are plain Payload field definitions; the language-pick-at-render logic is a small, existing-pattern-following helper (see data-model.md), not a new abstraction layer.

**Gate result**: PASS with one documented, pre-decided deviation from Principle II's current literal wording (Complexity Tracking below) — no unjustified violations.

## Post-Design Constitution Check

*Re-checked after Phase 1 (data-model.md, contracts/, quickstart.md).*

Design introduced no new entities, routes, admin screens, or dependencies beyond the paired fields and one small render-time field-selection helper (mirrors `formatPrice()`'s existing shape, just extended). The Principle II deviation identified above is unchanged by design details — still the one documented, pre-decided exception. All other gates remain PASS as stated above.

## Project Structure

### Documentation (this feature)

```text
specs/002-vehicle-ja-en-pricing-fields/
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
│   └── Vehicles.ts               # field definitions: 9 localized fields → 18 paired fields;
│                                  #   price+currency → priceJpy/priceUsd; extended beforeChange gate
├── lib/
│   ├── utils.ts                   # formatPrice() simplified — no more per-vehicle currency param
│   └── vehicle-locale.ts          # NEW — small pure helper resolving a paired field's display
│                                  #   value for a given locale, with same-document fallback
├── payload-types.ts               # regenerated (npm run generate:types) — new field names
├── app/(public)/[locale]/
│   ├── vehicles/page.tsx          # listing — reads paired fields via vehicle-locale.ts helper
│   └── vehicles/[slug]/page.tsx   # detail — same
└── components/vehicles/
    ├── VehicleCard.tsx            # paired-field display
    └── VehicleFilters.tsx         # only if it references old field names (spec: likely not,
                                    #   filters by make/model/year/status/bodyType/transmission)

scripts/
├── seed.ts                        # populates new paired fields instead of old localized ones
└── migrate-vehicle-fields.ts      # NEW — one-time migration: old localized/price+currency
                                    #   values → new paired fields, for existing documents

e2e/
├── admin.spec.ts                  # UPDATED — vehicle create/edit against new fields
└── public.spec.ts                 # UPDATED — listing/detail fallback + dual-price assertions

src/lib/__tests__/ or src/lib/vehicle-locale.test.ts   # NEW — unit tests for the fallback helper
```

**Structure Decision**: Single project (no frontend/backend split — Payload is embedded in the Next.js app). Field-shape changes are confined to `src/collections/Vehicles.ts`; a new small helper module (`src/lib/vehicle-locale.ts`) centralizes the "pick this language, fall back to the other" logic so every consumer (listing, detail, `VehicleCard`) uses one tested implementation rather than repeating the fallback check inline. Migration logic is a standalone script under `scripts/`, following this repo's existing pattern for one-time data operations (see README's documented cautionary precedent from the retired `/api/internal-init-schema` route — no ad-hoc production routes, no hardcoded secrets; a script run once and then safe to leave in place since it's idempotent against already-migrated documents).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle II ("every localized field needs `localized: true`") not followed for `Vehicles` | This is the feature's entire purpose: replace Payload's per-field locale gating (which hides content behind an admin-wide switcher and gives no "missing translation" signal) with always-visible paired fields, per the decision already recorded across roadmap issues #18–#20 | Keeping `localized: true` and only adding a missing-translation warning (design issue #18's "Option B") was considered and rejected in the prior design decision — the follow-up implementation issues (#19, #20) that this plan implements specifically chose the paired-field restructure instead, so re-litigating that choice here would contradict already-decided, in-flight roadmap work |
