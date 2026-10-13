
# AI Development Instructions — Task Board Frontend

## 1. Source of Truth and Scope

- Read `PROJECT_SPEC.md` completely before implementation.
- This is an independent frontend project. The NestJS backend is maintained in a separate repository and directory.
- `PROJECT_SPEC.md` is the authoritative source for assignment requirements.
- This file defines frontend architecture, coding conventions, implementation standards, and quality requirements.
- Never silently ignore, weaken, or replace a requirement from `PROJECT_SPEC.md`.
- If a requirement is ambiguous, document the assumption and choose the safest practical implementation.
- Do not invent backend endpoints, request fields, response shapes, or authentication contracts. Coordinate undocumented contracts with the backend developer.
- Maintain a checklist mapping assignment requirements to implementation and tests.

## 2. Required Technology Stack

Use the following technologies:

- Next.js App Router.
- React and TypeScript with strict type checking.
- Tailwind CSS.
- Headless UI for accessible dialogs, listboxes, menus, and related interactions.
- TipTap for rich-text editing and rendering.
- TanStack Query (React Query) for server state, caching, mutations, loading states, and invalidation.
- Axios for HTTP communication with the backend through the agreed integration mechanism.
- React Hook Form and Zod when useful for form handling and client-side validation.
- Vitest and React Testing Library for unit and component tests.
- Playwright for critical end-to-end flows where practical.
- ESLint and compatible formatting tools.
- Node.js 20+.

Use compatible, stable package versions. Inspect the current project and installed dependencies before making changes.

Do not introduce MUI, Ant Design, or other admin UI frameworks.

## 3. UI/UX Skills and Design Quality

Before implementing the interface, inspect the available AI coding skills, UI/UX skills, and design-related tools that can improve the result.

- Discover and use relevant, high-quality installed skills for frontend engineering, professional UI design, UX, accessibility, responsive design, and design-system implementation.
- If a relevant skill is available, read its instructions and apply its recommendations instead of relying only on generic UI patterns.
- Prefer skills that provide practical implementation guidance, design heuristics, accessibility checks, visual consistency rules, and production-quality frontend workflows.
- If no suitable skill is available, proceed using established professional UI/UX principles without inventing skill capabilities.
- Do not waste time installing unrelated skills or dependencies.

The interface must look intentionally designed, polished, modern, and suitable for a professional task-management application.

Focus on:

- Strong visual hierarchy and typography.
- Consistent spacing, alignment, radii, borders, shadows, and colors.
- A cohesive design system with reusable design tokens.
- Clear task status and priority indicators.
- Well-designed forms, dialogs, menus, task cards, filters, and empty states.
- Consistent interactions and predictable navigation.
- Responsive layouts for mobile, tablet, and desktop.
- Useful feedback for loading, success, validation errors, and failures.
- Accessible contrast, visible focus states, and reduced-motion support.
- Persian typography and correct RTL behavior.

Avoid generic, visually repetitive AI-generated dashboards, excessive gradients, unnecessary decoration, arbitrary animations, inconsistent spacing, and oversized UI elements.

Do not prioritize visual appearance over usability, accessibility, security, or performance.

If browser preview, screenshots, or visual inspection tools are available, use them to review the implemented UI and fix visible layout, typography, responsive, and interaction issues.

## 4. Architecture: Feature-Based + Atomic Design

Combine Feature-Based Architecture and Atomic Design without mixing their responsibilities.

### Feature-Based Architecture

Organize business functionality by feature:

- `auth`: login, logout, session state, and authentication-related UI.
- `tasks`: task board, task forms, filters, task actions, and task-specific data access.
- `users`: user management, role editing, and user status management for authorized owners.

Each feature should own its business-specific components, hooks, API functions, types, schemas, and tests where appropriate.

Avoid scattering files for the same feature across unrelated folders.

### Atomic Design

Use Atomic Design for reusable presentation components:

- Atoms: buttons, inputs, labels, badges, icons, and spinners.
- Molecules: form fields, search fields, filter controls, and task metadata groups.
- Organisms: task cards, task forms, task board columns, and reusable data sections.
- Templates: reusable page layouts and structural compositions.
- Pages: route-level compositions implemented through the Next.js App Router.

Atomic Design describes UI composition; Feature-Based Architecture describes business ownership.

Business-specific UI belongs to its feature. Generic, reusable UI belongs to shared UI components.

Do not create unnecessary abstraction layers or duplicate components just to satisfy naming conventions.

## 5. Recommended Project Structure

Adapt the structure to the actual Next.js version and configuration. Do not create empty directories or unnecessary files.

frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── tasks/
│   │   │   │   └── page.tsx
│   │   │   └── users/
│   │   │       └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── providers.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   │   ├── atoms/
│   │   │   ├── molecules/
│   │   │   └── organisms/
│   │   ├── templates/
│   │   └── layout/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   ├── types/
│   │   │   └── tests/
│   │   ├── tasks/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   ├── types/
│   │   │   └── tests/
│   │   └── users/
│   │       ├── api/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── schemas/
│   │       ├── types/
│   │       └── tests/
│   ├── lib/
│   │   ├── http/
│   │   ├── auth/
│   │   ├── env/
│   │   └── utils/
│   ├── hooks/
│   ├── types/
│   └── test/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md

This is a target structure, not a requirement to create every listed file.

Keep components, business logic, validation, and data access appropriately separated. Use colocated tests when appropriate.

The frontend must remain independently runnable and must not contain the backend implementation.

## 6. Next.js Rendering and Component Boundaries

- Use Server Components by default.
- Add `"use client"` only where browser APIs, state, event handlers, React Query hooks, Headless UI interactions, or TipTap require it.
- Keep interactive Client Components focused.
- Avoid turning entire pages into Client Components unnecessarily.
- Never import server-only secrets or modules into client bundles.
- Avoid unnecessary hydration and duplicated fetching between Server Components and React Query.
- Choose a consistent initial data-fetching strategy for each route and document it.
- Use dynamic imports when they provide a meaningful benefit, such as deferring a heavy editor.
- Choose SSR, static rendering, and client fetching according to actual authentication and data requirements.
- Never expose private user data through publicly cached responses or static pages.

## 7. HTTP Communication and Backend Integration

The frontend and backend are independent projects.

- Follow the integration mechanism agreed upon with the backend developer.
- Centralize Axios configuration and request handling.
- Use typed request and response models.
- Keep backend URLs configurable through environment variables.
- Never hardcode production endpoints.
- Never expose private backend credentials in browser bundles.
- Do not store access tokens in Axios defaults, JavaScript-accessible persistent storage, or logs.
- Handle network errors, timeouts, authentication failures, authorization failures, and unexpected responses consistently.
- Preserve meaningful HTTP status codes.
- Avoid unnecessary requests, duplicate submissions, and uncontrolled automatic retries.
- Do not invent undocumented endpoints, request fields, response shapes, or pagination behavior.
- Document integration assumptions that still require confirmation.

The frontend must not implement a second, competing authentication or authorization system.

## 8. Authentication and Frontend Security

Security is a first-class requirement. Implement all protections that are appropriate and enforceable on the frontend while recognizing that NestJS remains the ultimate security boundary.

### Cookies and Tokens

- Access tokens must be stored in HttpOnly cookies according to the assignment.
- Never store access or refresh tokens in `localStorage`, `sessionStorage`, ordinary JavaScript-accessible cookies, or other browser-accessible persistent storage.
- JavaScript must not attempt to read an HttpOnly token.
- Coordinate cookie names, domains, paths, lifetimes, SameSite settings, and refresh behavior with the backend developer.
- Cookies should use `Secure` in production and an appropriate `SameSite` policy.
- Use `Path`, expiration, and cookie-clearing attributes deliberately.
- Do not put tokens in URLs, query parameters, analytics, error reports, or logs.
- Do not assume frontend code alone can revoke tokens or invalidate sessions.

