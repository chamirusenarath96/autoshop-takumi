# Contract: Authentication & Access Control

Applies to every route in the dashboard app (enforced in `middleware.ts` per
research.md §3), covering spec.md User Story 3 and FR-001/FR-002/FR-003.

## Sign-in flow

1. **Unauthenticated request to any route** (`/`, `/runs`, `/runs/[runId]`,
   or any future route) → redirected to Auth.js's GitHub sign-in flow.
   No CI Run or Allure Report data is included in this response.
2. **GitHub OAuth completes, login matches `ALLOWED_DASHBOARD_GITHUB_LOGIN`**
   → `signIn` callback returns `true`; session JWT is issued; original
   requested route is rendered normally.
3. **GitHub OAuth completes, login does NOT match the allowlist**
   → `signIn` callback returns `false` (or redirects to `/access-denied`);
   no session granting dashboard access is issued; the response contains no
   CI Run or Allure Report data — only a generic access-denied message.

## Per-request enforcement (not just entry-page)

Every request matched by `middleware.ts` (all dashboard routes except the
sign-in and access-denied pages themselves) MUST re-verify a valid,
allowlisted session before the route handler/page component runs. A direct
deep link to `/runs/<some-id>` from a browser with no session, or a session
belonging to a non-allowlisted account, MUST redirect the same as hitting
`/` unauthenticated — it must not fall through to rendering data and hiding
it with client-side CSS/JS.

## Inputs / Outputs

| Scenario | Input | Output |
|---|---|---|
| No session | Any dashboard route request | 3xx redirect to GitHub sign-in; no run data in response body |
| Session, allowlisted login | Any dashboard route request | 200, requested page rendered with data |
| Session, non-allowlisted login | Any dashboard route request | Redirect/response to `/access-denied`; no run data in response body |

## Verification

Per constitution Principle IV, this contract is verified with a live e2e
check (Playwright), not by reading `signIn` callback source: attempt actual
sign-in with a non-allowlisted test account (or a mocked/stubbed OAuth
response representing one) and assert the response contains no run/report
data, for both the home route and a deep-linked run route.
