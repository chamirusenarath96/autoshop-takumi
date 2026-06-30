# CLAUDE.md — Autoshop Takumi

This file is read automatically by Claude Code. Keep it accurate as the project evolves.

## What this is

A bilingual (Japanese/English) vehicle sales website for Autoshop Takumi: landing page, filterable vehicle inventory, vehicle detail with inquiry form, and a Payload CMS admin dashboard. Built to be reusable as a template for other dealerships.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| CMS / Admin | Payload CMS 3.x (embedded in Next.js) |
| Database | SQLite (local dev) → PostgreSQL/Neon (production) |
| Images | Local `/public` (dev) → Cloudflare R2 (production) |
| UI | shadcn/ui + Tailwind CSS v4 |
| i18n (UI) | next-intl (`/ja`, `/en` routing) |
| i18n (content) | Payload field localization |
| Email | Resend (inquiry notifications) |
| Tests | Vitest + React Testing Library + happy-dom (component) · Playwright (e2e: admin UI + REST API) |

## Testing rule — ALWAYS follow this

**Every code change must come with a test change in the same PR.** No exceptions without saying so explicitly to the user first.

- **New feature** → add new test(s) covering it (component test for UI behavior, e2e/api.spec.ts for new endpoints or access-control rules, e2e/admin.spec.ts for new admin screens, e2e/public.spec.ts for new public pages)
- **Bug fix** → add a test that would have caught the bug, or extend an existing test's assertions
- **Behavior change** (e.g. changing an access control rule, a field's required-ness, a route) → update the existing test(s) that assert the old behavior — don't leave them asserting something no longer true
- **Refactor with no behavior change** → existing tests should still pass unmodified; if they don't, the refactor changed behavior and that's worth noticing
- Before opening a PR, run all three suites locally and confirm green:
  ```bash
  npm test                  # component tests
  npx tsc --noEmit           # type check
  npm run test:e2e           # admin + public + API e2e (requires dev server running)
  ```

This list grows as the app grows — when adding a new collection, global, or page, also add its corresponding section to whichever e2e spec file fits (admin.spec.ts for admin CRUD, api.spec.ts for REST behavior, public.spec.ts for the visitor-facing page).

## Git workflow — ALWAYS follow this

1. **Never commit directly to `master`** — master is protected
2. **Create a feature branch** for every piece of work: `git checkout -b feat/your-feature`
3. **Open a PR** to merge into master — PRs trigger CI and CodeRabbit review
4. **Wait for CI to pass** — Component Tests + Type Check must be green before merging
5. **Wait for CodeRabbit review** — address any issues flagged before merging

Branch naming convention:
- `feat/` — new features
- `fix/` — bug fixes
- `chore/` — tooling, deps, config
- `docs/` — documentation only

## CI pipeline (GitHub Actions — `.github/workflows/ci.yml`)

On every PR targeting `master`:
1. **Component Tests** — `npm test` (Vitest: VehicleCard, LocaleSwitcher, utils)
2. **Type Check** — `npx tsc --noEmit`
3. **E2E Tests** — `npm run test:e2e` (Playwright, runs after test+typecheck pass; admin UI, public site, REST API — see `e2e/*.spec.ts`)
4. **Build Check** — `npm run build` (runs after test+typecheck pass)

Run locally before pushing:
```bash
npm test && npx tsc --noEmit
npm run dev &              # in one terminal
npm run test:e2e           # in another, once the server is up
```

## CodeRabbit

CodeRabbit AI reviews every PR automatically once the GitHub App is installed. Config in `.coderabbit.yaml`. Key review focus areas:
- Collections: access control, localized fields, hook error messages
- Components: no hardcoded strings (use next-intl), no hardcoded shop content (use Payload globals)
- Public pages: locale handling, empty-state safety, SEO metadata

## Key conventions

- **No hardcoded strings in components** — all UI text via `next-intl` `useTranslations()`
- **No shop content in code** — addresses, phone numbers, copy go in Payload `SiteSettings`/`Homepage` globals
- **Localized fields** — any guest-facing text field needs `localized: true` in the collection
- **Brand token** — primary orange is `hsl(18 99% 50%)` (`#fe4d03`), sampled from real logo
- **Commits** — Conventional Commits style: `feat:`, `fix:`, `chore:`, `docs:`

## Local dev

```bash
npm install
cp .env.example .env   # set PAYLOAD_SECRET to any string
npm run dev            # → http://localhost:3000 (public) + /admin (Payload)
npm test               # run component tests
npm run test:watch     # watch mode
npm run test:e2e        # run e2e suite (needs npm run dev active in another terminal)
npm run test:e2e:ui     # Playwright UI mode — step through tests visually
```

First run: go to `/admin/create-first-user` to create the admin account. `e2e/global-setup.ts` does this automatically for the e2e suite (creates `admin@autoshoptakumi.com` if no user exists, then logs in and caches the session in `e2e/.auth/`, gitignored).
