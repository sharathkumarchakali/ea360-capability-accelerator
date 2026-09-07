import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    // Prototype store is a module singleton; isolate files so tenant switch/reset tests do not race.
    fileParallelism: false,
  },
})
