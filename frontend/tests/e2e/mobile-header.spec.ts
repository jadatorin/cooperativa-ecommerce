import { test, expect } from '@playwright/test';

test.describe('Mobile Header', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('mobile menu button is visible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const menuButton = page.locator('button.md\\:hidden').first();
    await expect(menuButton).toBeVisible({ timeout: 10000 });
  });

  test('mobile menu shows Inicio link', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const menuButton = page.locator('button.md\\:hidden').first();
    await menuButton.click();
    // Wait for mobile menu - look for Inicio link with py-2 class (mobile nav)
    await expect(page.locator('a.py-2:has-text("Inicio")')).toBeVisible({ timeout: 5000 });
  });
});