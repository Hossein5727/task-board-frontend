# Task Board — Frontend

Persian (RTL) Next.js frontend for the Task Board hiring assignment (`PROJECT_SPEC.md`).
The NestJS backend lives in a separate repository; this project contains **no backend code**
(`e2e/mock-backend.mjs` is a test-only stand-in, see [Testing](#testing)).

> **Status:** all frontend requirements are implemented and tested against a mock of the
> **provisional** API contract below. The contract has **not yet been confirmed** with the backend
> developer — read [Backend contract](#backend-contract-provisional) before integrating.

## Prerequisites

- Node.js 20+ (developed on Node 24) and npm
- A running NestJS backend (or the mock: `node e2e/mock-backend.mjs`)

## Getting started

```bash
npm install
cp .env.example .env.local      # set BACKEND_URL
npm run dev                     # http://localhost:3000
```

To try the UI without the real backend, run `node e2e/mock-backend.mjs` (port 4000) in a second
terminal and log in with `owner@example.com` / `manager@example.com` / `member@example.com`,
password `Password123!` (mock data only; real credentials come from the backend seed).

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript rules) |
| `npm test` | Vitest unit + component tests |
| `npm run test:e2e` | Playwright E2E (builds the app, starts the mock backend) |

## Environment variables

| Variable | Scope | Description |
| --- | --- | --- |
| `BACKEND_URL` | server only | NestJS base URL including any global prefix, e.g. `http://localhost:4000`. Required in production builds. **Read at `next build`/`next dev` time** because rewrites are compiled into the build — rebuild when it changes. |

No `NEXT_PUBLIC_*` variables exist; nothing about the backend is shipped to the browser.

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
│   ├── ui/molecules/        # TextField, SelectField (Listbox), FormAlert, StateMessage
│   ├── ui/organisms/        # Modal (Dialog), ConfirmDialog, Toaster, rich-text editor/viewer
│   └── layout/              # AppShell (header, role-aware nav, skip link)
├── features/
│   ├── auth/                # api, session hooks, SessionGate, login form, user menu, role helpers
│   ├── tasks/               # api, query hooks, schema, filters, board/card/dialogs, tests
│   └── users/               # api, query hooks, schemas, management table/dialogs, tests
├── lib/
│   ├── http/                # Axios client (refresh single-flight) + error normalization
│   ├── auth/                # safe redirect helper
│   ├── tiptap/              # shared extension config + JSON sanitizer
│   └── utils/
└── test/                    # Vitest setup + render helpers
e2e/                         # Playwright specs + test-only mock backend
```

Feature folders own business logic, data access and feature UI; `components/ui` holds generic
Atomic Design pieces. There is no `templates/` level: the only reusable page structure is
`AppShell`, which lives in `components/layout`.

### Rendering and data fetching

- Pages and layouts are Server Components; interactivity lives in focused Client Components.
- `cacheComponents` is on (Next 16 default). Every route prerenders a **static shell with no user
  data**; all private data is fetched in the browser with TanStack Query through the same-origin
  proxy. Nothing private is ever SSR-rendered or put in a shared cache.
- The dashboard layout wraps pages in `SessionGate`, which calls `GET /auth/me` before rendering.
  Dashboard pages export `instant = false` because this gate blocks entry by design.
- TipTap (the heaviest dependency) is loaded with `next/dynamic` only when a task dialog opens.
- Query defaults: `staleTime` 30 s (`/auth/me` 60 s); retries only for network/429/5xx, never
  for 4xx; mutations never retry. Mutations invalidate the task list and update the detail cache;
  user changes also invalidate `/auth/me` and tasks (names/roles are embedded there).
- Filters live in the URL (`/tasks?status=done&assignee=<id>`) and are applied client-side; see
  limitations.

## Backend contract (provisional)

`PROJECT_SPEC.md` requires that the browser talk only to Next.js through a proxy such as
`/api/v1/*`. This is implemented with a single **Next.js rewrite** (`next.config.ts`):
`/api/v1/:path*` → `${BACKEND_URL}/:path*`. Requests, `Set-Cookie` headers and status codes pass
through untouched. There is no custom proxy code and no second auth system.

Everything below is an **assumption** used by the frontend and mock, pending confirmation:

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
  priority: "low" | "medium" | "high";         // values not defined by the spec
  assigneeId: string | null; assignee: { id; fullName; email } | null;
  dueDate: string | null;                       // sent as "YYYY-MM-DD"
  description: TipTapJSON;                      // jsonb
  createdById: string; createdBy?: { id; fullName; email } | null;
  createdAt: string; updatedAt: string;
}
type TaskPayload = Pick<Task, "title" | "status" | "priority" | "assigneeId" | "dueDate" | "description">;
```

Also assumed: responses are raw JSON (no envelope), IDs are strings, no pagination, and errors use
NestJS's default `{ statusCode, message, error }` shape. The UI never displays backend error text;
it maps status codes to Persian messages.

## Authentication and security

**Frontend guarantees**

- Tokens are never read, stored or attached by JavaScript: no `localStorage`/`sessionStorage`, no
  `Authorization` header, nothing in URLs or logs. Verified by an E2E test.
- One Axios instance (`src/lib/http/client.ts`). On a 401 it calls `/auth/refresh` **once**
  (concurrent 401s share a single refresh) and retries the request once. If refresh fails, or the
  retry is also 401 (e.g. a disabled user), it clears the whole query cache and hard-redirects to
  `/login`. Auth endpoints never trigger refresh, so there are no loops.
- Logout calls `/auth/logout`, clears the query cache and does a full page navigation, which also
  discards routes kept alive by `cacheComponents`' `<Activity>`.
- Login caches are cleared before a new session loads. The post-login `next` parameter is accepted
  only as a same-origin path (blocks `//evil.com`, `/\evil.com`, schemes).
- 401 → re-authenticate; 403 → Persian "not allowed" message and the UI stays put.
- Role-aware UI (users nav, delete action, assignee choices, users page) is **usability only**.
- Security headers: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Every request sends `X-Requested-With: XMLHttpRequest` (CSRF defense in depth, see below).
- TipTap: JSON only, never HTML; no `dangerouslySetInnerHTML`; links restricted to http/https in
  the editor, the read-only renderer and a whitelist sanitizer applied on load and before submit.

**Backend responsibilities (must be confirmed — the frontend cannot enforce these)**

- Set auth cookies with `HttpOnly`, `Secure` (production), `SameSite=Lax` or `Strict`, and a
  `Path` valid for the **browser-visible** URLs. The browser sees `/api/v1/...`, so a refresh-cookie
  path must be `/api/v1/auth` (or `/`), not `/auth`. Agree cookie names and lifetimes.
- CSRF: the proxy makes the API same-origin, so `SameSite=Lax/Strict` cookies already block
  cross-site requests from carrying credentials. If cookies must be `SameSite=None`, the backend
  must add CSRF tokens or reject requests lacking `X-Requested-With`/a valid `Origin`.
- All authorization (roles, member task visibility, assignment and delete rules), disabled-user
  rejection including old tokens, refresh-token hashing/revocation, last-owner protection, DTO
  validation with unknown fields rejected, and TipTap node/mark/link validation.
- The three required security tests (member cannot view others' tasks, member cannot modify users,
  disabled user's old token rejected) belong to the backend repo. Frontend tests do not replace them.

## TipTap JSON

- One extension set (`src/lib/tiptap/extensions.ts`, StarterKit trimmed to: paragraph, heading
  levels 2–3, bullet/ordered list, blockquote, bold, italic, link) is used for both editing and
  read-only rendering.
- `sanitizeDoc` whitelists exactly that schema: unknown nodes, marks or attributes are dropped,
  unsafe links lose the link mark but keep their text, malformed input becomes an empty document.
  Empty documents (`{ type: "doc", content: [{ type: "paragraph" }] }`) are valid.
- Editing restores the saved JSON; the form submits `editor.getJSON()` after sanitizing.

## Testing

```bash
npm test                         # 78 Vitest tests (unit + component, jsdom)
npm run test:e2e                 # 9 Playwright tests against a production build
PW_CHANNEL=chrome npm run test:e2e   # use installed Chrome/Edge if Playwright cannot download browsers
```

Unit/component coverage: HTTP client refresh, single-flight and no-loop behavior; error mapping;
safe redirects; TipTap sanitizer, restoration, formatting and link safety; login validation,
errors and duplicate-submit prevention; role-aware navigation; task board grouping, URL filters,
create/edit/delete, mutation errors with preserved input, confirmation and Escape/focus handling;
member restrictions; user management (forbidden state, confirmed disable, last-owner error, create
validation).

E2E (`e2e/app.spec.ts`) runs the real production build with the real rewrite proxy against
`e2e/mock-backend.mjs`, a small in-memory server implementing the provisional contract with
HttpOnly cookies. It covers the login redirect round trip, HttpOnly cookies with empty web storage,
the full task lifecycle with rich text, URL filters, transparent token refresh, member
restrictions, logout, and a user being disabled mid-session. Passing E2E tests prove the frontend
works against **this contract**, not against the real backend.

## Known limitations and open items

- **Backend contract unconfirmed.** Field names, priority values, response shapes, error codes
  (403 for disabled login, 400 for last-owner, 409 for duplicate email) and cookie paths need sign-off.
- **Filtering is client-side** over the list `GET /todos` returns, because no query parameters are
  agreed. Switch `listTasks` to pass `status`/`assigneeId` once the backend supports them.
  There is no pagination.
- **Assignee list for managers:** `GET /users` is owner-only per the spec, so managers can only pick
  themselves or people already assigned to visible tasks. A lightweight assignable-users endpoint
  would remove this limitation.
- Route protection is client-side (`SessionGate`); there is no Next.js `proxy.ts` redirect, because
  cookie names are not agreed. The backend still rejects every unauthorized request.
- No Content-Security-Policy yet (needs nonce wiring with Next inline scripts).
- The due-date picker is the native `<input type="date">` (Gregorian); dates are displayed in the
  Persian calendar.
- Light theme only. The demo video and monorepo integration are outside this repository.

## AI-assisted development

Built with Cursor Agent following `AI_INSTRUCTIONS.md`. No dedicated UI/UX skill was installed;
the agent used the user's "ponytail" skill (smallest complete change, no speculative
abstractions) and reviewed the UI visually in a browser at desktop and mobile widths. The agent
read the version-matched Next.js 16 docs in `node_modules/next/dist/docs` before relying on
`cacheComponents`, rewrites and `instant`. All code was type-checked, linted and exercised by the
tests above; review findings (for example a read-only viewer exposed as an editable textbox, and an
ineffective date-input style) were fixed before delivery.
