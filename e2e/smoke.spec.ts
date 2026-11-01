import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Loads the built Chrome extension and checks the side panel UI boots.
// Prereq: `pnpm build` then `pnpm exec playwright install chromium`.

const extensionPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../.output/chrome-mv3',
);

let context: BrowserContext;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
});

test.afterAll(async () => {
  await context?.close();
});

async function extensionId(ctx: BrowserContext): Promise<string> {
  let [sw] = ctx.serviceWorkers();
  sw ??= await ctx.waitForEvent('serviceworker');
  return sw.url().split('/')[2]!;
}

test('side panel boots with toolbar and tabs', async () => {
  const id = await extensionId(context);
  const page = await context.newPage();
  await page.goto(`chrome-extension://${id}/sidepanel.html`);

  // Tabs render
  for (const tab of ['Styles', 'Assets', 'Inspect', 'Design']) {
    await expect(page.getByRole('tab', { name: tab })).toBeVisible();
  }
  // Toolbar has the inspect + settings controls
  await expect(page.getByTitle(/Inspect/)).toBeVisible();
  await expect(page.getByTitle('Settings')).toBeVisible();
});
