import { defineConfig } from '@playwright/test';

// E2E smoke for the built Chrome extension. Run: pnpm build && pnpm exec playwright install chromium && pnpm test:e2e
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: 'list',
});
