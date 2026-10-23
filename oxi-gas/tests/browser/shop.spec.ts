import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://fixture.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').pop();
    const products = [
      { id: '1', code: 'A', name: 'Taladro Bosch', brand: 'Bosch', category: 'Herramientas eléctricas', visible: true },
      { id: '2', code: 'B', name: 'Martillo Bremen', brand: 'Bremen', category: 'Herramientas manuales', visible: true },
    ];
    const offset = Number(url.searchParams.get('offset') || 0);
    await route.fulfill({ json: table === 'products' ? products.slice(offset) : [] });
  });
  // No cargar servicios externos durante pruebas de interfaz.
  await page.route(/https:\/\/(maps\.google\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//, route => route.abort());
});

test('escritorio: Tienda es un enlace directo sin lista desplegable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('./');
  const shop = page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Tienda', exact: true });
  await shop.hover();
  await expect(page.getByPlaceholder('Buscar productos...')).toHaveCount(0);
  await shop.click();
  await expect(page).toHaveURL(/\/OxigasWeb\/productos$/);
  await expect(page.getByRole('heading', { name: 'Tienda', exact: true })).toBeVisible();
  await expect(page.getByText('Taladro Bosch', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/tienda-escritorio.png', fullPage: true });
});

test('celular: acceso visible y búsqueda por marca', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const menu = await page.getByRole('button', { name: 'Abrir menú' }).boundingBox();
  expect(menu!.x + menu!.width).toBeLessThanOrEqual(390);
  await page.locator('header').getByRole('link', { name: 'Tienda', exact: true }).filter({ visible: true }).click();
  const search = page.getByRole('searchbox', { name: 'Buscar en la tienda por producto, marca o código' }).filter({ visible: true });
  await search.fill('Bosch');
  await expect(page.getByText('Taladro Bosch', { exact: true })).toBeVisible();
  await expect(page.getByText('Martillo Bremen', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/tienda-celular.png', fullPage: true });
});

test('quitar q de la URL limpia la búsqueda', async ({ page }) => {
  await page.goto('./productos?q=Bosch');
  await expect(page.getByRole('searchbox').filter({ visible: true })).toHaveValue('Bosch');
  await page.locator('header').getByRole('link', { name: 'Tienda', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('searchbox').filter({ visible: true })).toHaveValue('');
  await expect(page.getByText('Martillo Bremen', { exact: true })).toBeVisible();
});

test('fallo de catálogo muestra error y permite reintentar', async ({ page }) => {
  let failing = true;
  await page.route('**/rest/v1/products?**', route => failing ? route.fulfill({ status: 503, headers: { 'retry-after': '0', 'access-control-expose-headers': 'retry-after' }, json: { message: 'No disponible' } }) : route.fallback());
  await page.goto('./productos');
  await expect(page.getByRole('heading', { name: 'No pudimos cargar la tienda' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sin resultados' })).toHaveCount(0);
  failing = false;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByText('Taladro Bosch', { exact: true })).toBeVisible();
});

test('carrito dañado se recupera y el producto eliminado se puede quitar', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('oxi-gas:quote-cart-v2', JSON.stringify([
    { code: 'A', fields: { cantidad: 2 } }, { code: 'DESCONTINUADO', fields: { cantidad: '1' } },
  ])));
  await page.goto('./productos');
  await page.getByRole('button', { name: 'Mi cotización' }).filter({ visible: true }).click();
  await expect(page.getByText('El producto DESCONTINUADO ya no está disponible.')).toBeVisible();
  await page.getByRole('button', { name: 'Quitar de la cotización' }).click();
  await expect(page.getByText('El producto DESCONTINUADO ya no está disponible.')).toHaveCount(0);
});

test('formulario asocia errores y enfoca el primer campo inválido', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Enviar consulta por WhatsApp' }).click();
  const name = page.getByRole('textbox', { name: 'Nombre completo' });
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#nombre-error')).toBeVisible();
});

test('detalle accesible abre con teclado, cierra con Escape y recupera el foco', async ({ page }) => {
  await page.goto('./productos');
  const product = page.getByRole('button', { name: 'Ver Taladro Bosch', exact: true });
  await product.focus(); await product.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Taladro Bosch' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(product).toBeFocused();
});

test('panel sin sesión redirige antes de consultar productos', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => { if (request.url().includes('/rest/v1/products')) requests.push(request.url()); });
  await page.goto('./admin/dashboard');
  await expect(page).toHaveURL(/admin\/login$/);
  expect(requests).toHaveLength(0);
});

test('fallback de ruta conserva búsqueda al recargar', async ({ page }) => {
  await page.goto('./?__route=' + encodeURIComponent('/productos?q=Bosch'));
  await expect(page).toHaveURL(/productos\?q=Bosch$/);
  await expect(page.getByText('Taladro Bosch', { exact: true })).toBeVisible();
  await expect(page.getByText('Martillo Bremen', { exact: true })).toHaveCount(0);
});
