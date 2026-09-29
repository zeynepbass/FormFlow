# FormFlow — Architecture

Create forms. Collect responses. Understand your data.

This document records the product scope and the technical decisions behind FormFlow. Each decision lists the reasoning so it can be revisited when requirements change.

Decision priority, in order: correctness, security, performance, accessibility, SEO, maintainability, developer experience, visual polish.

---

## 1. Product

### Users

Individuals, freelancers, creators and small teams who need a form online in minutes and want to read the results without exporting to a spreadsheet first.

### Core flow

```text
Register → Create form → Add & arrange fields → Publish → Share /f/:slug
        → Respondents submit → Owner reads responses → Analytics → CSV export
```

### MVP scope

| Area      | Included                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------- |
| Auth      | Register, login, logout, server sessions, email verification and password reset flows (dev mail log) |
| Forms     | Create, edit, duplicate, publish, pause, archive, restore, delete                                    |
| Builder   | 11 field types, add / edit / delete / duplicate / reorder (pointer + keyboard), required, options    |
| Public    | `/f/:slug`, server-rendered, client validation, honeypot, rate limiting, file upload                 |
| Responses | Keyset pagination, full-text search, date range filter, detail view, delete, CSV export              |
| Analytics | Views, starts, submissions, completion rate, daily chart (last 7 / 30 / 90 days)                     |
| Account   | Profile name, change password, delete account                                                        |

### Out of scope (see Roadmap)

Teams and shared workspaces, conditional logic, multi-page forms, themes, integrations and webhooks, payments, real email delivery.

---

## 2. System overview

```text
                    ┌───────────────────────────── Next.js (frontend) ─────────────────────────────┐
Browser ── HTTPS ──▶│ Server Components ── fetch (server-only, forwards cookie) ──┐                 │
                    │ Client Components ── fetch("/api/...") ── rewrite ──────────┤                 │
                    └──────────────────────────────────────────────────────────────┼─────────────────┘
                                                                                   ▼
                                                                    Express API (backend) ── MongoDB
                                                                          │
                                                                          └── POST /revalidate (tag) ──▶ Next.js
```

**Single origin for the browser.** Next.js rewrites `/api/*` to the Express server. The browser only ever talks to one origin, which means:

- the session cookie is a first-party, host-only cookie (`SameSite=Lax`, `__Host-` prefix in production),
- no credentialed cross-origin requests and no permissive CORS,
- CSRF defence reduces to an `Origin` check plus `SameSite`.

**Server Components call the API directly** through `API_INTERNAL_URL`, forwarding the incoming `Cookie` header. That module imports `server-only` so it can never end up in a client bundle.

**Express is the only authority.** Every authorization, validation and state rule lives in the API. The frontend repeats validation only for UX.

---

## 3. Frontend architecture

### Stack

| Choice                             | Reason                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| Next.js 16, App Router, JavaScript | Server Components by default, Cache Components, Metadata API, streaming                             |
| Tailwind CSS v4                    | CSS-first `@theme` tokens, no runtime cost                                                          |
| shadcn/ui (JS mode, `tsx: false`)  | Copied source, only the primitives used (Button, Input, DropdownMenu, AlertDialog); native `select` |
| Lucide icons                       | Tree-shakable per-icon imports                                                                      |
| React Hook Form + Zod Mini         | Uncontrolled inputs keep typing cheap (INP); `zod/mini` keeps validation out of the bundle budget   |
| dnd-kit                            | Sortable with a real keyboard sensor and screen-reader announcements; loaded only in the builder    |

**TanStack Query is not part of the MVP.** Reads happen in Server Components; mutations call the API and then `router.refresh()` (or rely on tag revalidation). There is no polling, no shared client cache and no infinite list that would justify it. It becomes worth adding if live-updating responses or optimistic multi-step mutations are introduced.

**No global state library.** The builder keeps its document in a `useReducer` inside the builder tree. Filters and pagination live in the URL. The current user comes from a request-memoized server function. Nothing needs Zustand or Context-based stores.

### State priority

1. Local state — builder document, dialogs, inputs.
2. URL state — `?q=`, `?from=`, `?to=`, `?cursor=`, `?status=`, `?range=`. Shareable, back-button friendly, readable by Server Components.
3. Server state — fetched in Server Components.
4. Global state — none.

### Routes

