/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}', 'supabase/functions/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // lcov lo lee SonarCloud desde CI
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx}', 'supabase/functions/**/*.ts'],
      exclude: ['**/*.test.{js,jsx,ts}'],
      thresholds: {
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
