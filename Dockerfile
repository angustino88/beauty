# syntax=docker/dockerfile:1
# LabMango frontend: Vite build served by nginx (production). Build arguments are the VITE_* settings, baked
# into the bundle at build time; see .env.example.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_MODE=direct
ARG VITE_API_URL=
ARG VITE_ROUTER_URL=
ARG VITE_CLIENT_ID
ARG VITE_TENANT_ID
ARG VITE_REDIRECT_URI
ARG VITE_APP_URL
ARG VITE_WS_URL_CHATBOT=
ARG VITE_AGENT_URL=
ENV VITE_API_MODE=$VITE_API_MODE VITE_API_URL=$VITE_API_URL VITE_ROUTER_URL=$VITE_ROUTER_URL \
    VITE_CLIENT_ID=$VITE_CLIENT_ID VITE_TENANT_ID=$VITE_TENANT_ID VITE_REDIRECT_URI=$VITE_REDIRECT_URI \
    VITE_APP_URL=$VITE_APP_URL VITE_WS_URL_CHATBOT=$VITE_WS_URL_CHATBOT VITE_AGENT_URL=$VITE_AGENT_URL
RUN npm run build:app

FROM nginx:1.27.3-alpine
LABEL org.opencontainers.image.title="labmango-frontend"
# Rendered at start-up by the image's envsubst step (API_MODE, BACKEND_UPSTREAM, ROUTER_UPSTREAM, SERVER_NAME,
# SSL_CERT_NAME) into /etc/nginx/conf.d.
COPY deploy/nginx/prod.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/nginx/api-direct.inc.template deploy/nginx/api-router.inc.template /etc/nginx/templates/
COPY deploy/nginx/spa.inc deploy/nginx/proxy.inc deploy/nginx/security-headers.inc /etc/nginx/snippets/
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80 443
HEALTHCHECK --interval=15s --timeout=3s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
