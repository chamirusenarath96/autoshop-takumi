# Contract: Allure Report Bundle Format & Delivery

Defines the `report/` bundle referenced by `runs-data-contract.md`'s
`reportPath`, and how the dashboard serves its contents to an authorized
session. Resolves the ambiguity research.md originally left open ("Allure
*results* or a generated static *report*, TBD by #15's own implementation")
by fixing the bundle to a rendered static report, not raw result JSON —
so the dashboard never needs Allure's internal result-file format, only a
static asset tree it can serve.

## Producer format (issue #15's CI workflow)

`testing-artifacts/<run-id>/report/` MUST be the output of Allure's own
static HTML report generator (`allure generate`), not the raw
`allure-results/` result-file directory. Concretely:

```text
testing-artifacts/<run-id>/report/
├── index.html            # entrypoint — MUST exist at exactly this key
├── data/                 # Allure's own generated JSON (suites, timeline, etc.)
├── plugins/               # Allure's bundled report UI assets
└── ...                    # any attachment files Allure embedded/linked
    (screenshots, traces) referenced from data/*.json
```

**Rationale**: generating the static report once at CI time (via
`allure generate --clean`) means the dashboard only ever serves a
self-contained, already-rendered asset tree — it does not need to
understand Allure's result-file schema, re-implement any of Allure's report
rendering, or risk a version mismatch between an `allure-results/`-only
upload and whatever report-generation logic the dashboard would otherwise
need to embed.

## Validation rules (what the dashboard checks before treating a report as usable)

- `report/index.html` MUST exist; its absence means the run is treated as
  `incomplete`/unavailable in its detail view (`runs-data-contract.md` Error
  Handling), even if `summary.json` itself parsed successfully.
- Every asset key requested for a given run MUST resolve to a path under
  that same run's `testing-artifacts/<run-id>/report/` prefix — reject (404,
  not a passthrough) any request whose resolved key falls outside that
  prefix, contains `..` traversal segments, or is an absolute URL. This is
  the same key-containment rule `runs-data-contract.md` applies to
  `reportPath` itself, extended to every individual asset inside the bundle.

## Delivery/access model

Report content — `index.html`, Allure's `data/*.json`, and attachment files
(screenshots, traces) — is served to the browser **only** through a
same-origin dashboard route that itself sits behind `middleware.ts`'s
session/allowlist check (`contracts/auth-contract.md`), using one of:

- **Authenticated streaming proxy** (default assumption): a dashboard route
  (e.g. `runs/[runId]/report/[...path]`) validates the session, resolves and
  validates the requested key per the rules above, then streams the R2
  object through as the response — setting `Content-Type` from the object's
  stored/inferred MIME type, and honoring `Range` requests (R2, being
  S3-compatible, supports byte-range `GetObject`) so large attachments
  (e.g. video traces) don't have to load in one shot. Because Vercel
  Functions cap a single response body at 4.5 MB, any non-trivial attachment
  MUST use streaming rather than buffering the full object into memory
  before responding.
- **Short-lived signed R2 URLs** (acceptable alternative, with a caveat):
  the dashboard route validates the session and the requested key, then
  issues a presigned `GetObject` URL with a short expiry (minutes, not
  hours) and redirects the browser to it. This still requires the
  session/allowlist check to happen *before* a URL is minted — an
  unauthenticated request MUST NOT receive a signed URL back. **This
  approach cannot be applied to `index.html` alone and stop there**:
  `index.html` loads `data/*.json`, `plugins/` assets, and attachments via
  relative URLs, which the browser resolves against the *R2 object's own
  URL* once redirected there — not against the dashboard's origin. Those
  follow-on requests never pass back through the dashboard's session check,
  so signing only the entrypoint leaves every other asset in the bundle
  reachable by anyone who can guess or observe an R2 object URL pattern.
  Signed URLs are therefore only safe here if **every** asset the report
  references is individually signed before the browser ever requests it —
  in practice this means either (a) rewriting `index.html`'s asset
  references at serve time to point at the dashboard's own per-asset signed-
  URL endpoint (itself session-checked before minting each one), or (b)
  proxying every asset per the streaming approach above and treating signed
  URLs as, at most, an optimization for a small number of already-
  individually-authorized large attachments — not a blanket substitute for
  the streaming proxy.

Whichever approach is chosen MUST be applied uniformly to `index.html`,
`data/*.json`, `plugins/`, and every attachment — a report bundle is not
"protected" if only the entrypoint is gated but a directly-guessable
attachment key isn't, and testing (per Testing below) MUST exercise the
full bundle including attachments, not just `index.html`'s own response. R2
bucket-level credential scoping (`research.md` §5) is necessary but not
sufficient on its own: a raw, unauthenticated public URL handed to the
browser would bypass the dashboard's own session check entirely, regardless
of how narrowly the dashboard's *backend* R2 credentials are scoped.

## Testing

Per constitution Principle III, this bundle-serving path is tested against
a realistic fixture (a real `allure generate` output containing at least one
screenshot attachment) deployed to a Vercel preview, not just a unit test
against a trivial `index.html` — the streaming/range and body-size behavior
this contract depends on doesn't reproduce faithfully outside Vercel's
actual Functions runtime (tasks.md T033, quickstart.md).