```text
src/app/
├── (marketing)/            indexable, static
│   ├── page.js             /
│   ├── features/page.js    /features
│   └── about/page.js       /about
├── (auth)/                 noindex, static shells
│   ├── login/  register/  forgot-password/  reset-password/  verify-email/
├── (app)/                  noindex, dynamic, authenticated shell (sidebar + header)
│   ├── dashboard/page.js                        /dashboard
│   ├── forms/page.js                            /forms
│   ├── forms/create/page.js                     /forms/create
│   ├── forms/[id]/page.js                       /forms/:id            (builder)
│   ├── forms/[id]/responses/page.js             /forms/:id/responses
│   ├── forms/[id]/responses/[responseId]/page.js
│   ├── forms/[id]/analytics/page.js
│   ├── forms/[id]/settings/page.js
│   └── settings/page.js                         /settings
├── f/[slug]/page.js        public form, cached per slug
├── revalidate/route.js     internal, secret-protected tag revalidation
├── robots.js  sitemap.js  not-found.js  error.js  global-error.js  layout.js
```

`dashboard`, `forms` and `settings` share one `(app)` route group so the authenticated shell, the auth check and the `noindex` metadata are declared once. The group does not appear in URLs.

### Folder structure

```text
frontend/src/
├── app/                    routes only: page, layout, loading, error, metadata
├── features/
│   ├── auth/               login/register forms, auth actions
│   ├── forms/              form list, status badge, form actions menu
│   ├── form-builder/       builder reducer, field editor, field list, sortable
│   ├── public-form/        public renderer, field inputs, schema builder
│   ├── responses/          table, filters, detail, export button
│   ├── analytics/          stat cards, SVG chart
│   └── dashboard/          overview widgets
├── components/
│   ├── ui/                 shadcn primitives
│   ├── layout/             site header/footer, app sidebar
│   └── common/             empty state, pagination, page header
├── lib/                    api clients (server/client), session, csv filename, dates, cn
├── config/                 site config, navigation, field type registry
├── types/                  JS constants shared by features (field types, statuses) — no .d.ts
└── styles/                 globals.css with design tokens
```

`hooks/` and `services/` are created only when a second consumer appears. A hook used by one component stays next to that component.

### Server / Client boundaries

| Area        | Server                                          | Client (`"use client"`)                                    |
| ----------- | ----------------------------------------------- | ---------------------------------------------------------- |
| Marketing   | everything                                      | mobile nav toggle                                          |
| Auth pages  | page shell, copy, metadata                      | the form itself (RHF + Zod)                                |
| App shell   | layout, sidebar, user lookup                    | user menu dropdown, mobile sidebar                         |
| Forms list  | list, counts, status                            | per-row actions menu                                       |
| Builder     | initial form load                               | builder (dynamically imported dnd-kit)                     |
| Public form | title, description, field markup data, metadata | form renderer, analytics beacon                            |
| Responses   | table, pagination, detail                       | search input (debounced → URL), date filter, delete button |
| Analytics   | numbers, SVG chart, data table                  | range tabs (links, so actually server)                     |

Charts are rendered as server-side SVG with a visually hidden data table. That removes a charting library (tens of KB) from the bundle and keeps the chart readable by screen readers. Hover tooltips are not required for daily totals of three series.

### Builder design

- Document shape mirrors the API: `{ title, description, fields[], settings }`.
- `useReducer` with actions `add`, `update`, `remove`, `duplicate`, `move` and option edits. Pure reducer, unit tested.
- Reorder three ways: pointer drag, keyboard drag (`Space` to lift, arrows to move, `Space` to drop, `Esc` to cancel), and explicit "Move up / Move down" buttons on each field. Live regions announce moves. The open field editor collapses when a drag starts, so tall cards reorder as reliably as short ones.
- Save is explicit (`Ctrl/Cmd+S` or button) with an unsaved-changes indicator and a `beforeunload` guard. `PATCH` carries `version`; the API returns `409` if the form changed elsewhere.
- Mobile: single column. Field settings expand inline under the selected field, and the field palette follows the list.

---

## 4. Backend architecture

### Stack

| Choice                     | Reason                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| Node.js 22+ LTS            | Native `--env-file`, `--watch`, `crypto.randomBytes` — no dotenv / nodemon / nanoid         |
| Express 5                  | Rejected promises reach the error handler without wrappers                                  |
| MongoDB native driver      | Zod already validates every boundary; Mongoose would add a second schema layer and overhead |
| Zod                        | Request validation, `.strict()` objects block unexpected keys (and `$` operators)           |
| argon2 (argon2id)          | Memory-hard password hashing                                                                |
| helmet, express-rate-limit | Security headers and throttling                                                             |
| multer + file-type         | Multipart parsing with limits; magic-byte MIME detection                                    |
| pino / pino-http           | Structured logs with redaction                                                              |

### Folder structure

