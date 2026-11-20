import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { readdirSync, readFileSync } from 'node:fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'little-acre-static',
      apply: 'build',
      generateBundle() {
        // Preserve the standalone game's relative script and texture URLs in production.
        const root = path.resolve(import.meta.dirname, 'farm-game')
        for (const file of readdirSync(root, { recursive: true, encoding: 'utf8' })) {
          if (!/\.(html|js|css|webp)$/i.test(file)) continue
          this.emitFile({
            type: 'asset',
            fileName: 'farm-game/' + file.split(path.sep).join('/'),
            source: readFileSync(path.join(root, file)),
          })
        }
      },
    },
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    // Run on port 3000 so the dev redirect URI http://localhost:3000/about
    // matches the already-registered Azure AD redirect URI from the old project.
    port: 3000,
  },
  build:{
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
})

