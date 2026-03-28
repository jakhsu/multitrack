import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  resolve: {
    alias: {
      '@multitrack/core/analytics': fileURLToPath(new URL('../../packages/core/src/analytics.ts', import.meta.url)),
      '@multitrack/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      '@multitrack/react': fileURLToPath(new URL('../../packages/react/src/index.ts', import.meta.url)),
    },
  },
})
