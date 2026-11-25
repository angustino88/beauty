# Frontend deployment

The frontend is a static Vite build served by nginx. nginx also proxies the API on the same origin, so the
browser never makes cross-origin calls and no CORS setup is needed.

## 1. Modes

| `VITE_API_MODE` | Deployment | nginx proxies | to |
|---|---|---|---|
| `direct` (default) | one backend | `/api/`, `/ws/`, `/media/` | `BACKEND_UPSTREAM` (the backend) |
| `router` | several department backends | `/routing/`, `/t/` | `ROUTER_UPSTREAM` (the LabMango Router's nginx) |

Leave `VITE_API_URL` and `VITE_ROUTER_URL` empty to use the page's own origin (recommended). Set them only
when the frontend must call another origin directly; that origin then has to allow the frontend in its CORS
settings.

In router mode the app signs in with Microsoft, calls `POST /routing/resolve/user` with the ID token, and then
sends every request to `/t/<prefix_key>/...`; the Router's nginx forwards it to the user's backend. See the
Router's `docs/deployment.md` for the Router side.

## 2. Files

| Path | Purpose |
|---|---|
| `Dockerfile` | production image: `npm run build:app` with the `VITE_*` build arguments, then `nginx:1.27.3-alpine` |
| `docker-compose.dev.yml` | nginx serving the local `./build`, ports 30002 (HTTP) and 3002 (HTTPS) |
| `docker-compose.prod.yml` | the production image, ports 80 (redirect) and 443 |
| `deploy/nginx/dev.conf.template`, `prod.conf.template` | server blocks; rendered at start-up by the nginx image (envsubst) |
| `deploy/nginx/api-direct.inc.template`, `api-router.inc.template` | API proxy of each mode; `API_MODE` selects one |
| `deploy/nginx/spa.inc` | static files: hashed `/assets/` cached for a year, `index.html` and client routes never cached |
| `deploy/nginx/proxy.inc`, `security-headers.inc` | proxy settings (WebSockets included) and security headers |
| `deploy/gen-dev-cert.sh` | self-signed certificate for development |

## 3. Settings (`.env`)

| Variable | Used by | Meaning |
|---|---|---|
| `VITE_API_MODE` | build and nginx | `direct` or `router` |
| `VITE_API_URL`, `VITE_ROUTER_URL` | build | empty = same origin |
| `VITE_CLIENT_ID`, `VITE_TENANT_ID`, `VITE_REDIRECT_URI`, `VITE_APP_URL` | build | Microsoft Entra (MSAL); the redirect URI must be registered for the public URL |
| `BACKEND_UPSTREAM` | nginx | backend URL for direct mode, e.g. `https://host.docker.internal:8443` |
| `ROUTER_UPSTREAM` | nginx | Router nginx URL for router mode, e.g. `https://router.example.com` |
| `SERVER_NAME` | nginx | public host name, e.g. `labmango.com` |
| `SSL_DIR`, `SSL_CERT_NAME` | nginx | certificate `$SSL_DIR/$SSL_CERT_NAME.crt` and `.key` (default `./ssl_certificates/labmango.*`) |
| `DEV_PROXY_TARGET` | `npm run dev` | where the Vite dev server proxies the API paths |

`VITE_*` values are compiled into the bundle: rebuild after changing them. The nginx values apply on restart.

## 4. Development

```bash
cp .env.example .env              # fill in VITE_CLIENT_ID, VITE_TENANT_ID, the upstreams
./deploy/gen-dev-cert.sh          # once: ssl_certificates/labmango.crt and .key
npm run build:app                 # writes ./build with the VITE_* values of .env
docker compose -f docker-compose.dev.yml up -d
```

http://localhost:30002 and https://localhost:3002. After a code change run `npm run build:app` again; nginx
serves the new files at once. For hot reload use `npm run dev` (port 3000) with `DEV_PROXY_TARGET`.

## 5. Production

```bash
cp .env.example .env              # VITE_*, SERVER_NAME, BACKEND_UPSTREAM or ROUTER_UPSTREAM
# certificate: $SSL_DIR/$SSL_CERT_NAME.crt and .key
docker compose -f docker-compose.prod.yml up -d --build
```

Port 80 answers `/healthz` and redirects everything else to HTTPS. The container health check calls `/healthz`.
Backend certificates are not verified on the proxy hop (`proxy_ssl_verify off`, as for an internal backend
with its own certificate); use an internal network between the frontend and the backend or Router.

## 6. Checks

| Request | Expected |
|---|---|
| `GET /` and any client route | `200`, `index.html`, `Cache-Control: no-store, ...` |
| `GET /assets/<hash>.js` | `200`, `Cache-Control: public, max-age=31536000, immutable` |
| `GET /static/...` | `404` |
| direct: `GET /api/csrf-token` | answered by the backend |
| router: `POST /routing/resolve/user` | answered by the Router: `{"data": {"backend_id", "name", "prefix"}}` |
