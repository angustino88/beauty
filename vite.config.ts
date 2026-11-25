import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// `npm run dev` with an empty VITE_API_URL / VITE_ROUTER_URL: the dev server proxies the same paths as the
// Docker nginx (deploy/nginx) to DEV_PROXY_TARGET, e.g. http://127.0.0.1:8000 (backend) or
// http://localhost:8080 (Router).
const API_PATHS = ['/api', '/ws', '/media', '/routing', '/t/'];

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const target = loadEnv(mode, process.cwd(), '').DEV_PROXY_TARGET;
  const proxy = target
    ? Object.fromEntries(API_PATHS.map((p) => [p, { target, changeOrigin: true, ws: true, secure: false }]))
    : undefined;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, './src') },
    },
    server: {
      // Run on port 3000 so the dev redirect URI http://localhost:3000/about
      // matches the already-registered Azure AD redirect URI from the old project.
      port: 3000,
      proxy,
    },
    build: {
      outDir: 'build',
    },
    // Pre-bundle FullCalendar packages together for faster cold-start.
    optimizeDeps: {
      include: [
        '@fullcalendar/react',
        '@fullcalendar/core',
        '@fullcalendar/daygrid',
        '@fullcalendar/timegrid',
        '@fullcalendar/list',
        '@fullcalendar/interaction',
      ],
    },
  };
})
