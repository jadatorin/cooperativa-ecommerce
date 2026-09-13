import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    // Use specific selector for the card title
    await expect(page.locator('div:has-text("Iniciar sesión")').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('login with valid credentials redirects to home', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('#email', 'test@coop.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page).toHaveURL('/');
  });

  test('admin sees Admin link in navbar', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('#email', 'test@coop.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page.locator('nav a:has-text("Admin")')).toBeVisible({ timeout: 10000 });
  });
});