```text
backend/src/
├── modules/
│   ├── auth/        auth.routes.js  auth.service.js  auth.schemas.js  session.js  one-time-tokens.js
│   ├── users/       users.routes.js  users.service.js  users.schemas.js
│   ├── forms/       forms.routes.js  forms.service.js  forms.schemas.js  field-types.js
│   ├── responses/   responses.routes.js  ...  answer-validation.js  csv.js  uploads.js
│   ├── analytics/   analytics.routes.js  analytics.service.js
│   └── public/      public.routes.js  (read form by slug, submit response, record event)
├── common/
│   ├── middleware/  require-auth.js  rate-limit.js  verify-origin.js  error-handler.js
│   ├── errors/      app-error.js  (AppError + a few named constructors)
│   ├── validation/  parse.js  object-id.js
│   ├── storage/     files.js  (private upload storage)
│   └── utils/       tokens.js  slug.js  revalidate.js  mailer.js  serialize.js
├── config/          env.js (Zod-validated env, fails fast on boot)  logger.js
├── database/        client.js  indexes.js
├── app.js           builds the Express app (used by tests)
└── server.js        connects DB, ensures indexes, listens, graceful shutdown
```

Controller → service → collection. Services call the MongoDB collections directly; there is no repository layer because it would only forward calls to the driver.

`public` is its own module because it has a different trust model: no session, stricter rate limits, and it only ever exposes published forms.

---

## 5. Data model

All IDs are `ObjectId`. Timestamps are `Date`. Emails are stored lowercased and trimmed.

### users

```js
{ _id, email, name, passwordHash, emailVerifiedAt: Date | null, createdAt, updatedAt }
```

### sessions

```js
{
  (_id, userId, tokenHash, createdAt, lastSeenAt, expiresAt);
}
```

The cookie holds a random 32-byte token. Only `HMAC-SHA256(AUTH_SECRET, token)` is stored, so a database leak does not yield usable sessions.

### forms

```js
{
  _id, ownerId, title, description, slug,
  status: "draft" | "published" | "paused" | "archived",
  fields: [{
    id,                // "fld_" + 10 random chars, stable across edits
    type,              // short_text | long_text | email | number | phone | url
                       // select | radio | checkbox | date | file
    label, description, placeholder, required,
    options: [{ id, label }],          // select, radio, checkbox
    validation: { min, max, maxLength } // per type, optional
  }],
  settings: { submitLabel, successMessage, allowIndexing: false },
  responseCount, version, publishedAt, createdAt, updatedAt
}
```

Fields are embedded: a form is always read and written as a whole, and the field count is bounded (max 50). `responseCount` is incremented on submission so the forms list never aggregates.

### responses

```js
{
  _id, formId, ownerId,
  answers: { [fieldId]: string | number | string[] | { fileId, name, size, mimeType } },
  searchText,        // lowercased text answers, capped at 4 KB, for search
  createdAt
}
```

`answers` is keyed by field id, so renaming a label never breaks old responses. Fields deleted from the form still appear in the detail view under a "Removed field" label; the CSV export follows the form's current fields. `ownerId` is denormalized so response queries can be scoped to the owner without a join.

### analyticsEvents

```js
{ _id, formId, type: "view" | "start" | "submit", visitorId, createdAt }
```

`visitorId` is a random id kept in `sessionStorage` (not a cookie, not a fingerprint). It is used only to de-duplicate views and starts within a browsing session.

### passwordResetTokens / emailVerificationTokens

```js
{
  (_id, userId, tokenHash, expiresAt, createdAt);
}
```

Single use (deleted on consumption). Reset tokens live 30 minutes, verification tokens 24 hours.

### Indexes

| Collection              | Index                                                               | Serves                             |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------- |
| users                   | `{ email: 1 }` unique                                               | login, register                    |
| sessions                | `{ tokenHash: 1 }` unique                                           | every authenticated request        |
|                         | `{ userId: 1 }`                                                     | logout everywhere, password change |
|                         | `{ expiresAt: 1 }` TTL 0                                            | expiry cleanup                     |
| forms                   | `{ slug: 1 }` unique                                                | public form lookup                 |
|                         | `{ ownerId: 1, updatedAt: -1 }`                                     | forms list, ownership lookups      |
| responses               | `{ formId: 1, createdAt: -1, _id: -1 }`                             | keyset pagination, date range, CSV |
|                         | `{ formId: 1, searchText: "text" }`                                 | search scoped to one form          |
| analyticsEvents         | `{ formId: 1, createdAt: 1 }`                                       | range aggregation                  |
|                         | `{ formId: 1, visitorId: 1, type: 1 }` unique, partial (view/start) | de-duplication                     |
|                         | `{ createdAt: 1 }` TTL 180 days                                     | retention                          |
| passwordResetTokens     | `{ tokenHash: 1 }` unique, `{ expiresAt: 1 }` TTL 0                 |                                    |
| emailVerificationTokens | `{ tokenHash: 1 }` unique, `{ expiresAt: 1 }` TTL 0                 |                                    |

