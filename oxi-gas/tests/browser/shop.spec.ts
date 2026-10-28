import { test, expect } from '@playwright/test';

test('marcas históricas con distinta capitalización se ven iguales y comparten filtro', async ({page}) => {
  await page.route('**/rest/v1/products?**',route => {
    const offset=Number(new URL(route.request().url()).searchParams.get('offset') || 0);
    return route.fulfill({json:['LUSQTOFF','lusqtoff','LuSqToFf'].map((brand,i) => ({id:String(i),code:`L${i}`,name:`Herramienta ${i}`,brand,visible:true})).slice(offset)});
  });
  await page.goto('./productos?marca=LUSQTOFF');
  for (let i=0;i<3;i++) await expect(page.getByRole('button',{name:`Detalles de Herramienta ${i}`,exact:true}).getByText('Lusqtoff',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Quitar marca Lusqtoff',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Ver Herramienta 0',exact:true}).click();
  await expect(page.getByRole('dialog').getByText('Lusqtoff',{exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Consultar por WhatsApp',exact:true})).toHaveAttribute('href',/Marca%3A%20Lusqtoff/);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:/^Filtros/}).click();
  await expect(page.getByRole('checkbox',{name:'Lusqtoff 3',exact:true})).toBeChecked();
  await expect(page.getByRole('checkbox')).toHaveCount(1);
});

test('cantidad permite borrar el 1 y escribir 3 en tarjeta y detalle', async ({ page }) => {
  await page.goto('./productos');
  const quantity = page.getByRole('spinbutton', { name: 'Cantidad de Taladro Bosch', exact: true });
  await quantity.fill('');
  await expect(quantity).toHaveValue('');
  await quantity.pressSequentially('3');
  await expect(quantity).toHaveValue('3');
  await page.getByRole('button', { name: '+ Agregar a cotización', exact: true }).first().click();
  await page.getByRole('button', { name: 'Mi cotización', exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('Cantidad: 3', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Enviar cotización por WhatsApp' })).toHaveAttribute('href', /Cantidad%3A%203/);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Ver Taladro Bosch', exact: true }).click();
  const modalQuantity = page.getByRole('dialog').getByRole('spinbutton', { name: 'Cantidad', exact: true });
  await modalQuantity.fill('');
  await expect(modalQuantity).toHaveValue('');
  await modalQuantity.pressSequentially('3');
  await expect(page.getByRole('link', { name: 'Consultar por WhatsApp', exact: true })).toHaveAttribute('href', /Cantidad%3A%203/);
  for (const invalid of ['', '0', '-2', '2.5']) {
    await modalQuantity.fill(invalid);
    await modalQuantity.press('Tab');
    await expect(modalQuantity).toHaveValue(invalid === '2.5' ? '2' : '1');
  }
});

test.beforeEach(async ({ page }) => {
  await page.route('**/fixture-photo-*.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#edf2f7"/><text x="160" y="120" text-anchor="middle" fill="#245a9b" font-family="sans-serif" font-size="18">Foto de prueba</text></svg>' }));
  await page.route('https://fixture.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').pop();
    const products = [
      { id: '1', code: 'A', name: 'Taladro Bosch', brand: 'Bosch', category: 'Herramientas eléctricas', visible: true, images: ['/fixture-photo-1.svg', '/fixture-photo-2.svg'] },
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
  await page.getByRole('button', { name: 'Mi cotización', exact: true }).filter({ visible: true }).click();
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


test('galería cambia fotos, enlace directo resiste recarga y Escape conserva filtros', async ({ page }) => {
  await page.goto('./productos?marca=Bosch&producto=A');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Taladro Bosch' })).toBeVisible();
  await expect(dialog.getByRole('img', { name: 'Taladro Bosch — foto 1', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Ver foto 2', exact: true }).click();
  await expect(dialog.getByRole('img', { name: 'Taladro Bosch — foto 2', exact: true })).toHaveAttribute('src', '/fixture-photo-2.svg');
  await dialog.getByRole('button', { name: 'Foto siguiente', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Ver foto 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: 'test-results/galeria-producto.png', fullPage: true });
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/marca=Bosch$/);
  await expect(page.getByText('Martillo Bremen', { exact: true })).toHaveCount(0);
});

test('el filtro de marca acepta mayúsculas y se puede desmarcar', async ({ page }) => {
  await page.goto('./productos?marca=BOSCH');
  await page.getByRole('button', { name: /^Filtros/ }).click();
  const checkbox = page.getByRole('checkbox', { name: /Bosch/ }).filter({ visible: true });
  await expect(checkbox).toBeChecked();
  await expect(page.getByText('Martillo Bremen', { exact: true })).toHaveCount(0);
  await checkbox.uncheck();
  await page.getByRole('button', { name: 'Ver 2 productos', exact: true }).click();
  await expect(page.getByText('Martillo Bremen', { exact: true })).toBeVisible();
});

test('compartir copia un enlace limpio y un producto inexistente muestra aviso', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
  await page.goto('./productos?q=Bosch&producto=A');
  await page.getByRole('button', { name: 'Compartir producto' }).click();
  await expect(page.getByText('Enlace copiado. Ya podés enviarlo.')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('http://127.0.0.1:4173/OxigasWeb/productos?producto=A');
  await page.goto('./productos?producto=DESCONTINUADO');
  await expect(page.getByText('El producto de este enlace ya no está disponible.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Seguir en la tienda' }).click();
  await expect(page).toHaveURL(/productos$/);
});

test('marca de portada abre tienda filtrada en la misma pestaña', async ({ page }) => {
  await page.goto('./');
  const brand = page.getByRole('link').filter({ has: page.getByRole('img', { name: 'Bosch', exact: true }) });
  await expect(brand).toHaveAttribute('href', '/OxigasWeb/productos?marca=Bosch');
  await brand.click();
  await expect(page.getByText('Taladro Bosch', { exact: true })).toBeVisible();
  await expect(page.getByText('Martillo Bremen', { exact: true })).toHaveCount(0);
});


test('marca abreviada B&D coincide con Black & Decker en la portada', async ({ page }) => {
  await page.route('**/rest/v1/products?**', route => {
    const url = new URL(route.request().url());
    return route.fulfill({ json: url.searchParams.get('offset') === '0' ? [
      { id: 'bd', code: 'BD1', name: 'Taladro B&D', brand: 'B&D', visible: true },
      { id: 'bd2', code: 'BD2', name: 'Amoladora Black & Decker', brand: 'Black & Decker', visible: true },
    ] : [] });
  });
  await page.goto('./productos?marca=Black%20%26%20Decker');
  await expect(page.getByText('Taladro B&D', { exact: true })).toBeVisible();
  await expect(page.getByText('Amoladora Black & Decker', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Filtros/ }).click();
  await expect(page.getByRole('checkbox').filter({ visible: true })).toHaveCount(1);
});

for (const width of [390, 1440]) {
  test(`categorías debajo del header y filtros accesibles a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./productos');
    const categories = page.getByRole('navigation', { name: 'Categorías de la tienda' });
    const manual = categories.getByRole('button', { name: 'Herramientas Manuales', exact: true });
    await expect(manual).toBeVisible();
    const headerBox = await page.locator('header').boundingBox();
    const navBox = await categories.boundingBox();
    expect(navBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 2);
    expect(navBox!.y - (headerBox!.y + headerBox!.height)).toBeLessThan(3);
    await manual.click();
    await expect(manual).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Martillo Bremen', { exact: true })).toBeVisible();
    await expect(page.getByText('Taladro Bosch', { exact: true })).toHaveCount(0);
    const filters = page.getByRole('button', { name: /^Filtros/ });
    await filters.click();
    const dialog = page.getByRole('dialog', { name: 'Filtros de la tienda' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Categoría', { exact: true }).selectOption('all');
    await dialog.getByRole('checkbox', { name: /Bosch/ }).check();
    await dialog.getByRole('button', { name: 'Ver 1 producto', exact: true }).click();
    await expect(page.getByText('Taladro Bosch', { exact: true })).toBeVisible();
    await expect(page.getByText('Martillo Bremen', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Quitar marca Bosch', exact: true }).click();
    await filters.click();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(filters).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/nueva-tienda-${width}.png`, fullPage: true });
  });
}

test('botón flotante conserva la cotización entre páginas y sólo el envío abre WhatsApp', async ({ page }) => {
  await page.goto('./productos');
  const help = page.getByRole('link', { name: '¿Necesitás ayuda? Consultar por WhatsApp', exact: true });
  await expect(help).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Cantidad de Taladro Bosch', exact: true }).fill('3');
  await page.getByRole('button', { name: '+ Agregar a cotización', exact: true }).first().click();
  await expect(help).toHaveCount(0);
  const floating = page.getByRole('button', { name: 'Ver mi cotización · 1 producto', exact: true });
  await expect(floating).toBeVisible();
  await page.getByRole('link', { name: 'OXI-GAS - Inicio', exact: true }).click();
  await expect(floating).toBeVisible();
  await floating.click();
  const quote = page.getByRole('dialog', { name: 'Mi cotización', exact: true });
  await expect(quote).toBeVisible();
  await expect(quote.getByText('Cantidad: 3', { exact: true })).toBeVisible();
  await expect(quote.getByRole('link', { name: 'Enviar cotización por WhatsApp' })).toHaveAttribute('href', /Cantidad%3A%203/);
  expect(page.context().pages()).toHaveLength(1);
  await quote.getByRole('button', { name: 'Vaciar lista', exact: true }).click();
  await expect(quote.getByText('Tu lista está vacía', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(help).toBeVisible();
  await expect(floating).toHaveCount(0);
});
