import { expect, test } from '@playwright/test';
import { isPhone, menuOpener, openStore } from './helpers';

test.describe('menu', () => {
  test('opens, takes focus, closes with Escape and gives focus back', async ({ page }) => {
    await openStore(page);
    const opener = menuOpener(page);
    const menu = page.locator('#gly-mmenu');

    await expect(opener).toBeVisible();
    await opener.click();
    await expect(menu).toHaveClass(/\bopen\b/);
    await expect(page.locator('#gly-mclose')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveClass(/\bopen\b/);
    await expect(opener).toBeFocused();
  });

  test('lists the store categories, and a category opens its page', async ({ page }) => {
    await openStore(page);
    await menuOpener(page).click();
    const menu = page.locator('#gly-mmenu');
    await expect(menu).toHaveClass(/\bopen\b/);

    // A category page's address ends in `/c` and its number.
    const href = await menu
      .locator('a')
      .evaluateAll((links) =>
        links.map((a) => a.getAttribute('href') ?? '').find((h) => /\/c\d+\/?$/.test(h))
      );
    expect(href, 'the menu lists at least one category').toBeTruthy();
    const first = menu.locator(`a[href="${href}"]`).first();
    await expect(first).toBeVisible();
    await first.click();

    await expect(page).toHaveURL(/\/c\d+/);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(menu).not.toHaveClass(/\bopen\b/);
  });

  test('the page behind the open menu does not scroll', async ({ page }) => {
    await openStore(page);
    await menuOpener(page).click();
    await expect(page.locator('#gly-mmenu')).toHaveClass(/\bopen\b/);
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(isPhone(page) ? 20 : 200, 400);
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });
});
