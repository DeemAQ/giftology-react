import { type Page } from '@playwright/test';

let cachedBase: string | undefined;

/**
 * The store's path on the dev server, such as `/dev-abc123`.
 *
 * The dev server sends `/` to its theme editor with the preview's path in `?path=`
 * (`/dev-abc123/ar`). Set `E2E_STORE_PATH` to skip that look-up.
 */
export async function storeBase(page: Page): Promise<string> {
  if (process.env.E2E_STORE_PATH) return process.env.E2E_STORE_PATH.replace(/\/$/, '');
  if (cachedBase) return cachedBase;
  await page.goto('/');
  await page.waitForURL(/__twilight\/editor/);
  const path = new URL(page.url()).searchParams.get('path') ?? '';
  const base = path.replace(/\/(ar|en)\/?$/, '');
  if (!base.startsWith('/'))
    throw new Error(`No store path in the editor's address: ${page.url()}`);
  cachedBase = base;
  return base;
}

/**
 * Waits until React has taken over the page, so a click reaches its handler. The header's
 * menu button is on every page; React marks the nodes it has hydrated.
 */
export async function waitForApp(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const button = document.querySelector('#gly-burger');
    return !!button && Object.keys(button).some((key) => key.startsWith('__reactProps'));
  });
}

/** Opens a page of the store in a language and waits until the app has taken over. */
export async function openStore(
  page: Page,
  rest = '',
  locale: 'ar' | 'en' = 'ar'
): Promise<string> {
  const base = await storeBase(page);
  await page.goto(`${base}/${locale}${rest}`);
  await waitForApp(page);
  return base;
}

/** Whether the project runs at phone width. */
export function isPhone(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1024) < 768;
}

/**
 * The control that opens the menu: the bottom bar's button on a phone, the header's
 * "الأقسام" button wider than that.
 */
export function menuOpener(page: Page) {
  return isPhone(page)
    ? page.getByTestId('mobile-bottom-bar-categories')
    : page.locator('#gly-burger');
}
