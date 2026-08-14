# Feature Specification: Retire Payload Localization on Makes, Models, Media, SiteSettings, and Homepage

**Feature Branch**: `docs/spec-remove-payload-localization`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "Migrate the remaining Payload `localized: true` content fields — on the Makes, Models, and Media collections and the SiteSettings and Homepage globals — to explicit paired JA/EN fields, following the same pattern issue #19 established for the Vehicles collection. This is the second half of retiring Payload's `localization` config entirely: once every `localized: true` field in the codebase is replaced, remove the `locales`/`defaultLocale`/`fallback` block from `payload.config.ts`, which is what makes the admin's top locale switcher disappear."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shop staff edit taxonomy and site copy without a locale switcher (Priority: P1)

A dealership staff member editing Makes, Models, Media alt text, Site Settings, or the Homepage in the admin dashboard sees one flat set of fields per language, side by side, on every screen — not a locale switcher that silently hides the other language until they toggle it. They can see and edit both the Japanese and English versions of a name, address, or heading at the same time, without switching context.

**Why this priority**: This is the core value of the migration — the confusing/error-prone hidden-locale editing experience (a past source of "why is the English site missing text I know I entered" issues) is the entire reason issue #19/#20 exist. Every other requirement is either what makes this safe (data migration) or what fully realizes it (removing the switcher).

**Independent Test**: Log into `/admin`, open Makes (or Models, Media, Site Settings, Homepage), and confirm both language fields for every migrated field render together on the same edit screen with no locale switcher needed to see the other language's value.

**Acceptance Scenarios**:

