/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}', 'supabase/functions/**/*.test.ts', 'scripts/recordatorio/**/*.test.mjs'],
    coverage: {
      provider: 'v8',
      // lcov lo lee SonarCloud desde CI
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx}', 'supabase/functions/**/*.ts', 'scripts/recordatorio/{mensaje,discord}.mjs'],
      exclude: ['**/*.test.{js,jsx,ts,mjs}'],
      thresholds: {
        'scripts/recordatorio/*.mjs': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        'src/lib/examScoring.js': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        'src/config/rediseno.js': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  },
})
