import { test, expect, type Page } from '@playwright/test';

const product = { id: 'p1', code: 'A', name: 'TUBO PVC 42 mm', description: 'Descripción completa', brand: 'Bosch', category: 'Insumos', visible: true, images: [], custom_fields: [{ key: 'medida', label: 'Medida', placeholder: 'Ej: 42 mm' }] };
async function setup(page: Page, admin = false) {
  if (admin) await page.addInitScript(() => localStorage.setItem('sb-fixture-auth-token', JSON.stringify({ access_token: 'fixture', refresh_token: 'fixture', expires_at: 4102444800, expires_in: 3600, token_type: 'bearer', user: { id: 'admin', aud: 'authenticated', role: 'authenticated' } })));
  await page.route('https://fixture.supabase.co/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/auth/v1/user')) return route.fulfill({ json: { id: 'admin', aud: 'authenticated', role: 'authenticated' } });
    if (url.pathname.endsWith('/admin_users')) return route.fulfill({ json: { user_id: 'admin', role: 'admin' } });
    if (url.pathname.endsWith('/products')) return route.fulfill({ json: url.searchParams.get('code')?.startsWith('eq.') ? product : [product].slice(Number(url.searchParams.get('offset') || 0)) });
    return route.fulfill({ json: [] });
  });
}

test('cotización permite borrar cantidad, corregirla y conservar campos al recargar', async ({ page }) => {
  await setup(page);
  await page.goto('./productos');
  await page.getByLabel('Medida', { exact: true }).fill('42 mm');
  await page.getByRole('button', { name: '+ Agregar a cotización', exact: true }).click();
  await page.getByRole('button', { name: 'Ver mi cotización · 1 producto' }).click();
  const input = page.getByRole('spinbutton', { name: 'Cantidad de Tubo PVC 42 mm en cotización', exact: true });
  await input.fill(''); await expect(input).toHaveValue(''); await input.fill('3'); await input.blur();
  await expect(page.getByRole('link', { name: 'Enviar cotización por WhatsApp' })).toHaveAttribute('href', /Cantidad%3A%203/);
  await expect(page.getByRole('link', { name: 'Enviar cotización por WhatsApp' })).toHaveAttribute('href', /Medida%3A%2042%20mm/);
  await page.reload();
  await page.getByRole('button', { name: 'Ver mi cotización · 1 producto' }).click();
  await expect(input).toHaveValue('3');
});

test('ficha individual enlazada conserva nombre técnico y permite cotizar', async ({ page }) => {
  await setup(page);
  await page.goto('./productos');
  await page.getByRole('link', { name: 'Ver ficha del producto', exact: true }).click();
  await expect(page).toHaveURL(/\/producto\/A$/);
  await expect(page.getByRole('heading', { name: 'Tubo PVC 42 mm', exact: true })).toBeVisible();
  await expect(page).toHaveTitle('Tubo PVC 42 mm | OXI-GAS');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Tubo PVC 42 mm | OXI-GAS');
  await expect(page.locator('#product-schema')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://oxigas.com.ar/producto/A');
  await page.getByLabel('Medida', { exact: true }).fill('42 mm');
  await page.getByLabel('Cantidad del producto').fill('2');
  await page.getByRole('button', { name: 'Agregar a cotización', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('spinbutton')).toHaveValue('2');
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: '← Volver a la tienda', exact: true }).click();
  await expect(page.locator('#product-schema')).toHaveCount(0);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
});

test('fotos grandes se reducen y no se agrandan fotos pequeñas', async ({ page }) => {
  await setup(page); await page.goto('./');
  const result = await page.evaluate(async () => {
    const { optimizeImage } = await import('/OxigasWeb/src/lib/image-upload.ts');
    const canvas = document.createElement('canvas'); canvas.width = 3200; canvas.height = 2400;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#1562a0'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!), 'image/png'));
    const original = new File([blob], 'foto.png', { type: 'image/png' });
    const optimized = await optimizeImage(original), bitmap = await createImageBitmap(optimized);
    const output = { width: bitmap.width, height: bitmap.height, size: optimized.size, original: original.size, type: optimized.type }; bitmap.close(); return output;
  });
  expect(result.width).toBe(1600); expect(result.height).toBe(1200); expect(result.type).toBe('image/webp'); expect(result.size).toBeLessThan(result.original);
});

test('Ofertas permite elegir un producto y completar sus datos', async ({ page }) => {
  await setup(page, true);
  await page.goto('./admin/dashboard');
  await page.getByRole('button', { name: 'Ofertas', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva oferta', exact: true }).click();
  await page.getByLabel('Elegir producto del catálogo (opcional)').fill('PVC');
  await page.getByRole('button', { name: 'A · TUBO PVC 42 mm', exact: true }).click();
  await expect(page.getByLabel('Nombre de la oferta')).toHaveValue('TUBO PVC 42 mm');
  await expect(page.getByRole('dialog').getByPlaceholder('Ej: BOSCH001')).toHaveValue('A');
  await expect(page.getByRole('dialog').getByText('seguirá en su categoría de la tienda', { exact: false })).toBeVisible();
});

test('respaldo descarga datos e imágenes y aborta si no puede descargarlas', async ({ page }) => {
  await setup(page, true);
  let broken = false;
  await page.route('**/storage/v1/object/list/product-images', route => {
    const body = route.request().postDataJSON();
    return route.fulfill({ json: body.offset ? [] : [{ id: 'image', name: 'foto.webp' }] });
  });
  await page.route('**/storage/v1/object/product-images/foto.webp', route => broken ? route.fulfill({ status: 403, json: { message: 'Fallo' } }) : route.fulfill({ contentType: 'image/webp', body: Buffer.from('imagen-de-prueba') }));
  await page.goto('./admin/dashboard');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar respaldo ZIP', exact: true }).click();
  const download = await downloadPromise;
  await download.saveAs('test-results/respaldo-verificacion.zip');
  await expect(page.getByRole('status').filter({ hasText: 'Descarga preparada: 1 productos y 1 imágenes.' })).toBeVisible();
  broken = true;
  await page.getByRole('button', { name: 'Descargar respaldo ZIP', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'No se generó una copia incompleta' })).toBeVisible();
});
