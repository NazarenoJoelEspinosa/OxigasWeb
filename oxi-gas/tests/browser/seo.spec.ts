import { test, expect } from '@playwright/test';

test('las rutas públicas conservan su canonical al navegar y volver', async ({ page }) => {
  await page.route('**/rest/v1/**', route => route.fulfill({ json: [] }));
  await page.goto('./');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://oxigas.com.ar/');
  await page.getByRole('link', { name: 'Tienda', exact: true }).first().click();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://oxigas.com.ar/productos');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
  await page.goBack();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://oxigas.com.ar/');
  await page.goto('./ofertas');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://oxigas.com.ar/ofertas');
  await page.goto('./admin/login');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});