Indexes are created idempotently at boot (`database/indexes.js`).

---

## 6. API design

Base path `/api`. JSON in and out, except multipart submissions and CSV export.

### Envelope

```json
{ "data": {}, "meta": { "nextCursor": "…" } }
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "details": [{ "path": "email", "message": "Enter a valid email." }]
  }
}
```

Error codes: `VALIDATION_ERROR` 400, `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `PAYLOAD_TOO_LARGE` 413, `UNSUPPORTED_MEDIA_TYPE` 415, `RATE_LIMITED` 429, `INTERNAL_ERROR` 500. In production, 500 responses never include stack traces or driver messages.

### Endpoints

```text
GET    /health

POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/verify-email
POST   /api/auth/resend-verification
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

PATCH  /api/users/me
PATCH  /api/users/me/password
DELETE /api/users/me

GET    /api/forms                              ?status=
POST   /api/forms
GET    /api/forms/:id
PATCH  /api/forms/:id                          body includes version
DELETE /api/forms/:id
POST   /api/forms/:id/duplicate
POST   /api/forms/:id/publish
POST   /api/forms/:id/pause
POST   /api/forms/:id/archive
POST   /api/forms/:id/restore

GET    /api/forms/:id/responses                ?q= &from= &to= &cursor= &limit=
GET    /api/forms/:id/responses/:responseId
DELETE /api/forms/:id/responses/:responseId
GET    /api/forms/:id/responses/:responseId/files/:fileId
GET    /api/forms/:id/export                   ?q= &from= &to=  → text/csv stream
GET    /api/forms/:id/analytics                ?range=7d|30d|90d

GET    /api/public/forms/:slug
POST   /api/public/forms/:slug/responses       JSON or multipart/form-data
POST   /api/public/forms/:slug/events          { type, visitorId }
```

Public submission is addressed by slug under `/api/public` rather than `POST /api/forms/:id/responses`. That keeps one rule for the whole `/api/forms` tree (always authenticated, always owner-scoped) and keeps internal ids out of public pages.

### Status transitions

```text
draft ──publish──▶ published ──pause──▶ paused ──publish──▶ published
  ▲                    │                   │
  └──────restore── archived ◀──archive─────┘  (archive allowed from any state)
```

Publishing requires a title and at least one field. Only `published` forms accept submissions. Paused forms render a "not accepting responses" message; archived and draft forms return 404 publicly.

---

## 7. Authentication

- **Passwords**: argon2id, minimum 8 characters, maximum 128 (bounds hashing cost). Login verifies against a dummy hash when the email is unknown so response time does not reveal accounts. The error is always "Email or password is incorrect."
- **Sessions**: opaque token in an `HttpOnly`, `Secure` (production), `SameSite=Lax`, `Path=/` cookie named `__Host-formflow_session` in production and `formflow_session` in development. 7-day sliding expiry, 30-day absolute limit. `lastSeenAt` / `expiresAt` are written at most once per hour to avoid a write per request.
- **Rotation**: a new session is created on login, register and password change. Password reset and password change delete all of the user's sessions.
- **Logout** deletes the session document and clears the cookie.
- **No tokens in `localStorage`.** JavaScript never sees the session token.
- **Email verification / password reset**: random 32-byte token, hashed at rest, single use, TTL-expired. A small `mailer` module renders the message; in development it logs the link through the logger, in production it is the single integration point for a provider. `forgot-password` always returns 200 to avoid account enumeration.
- **Route protection** in Next.js has two layers: `proxy.js` redirects requests without a session cookie away from `(app)` routes (cheap, optimistic), and `getCurrentUser()` — wrapped in React `cache()` so it runs once per request — validates the session against the API in the `(app)` layout and in every data function. The API validates again on every call.

## 8. Authorization

- Every `/api/forms/:id…` handler resolves the form with `{ _id: id, ownerId: req.user.id }` in a single query. There is no "load then compare" step to forget.
- A form that exists but belongs to someone else returns **404**, identical to a missing form, so ids cannot be probed.
- Responses and files are queried with both `formId` and `ownerId`.
- `:id` params are parsed to `ObjectId` by Zod; invalid ids are 404, never a driver error.
- Updates use an allow-list schema; `ownerId`, `status`, `responseCount`, `version` and timestamps can never be set from a request body.

## 9. Security model

| Threat                  | Mitigation                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| XSS                     | React escaping; no `dangerouslySetInnerHTML` except JSON-LD, which is serialized with `<` escaped; CSP            |
| IDOR / BOLA             | Owner-scoped queries (section 8), 404 on foreign ids, dedicated integration tests                                 |
| CSRF                    | `SameSite=Lax`, `Origin` / `Sec-Fetch-Site` check on non-GET requests, JSON-only bodies (except public multipart) |
| Brute force             | Rate limits per IP and per email on login; argon2id cost                                                          |
| NoSQL injection         | Zod `.strict()` schemas with primitive types; ids parsed to `ObjectId`; field ids validated `^fld_[a-z0-9]{10}$`  |
| Payload abuse           | `express.json({ limit: "100kb" })`, 50 fields per form, 50 options per field, answer length caps                  |
| Spam submissions        | Rate limit per IP + slug, hidden honeypot field, submissions rejected unless form is `published`                  |
| Malicious uploads       | See section 10                                                                                                    |
| CSV / formula injection | Cells starting with `=`, `+`, `-`, `@`, tab or CR are prefixed with `'`; every cell quoted; quotes doubled        |
| Session hijacking       | HttpOnly + Secure + `__Host-` cookie, hashed tokens, rotation, server-side revocation                             |
| Sensitive logging       | pino `redact` for `password`, `token`, `cookie`, `authorization`, `answers`; request bodies are never logged      |
| Error leakage           | Central error handler maps unknown errors to a generic 500 in production                                          |

