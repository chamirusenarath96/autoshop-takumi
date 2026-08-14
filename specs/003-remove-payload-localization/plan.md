# Implementation Plan: Retire Payload Localization on Makes, Models, Media, SiteSettings, and Homepage

**Branch**: `docs/spec-remove-payload-localization` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-remove-payload-localization/spec.md`

## Summary

`src/collections/Makes.ts`, `src/collections/Models.ts`, and `src/collections/Media.ts`, plus the `src/globals/SiteSettings.ts` and `src/globals/Homepage.ts` globals, together mark eleven fields (counting each `whyUsPoints[]` array item's `heading`/`body` once) `localized: true`, all hidden one language at a time behind Payload's admin-wide locale switcher today. This plan replaces every one of them with explicit, always-visible paired fields (`nameJa`/`nameEn`, `altJa`/`altEn`, `shopNameJa`/`shopNameEn`, `addressJa`/`addressEn`, `defaultSeoTitleJa`/`defaultSeoTitleEn`, `defaultSeoDescriptionJa`/`defaultSeoDescriptionEn`, `heroHeadingJa`/`heroHeadingEn`, `heroSubheadingJa`/`heroSubheadingEn`, `aboutBlurbJa`/`aboutBlurbEn`, `whyUsPoints[].headingJa`/`headingEn`, `whyUsPoints[].bodyJa`/`bodyEn`, `contactSummaryJa`/`contactSummaryEn`), following the exact pattern issue #19/spec 002 established for the `Vehicles` collection. Public pages pick the paired field matching the visitor's route locale, falling back to the other language when one is blank (spec FR-012, matching #19's FR-006). A one-time migration script copies each existing document's `.ja`/`.en` per-locale values into the new paired fields before the old fields are removed, so no production Makes/Models/Media/SiteSettings/Homepage content is lost. Once this feature and #19 are both complete, no field anywhere uses `localized: true`, so the `localization` block (`locales`/`defaultLocale`/`fallback`) is removed from `payload.config.ts`, which removes the admin's top locale switcher as a direct consequence (spec FR-008, FR-010) — this is the *last* step and depends on #19 having shipped first (spec Assumptions).

## Technical Context

**Language/Version**: TypeScript (Next.js 15 / Node, per repo's Volta-pinned version)

**Primary Dependencies**: Payload CMS 3.x (`CollectionConfig`/`GlobalConfig`, field-level config), Next.js App Router (`[locale]` route param already threaded through public pages), `next-intl` (unaffected — this feature is Payload content localization only, not UI-string localization)

**Storage**: SQLite (local dev) / Postgres-Neon (production) via Payload's ORM. Genuine schema change (new columns for every paired field, removal of the old localized columns) requiring a one-time, code-driven data migration — not just a Payload-config toggle — since production already holds real Makes/Models/Media/SiteSettings/Homepage content in the old shape.

**Testing**: Vitest + happy-dom (component tests for any component rendering `Media.alt` or Homepage/SiteSettings copy, covering paired-field rendering and language fallback), Playwright (`e2e/admin.spec.ts` — Makes/Models/Media/SiteSettings/Homepage admin screens against the new fields, plus the three existing Payload-theme regression tests noted in CLAUDE.md which must keep passing since they are unrelated to field shape; `e2e/public.spec.ts` — landing page, vehicle listing filter labels, about/contact assertions for fallback display)

**Target Platform**: Payload admin (`/admin/collections/makes`, `/models`, `/media`, `/admin/globals/site-settings`, `/admin/globals/homepage`) and the public site's landing, vehicle listing, and about/contact areas, which read this content server-side via Payload's Local API (`src/lib/payload.ts`, `src/lib/site-settings.ts`)

**Project Type**: Web application (Next.js App Router + embedded Payload CMS) — single project, no frontend/backend split

**Performance Goals**: N/A — no new hot-path query behavior; paired fields are read the same way the single localized fields are today, just with a language-pick-with-fallback step at render time instead of relying on Payload's `?locale=` resolution

**Constraints**: Zero data loss for existing Makes/Models/Media/SiteSettings/Homepage content across the migration (spec FR-006, SC-001); vehicle-listing filter labels (make/model names) must be unaffected in either locale; this feature MUST NOT touch the `Vehicles` collection (issue #19's separate, already-in-progress responsibility — spec Assumptions); removing the `localization` block from `payload.config.ts` (FR-008) is gated on #19 having also fully removed `localized: true` from `Vehicles` first, since the config is codebase-wide, not per-collection

**Scale/Scope**: Three collections (Makes, Models, Media) plus two globals (SiteSettings, Homepage); eleven `localized: true` fields become twenty-two paired fields; every public/admin consumer of the old field names needs updating, most centrally `src/lib/site-settings.ts`'s `getSiteSettings(locale)`; one migration script covering five schemas; one config removal (`payload.config.ts`) contingent on #19; no new entities or routes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. CMS-Driven Content, Not Hardcoded** — PASS. No shop identity is hardcoded; content remains entirely CMS-editable, just restructured from Payload-locale-resolved fields to explicit paired fields. `src/lib/site-settings.ts` continues to be the single place public components read shop identity from.
- **II. No Hardcoded UI Strings** — PARTIAL, justified deviation (see Complexity Tracking), identical in nature to the deviation already accepted and documented in spec 002/issue #19's plan.md. The constitution's current text ("Every localized Payload field needs `localized: true`") describes the pattern this feature deliberately completes moving away from, across the whole codebase, per the decision already recorded across roadmap issues #18–#20. The principle's actual intent — every visitor-facing string has a real, non-hardcoded value in both languages — is preserved and arguably strengthened by FR-012's fallback display closing the "silently blank" gap. `next-intl`'s UI-string localization is entirely untouched.
- **III. Every Change Ships With a Test** — PASS (design commitment). Component tests for anything rendering migrated fields (image alt text, homepage copy); `e2e/admin.spec.ts` coverage for Makes/Models/Media/SiteSettings/Homepage create/edit against the new fields, plus re-verification of the three existing Payload-theme regression tests (CLAUDE.md) after `localization` config removal, since that removal changes the admin shell those tests assert against; `e2e/public.spec.ts` coverage for fallback display on the landing page, listing filters, and about/contact areas; unit tests for the migration script's field-mapping logic and idempotency. Enforced concretely by `/speckit-tasks`.
- **IV. Verify Access Control Empirically** — N/A. No `access` config changes on any of the five affected schemas; read/write permissions are unaffected by this field-shape change.
- **V. Draft-Safe, Publish-Gated** — PASS. None of the five affected schemas have a publish-gate concept today (unlike `Vehicles`' `status: 'available'` gate) — every migrated field simply stays individually optional at the schema level, matching current behavior where one locale's value can be blank (spec FR-011). No new gate is introduced.
- **VI. Simplicity Over Premature Abstraction** — PASS. No new admin screen, no new npm dependency — paired fields are plain Payload field definitions. The language-pick-with-fallback logic is expected to reuse or closely mirror the small helper already introduced by issue #19's `Vehicles` migration (`src/lib/vehicle-locale.ts` per spec 002's plan.md) rather than inventing a second, parallel implementation — see research.md for the concrete reuse-vs-duplicate decision.

**Gate result**: PASS with one documented, pre-decided deviation from Principle II's current literal wording (Complexity Tracking below) — the same deviation already accepted for spec 002/issue #19, extended here to the remaining collections/globals. No unjustified violations.

## Post-Design Constitution Check

*Re-checked after Phase 1 (data-model.md, contracts/, quickstart.md).*

Design introduced no new entities, routes, admin screens, or dependencies beyond the paired fields and reuse of the existing locale-fallback helper pattern from issue #19 (extended to a generic form so both migrations' consumers can share it — see data-model.md). The Principle II deviation identified above is unchanged by design details — still the one documented, pre-decided exception, now spanning both migrations identically. All other gates remain PASS as stated above.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

This feature touches the existing single Next.js + embedded-Payload project; no new top-level directories:

```text
src/
├── collections/
│   ├── Makes.ts                   # name → nameJa/nameEn
│   ├── Models.ts                  # name → nameJa/nameEn
│   └── Media.ts                   # alt → altJa/altEn
├── globals/
│   ├── SiteSettings.ts             # shopName/address/defaultSeoTitle/defaultSeoDescription → paired fields
│   └── Homepage.ts                 # heroHeading/heroSubheading/aboutBlurb/whyUsPoints[]/contactSummary → paired fields
├── lib/
│   ├── site-settings.ts            # getSiteSettings(locale) — rewritten to read paired fields
│   │                                #   directly and pick by locale, instead of Payload's
│   │                                #   locale-aware findGlobal()
│   ├── content-locale.ts           # NEW (or extend issue #19's src/lib/vehicle-locale.ts into a
│   │                                #   shared, generically-named helper) — the same "pick this
│   │                                #   language, fall back to the other" logic reused across
│   │                                #   both migrations rather than reimplemented; see research.md
│   │                                #   for the reuse-vs-duplicate decision
│   └── payload.ts                  # unaffected — Local API cache helper
├── payload.config.ts               # localization block (locales/defaultLocale/fallback) removed
│                                    #   — LAST step, gated on issue #19 also being fully merged
├── payload-types.ts                # regenerated (npm run generate:types) — new field names
├── app/(public)/[locale]/
│   ├── page.tsx                    # Homepage global consumer — paired fields via content-locale.ts
│   └── vehicles/page.tsx           # Makes/Models filter labels — paired fields via content-locale.ts
└── components/
    └── [any component rendering Media.alt as an <img>/<Image> alt attribute]

