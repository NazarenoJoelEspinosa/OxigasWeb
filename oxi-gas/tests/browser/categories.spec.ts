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

test('menú de categorías por columnas: hover, teclado, cierre y filtros sólo principales', async ({ page }) => {
  await page.setViewportSize({width:1440,height:950});
  await setup(page);
  await page.goto('./productos');
  const nav=page.getByRole('navigation',{name:'Categorías de la tienda'});
  const supplies=nav.getByRole('button',{name:'Insumos',exact:true});
  await expect(nav.getByRole('button',{name:'Corte',exact:true})).toHaveCount(0);
  await supplies.hover();
  const panel=page.getByRole('region',{name:'Subcategorías de Insumos',exact:true});
  await expect(panel).toBeVisible();
  await expect(supplies).toHaveAttribute('aria-pressed','false');
  await panel.getByRole('button',{name:'Discos',exact:true}).hover();
  await expect(panel.getByRole('button',{name:'Corte',exact:true})).toBeVisible();
  await page.screenshot({path:'test-results/categorias-menu-columnas.png',fullPage:false});
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(supplies).toBeFocused();
  await supplies.press('ArrowDown');
  await expect(panel.getByRole('button',{name:'Cerrar categorías',exact:true})).toBeFocused();
  await page.getByRole('heading',{name:'Tienda',exact:true}).click();
  await expect(panel).toHaveCount(0);
  await page.getByRole('button',{name:/^Filtros/}).click();
  const category=page.getByRole('dialog').getByLabel('Categoría',{exact:true});
  await expect(category.getByRole('option')).toHaveCount(4);
  await expect(category.getByRole('option',{name:'Corte',exact:true})).toHaveCount(0);
  await expect(category.getByRole('option',{name:'Insumos',exact:true})).toHaveCount(1);
});

test('celular recorre un nivel por vez sin lista larga ni desborde', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await setup(page);
  await page.goto('./productos');
  const nav=page.getByRole('navigation',{name:'Categorías de la tienda'});
  await nav.getByRole('button',{name:'Insumos',exact:true}).click();
  const panel=page.getByRole('region',{name:'Subcategorías de Insumos',exact:true});
  await panel.getByRole('button',{name:'Discos',exact:true}).click();
  await expect(panel.getByRole('button',{name:'Corte',exact:true})).toBeVisible();
  await expect(panel.getByRole('button',{name:'Discos',exact:true})).toBeHidden();
  await panel.getByRole('button',{name:'← Volver',exact:true}).click();
  await expect(panel.getByRole('button',{name:'Discos',exact:true})).toBeVisible();
  await panel.getByRole('button',{name:'Discos',exact:true}).click();
  await panel.getByRole('button',{name:'Corte',exact:true}).click();
  await expect(panel).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Ver Producto 00',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Ver Producto 01',exact:true})).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
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

test('desde categorías ve mini productos y quita asociaciones sin borrar el producto', async ({ page }) => {
  const {products} = await setup(page,true);
  const changes: Record<string,unknown>[] = [];
  await page.route('**/rpc/bulk_classify_products', async route => {
    const body=route.request().postDataJSON(); changes.push(body);
    const product=products.find(p => p.id === body.p_ids[0])!;
    product.product_category_links=product.product_category_links.filter(link => !(body.p_set_primary && link.is_primary) && !(body.p_related.includes(link.category_id) && !link.is_primary));
    if(body.p_set_primary) product.category=null;
    await route.fulfill({json:1});
  });
  await page.goto('./admin/dashboard');
  await page.getByRole('button',{name:'Categorías',exact:true}).click();
  await page.getByRole('button',{name:'Ver productos de Soldadura',exact:true}).click();
  let panel=page.getByRole('dialog');
  await expect(panel.getByText('Producto 00',{exact:true})).toBeVisible();
  await expect(panel.getByText('Relacionada: Soldadura',{exact:true})).toBeVisible();
  page.once('dialog',async dialog => { expect(dialog.message()).toContain('Conservará su categoría principal'); await dialog.accept(); });
  await panel.getByRole('button',{name:'Quitar CODE0 de esta categoría',exact:true}).click();
  await expect(panel.getByText('No hay productos para esta selección.',{exact:true})).toBeVisible();
  expect(changes[0]).toMatchObject({p_ids:[id(100)],p_set_primary:false,p_related:[id(5)],p_mode:'remove'});
  await panel.getByRole('button',{name:'Cerrar',exact:true}).click();
  await page.getByRole('button',{name:'Ver productos de Insumos',exact:true}).click();
  panel=page.getByRole('dialog');
  await expect(panel.getByText('Producto 00',{exact:true})).toBeVisible();
  await panel.getByRole('checkbox',{name:'Incluir subcategorías',exact:true}).uncheck();
  await expect(panel.getByText('No hay productos para esta selección.',{exact:true})).toBeVisible();
  await panel.getByRole('checkbox',{name:'Incluir subcategorías',exact:true}).check();
  page.once('dialog',async dialog => { expect(dialog.message()).toContain('Quedará sin categoría principal'); await dialog.accept(); });
  await panel.getByRole('button',{name:'Quitar CODE0 de esta categoría',exact:true}).click();
  await expect(panel.getByText('Producto 00',{exact:true})).toHaveCount(0);
  await expect(panel.getByText('Producto 01',{exact:true})).toBeVisible();
  expect(changes[1]).toMatchObject({p_ids:[id(100)],p_set_primary:true,p_related:[],p_mode:'remove'});
  expect(products).toHaveLength(14);
});