### Security headers

- **API (helmet)**: `default-src 'none'`, `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy: no-referrer`. `x-powered-by` disabled.
- **Frontend (`next.config.js` headers)**: HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `frame-ancestors 'none'`.
- **CSP trade-off**: a nonce-based CSP forces dynamic rendering and is incompatible with partial prerendering, which Cache Components uses for every route here. One static policy is applied everywhere instead: `script-src 'self' 'unsafe-inline'` (Next.js inlines small bootstrap scripts), with `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`. No page renders user-supplied HTML and JSON-LD is serialized with `<` escaped, so the remaining risk is small and accepted consciously. Subresource integrity (experimental in Next.js) is the path to removing `'unsafe-inline'`.
- **CORS**: the browser never calls Express cross-origin. CORS is enabled only for `CORS_ORIGIN` (the app URL) as a safety net, with credentials.

### Rate limits (MVP, in-memory store)

| Endpoint                | Limit                                     |
| ----------------------- | ----------------------------------------- |
| login                   | 10 / 15 min per IP, 5 / 15 min per email  |
| register                | 5 / hour per IP                           |
| forgot / reset password | 5 / hour per IP                           |
| public submission       | 10 / min per IP + slug, 100 / hour per IP |
| public events           | 60 / min per IP                           |
| everything else         | 300 / 15 min per session                  |

The in-memory store is correct for one API instance. A shared store (MongoDB or Redis) is required before running multiple instances; this is listed under Technical risks. `trust proxy` is configured so client IPs come from `X-Forwarded-For` set by the Next.js rewrite and the hosting proxy only.

## 10. File uploads

- Allowed: PDF, PNG, JPEG, WebP, plain text. Max 5 MB per file, one file per file field, at most 3 file fields per form.
- Checks: `multer` limits (size, count, field count) → extension allow-list → magic-byte detection with `file-type` → declared and detected type must agree.
- Stored name is random (`<formId>/<32 hex>`); the original filename is sanitized (basename, control characters and path separators removed, 120 chars max) and kept only as metadata.
- Storage directory is outside any served path. Files are downloaded only through the owner-scoped endpoint with `Content-Disposition: attachment`, `nosniff` and `Content-Security-Policy: sandbox`.
- Files are written only after the whole submission validates, and are deleted with their response or form.
- Storage is a small module (`save`, `open`, `remove`) over the local filesystem. Moving to S3-compatible storage means rewriting that one module; no adapter layer is added up front.

---

## 11. Caching and rendering

Next.js 16 with Cache Components (`cacheComponents: true`). By default nothing is cached; caching is opted into with `"use cache"`.

| Route                      | Rendering                                | Cache                                                            |
| -------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| `/`, `/features`, `/about` | Static at build                          | Full route, CDN-cacheable                                        |
| Auth pages                 | Static shell                             | —                                                                |
| `(app)/*`                  | Dynamic, static shell + streamed content | **Never cached.** Reads cookies, per-user data                   |
| `/f/[slug]`                | Cached data + static markup              | `"use cache"` + `cacheTag("form:<slug>")` + `cacheLife("hours")` |

