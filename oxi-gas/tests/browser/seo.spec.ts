import { test, expect } from '@playwright/test';

test('garrafas mejora el bloque existente sin quitar gases industriales y enlaza tienda y consulta', async ({ page }) => {
  await page.route('**/rest/v1/**', route => route.fulfill({ json: [] }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const gases = page.locator('#gases');
  await gases.getByRole('heading', { name: 'Recambio de garrafas en Ciudadela', exact: true }).scrollIntoViewIfNeeded();
  await expect(gases.getByRole('heading', { name: 'Recambio de garrafas en Ciudadela', exact: true })).toHaveCount(1);
  await expect(gases.getByText('Recambio de garrafas de 10 y 15 kg', { exact: false })).toContainText('45 kg');
  await expect(gases.getByText('Recambio de garrafas de 10 y 15 kg', { exact: false })).toContainText('Clark');
  await expect(gases.getByText('¿Buscás recarga de gas', { exact: false })).toContainText('mediante recambio');
  await expect(gases.locator('p').filter({ hasText: 'Retiro en el local:' })).toContainText('te sale más barato');
  await expect(gases.locator('p').filter({ hasText: 'Entrega a domicilio opcional:' })).toContainText('llevamos el envase lleno a tu puerta y retiramos el vacío');
  await expect(gases.getByText('Reparto por Ciudadela, Caseros, Ramos Mejía y zonas cercanas.', { exact: true })).toBeVisible();
  await expect(gases.getByText('¿Estás en otra zona?', { exact: false })).toContainText('según nuestro recorrido y disponibilidad');
  await expect(gases).not.toContainText('únicamente');
  await expect(gases.getByRole('heading', { name: 'Gases comprimidos', exact: true })).toHaveCount(1);
  await expect(gases.getByRole('link', { name: 'Consultar recambio por WhatsApp' })).toHaveAttribute('href', /wa\.me\/5491134446666\?text=.*recambio/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Ferretería industrial.*gases industriales.*garrafas/);
  await expect(gases).not.toContainText(/liviana|contrato|alquiler|rotación/);
  expect(await gases.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await gases.getByRole('link', { name: 'Ver productos de gases en la tienda' }).click();
  await expect(page).toHaveURL(/productos\?categoria=Gases$/);
});

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