1. **Given** an existing Make with a Japanese name and an English name entered under the old locale-switcher UI, **When** an admin opens that Make's edit screen after the migration, **Then** both `nameJa` and `nameEn` are visible together, pre-populated with the values that were previously stored, with none lost.
2. **Given** an admin creates a new Model, **When** they fill in only `nameJa` and leave `nameEn` blank and save, **Then** the record saves successfully (paired fields are independently optional, matching today's per-locale behavior where a locale value can be blank).
3. **Given** Site Settings has an `address` previously entered in both languages, **When** an admin opens Site Settings after migration, **Then** `addressJa` and `addressEn` both show the correct, previously-entered text.

---

### User Story 2 - Visitors see correct bilingual content on the public site after the migration (Priority: P1)

A site visitor browsing in Japanese or English sees the same taxonomy names (make/model), image alt text, shop address, and homepage copy they saw before the migration — the switch from Payload's locale-aware storage to explicit paired fields must be invisible to the public site's behavior.

**Why this priority**: Equal priority to Story 1 — a migration that breaks or blanks public-facing content on either locale is a regression, not a rewrite. This is the safety rail on the whole feature.

**Independent Test**: Load the `/ja` and `/en` versions of the landing page, the vehicle listing page (make/model filter labels), and the about/contact areas sourced from Site Settings; confirm every migrated field renders the correct language-specific text with no blank fields or `undefined`/`[object Object]`-style artifacts.

**Acceptance Scenarios**:

1. **Given** a Make named "トヨタ" / "Toyota" before migration, **When** a visitor loads the vehicle listing filter in either locale after migration, **Then** they see "トヨタ" on `/ja` and "Toyota" on `/en`.
2. **Given** the Homepage global's hero heading, subheading, "why us" points, and about blurb were filled in both languages, **When** a visitor loads the landing page in either locale, **Then** all of that copy renders correctly per-locale with no missing sections.
3. **Given** a Media item's alt text was filled in both languages, **When** that image renders on the public site in either locale, **Then** the `alt` attribute uses the correct language's text (accessibility/SEO must not regress).

---

### User Story 3 - The admin locale switcher disappears once no field needs it (Priority: P2)

Once every `localized: true` field in the entire codebase (Vehicles from #19, plus Makes/Models/Media/SiteSettings/Homepage from this feature) is replaced with paired fields, the top-of-admin locale switcher — a UI element that only existed because Payload's `localization` config was active — is removed along with that config, simplifying the admin UI to match how content is actually edited now (all languages visible together, no hidden per-locale state).

**Why this priority**: This is a cleanup/consistency outcome dependent on Story 1 and 2 (and on issue #19's Vehicles migration) being fully done first — it delivers no independent user value until every other localized field is gone, so it is correctly sequenced last.

**Independent Test**: After confirming no `localized: true` remains anywhere in the collection/global schemas, load `/admin` and confirm the locale switcher control is no longer present anywhere in the admin UI, and that this does not change behavior of any REST/GraphQL/Local API call.

**Acceptance Scenarios**:

1. **Given** the `localization` block has been removed from `payload.config.ts`, **When** an admin loads any admin screen, **Then** no locale switcher control is rendered.
2. **Given** the `localization` config removal, **When** an existing e2e test or manual check exercises the public REST/GraphQL API with a `locale` query parameter, **Then** no previously-working request is broken (the API either ignores the now-meaningless parameter gracefully or the parameter was never required for these paired-field endpoints).

### Edge Cases

- What happens when an existing record has a field filled in only one language (e.g. a Make with `nameJa` set but the old `name.en` was always blank)? The paired field for the missing language migrates as blank/empty, not as a copied duplicate of the other language's value — matching Story 1's Acceptance Scenario 2 (paired fields stay independently optional after migration, same as before).
- How does the system handle a `whyUsPoints` array item where one language's `heading`/`body` was filled and the other wasn't? Same rule as above — migrate what exists, leave the paired field blank if the source had nothing, don't fabricate a fallback value.
- What happens to public-page rendering when a migrated paired field is genuinely blank in the visitor's active locale (e.g. `nameEn` was never filled in)? The site shows what exists rather than rendering an empty string or a Japanese fallback silently substituted for English — consistent with the display-fallback precedent already decided for the Vehicles migration in issue #19.
- What happens to any existing bookmarked/shared REST or GraphQL request that explicitly passes a `locale` query parameter for Makes, Models, Media, SiteSettings, or Homepage once `localization` is removed from `payload.config.ts`? It must not error; per FR-009, this needs empirical verification against the running server before removal, not an assumption from reading source.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST replace the `localized: true` field `name` on the Makes collection with two independent fields, `nameJa` and `nameEn`, each optionally blank.
- **FR-002**: The system MUST replace the `localized: true` field `name` on the Models collection with `nameJa` and `nameEn`, each optionally blank.
- **FR-003**: The system MUST replace the `localized: true` field `alt` on the Media collection with `altJa` and `altEn`, each optionally blank.
- **FR-004**: The system MUST replace these `localized: true` fields on the SiteSettings global with paired fields: `shopName` → `shopNameJa`/`shopNameEn`; `address` → `addressJa`/`addressEn`; `defaultSeoTitle` → `defaultSeoTitleJa`/`defaultSeoTitleEn`; `defaultSeoDescription` → `defaultSeoDescriptionJa`/`defaultSeoDescriptionEn`.
- **FR-005**: The system MUST replace these `localized: true` fields on the Homepage global with paired fields: `heroHeading` → `heroHeadingJa`/`heroHeadingEn`; `heroSubheading` → `heroSubheadingJa`/`heroSubheadingEn`; `aboutBlurb` → `aboutBlurbJa`/`aboutBlurbEn`; each `whyUsPoints[]` array item's `heading`/`body` → `headingJa`/`headingEn` and `bodyJa`/`bodyEn`; `contactSummary` → `contactSummaryJa`/`contactSummaryEn`.
- **FR-006**: The system MUST migrate all existing production content from the old per-locale storage into the new paired fields before the old fields are removed from any schema, with no data loss for either language, for every collection/global listed in FR-001 through FR-005.
- **FR-007**: Every consumer of a migrated field — admin screens, the public site's Local API reads, and any REST/GraphQL API response shape — MUST select the correct language's field based on the active locale rather than relying on Payload's locale-aware resolution, since that resolution mechanism no longer applies to these fields.
- **FR-008**: Once no field anywhere in the codebase uses `localized: true` (this feature plus issue #19's Vehicles migration both complete), the system MUST remove the `locales`/`defaultLocale`/`fallback` `localization` block from `payload.config.ts`.
- **FR-009**: Before the `localization` block is removed, the system MUST verify empirically (not by source inspection alone) that no other behavior — REST/GraphQL `locale` query parameter handling, Local API calls passing a `locale` option — depends on it in a way that would break after removal.
- **FR-010**: The admin UI's locale switcher control MUST no longer render once the `localization` config is removed.
- **FR-011**: Every migrated field MUST remain independently optional per language, matching today's behavior where one locale's value can be blank while the other is filled.
- **FR-012**: Public-facing rendering of a migrated field MUST show whatever content exists for the active locale and MUST NOT silently substitute the other language's value or render an empty/placeholder artifact when the active locale's field is blank.

### Key Entities

- **Make**: Vehicle manufacturer taxonomy entry. Attribute affected: display name, now stored as two language-specific values instead of one locale-aware value.
- **Model**: Vehicle model taxonomy entry, related to a Make. Attribute affected: display name, same paired-field treatment as Make.
- **Media**: Uploaded image/asset. Attribute affected: accessibility/SEO alt text, now two language-specific values.
- **SiteSettings** (global, singleton): Dealership identity and contact info. Attributes affected: shop name, address, default SEO title/description.
- **Homepage** (global, singleton): Landing page content. Attributes affected: hero heading/subheading, about blurb, each "why us" trust-signal point's heading and body text, contact summary.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of existing Make, Model, Media, SiteSettings, and Homepage content entered in either language before the migration is still present and correctly attributed to its language afterward — zero content loss across the migration.
- **SC-002**: Admin staff editing any of the five affected screens (Makes, Models, Media, Site Settings, Homepage) can see and edit both languages' values for a field on one screen, with zero additional clicks or navigation needed to view or edit the other language, compared to the prior locale-switcher workflow.
- **SC-003**: Visitors browsing the public site in either supported language see 100% of the taxonomy names, image alt text, and shop/homepage copy that were correctly showing before the migration, with no regressions in either locale.
- **SC-004**: After the `localization` config is removed, 100% of previously-passing automated checks covering the public REST/GraphQL API continue to pass unmodified in behavior (aside from tests updated per FR-007/FR-011's new field shape).
- **SC-005**: The admin locale switcher no longer appears anywhere in the admin UI once this feature and issue #19 are both complete.

## Assumptions

- **Sequencing relative to issue #19**: Issue #20 (this feature) is documented as depending on issue #19 (the equivalent paired-field migration for the Vehicles collection), to be implemented second so there's a working reference pattern to copy. As of this spec being written, #19 has an open, not-yet-merged implementer PR (#25). This spec is written now regardless, since spec-writing has no code dependency — but the implementation plan (plan.md/tasks.md) should note that starting actual implementation is best delayed until #19/PR #25 merges, so the paired-field-plus-migration-script approach it establishes can be reused rather than independently re-invented, per this repo's constitution principle on simplicity over premature abstraction.
- **Migration script pattern**: Following issue #19's approach and this repo's prior guidance (see the retired `/api/internal-init-schema` route from PR #14 for what *not* to do), the data migration for existing content is assumed to be a one-time script gated behind proper auth or run out-of-band, not a hardcoded-secret HTTP route, and deleted or disabled once it has run against production.
- **Constitution conflict, noted but not resolved here**: This repo's constitution (Principle II, "No Hardcoded UI Strings") currently states "Every localized Payload field needs `localized: true` in its collection/global config" — this feature's entire purpose contradicts that specific sentence (while remaining consistent with the principle's actual intent, that every visitor-facing string exists in both languages). Amending the constitution's wording is out of scope for this spec/spec-writing pipeline; it should happen as part of implementation (this feature's or #19's PR), consistent with the constitution's own Governance section, which treats a conflict between it and CLAUDE.md/README.md as a sign the constitution needs updating.
- **Out of scope — Vehicles collection**: The Vehicles collection's own `localized: true` fields (title, summary, highlights, description, specs, seoTitle/seoDescription) and its price/currency fields are issue #19's responsibility, not this feature's. This spec assumes #19 ships independently.
- **Out of scope — next-intl UI routing**: The visitor-facing `/ja`/`/en` URL routing, the `LocaleSwitcher` component, and `src/messages/*.json` UI strings are a separate, unrelated system (next-intl, not Payload field localization) and are unaffected by this feature.
- **REST/GraphQL locale parameter**: Assumed that once no field remains `localized: true`, any `locale` query parameter still accepted by Payload's generated REST/GraphQL endpoints becomes inert (ignored) rather than erroring — this must be confirmed empirically per FR-009 before the `localization` config is removed, not assumed from documentation alone.
- **Blank-field display fallback**: Following the precedent set for the Vehicles migration (issue #19), a paired field that's blank in the visitor's active locale is assumed to render as "show what exists" (i.e., that piece of content is simply absent/empty) rather than falling back to the other language's value — consistent across both migrations for a predictable admin/visitor experience.