- **Private data cannot enter a shared cache.** Cached functions cannot read `cookies()` or `headers()`; Next.js throws if they try. Everything user-specific goes through the non-cached `server-only` API client.
- **Public form freshness**: when a form is updated, published, paused, archived or deleted, the API calls `POST /revalidate` on the frontend with `REVALIDATE_SECRET` and the tag. `cacheLife("hours")` is a backstop if that call fails. Correctness never depends on the cache: the API rejects submissions to non-published forms regardless of what HTML was served.
- **Request memoization**: `getCurrentUser()` and `getForm(id)` are wrapped in React `cache()` so layout, page and `generateMetadata` share one API call per request.
- **Streaming**: `(app)` pages render their header immediately and wrap data sections in `<Suspense>` with fixed-size skeletons (no layout shift).

## 12. Performance strategy

| Concern         | Approach                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| JavaScript size | Server Components by default; client islands only for interaction; no chart, date-picker or state library                    |
| Code splitting  | Route-level automatic: dnd-kit only ships with the builder route, Radix only with pages that open menus or dialogs           |
| Public form     | Cached HTML, native inputs (`select`, `date`), one small client island, analytics via `sendBeacon`                           |
| Fonts           | One variable font via `next/font` (self-hosted, `display: swap`, automatic fallback metrics)                                 |
| Images          | `next/image` with explicit width/height; `priority` only for above-the-fold hero illustration; SVGs inline-safe static files |
| Lists           | Keyset pagination (25 per page) for responses; forms list is bounded per user                                                |
| Search          | 300 ms debounce, writes to URL with `router.replace`, Server Component refetches                                             |
| Export          | Streamed from a MongoDB cursor, constant memory                                                                              |
| Re-renders      | Uncontrolled RHF inputs; reducer keeps field objects stable; memoization only where profiling shows a need                   |
| Virtualization  | Not needed at 25 rows per page; revisit if a single view renders hundreds of rows                                            |

### Core Web Vitals

- **LCP**: hero is text plus a small inline SVG illustration; critical content is server-rendered; one preloaded font; no render-blocking third-party scripts.
- **CLS**: every image has dimensions; skeletons match final layout; font fallback metrics are adjusted by `next/font`; toasts overlay rather than push content.
- **INP**: little hydration work, uncontrolled inputs, builder updates touch only the edited field, heavy work (CSV) runs on the server.

### Measured (local production build)

| Page        | JS (gzip) | Notes                                                                                  |
| ----------- | --------- | -------------------------------------------------------------------------------------- |
| `/`         | ~180 KB   | ~150 KB is the Next.js + React runtime; the page itself ships no islands               |
| `/f/[slug]` | ~226 KB   | Form island with React Hook Form and Zod Mini; second load served from cache in ~15 ms |
| `/login`    | ~220 KB   | Same validation stack as the public form                                               |

CLS was 0–0.004 on every measured page. Moving client schemas from `zod` to `zod/mini` saved ~70 KB gzip on the public form and login pages, and keeping Radix out of the root error boundary removed it from pages without menus.

## 13. SEO strategy

- **Metadata API**: root `layout.js` sets `metadataBase`, title template `%s · FormFlow`, default OG/Twitter. Each marketing page exports its own `title`, `description`, `alternates.canonical`, `openGraph` and `twitter`.
- **Open Graph image**: a static 1200×630 image in `public/assets/og/`.
- **robots.js**: allow `/`, disallow `/api/`, `/dashboard`, `/forms`, `/settings`, `/revalidate`; points to the sitemap.
- **sitemap.js**: `/`, `/features`, `/about`.
- **noindex**: `(app)` and `(auth)` layouts set `robots: { index: false, follow: false }`; `next.config.js` also sends `X-Robots-Tag: noindex` for app paths.
- **Public forms**: `noindex` by default. The owner can enable "Allow search engines to index this form" in form settings. Paused forms are always `noindex`. Public forms are not listed in the sitemap in the MVP.
- **Structured data** only where it matches visible content:
  - `/`: `WebSite` and `SoftwareApplication` (name, category, description — no ratings, no prices).
  - `/features`, `/about`: `BreadcrumbList`.
  - `FAQPage` only if the features page ships a visible FAQ section.
  - No `Organization` markup: there is no company behind the project to describe.
- **Semantic HTML**: one `h1` per page, sequential headings, landmarks (`header`, `nav`, `main`, `footer`), real `<form>`, `<label>` and `<button>` elements.
- **URLs**: lowercase, short, no tracking parameters. Filter parameters exist only on private, noindex pages.

## 14. Accessibility

- WCAG 2.2 AA target.
- Every input has a visible `<label>`; descriptions and errors are linked through `aria-describedby`; invalid inputs get `aria-invalid`; on submit, focus moves to the first invalid field and an error summary is announced.
- Radio and checkbox groups use `fieldset` + `legend`.
- Visible focus ring on every interactive element (`focus-visible` outline using the primary token, 2 px offset).
- Skip link to `main`.
- Builder reordering works with pointer, keyboard drag and explicit move buttons; moves are announced through a live region.
- Dialogs and menus come from Radix (via shadcn), which handles focus trapping and return.
- `prefers-reduced-motion` disables the few transitions used.
- Touch targets at least 44×44 px on mobile.

