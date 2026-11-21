import { expect, test } from '@playwright/test';
import { isPhone, openStore, waitForApp } from './helpers';

/**
 * Opens the first category linked from the home page's circles. Links point at the store's
 * own address; a click lets the app turn them into the preview's address.
 */
async function openFirstCategory(page: import('@playwright/test').Page): Promise<void> {
  await openStore(page);
  const circles = page.locator('#gly-cats a');
  const index = await circles.evaluateAll((links) =>
    links.findIndex((a) => /\/c\d+\/?$/.test((a as HTMLAnchorElement).pathname))
  );
  expect(index, 'the home page links to at least one category').toBeGreaterThanOrEqual(0);
  await circles.nth(index).scrollIntoViewIfNeeded();
  await circles.nth(index).click();
  await expect(page).toHaveURL(/\/c\d+/);
}

test.describe('shopping', () => {
  test('category page: title and products', async ({ page }) => {
    await openFirstCategory(page);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('.s-product-card').first()).toBeVisible();
    if (!isPhone(page))
      await expect(page.locator('salla-filters-widget, salla-filters').first()).toBeVisible();
  });

  test('product page: title, price and either "add to cart" or "sold out"', async ({ page }) => {
    await openFirstCategory(page);
    const product = page.locator('main a[href*="/p"]').first();
    await expect(product).toBeVisible();
    await product.click();
    await expect(page).toHaveURL(/\/p\d+/);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('salla-add-product-button').first()).toBeAttached();
    // On a phone the price-and-buttons block must come up (it once never did, plan item 59).
    await expect(page.locator('salla-add-product-button').first()).toBeVisible();
  });

  test('cart page opens', async ({ page }) => {
    await openStore(page, '/cart');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('the floating WhatsApp button can be dismissed for the visit', async ({ page }) => {
    await openStore(page);
    const float = page.locator('a.gly-wa');
    test.skip((await float.count()) === 0, 'the store has no WhatsApp number');
    await expect(float).toBeVisible();
    await page.locator('.gly-wa-x').click();
    await expect(float).toHaveCount(0);
    await page.reload();
    await waitForApp(page);
    await expect(page.locator('a.gly-wa')).toHaveCount(0);
  });
});
