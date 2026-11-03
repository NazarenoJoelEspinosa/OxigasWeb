import { test, expect } from '@playwright/test';

test('productos vinculados a Ofertas siguen en su categoría con precio y aviso', async ({ page }) => {
  let active = true;
  await page.route('**/rest/v1/**', route => {
    const url = new URL(route.request().url());
    const offset = Number(url.searchParams.get('offset') || 0);
    const products = [
      { id: 'p1', code: 'D1', name: 'DISCO CORTE', category: 'Discos de corte', visible: true },
      { id: 'p2', code: 'D2', name: 'DISCO NORMAL', category: 'Discos de corte', visible: true },
    ];
    const offers = [
      { id: 'o1', product_code: 'D1', name: 'DISCO CORTE', price: 800, original_price: 1000, visible: true, sort_order: 0 },
      { id: 'o2', product_code: 'D2', name: 'DISCO NORMAL', price: 900, visible: true, sort_order: 1 },
    ];
    return route.fulfill({ json: (url.pathname.endsWith('/products') ? products : url.pathname.endsWith('/offers') && active ? offers : []).slice(offset) });
  });
  await page.goto('./productos?categoria=Discos%20de%20corte');
  const discounted = page.getByRole('button', { name: 'Detalles de Disco Corte', exact: true }).locator('..');
  await expect(discounted).toBeVisible();
  await expect(discounted.getByText('Este artículo está en oferta')).toBeVisible();
  await expect(discounted.locator('.line-through')).toHaveCount(1);
  const normal = page.getByRole('button', { name: 'Detalles de Disco Normal', exact: true }).locator('..');
  await expect(normal.getByText('Precio publicado en Ofertas')).toBeVisible();
  await expect(normal.locator('.line-through')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver Disco Corte', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('Este artículo está en oferta')).toBeVisible();
  await page.getByRole('dialog').getByRole('link', { name: 'Ver en Ofertas' }).click();
  await expect(page).toHaveURL(/ofertas#oferta-o1$/);
  await expect(page.locator('#oferta-o1')).toBeInViewport();
  active = false;
  await page.goto('./productos?categoria=Discos%20de%20corte');
  await expect(page.getByRole('button', { name: 'Detalles de Disco Corte', exact: true })).toBeVisible();
  await expect(page.getByText('Este artículo está en oferta')).toHaveCount(0);
  await expect(page.getByText('Precio publicado en Ofertas')).toHaveCount(0);
});
