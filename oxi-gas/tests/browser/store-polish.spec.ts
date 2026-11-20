import { test, expect } from '@playwright/test';

const products = [
  { id:'a',code:'06013960H1',name:'AMOLAD/ANG BOSCH 900W',brand:'Bosch',images:['/images/maquinas/bosch-1.png'],visible:true },
  { id:'b',code:'B',name:'JUEGO DESTORNILLADORES 6P',brand:'IGNCO',visible:true },
  { id:'c',code:'C',name:'PINZA 10"',brand:'Ingco',visible:true },
  { id:'d',code:'D',name:'BUZO ALGODON',brand:'BUZOALGFRIZ',visible:true },
];
test.beforeEach(async ({page}) => {
  await page.route('https://fixture.supabase.co/**',route => {
    const u=new URL(route.request().url());
    return route.fulfill({json:u.pathname.endsWith('/products') ? products.slice(Number(u.searchParams.get('offset')||0)) : []});
  });
  await page.route(/https:\/\/(maps\.google\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//,route=>route.abort());
});

test('portada da acceso al catálogo y máquinas enlazan a sus fichas',async({page})=>{
  await page.goto('./');
  await expect(page.locator('#inicio').getByRole('link',{name:'Ver productos',exact:true})).toHaveAttribute('href','/OxigasWeb/productos');
  await expect(page.locator('#maquinas').getByRole('link').filter({hasText:'Ver producto'})).toHaveAttribute('href','/OxigasWeb/producto/06013960H1');
  expect(await page.locator('#productos').evaluate(e=>!!(e.compareDocumentPosition(document.querySelector('#catalogo')!)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
});

test('marcas se unifican y un código interno no se ofrece como filtro',async({page})=>{
  await page.goto('./productos?marca=Ignco');
  await expect(page.getByRole('status').filter({hasText:'2 productos'})).toBeVisible();
  await page.getByRole('button',{name:/^Filtros/}).click();
  await expect(page.getByRole('checkbox',{name:'Ingco 2',exact:true})).toBeChecked();
  await expect(page.getByRole('checkbox',{name:/Buzoalgfriz/})).toHaveCount(0);
});

for(const width of [320,390]) test(`celular ${width}: tarjetas legibles y cotización sin globo superpuesto`,async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.goto('./productos');
  await expect(page.getByRole('link',{name:'¿Necesitás ayuda? Consultar por WhatsApp',exact:true})).toBeHidden();
  await page.getByRole('button',{name:'+ Agregar a cotización',exact:true}).first().click();
  await page.locator('header').getByRole('button',{name:'Mi cotización',exact:true}).filter({visible:true}).click();
  await expect(page.getByRole('dialog',{name:'Mi cotización',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/tienda-mejorada-${width}.png`,fullPage:false});
});