Important: HttpOnly cookies must be configured by the server that sets them. A browser-side Axios interceptor cannot make a cookie HttpOnly. Ensure the agreed authentication architecture actually supports this requirement.

### Session Management

- Use the agreed authentication endpoint to retrieve the current user's identity and role.
- Handle expired sessions and failed refresh attempts safely.
- Avoid infinite refresh loops and repeated retries after authentication failure.
- Prevent stale authenticated UI and private cached data from being displayed after logout or account changes.
- Clear relevant client-side session state and private React Query caches on logout or session invalidation.
- Handle concurrent refresh attempts carefully when the agreed authentication flow requires refresh coordination.
- Do not claim that frontend-only logic can enforce disabled-user invalidation. The backend must reject old tokens belonging to disabled users.

### Authorization and Input Safety

- Treat backend authorization as authoritative.
- UI hiding is a usability feature, not a security boundary.
- Handle `401` and `403` responses correctly.
- Never trust a role or user identifier supplied by the client as proof of permission.
- Validate form inputs on the client for usability, while recognizing that backend validation is mandatory.
- Avoid rendering untrusted HTML.
- Restrict TipTap links to `http` and `https`.
- Do not use `dangerouslySetInnerHTML` for arbitrary stored content.
- Never expose secrets, stack traces, internal error details, or sensitive data in UI messages.
- Avoid unsafe redirects and unvalidated external navigation.
- Evaluate CSRF risks when authentication uses cookies, especially for state-changing requests. Coordinate the required protection with the backend architecture.
- Avoid leaking sensitive data through client-side caches, browser logs, URLs, or error tracking.
- Use secure defaults and document any remaining security assumptions.

## 9. Roles and User Experience

The supported roles are Owner, Manager, and Member.

Frontend behavior must reflect the rules in `PROJECT_SPEC.md`:

- Owner: full access, including user management, disabling users, and changing roles.
- Manager: can create, edit, delete, and assign tasks, but cannot manage users.
- Member: can access tasks created by them or assigned to them, cannot assign tasks to others, and cannot delete other users' tasks.

Use role-aware UI to improve usability, but never treat client-side role checks as authorization enforcement.

- The backend remains authoritative for all permissions.
- Provide appropriate unauthorized and forbidden states.
- Avoid displaying stale private data after logout or account changes.
- Do not assume every task returned by an API is authorized for display.
- Keep role-specific behavior consistent throughout the interface.

## 10. Task Management

Implement all required task fields:

- Title.
- Status: `todo`, `in_progress`, `done`.
- Priority.
- Assignee.
- Due date.
- Description as TipTap JSON.

Requirements:

- Implement task listing and the required create, read, update, and delete flows.
- Provide filtering by status and assignee.
- Keep filters reflected in query parameters where practical.
- Support loading, empty, validation, success, and error states.
- Prevent accidental duplicate submissions.
- Provide confirmation for destructive actions where appropriate.
- Use optimistic updates only when rollback and consistency behavior are correctly handled.
- Invalidate or update relevant React Query cache entries after mutations.
- Keep API models and form models explicitly typed.
- Do not invent statuses, priorities, or backend fields without documenting and agreeing on the contract.
- Do not rely on client-side filtering as a substitute for server-side authorization.

## 11. TipTap Rich Text

- Store and submit the editor document as JSON.
- Never use HTML as the source of truth.
- Support bold, italic, headings, lists, blockquote, and links.
- Support empty documents.
- Use a consistent, explicitly configured extension set for editing and read-only rendering.
- Restore saved JSON documents correctly when editing.
- Use JSON for API payloads and cache data.
- Validate the document structure before submission where practical.
- Restrict links to `http` and `https`; reject unsafe schemes such as `javascript:`.
- The backend must independently validate allowed nodes, marks, and links.
- Never render arbitrary stored HTML using `dangerouslySetInnerHTML`.
- Handle malformed or unsupported document JSON gracefully.
- Provide accessible labels and keyboard interaction for editor controls.