## 15. Design system

Warm neutral surfaces, one purple accent, flat surfaces with borders instead of shadows, 8 px radius, 4 px spacing scale. No gradients, glass or glow.

### Tokens

| Token          | Value     | Use                                    |
| -------------- | --------- | -------------------------------------- |
| `primary`      | `#6D5DFB` | buttons, focus ring, selected state    |
| `primary-dark` | `#5848E8` | hover, **primary-coloured text/links** |
| `background`   | `#F7F3EE` | page background                        |
| `surface`      | `#FFFCF8` | cards, inputs, panels                  |
| `foreground`   | `#211F2B` | body text                              |
| `muted`        | `#77727F` | secondary text on `surface`            |
| `border`       | `#E8E1D9` | borders, dividers                      |
| `soft-purple`  | `#EEEAFE` | selected rows, badges, highlights      |
| `success`      | `#16A34A` | icons, badge dots                      |
| `error`        | `#DC2626` | icons, destructive buttons, borders    |
| `warning`      | `#D97706` | icons, badge dots                      |

Tokens are declared once in `styles/globals.css` under Tailwind's `@theme`, so components use `bg-surface`, `text-muted`, `border-border` and never raw hex values.

### Contrast findings

Measured against WCAG AA (4.5:1 for normal text):

| Pair                                | Ratio     | Result                                     |
| ----------------------------------- | --------- | ------------------------------------------ |
| white on `primary`                  | ≈ 4.6     | pass — primary buttons are fine            |
| `primary` text on `background`      | ≈ 4.1     | fail → use `primary-dark` (≈ 5.4) for text |
| `muted` on `surface`                | ≈ 4.6     | pass                                       |
| `muted` on `background`             | ≈ 4.2     | fail → needs `muted-strong`                |
| `success` / `warning` text on light | ≈ 3.0–3.3 | fail → text variants needed                |

To keep the palette intact while meeting AA, four text-only variants are added: `muted-strong #68636F`, `success-text #15803D`, `warning-text #B45309`, `error-text #B91C1C`. The palette colours stay as specified for fills, icons and borders.

### Typography

One variable sans-serif family through `next/font`, weights 400/500/600. Scale: 14 / 16 / 18 / 20 / 24 / 30 / 36 px. Body 16 px (inputs stay ≥ 16 px to prevent mobile zoom).

### Responsive

Mobile-first. Breakpoints 375 (base), 768 (`md`), 1024 (`lg`), 1280 (`xl`). App sidebar collapses into a sheet below `lg`; the responses table becomes a stacked list below `md`; the builder is a single column below `lg`.

---

## 16. Testing strategy

| Layer       | Tool                                          | Scope                                                                                                                                                                                                                                                                        |
| ----------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (API)  | Vitest                                        | Zod schemas, answer validation per field type, slug, CSV escaping, filename sanitizing, status transitions, token hashing                                                                                                                                                    |
| Integration | Vitest + Supertest + mongodb-memory-server    | Auth flows, form CRUD, publish/pause, submissions, uploads, pagination, search, export                                                                                                                                                                                       |
| Security    | Same as integration, separate files           | Cross-user access (read/update/delete/responses/files/export), missing/expired/forged session, mass assignment, `$` operator payloads, XSS strings stored and returned as text, rate limits, CSV formula payloads, disguised uploads (`.png` with PDF bytes, `.exe` renamed) |
| Unit (web)  | Vitest + Testing Library (jsdom)              | Builder reducer, public form schema builder, field editor keyboard reorder, form components                                                                                                                                                                                  |
| E2E         | Playwright (Chromium, WebKit mobile viewport) | Register → login → create → add fields → configure → save → publish → open public form → submit → view response → export CSV; keyboard-only builder run; axe checks on key pages                                                                                             |

Async Server Components are covered by E2E rather than unit tests. CI runs lint, unit, integration and build on every push; E2E runs against a MongoDB service container.

---

## 17. Tooling and repository

```text
formflow/
├── .github/workflows/ci.yml
├── backend/
├── frontend/
├── docs/architecture.md
├── .editorconfig
├── .env.example
├── .gitignore
├── .nvmrc
├── .prettierrc
├── LICENSE
├── package.json          npm workspaces: lint / test / build across both apps
└── README.md
```

