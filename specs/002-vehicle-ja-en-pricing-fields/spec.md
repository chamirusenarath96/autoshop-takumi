# Feature Specification: Paired JA/EN Content and JPY/USD Pricing on Vehicle Listings

**Feature Branch**: `002-vehicle-ja-en-pricing-fields`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "Replace Payload CMS field-level localization (`localized: true`) on the Vehicles collection with explicit paired JA/EN fields, and replace the single price+currency pair with explicit dual-currency price fields. Today, `src/collections/Vehicles.ts` marks nine fields localized — `title`, `exteriorColor`, `summary`, `highlights[].text`, `description`, `specs[].label`/`value`, `seoTitle`, `seoDescription` — meaning each is edited one language at a time behind Payload's admin-wide locale switcher, with no UI signal when a listing has content in only one language. Pricing today is a single `price` number plus a `currency` select (JPY/USD), with no real currency conversion or dual display. This feature replaces both: each of the nine localized fields becomes an explicit pair (e.g. `titleJa`/`titleEn`), and `price`+`currency` becomes explicit `priceJpy`+`priceUsd` fields (with `priceOnRequest` unchanged). The public site's active locale picks which field of each pair to render. Requires a one-time data migration preserving all existing content. Scoped only to the Vehicles collection — Makes, Models, Media, SiteSettings, and Homepage are unaffected. Ships with test coverage per this repo's testing rule."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Staff edit both languages of a listing without a global switch (Priority: P1)

A shop staff member creating or editing a vehicle listing needs to enter (or check) both the Japanese and English versions of every text field on that listing — title, exterior color, summary, highlights, description, spec rows, SEO title/description — without first having to change a site-wide language toggle that hides the other language's fields and gives no indication that the other language is still empty.

**Why this priority**: This is the core pain point driving the whole feature (see the source design issue) — staff currently publish listings with one language silently blank because the admin UI only shows one language at a time. It is also the foundation the other stories depend on: nothing about dual pricing or visitor-facing fallback matters if the underlying field structure isn't in place.

**Independent Test**: Can be fully tested by opening a vehicle listing's edit screen and confirming every one of the nine content fields has both a Japanese and an English input visible and independently editable in the same pass, without navigating away or toggling a locale control.

**Acceptance Scenarios**:

1. **Given** a new, blank vehicle listing, **When** a staff member opens its edit screen, **Then** they see separate Japanese and English inputs for title, exterior color, summary, description, SEO title, and SEO description, all editable without switching any language control.
2. **Given** a vehicle listing being edited, **When** a staff member adds a highlight or a spec row, **Then** that row exposes separate Japanese and English inputs for its text (or label/value).
3. **Given** a vehicle listing with only the Japanese title filled in, **When** a staff member views its edit screen, **Then** the empty English title field is visibly empty (not hidden behind a switch), so the gap is obvious without cross-checking another page.

---

### User Story 2 - Staff price a listing in JPY and/or USD independently (Priority: P1)

A shop staff member entering a vehicle's price needs to record a Japanese Yen price, a US Dollar price, or mark the vehicle "price on request" — independently of each other, with no requirement to fill in one currency because the other was entered, and with no automatic conversion applied between them.

**Why this priority**: Equally foundational to the feature's second half (pricing) and independently valuable — a listing can ship correctly priced even before every text field's bilingual content is complete.

**Independent Test**: Can be fully tested by entering only a JPY price on a listing, confirming it saves and displays correctly with no USD value assumed, then separately entering only a USD price on another listing and confirming the same in reverse.

**Acceptance Scenarios**:

1. **Given** a vehicle listing being edited, **When** a staff member enters a JPY price only, **Then** the listing saves successfully with no USD price required or auto-filled.
2. **Given** a vehicle listing being edited, **When** a staff member enters both a JPY and a USD price, **Then** both values are stored independently and neither is recalculated from the other.
3. **Given** a vehicle listing being edited, **When** a staff member checks "price on request," **Then** both the JPY and USD price displays are suppressed on the public site regardless of whether either field has a stored value.

---

### User Story 3 - Visitors see listing content in their language, with graceful fallback (Priority: P2)

A site visitor browsing the vehicle listing or detail page in either Japanese or English needs to see that listing's content in their chosen language, and — if a particular field genuinely has no content in that language yet — see the other language's version rather than a blank gap.

**Why this priority**: This is the visitor-facing payoff of Stories 1 and 2, but it depends on them existing first; it's P2 because an incomplete rollout (fields exist but fallback isn't wired up) is still functional, just less polished, whereas Stories 1/2 not existing would block everything.

**Acceptance Scenarios**:

1. **Given** a vehicle listing with both Japanese and English titles filled in, **When** a visitor views it on the Japanese site, **Then** they see the Japanese title, and on the English site, the English title.
2. **Given** a vehicle listing with only a Japanese description, **When** a visitor views it on the English site, **Then** they see the Japanese description rather than an empty description section.
3. **Given** a vehicle listing with a JPY price only, **When** a visitor views it on either site locale, **Then** they see the JPY price displayed (no invented USD figure).
4. **Given** a vehicle listing with a spec row that has no label or value in either language, **When** a visitor views the spec table, **Then** that row does not appear at all.

---

### Edge Cases

