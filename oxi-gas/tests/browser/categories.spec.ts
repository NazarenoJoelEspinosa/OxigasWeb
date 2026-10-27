import { test, expect } from '@playwright/test';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const fixtures = () => [
  {id:id(1),label:'Insumos',parent_id:null}, {id:id(2),label:'Discos',parent_id:id(1)},
  {id:id(3),label:'Corte',parent_id:id(2)}, {id:id(4),label:'Desbaste',parent_id:id(2)},
  {id:id(5),label:'Soldadura',parent_id:null}, {id:id(6),label:'Herramientas',parent_id:null},
].map((cat, sort_order) => ({...cat,sort_order,slugs:[],icon:'📦'}));

async function setup(page: import('@playwright/test').Page, admin = false) {
  if (admin) await page.addInitScript(() => localStorage.setItem('sb-fixture-auth-token', JSON.stringify({
    access_token:'fixture-admin-token',refresh_token:'fixture-refresh',token_type:'bearer',expires_at:4102444800,expires_in:3600,
    user:{id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'admin@example.test'},
  })));
  const categories = fixtures();
  const products = Array.from({length:14}, (_, i) => ({
    id:id(100 + i), code:`CODE${i}`,name:`Producto ${String(i).padStart(2,'0')}`,brand:'Bosch',visible:true,
    category:i === 0 ? 'Corte' : i === 1 ? 'Desbaste' : i === 13 ? null : 'Herramientas',
    images:[], custom_fields:[], product_category_links:i === 13 ? [] : [
      {category_id:id(i === 0 ? 3 : i === 1 ? 4 : 6),is_primary:true},
      ...(i === 0 ? [{category_id:id(5),is_primary:false}] : []),
    ],
  }));
  await page.route('https://fixture.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/auth/v1/user') return route.fulfill({json:{id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated'}});
    if (url.pathname.endsWith('/admin_users')) return route.fulfill({json:{role:'admin'}});
    if (url.pathname.endsWith('/category_groups')) return route.fulfill({json:categories.slice(Number(url.searchParams.get('offset') || 0))});
    if (url.pathname.endsWith('/products')) return route.fulfill({json:products.slice(Number(url.searchParams.get('offset') || 0))});
    return route.fulfill({json:[]});
  });
  return {categories,products};
}

test('tienda muestra descendientes y productos relacionados sin duplicarlos', async ({ page }) => {
  await setup(page);
  await page.goto('./productos');
  const nav = page.getByRole('navigation',{name:'Categorías de la tienda'});
  await nav.getByRole('button',{name:'Insumos',exact:true}).click();
  await expect(page.getByRole('button',{name:'Ver Producto 00',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Ver Producto 01',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Ver Producto 02',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Discos',exact:true}).click();
  await page.getByRole('button',{name:'Corte',exact:true}).click();
  await expect(page.getByRole('button',{name:'Ver Producto 00',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Ver Producto 01',exact:true})).toHaveCount(0);
  await nav.getByRole('button',{name:'Soldadura',exact:true}).click();
  await expect(page.getByRole('button',{name:'Ver Producto 00',exact:true})).toHaveCount(1);
  await page.getByRole('button',{name:/^Filtros/}).click();
  await expect(page.getByRole('checkbox',{name:/Bosch/})).toHaveAccessibleName('Bosch 1');
});

test('administración crea, renombra y mueve una subcategoría', async ({ page }) => {
  const {categories} = await setup(page,true);
  const writes: Record<string,unknown>[] = [];
  await page.route('**/rpc/save_catalog_category', async route => {
    const body = route.request().postDataJSON(); writes.push(body);
    const record = {id:body.p_id || id(20),label:body.p_label,parent_id:body.p_parent_id,sort_order:body.p_sort_order,slugs:[],icon:'📦'};
    const old = categories.findIndex(cat => cat.id === record.id);
    if (old < 0) categories.push(record); else categories[old] = record;
    await route.fulfill({json:record.id});
  });
  await page.goto('./admin/dashboard');
  await page.getByRole('button',{name:'Categorías',exact:true}).click();
  await page.getByLabel('Nombre de categoría').fill('Flap');
  await page.getByLabel('Categoría superior').selectOption(id(2));
  await page.getByRole('button',{name:'Guardar categoría',exact:true}).click();
  const row = page.getByRole('row').filter({has:page.getByRole('cell',{name:'Insumos → Discos → Flap',exact:true})});
  await expect(row).toBeVisible();
  await row.getByRole('button',{name:'Editar',exact:true}).click();
  await expect(page.getByLabel('Categoría superior').getByRole('option',{name:'Insumos → Discos → Flap',exact:true})).toHaveCount(0);
  await page.getByLabel('Nombre de categoría').fill('Flap y lijado');
  await page.getByLabel('Categoría superior').selectOption(id(1));
  await page.getByRole('button',{name:'Guardar categoría',exact:true}).click();
  await expect(page.getByRole('cell',{name:'Insumos → Flap y lijado',exact:true})).toBeVisible();
  expect(writes[1]).toMatchObject({p_id:id(20),p_parent_id:id(1)});
});

test('selecciona productos entre páginas y clasifica el lote con confirmación', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  const {products} = await setup(page,true);
  let saved: Record<string,unknown> | undefined;
  await page.route('**/rpc/bulk_classify_products', async route => {
    saved = route.request().postDataJSON();
    for (const product of products.filter(p => (saved!.p_ids as string[]).includes(p.id))) {
      product.category='Corte'; product.product_category_links=[{category_id:id(3),is_primary:true},{category_id:id(5),is_primary:false}];
    }
    await route.fulfill({json:2});
  });
  await page.goto('./admin/dashboard');
  await page.getByRole('checkbox',{name:'Seleccionar CODE0',exact:true}).filter({visible:true}).check();
  await page.getByRole('button',{name:'Siguiente',exact:true}).click();
  await page.getByRole('checkbox',{name:'Seleccionar CODE13',exact:true}).filter({visible:true}).check();
  await expect(page.getByText('2 seleccionados',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Clasificar selección',exact:true}).click();
  const bulk = page.getByRole('region',{name:'Clasificación por lotes'});
  await bulk.getByRole('checkbox',{name:'Cambiar categoría principal',exact:true}).check();
  await bulk.getByLabel('Categoría principal',{exact:true}).selectOption(id(3));
  await bulk.getByLabel('Operación de secciones relacionadas').selectOption('add');
  await bulk.getByRole('checkbox',{name:'Soldadura',exact:true}).check();
  page.once('dialog',async dialog => { expect(dialog.message()).toContain('2 productos seleccionados'); await dialog.accept(); });
  await bulk.getByRole('button',{name:'Aplicar clasificación al lote',exact:true}).click();
  await expect(page.getByText('0 seleccionados',{exact:true})).toBeVisible();
  expect(saved).toMatchObject({p_ids:[id(100),id(113)],p_primary:id(3),p_related:[id(5)],p_set_primary:true,p_mode:'add'});
});

test('guardar producto envía contenido y clasificación en una sola operación', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await setup(page,true);
  let saved: Record<string,unknown> | undefined;
  await page.route('**/rpc/save_catalog_product', async route => { saved=route.request().postDataJSON(); await route.fulfill({json:id(100)}); });
  await page.goto('./admin/dashboard');
  await page.getByRole('article').first().getByRole('button',{name:'Editar',exact:true}).click();
  await expect(page.getByLabel('Categoría principal',{exact:true})).toHaveValue(id(3));
  await expect(page.getByRole('checkbox',{name:'Soldadura',exact:true})).toBeChecked();
  await page.getByLabel('Categoría principal',{exact:true}).selectOption(id(4));
  await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
  await expect(page.getByRole('button',{name:'Guardar cambios',exact:true})).toHaveCount(0);
  expect(saved).toMatchObject({p_primary:id(4),p_related:[id(5)],p_product:{id:id(100),code:'CODE0',name:'Producto 00'}});
});
