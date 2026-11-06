import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) test(`carrusel mantiene altura y posición al cambiar automáticamente y manualmente a ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 950 });
  await page.route(/https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\//, route => route.abort());
  const rows = [
    { id: 'a', name: 'Oferta corta', visible: true, sort_order: 0 },
    { id: 'b', name: 'Herramienta industrial con accesorios para trabajos profesionales y mantenimiento de talleres', brand: 'Bosch', description: 'Descripción extensa con distintas características. '.repeat(15), price: 999999, original_price: 1200000, visible: true, sort_order: 1 },
    { id: 'c', name: 'Otra oferta', image: '/portrait-test.svg', price: 10, visible: true, sort_order: 2 },
  ];
  await page.route('**/portrait-test.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="1600"><rect width="300" height="1600" fill="blue"/></svg>' }));
  await page.route('**/rest/v1/**', route => route.fulfill({ json: route.request().url().includes('/offers?') ? rows.slice(Number(new URL(route.request().url()).searchParams.get('offset') || 0)) : [] }));
  await page.goto('./');
  const section = page.locator('#ofertas');
  await expect(section.getByRole('heading', { name: 'Oferta Corta', exact: true })).toBeVisible();
  await section.scrollIntoViewIfNeeded(); await page.mouse.move(0, 0);
  await page.evaluate(() => {
    document.documentElement.style.overflowAnchor = 'none';
    const samples: number[][] = [];
    Object.assign(window, { offerLayoutSamples: samples });
    const observe = () => { const section = document.getElementById('ofertas')!; samples.push([section.getBoundingClientRect().height, (section.nextElementSibling as HTMLElement).offsetTop]); if (samples.length < 1200) requestAnimationFrame(observe); };
    requestAnimationFrame(observe);
  });
  await expect(section.getByRole('heading', { name: /^Herramienta Industrial/ })).toBeVisible({ timeout: 9000 });
  await section.getByRole('button', { name: 'Siguiente oferta', exact: true }).click();
  await expect(section.getByRole('heading', { name: 'Otra Oferta', exact: true })).toBeVisible();
  await section.getByRole('button', { name: 'Oferta anterior', exact: true }).click();
  await expect(section.getByRole('heading', { name: /^Herramienta Industrial/ })).toBeVisible();
  await expect(section.getByRole('heading', { name: 'Oferta Corta', exact: true })).toHaveCount(0);
  await expect(section.getByRole('link', { name: 'Consultar por WhatsApp', exact: true })).toHaveCount(1);
  const samples = await page.evaluate(() => (window as unknown as { offerLayoutSamples: number[][] }).offerLayoutSamples);
  for (const column of [0, 1]) expect(Math.max(...samples.map(sample => sample[column])) - Math.min(...samples.map(sample => sample[column]))).toBeLessThanOrEqual(1);
  await expect(section.getByRole('button', { name: 'Activar cambio automático', exact: true })).toBeVisible();
  await page.clock.install();
  await page.mouse.move(0, 0);
  await page.clock.fastForward(13000);
  await expect(section.getByRole('heading', { name: /^Herramienta Industrial/ })).toBeVisible();
});
