import { expect, test } from '@playwright/test';
import { openStore, storeBase } from './helpers';

test.describe('home page', () => {
  test('Arabic: right to left, the hero, latest products, the gift finder, the footer', async ({ page }) => {
    await openStore(page);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('.gly-hero h1')).toBeVisible();
    await expect(page.locator('#gly-latest a[href*="/p"]').first()).toBeVisible();
    await expect(page.locator('#gly-finder')).toBeAttached();
    await expect(page.locator('footer')).toBeAttached();
  });

  test('English: left to right, with its own headline', async ({ page }) => {
    await openStore(page, '', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.gly-hero h1')).toBeVisible();
    // The Arabic headline must not leak onto the English page.
    await expect(page.locator('.gly-hero h1')).not.toHaveText(/[؀-ۿ]/);
  });

  test('latest products arrive in the server HTML, before any JavaScript', async ({ page, request }) => {
    const base = await storeBase(page);
    const html = await (await request.get(`${base}/ar`)).text();
    const latest = html.slice(html.indexOf('id="gly-latest"'));
    expect(html).toContain('id="gly-latest"');
    expect(latest).toMatch(/href="[^"]*\/p\d+"/);
  });

  test('every section of the page is visible before JavaScript runs', async ({ page, request }) => {
    const base = await storeBase(page);
    const html = await (await request.get(`${base}/ar`)).text();
    // `.gly-reveal` without `.in` is drawn at opacity 0. A block sent that way would leave the
    // page blank if the app never took over (review item 8).
    const reveals = [...html.matchAll(/class="([^"]*\bgly-reveal\b[^"]*)"/g)].map((m) => m[1]);
    expect(reveals.length).toBeGreaterThan(0);
    expect(reveals.filter((cls) => !/(^|\s)in(\s|$)/.test(cls))).toEqual([]);
  });
});