for (const mode of ['related','primary'] as const) {
  test(`desde categoría agrega productos como ${mode} sin duplicarlos`, async ({ page }) => {
    const {products}=await setup(page,true);
    let saved: Record<string,unknown> | undefined;
    await page.route('**/rpc/bulk_classify_products',async route => {
      saved=route.request().postDataJSON();
      for(const product of products.filter(p => (saved!.p_ids as string[]).includes(p.id))) {
        if(mode === 'primary') {
          product.product_category_links=product.product_category_links.filter(link => !link.is_primary && link.category_id !== id(5));
          product.product_category_links.push({category_id:id(5),is_primary:true}); product.category='Soldadura';
        } else product.product_category_links.push({category_id:id(5),is_primary:false});
      }
      await route.fulfill({json:2});
    });
    await page.goto('./admin/dashboard');
    await page.getByRole('button',{name:'Categorías',exact:true}).click();
    await page.getByRole('button',{name:'Ver productos de Soldadura',exact:true}).click();
    const panel=page.getByRole('dialog');
    await panel.getByRole('button',{name:'Agregar productos',exact:true}).click();
    await panel.getByLabel('Tipo de asociación al agregar').selectOption(mode);
    await expect(panel.getByRole('checkbox',{name:'Agregar CODE0',exact:true})).toHaveCount(mode === 'related' ? 0 : 1);
    const search=panel.getByRole('searchbox',{name:'Buscar productos para agregar',exact:true});
    await search.fill('CODE1');
    await panel.getByRole('checkbox',{name:'Agregar CODE1',exact:true}).check();
    await search.fill('CODE13');
    await panel.getByRole('checkbox',{name:'Agregar CODE13',exact:true}).check();
    await expect(panel.getByText('2 seleccionados',{exact:true})).toBeVisible();
    page.once('dialog',async dialog => {
      expect(dialog.message()).toContain(mode === 'related' ? 'Las categorías principales se conservan' : 'reemplazará la anterior');
      await dialog.accept();
    });
    await panel.getByRole('button',{name:'Agregar 2 productos',exact:true}).click();
    await expect(panel.getByText('2 productos agregados a la categoría. No se crearon copias.',{exact:true})).toBeVisible();
    await expect(panel.getByText('Producto 01',{exact:true})).toBeVisible();
    await expect(panel.getByText('Producto 13',{exact:true})).toBeVisible();
    expect(saved).toMatchObject({p_ids:[id(101),id(113)],p_primary:mode === 'primary' ? id(5) : null,p_set_primary:mode === 'primary',p_related:mode === 'related' ? [id(5)] : [],p_mode:mode === 'related' ? 'add' : 'keep'});
    expect(products).toHaveLength(14);
    if(mode === 'related') expect(products[1].product_category_links.find(link => link.is_primary)?.category_id).toBe(id(4));
    await page.screenshot({path:`test-results/categoria-agregar-${mode}.png`,fullPage:false});
  });
}

test('si falla el agregado conserva selección y permite reintentar',async ({page}) => {
  await setup(page,true);
  await page.route('**/rpc/bulk_classify_products',route => route.fulfill({status:403,json:{message:'No se pudo guardar el agregado'}}));
  await page.goto('./admin/dashboard');
  await page.getByRole('button',{name:'Categorías',exact:true}).click();
  await page.getByRole('button',{name:'Ver productos de Soldadura',exact:true}).click();
  const panel=page.getByRole('dialog');
  await panel.getByRole('button',{name:'Agregar productos',exact:true}).click();
  await panel.getByRole('checkbox',{name:'Agregar CODE1',exact:true}).check();
  page.once('dialog',dialog => dialog.accept());
  await panel.getByRole('button',{name:'Agregar 1 producto',exact:true}).click();
  await expect(panel.getByText('No se pudo guardar el agregado',{exact:true})).toBeVisible();
  await expect(panel.getByRole('checkbox',{name:'Agregar CODE1',exact:true})).toBeChecked();
  await expect(panel.getByRole('button',{name:'Agregar 1 producto',exact:true})).toBeEnabled();
});
