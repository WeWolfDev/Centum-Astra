/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/lib/examScoring.js',
        'src/config/rediseno.js',
      ],
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