- **ESLint 9** flat config per app (`eslint-config-next` with jsx-a11y on the frontend, `@eslint/js` + `eslint-plugin-n` on the backend). `no-console` is an error.
- **Prettier** with `prettier-plugin-tailwindcss` for class ordering.
- **npm workspaces** give one lockfile and root scripts (`npm run lint`, `npm test`, `npm run build`). No monorepo tooling beyond that.

### Dependencies

Frontend: `next`, `react`, `react-dom`, `tailwindcss`, `@tailwindcss/postcss`, `lucide-react`, `react-hook-form`, `@hookform/resolvers`, `zod` (imported as `zod/mini`), `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `radix-ui`, `clsx`, `tailwind-merge`, `class-variance-authority`, `server-only`.

Backend: `express`, `mongodb`, `zod`, `argon2`, `helmet`, `cors`, `cookie-parser`, `express-rate-limit`, `multer`, `file-type`, `pino`, `pino-http`.

Dev: `eslint`, `prettier`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `supertest`, `mongodb-memory-server`, `@playwright/test`, `@axe-core/playwright`.

### Environment variables

| Variable              | App      | Purpose                                                     |
| --------------------- | -------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | frontend | Canonical URLs, metadata base, sitemap                      |
| `API_INTERNAL_URL`    | frontend | Server-side API base and rewrite target                     |
| `REVALIDATE_SECRET`   | both     | Shared secret for `POST /revalidate`                        |
| `PORT`                | backend  | API port                                                    |
| `NODE_ENV`            | backend  | `development` / `production` / `test`                       |
| `MONGODB_URI`         | backend  | Database connection                                         |
| `AUTH_SECRET`         | backend  | HMAC key for session and one-time token hashes (≥ 32 chars) |
| `CORS_ORIGIN`         | backend  | App origin; also used for the `Origin` check                |
| `APP_URL`             | backend  | Links in verification / reset emails, revalidation target   |
| `UPLOAD_DIR`          | backend  | Private upload directory                                    |
| `TRUST_PROXY`         | backend  | Number of proxy hops for client IP resolution               |

`NEXT_PUBLIC_API_URL` is intentionally absent: the browser uses the same-origin `/api` path, so no API URL is exposed to the client. Backend env is validated with Zod at boot and the process exits with a clear message if something is missing.

---

## 18. Roadmap

1. Shared rate-limit store (MongoDB) for multi-instance deployments.
2. Real email provider behind the existing `mailer` module.
3. Conditional logic and multi-step forms.
4. Webhooks and Slack / Google Sheets integrations.
5. Workspaces with roles (owner, editor, viewer) — authorization moves from `ownerId` to membership checks.
6. S3-compatible file storage and signed download URLs.
7. Turnstile or hCaptcha on public forms as an opt-in.
8. Daily analytics roll-ups once raw events become expensive to aggregate.
9. Indexable public forms in the sitemap.
10. Custom themes per form.

## 19. Technical risks

| Risk                                                                      | Mitigation                                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Cache Components is a newer model; some libraries assume the old defaults | Keep cached code limited to the public form data function; verify behaviour with E2E |
| Tag revalidation call fails, public page shows stale state                | `cacheLife` backstop; API is authoritative for accepting submissions                 |
| In-memory rate limits reset on restart and do not work across instances   | Documented; shared store on the roadmap before horizontal scaling                    |
| Client IP spoofing through `X-Forwarded-For`                              | Explicit `TRUST_PROXY` hop count, never `true`                                       |
| `'unsafe-inline'` scripts in the CSP                                      | No user HTML anywhere, escaped JSON-LD; SRI once it is stable in Next.js             |
| Text search is word-based, not substring                                  | Acceptable for responses; clearly labelled "Search responses"                        |
| Analytics can be inflated by scripted requests                            | Per-IP limits, per-visitor de-duplication, shown as approximate                      |
| Local file storage is lost on ephemeral hosts                             | Storage module isolated for an S3 swap                                               |
| argon2 native binary on unusual platforms                                 | Prebuilt binaries cover macOS/Linux/Windows x64/arm64                                |

---

## 20. Milestones

1. **Architecture** — this document, license, repository scaffolding files.
2. **Foundation** — Next.js and Express setup, MongoDB connection, lint/format, Tailwind tokens, shadcn, env validation, base layouts, error handling.
3. **Backend** — auth, users, forms, responses, analytics, authorization, validation, rate limiting, uploads.
4. **Frontend** — marketing, auth, dashboard, forms list, builder, public form, responses, analytics.
5. **Performance and SEO pass** — boundaries, caching, metadata, sitemap, robots, structured data, images, fonts, bundle analysis, accessibility audit.
6. **Testing** — unit, integration, security, E2E.
7. **Cleanup** — lint, tests, build, dead code, dependency review, final README.
