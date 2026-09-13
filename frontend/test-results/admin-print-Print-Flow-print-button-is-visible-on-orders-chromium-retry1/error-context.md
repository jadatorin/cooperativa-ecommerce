# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-print.spec.ts >> Print Flow >> print button is visible on orders
- Location: tests\e2e\admin-print.spec.ts:23:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Panel de Administración')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=Panel de Administración') with timeout 15000ms
  - waiting for locator('text=Panel de Administración')

```

```yaml
- banner:
  - link "Cooperativa":
    - /url: /
  - navigation:
    - link "Inicio":
      - /url: /
    - link "Productos":
      - /url: /products
    - link "Admin":
      - /url: /admin
  - searchbox "Buscar productos..."
  - link "1 Carrito":
    - /url: /cart
    - button "1 Carrito"
  - button
- main:
  - heading "Bienvenido a Cooperativa" [level=1]
  - paragraph: Productos de calidad a precios justos para ti y tu familia
  - heading "Categorías" [level=2]
  - link "🍚 Básicos":
    - /url: /products?category=basicos
  - link "🥛 Lácteos":
    - /url: /products?category=lacteos
  - link "🥩 Carnes":
    - /url: /products?category=carnes
  - link "🍌 Frutas y Verduras":
    - /url: /products?category=frutas-verduras
  - link "🥤 Bebidas":
    - /url: /products?category=bebidas
  - link "🧴 Higiene":
    - /url: /products?category=higiene
  - heading "Productos Destacados" [level=2]
  - link "Aceite Optimus 1L Eliminar de favoritos":
    - /url: /products/5b96eb1f-5642-43bc-ad33-c5a74179c1ae
    - text: Aceite Optimus 1L
    - button "Eliminar de favoritos"
  - text: Aceite Optimus 1L
  - paragraph: Aceite vegetal refinado para freír y cocinar
  - text: USD 4,25 Disponible
  - button "Agregar al carrito"
  - link "Agua Minalba 1.5L Eliminar de favoritos":
    - /url: /products/b4c3a07c-bff4-46e8-b581-5010bc770b51
    - text: Agua Minalba 1.5L
    - button "Eliminar de favoritos"
  - text: Agua Minalba 1.5L
  - paragraph: Agua purificada sin gas
  - text: USD 0,90 Disponible
  - button "Agregar al carrito"
  - link "Arroz Polar 1kg Eliminar de favoritos":
    - /url: /products/1be6908e-5282-4350-adcc-446ef9758072
    - text: Arroz Polar 1kg
    - button "Eliminar de favoritos"
  - text: Arroz Polar 1kg
  - paragraph: Arroz de grano largo, ideal para el día a día
  - text: USD 3,50 Disponible
  - button "Agregar al carrito"
  - link "Azúcar Montalbán 1kg Eliminar de favoritos":
    - /url: /products/a82c6b1a-d55c-4aaf-8937-d22d10d61844
    - text: Azúcar Montalbán 1kg
    - button "Eliminar de favoritos"
  - text: Azúcar Montalbán 1kg
  - paragraph: Azúcar blanca refinada
  - text: USD 2,80 Disponible
  - button "Agregar al carrito"
  - link "Carne molida 1kg Agregar a favoritos Por peso":
    - /url: /products/cc7d70f9-6f22-4af6-baf4-c4ed080135a0
    - text: Carne molida 1kg
    - button "Agregar a favoritos"
    - text: Por peso
  - text: Carne molida 1kg
  - paragraph: Carne de res molida fresca
  - text: USD 8,90 Disponible
  - button "Agregar al carrito"
  - link "Cebolla Agregar a favoritos Por peso":
    - /url: /products/2593e3e1-c2f7-44b2-ab9a-31f60542b13d
    - text: Cebolla
    - button "Agregar a favoritos"
    - text: Por peso
  - text: Cebolla
  - paragraph: Cebolla blanca
  - text: USD 0,90 Disponible
  - button "Agregar al carrito"
- contentinfo:
  - heading "Cooperativa" [level=3]
  - paragraph: Tu tienda de confianza para productos de calidad a precios justos.
  - heading "Enlaces" [level=4]
  - navigation:
    - link "Productos":
      - /url: /products
    - link "Carrito":
      - /url: /cart
  - heading "Contacto" [level=4]
  - paragraph: "Email: info@cooperativa.com"
  - paragraph: "Tel: +58 412 1234567"
  - heading "Horario" [level=4]
  - paragraph: "Lun - Vie: 8:00 AM - 6:00 PM"
  - paragraph: "Sáb: 9:00 AM - 4:00 PM"
  - text: © 2026 Cooperativa. Todos los derechos reservados.
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // Helper: login via API and set token in localStorage
  4  | async function loginViaAPI(page: any) {
  5  |   const response = await page.request.post('https://coop-backend-9d7x.onrender.com/api/auth/login', {
  6  |     data: {
  7  |       email: 'test@coop.com',
  8  |       password: 'Password123!',
  9  |     },
  10 |   });
  11 |   const data = await response.json();
  12 |   
  13 |   await page.goto('/', { waitUntil: 'domcontentloaded' });
  14 |   await page.evaluate((token: string) => {
  15 |     localStorage.setItem('cooperativa_token', token);
  16 |   }, data.token);
  17 |   
  18 |   await page.reload({ waitUntil: 'networkidle' });
  19 |   await page.waitForSelector('nav a:has-text("Admin")', { timeout: 10000 });
  20 | }
  21 | 
  22 | test.describe('Print Flow', () => {
  23 |   test('print button is visible on orders', async ({ page }) => {
  24 |     await loginViaAPI(page);
  25 |     
  26 |     // Click Admin link
  27 |     await page.click('nav a:has-text("Admin")');
  28 |     await page.waitForLoadState('networkidle');
> 29 |     await expect(page.locator('text=Panel de Administración')).toBeVisible({ timeout: 15000 });
     |                                                                ^ Error: expect(locator).toBeVisible() failed
  30 |     
  31 |     // Wait for orders table to load
  32 |     await page.waitForSelector('table tbody tr', { timeout: 15000 });
  33 |     
  34 |     // Check print button exists
  35 |     const printButton = page.locator('button:has-text("Imprimir")').first();
  36 |     await expect(printButton).toBeVisible({ timeout: 10000 });
  37 |   });
  38 | });
```