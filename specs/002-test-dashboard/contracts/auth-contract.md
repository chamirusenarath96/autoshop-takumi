# Contract: Authentication & Access Control

Applies to every route in the dashboard app (enforced in `middleware.ts` per
research.md §3), covering spec.md User Story 3 and FR-001/FR-002/FR-003.

## Sign-in flow

1. **Unauthenticated request to any dashboard route** (`/`, `/runs`,
   `/runs/[runId]`, or any future route) → redirected to Auth.js's GitHub
   sign-in flow. No CI Run or Allure Report data is included in this
   response. Requests to Auth.js's own routes (`/api/auth/:path*` — sign-in,
   callback, session, sign-out) are **not** redirected by this rule; see
   Middleware Scope below.
2. **GitHub OAuth completes, account ID matches `ALLOWED_DASHBOARD_GITHUB_ID`**
   (compared on the stable GitHub account ID, not the login — see
   `data-model.md`'s Authorized Viewer entity and spec.md FR-002) →
   `signIn` callback returns `true`; session JWT is issued (embedding both
   `githubId` and `githubLogin`); original requested route is rendered
   normally.
3. **GitHub OAuth completes, account ID does NOT match the allowlist**
   → `signIn` callback returns `false`. Auth.js is configured with
   `pages: { error: "/access-denied" }`, so this deterministically redirects
   to `/access-denied?error=AccessDenied` — there is exactly one rejection
   route, not an either/or. No session granting dashboard access is issued;
   the response contains no CI Run or Allure Report data — only a generic
   access-denied message.

## Middleware scope

`middleware.ts`'s route matcher MUST exclude Auth.js's own handler prefix
(`/api/auth/:path*`) from the authenticated-session check — that path is
inherently public/unauthenticated, since it's exactly what a visitor hits
*before* a session exists (initiating sign-in, and GitHub's OAuth callback
completing the handshake). Applying the auth gate to `/api/auth/callback/github`
itself would redirect the callback before Auth.js can process it and issue a
session, breaking sign-in entirely. Every other route — explicitly including
`/`, `/runs`, and deep links like `/runs/[runId]` — remains gated.

## Per-request enforcement (not just entry-page)

Every request matched by `middleware.ts` (all dashboard routes except
`/api/auth/:path*` and the `/access-denied` page itself) MUST re-verify a
valid, allowlisted session before the route handler/page component runs. A
direct deep link to `/runs/<some-id>` from a browser with no session, or a
session belonging to a non-allowlisted account, MUST redirect the same as
hitting `/` unauthenticated — it must not fall through to rendering data and
hiding it with client-side CSS/JS.

## Inputs / Outputs

| Scenario | Input | Output |
|---|---|---|
| No session | Any dashboard route request (not `/api/auth/*`) | 3xx redirect to GitHub sign-in; no run data in response body |
| Session, allowlisted `githubId` | Any dashboard route request | 200, requested page rendered with data |
| Session, non-allowlisted `githubId` | Any dashboard route request | 3xx redirect to `/access-denied?error=AccessDenied`; no run data in response body |
| Any request | `/api/auth/:path*` | Handled by Auth.js directly, not gated by `middleware.ts`'s dashboard auth check |

## Verification

Per constitution Principle IV, this contract is verified with a live e2e
check (Playwright), not by reading `signIn` callback source:

- Attempt actual sign-in with a non-allowlisted test account (or a
  mocked/stubbed OAuth response representing one) and assert the response
  lands on exactly `/access-denied` with no run/report data, for both the
  home route and a deep-linked run route.
- Confirm `/api/auth/callback/github` is reachable and completes the OAuth
  handshake without being redirected by the dashboard's own auth gate.
