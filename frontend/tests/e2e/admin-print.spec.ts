import { test, expect } from '@playwright/test';

// Helper: login via API and set token in localStorage
async function loginViaAPI(page: any) {
  const response = await page.request.post('https://coop-backend-9d7x.onrender.com/api/auth/login', {
    data: {
      email: 'test@coop.com',
      password: 'Password123!',
    },
  });
  const data = await response.json();
  
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token: string) => {
    localStorage.setItem('cooperativa_token', token);
  }, data.token);
  
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('nav a:has-text("Admin")', { timeout: 10000 });
}

test.describe('Print Flow', () => {
  test('print button is visible on orders', async ({ page }) => {
    await loginViaAPI(page);
    
    // Click Admin link
    await page.click('nav a:has-text("Admin")');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Panel de Administración')).toBeVisible({ timeout: 15000 });
    
    // Wait for orders table to load
    await page.waitForSelector('table tbody tr', { timeout: 15000 });
    
    // Check print button exists
    const printButton = page.locator('button:has-text("Imprimir")').first();
    await expect(printButton).toBeVisible({ timeout: 10000 });
  });
});