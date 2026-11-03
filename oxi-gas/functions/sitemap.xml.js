import { publicProducts, escapeHtml as esc, SITE } from './_lib/catalog.js';

export async function onRequestGet(context) {
  try {
    const urls = [`${SITE}/`, `${SITE}/productos`, `${SITE}/ofertas`];
    let offset = 0;
    while (true) {
      const rows = await publicProducts(context, { select: 'code', offset, limit: 500 });
      if (!rows.length) break;
      for (const product of rows) urls.push(`${SITE}/producto/${encodeURIComponent(product.code)}`);
      offset += rows.length;
      if (urls.length > 45000) throw new Error('Dividir sitemap');
    }
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(urls)].map(url => `<url><loc>${esc(url)}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
  } catch {
    return new Response('Sitemap temporalmente no disponible.', { status: 503, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } });
  }
}
