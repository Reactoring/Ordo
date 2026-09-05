import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'review/ReviewModule': fileURLToPath(
        new URL('./apps/review/src/ReviewModule.tsx', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['apps/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    restoreMocks: true,
  },
});
