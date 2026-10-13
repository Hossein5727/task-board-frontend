# Task Board — Frontend

Persian (RTL) Next.js frontend for the Task Board hiring assignment (`PROJECT_SPEC.md`).
The NestJS backend lives in a separate repository; this project contains **no backend code**.
The browser talks only to Next.js, which proxies `/api/v1/*` to the NestJS API.

## Contents

- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Architecture](#architecture)
- [Backend API contract](#backend-api-contract)
- [Authentication and security](#authentication-and-security)
- [TipTap JSON](#tiptap-json)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)

## Prerequisites

- Node.js 20+ (developed on Node 24) and npm
- A running NestJS backend reachable from the machine that runs Next.js

## Getting started

```bash
npm install
cp .env.example .env.local      # set BACKEND_URL to your NestJS API
npm run dev                     # http://localhost:3000
```

Log in with an account from the backend's seed data.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript rules) |
| `npm test` | Vitest unit + component tests |
| `npm run test:watch` | Vitest in watch mode |

## Environment variables

| Variable | Scope | Description |
| --- | --- | --- |
| `BACKEND_URL` | server only | NestJS base URL **including any global prefix**, e.g. `http://localhost:4000` or `http://localhost:4000/api/v1` if NestJS uses `setGlobalPrefix('api/v1')`. Required in production builds; defaults to `http://localhost:4000` in development. |

`BACKEND_URL` is read when `next dev` / `next build` starts, because rewrites are compiled into
the build. **Restart the dev server (or rebuild) after changing it.**

There are no `NEXT_PUBLIC_*` variables: nothing about the backend is shipped to the browser.
Do not use `process.env.BACKEND_URL` in client code — it is `undefined` in the browser. Client
code always calls the relative path `/api/v1`.

## Architecture

```
src/
├── app/                     # App Router: routes, root layout (lang="fa" dir="rtl"), providers
│   ├── (auth)/login/        # public login page (Server Component shell + client form)
│   └── (dashboard)/         # authenticated area: layout = SessionGate + AppShell
│       ├── tasks/           # board
│       └── users/           # owner-only user management
├── components/
│   ├── ui/atoms/            # Button, Badge, Avatar, Spinner, Skeleton, Logo, control styles
│   ├── ui/molecules/        # TextField, SelectField (Listbox), DatePickerField, FormAlert, StateMessage
│   ├── ui/organisms/        # Modal (Dialog), ConfirmDialog, Toaster, rich-text editor/viewer
│   └── layout/              # AppShell (header, role-aware nav, skip link)
├── features/
│   ├── auth/                # api, session hooks, SessionGate, login form, user menu, role helpers
│   ├── tasks/               # api, query hooks, schema, filters, board/card/dialogs, tests
│   └── users/               # api, query hooks, schemas, management table/dialogs, tests
├── lib/
│   ├── http/                # Axios client (refresh single-flight) + error normalization
│   ├── auth/                # safe redirect helper
│   ├── dates/               # ISO date helpers
│   ├── hooks/               # shared DOM hooks
│   ├── tiptap/              # shared extension config + JSON sanitizer
│   └── utils/
└── test/                    # Vitest setup + render helpers
```

Feature folders own business logic, data access and feature UI; `components/ui` holds generic
Atomic Design pieces. Each feature follows the same layout: `api/` (HTTP calls), `hooks/`
(TanStack Query + component logic), `schemas/` (Zod), `components/`, `types.ts` and `tests/`.
There is no `templates/` level: the only reusable page structure is `AppShell`, which lives in
`components/layout`.

### Request flow

```
Browser ──/api/v1/*──▶ Next.js (rewrite in next.config.ts) ──▶ ${BACKEND_URL}/*  (NestJS)
```

All HTTP goes through one Axios instance, `src/lib/http/client.ts`, with `baseURL: "/api/v1"`.
Because the API is same-origin from the browser's point of view, the HttpOnly auth cookies set by
NestJS belong to the frontend's origin and no CORS configuration is needed.

### Rendering and data fetching

- Pages and layouts are Server Components; interactivity lives in focused Client Components.
- `cacheComponents` is on. Every route prerenders a **static shell with no user data**; all
  private data is fetched in the browser with TanStack Query through the same-origin proxy.
  Nothing private is ever SSR-rendered or put in a shared cache.
- The dashboard layout wraps pages in `SessionGate`, which calls `GET /auth/me` before rendering.
  Dashboard pages export `instant = false` because this gate blocks entry by design.
- TipTap (the heaviest dependency) is loaded with `next/dynamic` only when a task dialog opens.
- Query defaults: `staleTime` 30 s (`/auth/me` 60 s); retries only for network/429/5xx, never
  for 4xx; mutations never retry. Mutations invalidate the task list and update the detail cache;
  user changes also invalidate `/auth/me` and tasks (names/roles are embedded there).
- Filters live in the URL (`/tasks?status=done&assignee=<id>`) and are applied client-side.

## Backend API contract

The proxy is a single **Next.js rewrite** (`next.config.ts`): `/api/v1/:path*` →
`${BACKEND_URL}/:path*`. Requests, `Set-Cookie` headers and status codes pass through untouched.
There is no custom proxy code and no second auth system.

Paths below are relative to `BACKEND_URL`:

| Endpoint | Request | Response |
| --- | --- | --- |
| `POST /auth/login` | `{ email, password }` | 2xx + sets cookies (body ignored). 401 = bad credentials, 403 = disabled account |
| `POST /auth/refresh` | refresh cookie | 2xx + rotates cookies; 401 when invalid |
| `POST /auth/logout` | cookies | clears cookies |
| `GET /auth/me` | — | `User` |
| `GET /users` | — | `User[]` (owner only; managers get 403 and the UI falls back gracefully) |
| `POST /users` | `{ fullName, email, password, role: "manager" \| "member" }` | `User` (409 = email exists) |
| `PATCH /users/:id` | partial `{ fullName?, role?, isActive? }` | `User` (400 = last active owner rule) |
| `GET /todos` | — | `Task[]` already filtered by permissions |
| `GET /todos/:id` | — | `Task` |
| `POST /todos` | `TaskPayload` | `Task` |
| `PATCH /todos/:id` | partial `TaskPayload` | `Task` |
| `DELETE /todos/:id` | — | 2xx |

```ts
type Role = "owner" | "manager" | "member";
interface User { id: string; email: string; fullName: string; role: Role; isActive: boolean }
interface Task {
  id: string; title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assigneeId: string | null; assignee: { id; fullName; email } | null;
  dueDate: string | null;                       // sent as "YYYY-MM-DD"
  description: TipTapJSON;                      // jsonb
  createdById: string; createdBy?: { id; fullName; email } | null;
  createdAt: string; updatedAt: string;
}
type TaskPayload = Pick<Task, "title" | "status" | "priority" | "assigneeId" | "dueDate" | "description">;
```

Responses are raw JSON (no envelope), IDs are strings, there is no pagination, and errors use
NestJS's default `{ statusCode, message, error }` shape. The UI never displays backend error text;
it maps status codes to Persian messages (`src/lib/http/errors.ts`). If the backend changes any of
this, update the matching `features/*/api` and `features/*/types.ts` files.

## Authentication and security

**Frontend guarantees**

- Tokens are never read, stored or attached by JavaScript: no `localStorage`/`sessionStorage`, no
  `Authorization` header, nothing in URLs or logs.
- On a 401 the HTTP client calls `/auth/refresh` **once** (concurrent 401s share a single refresh)
  and retries the request once. If refresh fails, or the retry is also 401 (e.g. a disabled user),
  it clears the whole query cache and hard-redirects to `/login`. Auth endpoints never trigger
  refresh, so there are no loops.
- Logout calls `/auth/logout`, clears the query cache and does a full page navigation, which also
  discards routes kept alive by `cacheComponents`' `<Activity>`.
- Login caches are cleared before a new session loads. The post-login `next` parameter is accepted
  only as a same-origin path (blocks `//evil.com`, `/\evil.com`, schemes).
- 401 → re-authenticate; 403 → Persian "not allowed" message and the UI stays put.
- Role-aware UI (users nav, delete action, assignee choices, users page) is **usability only**.
- Security headers: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Every request sends `X-Requested-With: XMLHttpRequest` (CSRF defense in depth).
- TipTap: JSON only, never HTML; no `dangerouslySetInnerHTML`; links restricted to http/https in
  the editor, the read-only renderer and a whitelist sanitizer applied on load and before submit.

**Backend responsibilities (the frontend cannot enforce these)**

- Auth cookies with `HttpOnly`, `Secure` (production), `SameSite=Lax` or `Strict`, and a `Path`
  valid for the **browser-visible** URLs. The browser sees `/api/v1/...`, so a refresh-cookie path
  must be `/api/v1/auth` (or `/`), not `/auth`.
- CSRF: with `SameSite=Lax/Strict` cookies, cross-site requests cannot carry credentials. If
  cookies must be `SameSite=None`, the backend must add CSRF tokens or check
  `X-Requested-With`/`Origin`.
- All authorization (roles, member task visibility, assignment and delete rules), disabled-user
  rejection including old tokens, refresh-token revocation, last-owner protection, DTO validation
  and TipTap node/mark/link validation.

## TipTap JSON

- One extension set (`src/lib/tiptap/extensions.ts`, StarterKit trimmed to: paragraph, heading
  levels 2–3, bullet/ordered list, blockquote, bold, italic, link) is used for both editing and
  read-only rendering.
- `sanitizeDoc` (`src/lib/tiptap/document.ts`) whitelists exactly that schema: unknown nodes,
  marks or attributes are dropped, unsafe links lose the link mark but keep their text, malformed
  input becomes an empty document. Empty documents (`{ type: "doc", content: [{ type: "paragraph" }] }`)
  are valid.
- Editing restores the saved JSON; the form submits `editor.getJSON()` after sanitizing.

## Testing

```bash
npm test             # Vitest unit + component tests (jsdom)
npm run typecheck
npm run lint
```

Tests mock HTTP at the API-module level, so they need no backend. Coverage: HTTP client refresh,
single-flight and no-loop behavior; error mapping; safe redirects; date helpers; TipTap sanitizer,
restoration, formatting and link safety; login validation, errors and duplicate-submit prevention;
role-aware navigation; task board grouping, URL filters, create/edit/delete, mutation errors with
preserved input, confirmation and Escape/focus handling; member restrictions; user management
(forbidden state, confirmed disable, last-owner error, create validation).

End-to-end behavior against the real API is checked manually.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Requests go to `/undefined/api/v1/...` | Client code used `process.env.BACKEND_URL`. Use the relative `/api/v1` base URL. |
| Every request returns 404 | `BACKEND_URL` is missing the NestJS global prefix (or has it twice). The rewrite strips `/api/v1`, then appends the rest to `BACKEND_URL`. |
| Changed `BACKEND_URL` has no effect | Restart `npm run dev` or rebuild; rewrites are fixed at startup. |
| Login succeeds but the next request is 401 | Cookie `Path`/`Secure` mismatch — e.g. `Secure` cookies over plain HTTP, or a refresh cookie scoped to `/auth` instead of `/api/v1/auth`. |
| `next build` fails with "BACKEND_URL must be set" | Production builds require `BACKEND_URL`. |

## Known limitations

- **Filtering is client-side** over the list `GET /todos` returns. Switch `listTasks` to pass
  `status`/`assigneeId` once the backend supports them. There is no pagination.
- **Assignee list for managers:** `GET /users` is owner-only, so managers can only pick themselves
  or people already assigned to visible tasks. An assignable-users endpoint would remove this.
- Route protection is client-side (`SessionGate`); there is no Next.js `proxy.ts` redirect. The
  backend still rejects every unauthorized request.
- No Content-Security-Policy yet (needs nonce wiring with Next inline scripts).
- The due date (`DatePickerField`, built on `react-multi-date-picker`) is picked and shown in the
  Persian calendar but always sent as a Gregorian `YYYY-MM-DD`. Day-by-day arrow-key navigation in
  its calendar grid is limited by the library.
- Light theme only.

## AI-assisted development

Built with Cursor Agent following `AI_INSTRUCTIONS.md`. The agent read the version-matched
Next.js 16 docs in `node_modules/next/dist/docs` before relying on `cacheComponents`, rewrites and
`instant`. All code is type-checked, linted and covered by the tests above.