## 12. Persian RTL and Accessibility

The application must be Persian and RTL.

- Set the document language to Persian and direction to RTL.
- Use logical CSS properties and RTL-compatible Tailwind utilities where applicable.
- Ensure forms, menus, dialogs, icons, navigation, dates, and text alignment behave correctly in RTL.
- Select and configure a suitable Persian font when available and appropriately licensed.
- Do not assume left-to-right alignment is correct for every icon or control.
- Use Headless UI Dialog for create/edit dialogs and Listbox or Menu for relevant selections and actions.
- Ensure dialogs have accessible titles, correct focus entry, focus containment, Escape handling, and focus restoration.
- Ensure interactive elements are keyboard accessible.
- Provide visible focus states, appropriate labels, and meaningful accessible names.
- Do not rely on color alone to communicate status or priority.
- Respect reduced-motion preferences.
- Use semantic HTML and appropriate ARIA attributes.
- Verify responsive behavior on mobile, tablet, and desktop.

## 13. UX and Visual Quality

- Build a consistent, polished, professional task-management interface.
- Use reusable design tokens for colors, spacing, typography, radii, shadows, and focus styles.
- Reuse shared UI components rather than duplicating markup.
- Provide skeletons or appropriate loading indicators where useful.
- Provide helpful empty states and actionable Persian error messages.
- Preserve user input when a recoverable request fails.
- Confirm destructive actions and communicate mutation success or failure.
- Ensure filters and forms remain usable on small screens.
- Avoid unnecessary dialogs, excessive animations, and confusing interactions.
- Follow relevant UI/UX skill recommendations when available.
- Review the completed UI visually whenever the available tools permit.
- Do not add features that are not required unless they materially improve usability without increasing risk or complexity.

## 14. Performance

Performance optimization is required, not optional.

- Avoid unnecessary Client Components and excessive client-side JavaScript.
- Keep bundles small and defer heavy features such as TipTap when appropriate.
- Use stable React keys and avoid unnecessary rerenders.
- Use React Query cache keys that include relevant filter parameters.
- Configure stale times, retries, and refetch behavior intentionally.
- Avoid automatic retries for authentication failures and non-recoverable validation errors.
- Prevent duplicate requests where possible.
- Avoid loading entire datasets when the agreed API supports pagination or server-side filtering.
- Do not invent pagination assumptions until the backend contract is agreed upon.
- Avoid unnecessary dependencies and overlapping libraries.
- Optimize images and static assets if introduced.
- Avoid layout shifts and expensive rendering patterns.
- Measure performance where practical rather than applying speculative optimizations.
- Test production builds, not only the development server.
- Never sacrifice security, accessibility, or correctness for minor performance gains.

## 15. Testing and Quality Gates

Automated tests are required.

Frontend tests should cover, where applicable:

- Login form validation and authentication states.
- Authenticated and unauthenticated navigation behavior.
- Role-aware UI rendering.
- Task form validation.
- Task filtering by status and assignee.
- Task mutation success and failure handling.
- TipTap JSON restoration and empty documents.
- Supported rich-text formatting and safe link handling.
- Loading and error states.
- Keyboard interaction and accessible dialog behavior.
- HTTP client error handling and authentication failure behavior.

Use Vitest and React Testing Library for unit and component tests. Use Playwright for critical end-to-end flows when feasible.

The backend security tests specified in `PROJECT_SPEC.md` must be implemented and run in the backend repository. Frontend tests cannot replace them.

Before declaring the frontend complete, run and review:

- TypeScript type checking.
- ESLint.
- Unit and component tests.
- Production build.
- Relevant end-to-end tests when configured.

Fix failures introduced by the implementation. Do not disable tests, suppress meaningful lint rules, or weaken type safety merely to obtain a green result.

## 16. Environment and Configuration

