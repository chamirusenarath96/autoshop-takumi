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
| Tests | Vitest + React Testing Library + happy-dom |

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

## CI pipeline (GitHub Actions)

On every PR targeting `master`:
1. **Component Tests** — `npm test` (Vitest, 19 tests covering VehicleCard, LocaleSwitcher, utils)
2. **Type Check** — `npx tsc --noEmit`
3. **Build Check** — `npm run build` (runs only after test + typecheck pass)

Run locally before pushing: `npm test && npx tsc --noEmit`

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
```

First run: go to `/admin/create-first-user` to create the admin account.
