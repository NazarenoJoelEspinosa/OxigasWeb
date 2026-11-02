import { test, expect } from '@playwright/test';

test('Ofertas admite precios normales y solo muestra descuentos reales', async ({ page }) => {
  const rows = [
    { id: 'plain', name: 'Precio normal', price: 1000 },
    { id: 'equal', name: 'Precios iguales', price: 1000, original_price: 1000 },
    { id: 'lower', name: 'Anterior menor', price: 1000, original_price: 900 },
    { id: 'sale', name: 'Descuento real', price: 800, original_price: 1000 },
    { id: 'tiny', name: 'Descuento pequeño', price: 999.99, original_price: 1000 },
  ];
  const response = (url: string, items = rows) => items.map((row, i) => ({ ...row, visible: true, sort_order: i }))
    .slice(Number(new URL(url).searchParams.get('offset') || 0));
  await page.route('**/rest/v1/**', route => route.fulfill({ json: route.request().url().includes('/offers?') ? response(route.request().url()) : [] }));
  await page.goto('./ofertas');
  await expect(page.getByRole('heading', { name: 'Ofertas', exact: true })).toBeVisible();
  for (const name of ['Precio Normal', 'Precios Iguales', 'Anterior Menor']) {
    const card = page.getByRole('heading', { name, exact: true }).locator('../..');
    await expect(card.locator('.line-through')).toHaveCount(0);
    await expect(card.getByText(/^-\d+%$/)).toHaveCount(0);
    await expect(card.getByRole('link')).toHaveAttribute('href', /consultar%20el%20producto/);
  }
  const sale = page.getByRole('heading', { name: 'Descuento Real', exact: true }).locator('../..');
  await expect(sale.getByText('-20%', { exact: true })).toBeVisible();
  await expect(sale.locator('.line-through')).toHaveCount(1);
  await expect(page.getByText('-0%', { exact: true })).toHaveCount(0);
  await page.route('**/rest/v1/offers?**', route => route.fulfill({ json: response(route.request().url(), [rows[0]]) }));
  await page.goto('./');
  const section = page.locator('#ofertas');
  await expect(section.getByRole('heading', { name: 'Precio Normal', exact: true })).toBeVisible();
  await expect(section.locator('.line-through')).toHaveCount(0);
  await expect(section.getByRole('link', { name: 'Consultar por WhatsApp', exact: true })).toHaveAttribute('href', /precio%20del%20producto/);
});
