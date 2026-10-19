import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

import { accessApiPlugin } from './vite.access-api.ts'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// GitHub Pages project sites need a repo-name base path.
// Override with VITE_BASE_PATH=/ for custom domains or user sites.
const base = process.env.VITE_BASE_PATH ?? '/trustbox/'

export default defineConfig(({ mode }) => {
  // Load PEOPLEFORCE_* (and other non-VITE) secrets for the local access API.
  const env = loadEnv(mode, rootDir, '')
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  return {
    base,
    plugins: [react(), tailwindcss(), accessApiPlugin(rootDir)],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
    },
  }
})
