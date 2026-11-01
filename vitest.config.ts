import { defineConfig } from 'vitest/config';

// Unit tests only (pure logic). E2E lives in e2e/ and runs via Playwright.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
