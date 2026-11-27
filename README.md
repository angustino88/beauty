# LabMango Frontend v2

## Project Purpose

LabMango Frontend v2 is the current frontend for lab operations, built to replace the legacy UI stack with a faster build system, cleaner data flow, and stronger maintainability while preserving business behavior.


## Technology Stack

- React 19 + TypeScript
- Vite 8
- Redux Toolkit + RTK Query
- Ant Design 6
- MSAL v5 (`@azure/msal-browser`, `@azure/msal-react`)
- Three.js (`@react-three/fiber`, `@react-three/drei`) for 3D dashboard surfaces

## Prerequisites

- Node.js 20.x
- npm 10.x or newer
- Git

## Quick Start

```bash
git clone <repository-url>
cd prj.labmango_frontend.v2
npm install
npm run dev
```

Default development URL:

- `http://localhost:3000`

## Environment Configuration

This project uses Vite runtime variables (`VITE_*`), not `REACT_APP_*`.

Minimum variables:

- `VITE_API_URL`
- `VITE_CLIENT_ID`
- `VITE_TENANT_ID`
- `VITE_REDIRECT_URI`
- `VITE_APP_URL`
- `VITE_WS_URL_CHATBOT`

Production: `VITE_AGENT_URL`, the public Nginx or Router address lab computers enroll at (never the
application server). The agent setup dialog puts it in the enroll command; without it the command shows
`<server-url>` and a warning. Development uses `VITE_API_URL` (the backend directly).

For exact values per environment, use secure internal channels and contact the team lead.

### Direct backend or Router (`VITE_API_MODE`)

The frontend works with one backend directly or with several department backends behind the
[LabMango Router](https://github.com/angustino88/router). Copy `.env.example` for the full list.

| `VITE_API_MODE` | Use when | Requests go to |
|---|---|---|
| `direct` (default) | one backend | `/api/...` on the frontend origin, proxied to the backend |
| `router` | several department backends | `/t/<prefix_key>/api/...` on the frontend origin, proxied to the Router |

In router mode the sign-in flow is: Microsoft sign-in (MSAL) → `POST /routing/resolve/user` with the ID token →
`{"data": {"backend_id", "name", "prefix"}}` → sign-in, the API, WebSockets and token refresh use that prefix. The
chosen backend is kept in localStorage (`labmango.routedBackend`) until sign-out. All backend URLs are built by
`src/shared/lib/backendTarget.ts`; do not read `VITE_API_URL` anywhere else.

### Docker

nginx serves the build and proxies the API on the same origin; `docker-compose.dev.yml` (ports 30002/3002) and
`docker-compose.prod.yml` (80/443). Details: [docs/deployment.md](docs/deployment.md).

## Available Scripts

- `npm run dev` — start local development server
- `npm run build` — production build to `build/` from the committed API client (works on a fresh clone)
- `npm run build:app` — same as `npm run build` (used by Docker)
- `npm run build:full` — regenerate the API client from `openapi/openapi-full.json`, then build; needs the
  contract, which is not in the repository (`openapi/` is git-ignored), so get it from the backend team first
- `npm run preview` — preview built assets
- `npm run lint` — run ESLint
- `npm test` — run Node.js TypeScript unit tests
- `npm run typecheck` — check TypeScript without building assets

## Generate API Client

The current code-generation contract is `openapi/openapi-full.json`. The split `openapi/openapi.yml` is incomplete (some referenced domain files are absent), so do not use it for generation until its references have been restored and validated. To use another complete contract, set `OPENAPI_SPEC` before the command. Then run:

```bash
npm ci
npm run api:generate
```

To use another contract path, set `OPENAPI_SPEC` before the command. PowerShell example:

```powershell
$env:OPENAPI_SPEC = "docs/api/openapi.yaml"
npm run api:generate
```

The generated RTK Query endpoints and hooks are written to `src/shared/api/generated/api.ts`. They inject into the existing `baseApi`, so requests use the frontend's authentication, token refresh, and cache infrastructure. Keep generated code separate from handwritten API code and do not edit it manually. Cache tags remain managed by handwritten feature endpoints; add endpoint-specific tag behavior when migrating a feature.

The equipment collection response includes pagination metadata, but the current contract does not declare request parameters for `page` or `page_size`. The inventory currently paginates only the returned rows; confirm backend request support and update the contract before switching to server-side pagination.

The code generator reads the local contract by default. To generate from another contract, set `OPENAPI_SPEC` before running the command.

## Access Control

The backend decides who may do what and sends the signed-in user's permissions in `GET /api/users/me` →
`effective_permissions.labs` (`{ value, label }` items, for example `bench_booking.approve`). The full list and
which role holds each one is Lab Mango's `docs/architecture/access-matrix.md`; the codes are mirrored in
`src/features/auth/permissions.ts`.

- Gate actions with `useCan()` / `usePermission('area.action')`, pages with `<PermissionRoute permission="...">`,
  and navigation sections with `requires`.
- Never check a role (`admin`, `coord`, `user`) or a group name: roles are shown for information only
  (`state.me.roles`). Changing who may do something is a backend change; the UI follows automatically.
- The server stays authoritative: every action still handles 403.

## Repository Structure

Top-level structure:

```text
prj.labmango_frontend.v2/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   └── shared/
├── docs/
├── package.json
├── vite.config.ts
└── tsconfig*.json
```

Primary source folders:

- `src/app`: app bootstrap, routing, store wiring
- `src/features`: feature modules (domain-focused)
- `src/components`: shared UI building blocks
- `src/shared`: cross-feature libraries, hooks, API base, utilities
