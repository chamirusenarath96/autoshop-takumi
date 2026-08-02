# Data Model: Mobile and Tablet Responsive Support

## Summary

This feature introduces **no new or modified Payload CMS collections, globals, or fields**, and **no new persisted data entities**. It is a UI/layout/interaction feature layered entirely on top of existing data-fetching paths (`Vehicles`, `Makes`, `Models`, `SiteSettings` — all read via the existing Local API helpers in `src/lib/payload.ts` / `src/lib/site-settings.ts`, unchanged by this work).

## Transient UI State (not persisted)

The following are component-local React state introduced by this feature — documented here for completeness since the spec's "Key Entities" section is otherwise empty, but none of these are data model entities in the CMS/database sense:

| State | Owner Component | Shape | Notes |
|---|---|---|---|
| Mobile nav open/closed | `Header.tsx` (or new `MobileNav.tsx`) | `boolean` (`useState`) | Not persisted across page loads or routes; resets on navigation. |
| Filter drawer open/closed | `VehicleFilters.tsx` (or new `FilterDrawer.tsx`) | `boolean` (`useState`) | Not persisted; the underlying filter *values* remain URL-driven (`useSearchParams`), unchanged from current behavior — only the drawer's visibility is new local state. |
| Gallery active image index | `VehicleGallery.tsx` | `number` (`useState`, already exists) | Unchanged data shape; touch swipe handlers call the existing `setActive` setter, same as the existing thumbnail-click handler does today. |

## Existing Entities Referenced (unchanged)

For reference only — these are read, not modified, by this feature:

- **Vehicle** (`Vehicles` collection) — `heroImage`, `gallery` fields drive `VehicleGallery`; `make`, `model`, `bodyType`, `transmission` fields drive `VehicleFilters` options, all unchanged.
- **SiteSettings** (global) — `socialLinks`/Instagram, `contactEmail`/`contactPhone` drive `Header`/`Footer` content, unchanged.

## Conclusion

No `data-model.md` entity design work is required beyond this note. Proceed to `quickstart.md`.