- A spec row has a label in only one language and a value in only one language (independently, not necessarily the same language): each half falls back independently — whichever language's label exists is shown, and likewise for the value — rather than dropping the row.
- A vehicle document from before this change had neither the Japanese nor English value populated for a given field (a pre-existing data gap): the migration carries that gap forward as-is (both new paired fields blank) rather than failing; such a listing simply cannot be set to "available" until the publish-gate requirement below is met.
- A pre-existing listing had `priceOnRequest: true` and no `price` value: migration carries `priceOnRequest` forward unchanged, and both new price fields remain blank — a valid state.
- A pre-existing listing's `currency` was `USD`: migration copies its stored number into the new USD field, leaving the new JPY field blank — no conversion is invented to fill the other field.
- Listing sort by price (asc/desc) compares listings that may each have only one of the two price fields populated: sorting uses the JPY price as the canonical sort key (see Assumptions), so a listing with only a USD price sorts using that same field's absence consistently with how missing prices are already handled today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide independently editable Japanese and English fields for each of the nine currently-localized vehicle content fields (title, exterior color, summary, each highlight's text, description, each spec row's label and value, SEO title, SEO description).
- **FR-002**: The system MUST provide independently editable JPY and USD price fields per vehicle listing, replacing the current single price value plus currency selection.
- **FR-003**: The "price on request" setting MUST continue to suppress display of both price fields regardless of whether either has a stored value.
- **FR-004**: The public site MUST render, for each paired content or price field, the value matching the visitor's active site language, where a value exists for that language.
- **FR-005**: When a field's value for the visitor's active language is blank but the other language's value is populated, the system MUST display the other language's value rather than leaving the field visibly blank.
- **FR-006**: When both languages of an optional repeating entry (a single highlight, or a single spec row where both label and value are blank in both languages) are blank, the system MUST omit that entry from the rendered list rather than showing an empty row.
- **FR-007**: A vehicle listing MUST NOT be set to "available" status unless it has at minimum a title in at least one language AND a price in at least one currency or "price on request" is set — mirroring this repo's existing pattern of gating publish-readiness in a change hook rather than a schema-level required field, so drafts remain saveable with any of these fields empty.
- **FR-008**: The system MUST migrate every existing vehicle listing's current bilingual content and price/currency selection into the new paired fields, with no loss of previously-entered content, before the old fields are removed from the schema.
- **FR-009**: The system MUST NOT perform automatic currency conversion between the JPY and USD price fields — each is entered and stored independently.
- **FR-010**: The system MUST NOT change how any other collection or global (Makes, Models, Media, SiteSettings, Homepage) handles language content — this feature is scoped to the Vehicles collection only.
- **FR-011**: Vehicle listing filtering and sorting (by make, model, body type, transmission, and price) MUST continue to function correctly against the new paired price fields.
- **FR-012**: All site code that reads vehicle content or price fields MUST be updated to use the new paired-field structure, with no remaining references to the removed single-locale/single-price fields.
- **FR-013**: Automated tests asserting the old field names or single-price behavior MUST be updated to reflect the new paired-field behavior, and new tests MUST cover the language-fallback display behavior and independent dual-price entry, per this repo's testing rule.

### Key Entities

- **Vehicle Listing**: A single vehicle for sale. Each previously-localized content attribute (title, exterior color, summary, description, SEO title, SEO description) becomes a pair of language-specific values. Price becomes a pair of currency-specific values (JPY, USD) alongside the existing "price on request" flag, which continues to apply regardless of which price value(s) are set.
- **Highlight**: A bullet-point entry belonging to a vehicle listing; its text becomes a Japanese/English pair.
- **Spec Row**: A label/value pair belonging to a vehicle listing's spec table; both the label and the value become independent Japanese/English pairs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Staff can view and edit both language versions of all nine vehicle content fields from a single listing edit view, with zero need to toggle any site-wide or page-wide language control.
- **SC-002**: Staff can save a vehicle listing with only a JPY price, only a USD price, or "price on request" set, with none of these choices requiring any of the others to be filled in.
- **SC-003**: 100% of existing vehicle listings retain every previously-entered bilingual text value and price value after the migration, verified by comparing each listing's field values before and after the change.
- **SC-004**: 100% of visitor page views of a listing with content in only one language show that language's content rather than a blank field, regardless of which site locale (Japanese or English) the visitor is browsing.
- **SC-005**: Zero vehicle listings can reach "available" status while missing both a title (in every language) and a price (in every currency and price-on-request), consistent with today's publish-safety guarantee for other required-before-publish content.

## Assumptions

- **Bilingual editing UI shape**: this spec requires both languages to be visible/editable without a global switch, but does not mandate a specific layout (e.g. side-by-side columns vs. stacked fields vs. a two-column tab-free group) — that presentation choice is left to the implementation plan, consistent with this repo's existing precedent of using Payload's native field layout options rather than building bespoke admin UI (Constitution Principle VI).
- **Price sort key**: since a listing may have only one of the two price prices populated, and JPY was already the system's default/primary currency before this change (the old `currency` select's implicit default), listing price sort (asc/desc) uses the JPY price field as its canonical sort key. USD remains a secondary, display-only value with no independent sort control in this feature. This can be revisited in a later feature if USD-primary listings become common.
- **Publish-gate scope**: FR-007's minimum-completeness check (title in one language, price in one currency or price-on-request) mirrors the existing `heroImage`-before-publish precedent rather than requiring both languages/both currencies to be complete before publishing — full bilingual completeness is a quality goal (served by FR-005's fallback display), not a hard publish blocker, since forcing full translation before any listing can go live would be a regression from today's ability to publish Japanese-only listings.
- **Migration ordering**: this feature's schema change (paired fields) is written and executed before the old localized/single-price fields are removed from the collection definition, so the migration step always has both old and new fields available to read from and write to during the one-time cutover.
- **Scope boundary**: this feature does not touch Makes, Models, Media, SiteSettings, or Homepage, all of which keep Payload's `localized: true` fields and the admin locale switcher for now; a separate, later feature (already tracked as a follow-up in this repo's roadmap) covers migrating those.
- **No new currencies**: this feature only introduces JPY and USD, matching the two options already present in the current `currency` select — support for additional currencies is out of scope.
