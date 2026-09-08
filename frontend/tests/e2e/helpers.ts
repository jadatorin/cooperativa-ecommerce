import { Page, expect } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@coop.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

export async function loginAsCustomer(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'customer@test.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

export async function expectVisible(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeVisible();
}

export async function expectHidden(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeHidden();
}