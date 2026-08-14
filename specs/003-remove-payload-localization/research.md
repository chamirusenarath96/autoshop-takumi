# Phase 0 Research: Retire Payload Localization on Makes, Models, Media, SiteSettings, and Homepage

## 1. Field pairing mechanism

**Decision**: Replace each `localized: true` field with two plain (non-localized) sibling fields, using the `<base>Ja` / `<base>En` naming convention already specified verbatim in roadmap issue #20's field-level table (e.g. `name` → `nameJa`/`nameEn`), identical to the mechanism spec 002/issue #19 already applied to `Vehicles`.

**Rationale**: Consistency with the already-shipped-or-in-progress pattern is itself the goal (spec User Story 1/3) — introducing a second mechanism for the remaining five schemas would leave the codebase with two different content-localization patterns, which is exactly what issue #20 exists to avoid. No new Payload field type or UI package is needed; both languages render in the same admin form (Constitution Principle VI).

**Alternatives considered**: Payload `tabs` grouping or a custom side-by-side component (design issue #18's Options A/C) — both already rejected for `Vehicles` in spec 002's research.md for the same reasons, which apply identically here: the roadmap issues specify flat paired fields, and presentation polish can layer on top later without a second migration.

## 2. Locale-fallback rendering — reuse vs. duplicate

**Decision**: Extend issue #19's `src/lib/vehicle-locale.ts` helper into a generically-named, generically-typed shared helper (e.g. rename/move to `src/lib/content-locale.ts`, exporting a `resolveLocalizedField(activeValue, fallbackValue, activeLocale)`-shaped function with no `Vehicle`-specific typing) that both this feature's consumers (Makes/Models filter labels, Media alt text, SiteSettings, Homepage) and `Vehicles`' consumers import from one place, rather than each migration maintaining its own copy of the same `value || fallback` logic.

**Rationale**: Constitution Principle VI (no premature abstraction, but also no duplicated logic once a second concrete need exists) — issue #19 already built and tested this exact fallback rule once; this feature is the second concrete consumer that makes generalizing it worthwhile, not a hypothetical future one. Centralizing it also means the two migrations' display behavior can never silently drift apart from each other.

**Alternatives considered**: Writing a second, independent helper scoped to this feature's five schemas was considered and rejected — it would duplicate already-tested logic and risk the two migrations' fallback rule diverging over time as either is touched independently. Inlining the `??`/`||` check at each of the ~6+ call sites (Makes/Models filter labels, image alt text, SiteSettings fields, Homepage fields) was rejected for the same reason spec 002 rejected it originally: repeated small logic drifting apart across call sites.

**Note for implementation sequencing**: This decision assumes issue #19's helper exists on `master` by the time this feature is implemented (i.e., #19/PR #25 has merged — see spec.md Assumptions and plan.md's Technical Context constraint). If implementation of this feature genuinely must start before #19 merges, the fallback helper should still be written in the same generic, non-`Vehicle`-specific shape described above, so `Vehicles`' consumers can be migrated onto it later with a pure import-path change and no logic rewrite — never as a second, parallel implementation.

## 3. Migration approach for existing data

**Decision**: A one-time Node/TypeScript script under `scripts/` (following the existing `scripts/seed.ts` and issue #19's `scripts/migrate-vehicle-fields.ts` pattern), covering all five schemas in one run: it reads every Make, Model, and Media document, and both the SiteSettings and Homepage globals, via Payload's Local API (paginating collections — `payload.find()` defaults to 10 results per page, so the script must iterate `page`/`limit` or request `pagination: false`/`limit: 0`; globals are singletons and need no pagination), reads each old localized field's `.ja`/`.en` values, and writes them into the new paired fields — run once against each environment (local, then production) before the old fields are removed from any collection/global config. Idempotency is checked **per target field**, matching issue #19's precedent (see data-model.md) — a partially-migrated document converges to fully migrated on a re-run, and a fully-migrated document's re-run is a true no-op.

**Rationale**: Matches this repo's documented precedent and its documented cautionary lesson (the retired `/api/internal-init-schema` route — README Known Issues / PR #14 history): a script run via the same `tsx`/Node path as `scripts/seed.ts`, not a network-exposed route gated by a static nonce. Running all five schemas from a single script (rather than five separate scripts) keeps the migration a single, auditable, one-time operation matching the scope of one feature/PR, while still structuring it as five independent, individually-idempotent field-mapping passes internally (see data-model.md) so a partial failure on one schema doesn't block or corrupt the others.

**Alternatives considered**: A Payload database migration (`payload migrate:create`) was considered but rejected for the same reason issue #19's research.md already rejected it — this project's `payload` CLI invocation via `tsx` hits a known ESM/CJS interop failure (README Known Issues), unresolved as of this feature. Five separate migration scripts (one per schema) were considered and rejected as unnecessary process overhead for what is fundamentally one feature's one-time data operation; the per-field idempotency design already gives partial-failure isolation without needing separate scripts.

## 4. `getSiteSettings(locale)` rewrite

**Decision**: `src/lib/site-settings.ts`'s `getSiteSettings(locale)` currently calls Payload's locale-aware `findGlobal({ slug: 'site-settings', locale })` and relies on Payload to resolve `shopName`/`address`/etc. to the requested language automatically. It is rewritten to call `findGlobal({ slug: 'site-settings' })` with no `locale` option (since the field itself is no longer locale-aware), then apply the shared fallback helper (§2) to each paired field (`shopNameJa`/`shopNameEn` → resolved `shopName`, etc.) before returning the same shaped object its callers already consume.

**Rationale**: Keeps `getSiteSettings(locale)`'s existing return shape and call signature stable for all its consumers (Header, Footer, About page, per README's Data Model section) — the locale-resolution logic moves from Payload's config into this one function's body, which is the smallest possible change surface (Constitution Principle VI) and requires zero changes at any call site.

**Alternatives considered**: Changing `getSiteSettings()`'s return shape to expose both `*Ja`/`*En` values and pushing the fallback pick out to each caller was rejected — it would touch every consumer (Header, Footer, About page) for no benefit, when centralizing the pick in the one existing function call site is strictly simpler.

## 5. Scope and sequencing boundary confirmation

**Decision**: This feature touches `Makes`, `Models`, `Media`, `SiteSettings`, and `Homepage` only. The `Vehicles` collection's own `localized: true` fields remain issue #19's exclusive responsibility (spec.md Assumptions: "Out of scope — Vehicles collection"). The `payload.config.ts` `localization` block removal (FR-008) is the final task in this feature's implementation and is gated on issue #19 having also fully removed `localized: true` from `Vehicles` — removing it while `Vehicles` still depends on it would break that collection.

**Rationale**: Matches roadmap issue #20's explicit framing as the second half of a two-part migration, and its documented dependency on #19 landing first. Sequencing the config removal last (rather than per-schema) reflects that `localization` is one codebase-wide config shared by every collection/global, not something that can be partially removed.

**Alternatives considered**: N/A — this boundary and sequencing are direct, already-decided constraints from the source roadmap issues (#18, #19, #20), not open design questions.