scripts/
├── seed.ts                         # populates new paired fields instead of old localized ones
└── migrate-content-locale-fields.ts  # NEW — one-time migration: old localized values → new
                                       #   paired fields, for Makes/Models/Media/SiteSettings/Homepage

e2e/
├── admin.spec.ts                   # UPDATED — Makes/Models/Media/SiteSettings/Homepage screens
│                                    #   against new fields; re-verify the 3 existing Payload-theme
│                                    #   regression tests still pass once localization is removed
└── public.spec.ts                  # UPDATED — landing/listing-filter/about fallback assertions

src/lib/__tests__/ or src/lib/content-locale.test.ts   # NEW/extended — unit tests for the shared
                                                          #   fallback helper covering both migrations
```

**Structure Decision**: Single project (no frontend/backend split — Payload is embedded in the Next.js app). Field-shape changes are confined to the three collections and two globals listed above, plus their direct consumers. The language-pick-with-fallback logic centralizes into one shared helper reused by both this feature and issue #19's `Vehicles` migration (rather than each maintaining its own copy — Constitution Principle VI), following this repo's existing pattern for one-time production data operations (see README's cautionary precedent from the retired `/api/internal-init-schema` route — no ad-hoc production routes, no hardcoded secrets; a script run once, idempotent against already-migrated documents, then safe to leave in place or delete). The `payload.config.ts` `localization` block removal is deliberately the last code change in this feature's task ordering, since it is a single codebase-wide config that both this feature and issue #19 depend on being present until *both* have removed every `localized: true` field.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle II ("every localized field needs `localized: true`") not followed for Makes/Models/Media/SiteSettings/Homepage | This is the feature's entire purpose: complete, codebase-wide, the replacement of Payload's per-field locale gating (which hides content behind an admin-wide switcher and gives no "missing translation" signal) with always-visible paired fields, per the decision already recorded across roadmap issues #18–#20, and already applied to `Vehicles` by issue #19 | Leaving these five schemas on `localized: true` while only `Vehicles` uses paired fields was considered and rejected — it would leave the admin locale switcher in place (defeating spec User Story 3 / FR-008/FR-010) and leave the codebase with two inconsistent content-localization patterns instead of one, which issue #20 exists specifically to avoid |
