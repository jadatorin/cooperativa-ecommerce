import { test, expect } from '@playwright/test';

test.describe('Role-Based Navigation', () => {
  test('admin user sees Admin link after login', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('#email', 'test@coop.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page.locator('nav a:has-text("Admin")')).toBeVisible({ timeout: 10000 });
  });

  test('unauthenticated user does not see Admin link', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('nav a:has-text("Admin")')).toBeHidden();
  });
});