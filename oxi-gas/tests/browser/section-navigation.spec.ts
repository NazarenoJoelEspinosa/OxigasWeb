import { test, expect } from '@playwright/test';

for (const start of ['', 'productos', 'ofertas']) test(`celular: Horarios llega a su sección desde /${start}`, async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.route('https://fixture.supabase.co/**', async route => {
    const u=new URL(route.request().url());
    if(u.pathname.endsWith('/offers')){
      await new Promise(resolve=>setTimeout(resolve,700));
      return route.fulfill({json:[{id:'o',name:'Oferta de prueba',visible:true,sort_order:0,price:100,image:''}].slice(Number(u.searchParams.get('offset')||0))});
    }
    return route.fulfill({json:[]});
  });
  await page.route(/https:\/\/(maps\.google\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//,route=>route.abort());
  await page.goto('./'+start);
  await page.getByRole('button',{name:'Abrir menú',exact:true}).click();
  await page.locator('#mobile-navigation').getByRole('button',{name:'Horarios',exact:true}).click();
  await expect(page.getByRole('button',{name:'Abrir menú',exact:true})).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#ofertas')).toBeAttached();
  await expect.poll(async()=>page.locator('#horarios').evaluate(e=>{
    const top=e.getBoundingClientRect().top;
    const header=document.querySelector('header')!.getBoundingClientRect().bottom;
    return top>=header-2&&top<header+50;
  })).toBe(true);
  await expect(page.getByRole('heading',{name:'Horarios de Atención',exact:true})).toBeInViewport();
  await page.screenshot({path:`test-results/horarios-celular-${start||'inicio'}.png`,fullPage:false});
});