- Validate required environment variables at the appropriate boundary.
- Provide `.env.example` with placeholders, not real secrets.
- Keep private backend URLs and secrets out of browser bundles.
- Do not commit environment files containing secrets.
- Document required frontend environment variables.
- Keep local development, test, and production configuration differences explicit.
- Do not assume the frontend and backend share a filesystem, runtime, or deployment origin.

## 17. Code Quality and Dependency Rules

- Use strict TypeScript and avoid `any` unless justified and documented.
- Keep components focused and reasonably small.
- Separate UI, business logic, HTTP communication, and validation.
- Prefer composition over deeply nested conditionals.
- Avoid duplicated request logic and authorization assumptions.
- Use consistent export conventions.
- Avoid circular dependencies.
- Do not create generic abstractions before they are useful.
- Use TanStack Query for server state rather than duplicating server data in a global client store.
- Explain significant deviations from this architecture.
- Prefer readable, maintainable code over unnecessarily clever solutions.

## 18. AI-Assisted Development Workflow

- Read project instructions before editing.
- Inspect existing files and dependencies before generating new ones.
- Discover and apply relevant UI/UX and frontend engineering skills when available.
- Maintain a checklist mapping assignment requirements to implementation and tests.
- Implement in coherent, verifiable stages.
- Review generated code for correctness, security, accessibility, maintainability, visual consistency, and unnecessary complexity.
- Never assume generated code is correct simply because it compiles.
- Do not overwrite working project files without inspecting them.
- Do not claim tests, builds, or integrations passed unless they were actually executed.
- Record important architectural decisions and known limitations.
- Keep documentation aligned with the implementation.
- Identify work that requires coordination with the backend developer.

## 19. Definition of Done

The frontend is not complete merely because the UI renders.

Completion requires:

- All applicable frontend requirements in `PROJECT_SPEC.md` are implemented.
- The frontend remains independent of the backend repository.
- Authentication follows the agreed secure HttpOnly cookie contract.
- Frontend security measures are implemented wherever applicable.
- Role-aware UI behavior follows the assignment without pretending the UI enforces security.
- Required task workflows and filtering work against the agreed API contract.
- TipTap JSON is saved and restored correctly.
- Persian RTL and accessibility requirements are verified.
- The UI has been reviewed for visual quality and responsive behavior.
- Relevant automated tests pass.
- Type checking, linting, and production build pass.
- Environment configuration and setup instructions are documented.
- Backend integration assumptions and dependencies are explicit.
- Remaining limitations are honestly documented.

Do not claim production readiness solely because the application builds.

## 20. Current Implementation Decisions

Keep these aligned with `README.md` (which holds the full provisional backend contract and limitations).

- Next.js 16 with `cacheComponents`. Read `node_modules/next/dist/docs` before using framework APIs; this version differs from older training data.
- The `/api/v1/*` proxy required by `PROJECT_SPEC.md` is a single rewrite in `next.config.ts` to `BACKEND_URL`. Do not add route-handler proxies or token handling in Next.js without agreeing it with the backend developer.
- All HTTP goes through `src/lib/http/client.ts`. Its 401 → single refresh → single retry → session-expired flow is covered by tests; keep it loop-free.
- Private data is fetched only client-side with TanStack Query behind `SessionGate`; static shells contain no user data. Dashboard pages export `instant = false` for this reason.
- Logout and session expiry use a full page navigation to discard caches and `<Activity>`-preserved routes.
- TipTap: one extension set (`src/lib/tiptap/extensions.ts`) and one whitelist sanitizer (`src/lib/tiptap/document.ts`) shared by the editor and viewer. Change both together and update the backend validation contract when you do.
- Task filtering is client-side until server-side filter parameters are agreed.
- The structure in section 5 is adapted: there is no `templates/` level (the only shared page structure is `components/layout/app-shell.tsx`), and there are no top-level `hooks/` or `types/` folders because nothing shared needs them yet.
- `e2e/mock-backend.mjs` is a test-only implementation of the provisional contract. It is not the backend and must not grow into one.
- Test commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e` (set `PW_CHANNEL=chrome` when Playwright browsers cannot be downloaded).
