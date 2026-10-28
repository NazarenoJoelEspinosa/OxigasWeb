import { test, expect } from '@playwright/test';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0YQAAAAASUVORK5CYII=', 'base64');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sb-fixture-auth-token', JSON.stringify({
    access_token: 'fixture-admin-token', refresh_token: 'fixture-refresh', token_type: 'bearer',
    expires_at: 4102444800, expires_in: 3600,
    user: { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'admin@example.test' },
  })));
  await page.route('https://fixture.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/auth/v1/user') return route.fulfill({ json: { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated' } });
    if (url.pathname.endsWith('/admin_users')) return route.fulfill({ json: { role: 'admin' } });
    if (url.pathname.endsWith('/products')) {
      if (route.request().method() === 'PATCH') return route.fulfill({ json: { id: 'p0' } });
      return route.fulfill({ json: Array.from({ length: 14 }, (_, i) => ({ id: `p${i}`, code: `CODE${i}`, name: `Producto ${String(i).padStart(2, '0')}`, brand: 'Bosch', category: i % 2 ? 'Soldadura' : 'Herramientas', visible: i % 2 === 0 })).slice(Number(url.searchParams.get('offset') || 0)) });
    }
    if (url.pathname.includes('/storage/')) return route.fulfill({ json: { Key: 'product-images/offers/fixture.png' } });
    return route.fulfill({ json: [] });
  });
});

test('administración pagina, filtra, cambia visibilidad y se adapta al celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./admin/dashboard');
  await expect(page.getByText('Página 1 de 2')).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.getByText('Producto 12', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.getByLabel('Filtrar por estado').selectOption('hidden');
  await expect(page.getByText('Página 1 de 1')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(7);
  await page.getByLabel('Filtrar por categoría').selectOption('Herramientas');
  await expect(page.getByText('No se encontraron productos.')).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await page.getByRole('searchbox').fill('producto 00');
  const item = page.getByRole('article');
  await item.getByRole('button', { name: 'Ocultar', exact: true }).click();
  await expect(item.getByRole('button', { name: 'Mostrar', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/admin-celular.png', fullPage: true });
});

test('oferta sube foto y guarda la URL generada sin pedir una dirección', async ({ page }) => {
  let saved: Record<string, unknown> | undefined;
  let uploaded = false;
  await page.route('**/storage/v1/object/product-images/offers/**', async route => {
    uploaded = true;
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ json: { Key: 'fixture' } });
  });
  await page.route('**/rest/v1/offers**', async route => {
    if (route.request().method() === 'POST') {
      saved = route.request().postDataJSON();
      return route.fulfill({ status: 201, json: null });
    }
    await route.fulfill({ json: [] });
  });
  await page.goto('./admin/dashboard');
  await page.getByRole('button', { name: 'Ofertas', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva oferta' }).click();
  await page.getByRole('textbox', { name: 'Nombre de la oferta' }).fill('Oferta con foto');
  await page.getByPlaceholder('Ej: Bosch',{exact:true}).fill('LUSQTOFF');
  await page.getByLabel('Foto de la oferta').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByRole('img', { name: 'Vista previa de la oferta' })).toHaveAttribute('src', /^blob:/);
  await expect(page.getByLabel('URL de imagen (opcional)')).toBeDisabled();
  await page.screenshot({ path: 'test-results/oferta-con-foto.png', fullPage: true });
  await page.getByRole('button', { name: 'Guardar oferta' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(uploaded).toBe(true);
  expect(saved?.image).toMatch(/^https:\/\/fixture.supabase.co\/storage\/v1\/object\/public\/product-images\/offers\/.+\.png$/);
  expect(saved?.brand).toBe('Lusqtoff');
});

test('rechaza archivos inválidos y limpia la foto subida si no se guarda la oferta', async ({ page }) => {
  let cleaned = false;
  await page.route('**/storage/v1/object/product-images', async route => {
    cleaned = route.request().method() === 'DELETE';
    await route.fulfill({ json: [] });
  });
  await page.route('**/rest/v1/offers**', async route => {
    await route.fulfill(route.request().method() === 'POST' ? { status: 403, json: { message: 'Sin permiso' } } : { json: [] });
  });
  await page.goto('./admin/dashboard');
  await page.getByRole('button', { name: 'Ofertas', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva oferta' }).click();
  await page.getByRole('textbox', { name: 'Nombre de la oferta' }).fill('Oferta');
  await page.getByLabel('Foto de la oferta').setInputFiles({ name: 'no.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.getByRole('alert')).toContainText('JPG, PNG o WebP');
  await page.getByLabel('Foto de la oferta').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Guardar oferta' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar oferta' })).toBeEnabled();
  expect(cleaned).toBe(true);
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('si falla la carga de la foto, no guarda la oferta y permite recuperar la imagen anterior', async ({ page }) => {
  let inserts = 0;
  await page.route('**/rest/v1/offers**', async route => {
    if (route.request().method() === 'POST') inserts++;
    await route.fulfill({ json: [] });
  });
  await page.route('**/storage/v1/object/product-images/offers/**', route => route.fulfill({ status: 403, json: { message: 'Upload denied' } }));
  await page.goto('./admin/dashboard');
  await page.getByRole('button', { name: 'Ofertas', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva oferta' }).click();
  await page.getByRole('textbox', { name: 'Nombre de la oferta' }).fill('Oferta');
  await page.getByLabel('URL de imagen (opcional)').fill('https://example.test/anterior.png');
  await page.getByLabel('Foto de la oferta').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Guardar oferta' }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudo subir la imagen');
  expect(inserts).toBe(0);
  await page.getByRole('button', { name: 'Descartar foto seleccionada' }).click();
  await expect(page.getByLabel('URL de imagen (opcional)')).toHaveValue('https://example.test/anterior.png');
  await expect(page.getByRole('img', { name: 'Vista previa de la oferta' })).toHaveAttribute('src', 'https://example.test/anterior.png');
});
