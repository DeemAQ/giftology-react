import { expect, test } from '@playwright/test';
import { openStore } from './helpers';

test.describe('gift finder', () => {
  test('answering every question ends on an answer, and "start over" goes back', async ({ page }) => {
    await openStore(page);
    const finder = page.locator('#gly-finder');
    await finder.scrollIntoViewIfNeeded();

    const firstQuestion = (await finder.locator('.gly-qq').textContent())?.trim();
    expect(firstQuestion).toBeTruthy();

    // At most three questions: what, which kind, budget. Each is skipped when it has nothing to ask.
    const result = finder.locator('.gly-qresult');
    for (let step = 0; step < 3 && !(await result.isVisible()); step++) {
      const option = finder.locator('.gly-qopt:not(.gly-qopt--custom)').first();
      await expect(option).toBeVisible();
      await option.click();
      await expect(result.or(finder.locator('.gly-qq'))).toBeVisible();
    }
    await expect(result).toBeVisible();

    // The answer is suggestions, or a way into the category when it holds nothing in stock.
    await expect(finder.locator('.gly-qpick').or(finder.locator('.gly-qlinks a')).first()).toBeVisible();
    await expect(finder.locator('.gly-qloading')).toHaveCount(0);

    await finder.locator('.gly-qnav .gly-qlink').last().click();
    await expect(finder.locator('.gly-qq')).toHaveText(firstQuestion!);
  });

  test('a suggestion opens its product', async ({ page }) => {
    await openStore(page);
    const finder = page.locator('#gly-finder');
    await finder.scrollIntoViewIfNeeded();
    const result = finder.locator('.gly-qresult');
    for (let step = 0; step < 3 && !(await result.isVisible()); step++) {
      await finder.locator('.gly-qopt:not(.gly-qopt--custom)').first().click();
      await expect(result.or(finder.locator('.gly-qq'))).toBeVisible();
    }
    const pick = finder.locator('.gly-qpick').first();
    test.skip(!(await pick.isVisible()), 'the first category has nothing in stock on this store');
    await pick.click();
    await expect(page).toHaveURL(/\/p\d+/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('the custom-gift answer ends on its WhatsApp button', async ({ page }) => {
    await openStore(page);
    const finder = page.locator('#gly-finder');
    await finder.scrollIntoViewIfNeeded();
    const custom = finder.locator('.gly-qopt--custom');
    test.skip((await custom.count()) === 0, 'the custom-gift answer is switched off in the block');
    await custom.click();
    await expect(finder.locator('.gly-qresult a.gly-btn-wa')).toHaveAttribute('href', /wa\.me|whatsapp/);
  });
});
