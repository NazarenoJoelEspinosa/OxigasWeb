import { publicProducts, escapeHtml as esc, SITE } from '../_lib/catalog.js';
import { formatProductName } from '../../src/lib/format.ts';

export async function onRequestGet(context) {
  const code = String(context.params.code ?? '');
  try {
    const rows = await publicProducts(context, { code: `eq.${code}`, limit: 1 });
    const product = rows[0];
    const shell = await context.env.ASSETS.fetch(new URL('/', context.request.url));
    if (!shell.ok) throw new Error('Página no disponible');
    let html = await shell.text();
    const name = product ? formatProductName(product.name) : 'Producto no disponible';
    const title = `${name} | OXI-GAS`;
    const description = product ? String(product.description || `Consultá ${name} en OXI-GAS, Ciudadela.`).slice(0, 250) : 'Este producto no está disponible en el catálogo.';
    const canonical = `${SITE}/producto/${encodeURIComponent(code)}`;
    const image = product?.images?.find(value => typeof value === 'string' && /^https?:\/\//i.test(value)) || `${SITE}/og-image.jpg`;
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
      .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`)
      .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(canonical)}" />`);
    for (const [key, value] of Object.entries({ 'og:title': title, 'og:description': description, 'og:url': canonical, 'og:image': image, 'og:type': 'product' })) {
      html = html.replace(new RegExp(`<meta property="${key}"[^>]*>`), `<meta property="${key}" content="${esc(value)}" />`);
    }
    for (const [key, value] of Object.entries({ 'twitter:title': title, 'twitter:description': description, 'twitter:image': image })) html = html.replace(new RegExp(`<meta name="${key}"[^>]*>`), `<meta name="${key}" content="${esc(value)}" />`);
    const content = product ? `<main class="max-w-6xl mx-auto px-4 py-12"><a href="/productos">Volver a la tienda</a><h1>${esc(name)}</h1><p>Código: ${esc(product.code)} · ${esc(product.brand)}</p>${image !== `${SITE}/og-image.jpg` ? `<img src="${esc(image)}" alt="${esc(name)}" width="400" height="400" style="object-fit:contain" />` : ''}<p>${esc(product.description)}</p><p>Consultá disponibilidad por WhatsApp.</p></main>` : '<main><h1>Producto no disponible</h1><a href="/productos">Volver a la tienda</a></main>';
    html = html.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
    if (product) {
      const json = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name, sku: product.code, description, image, ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}) }).replace(/</g, '\u003c');
      html = html.replace('</head>', `<script id="product-schema" type="application/ld+json">${json}</script></head>`);
    } else html = html.replace('</head>', '<meta name="robots" content="noindex, follow" /></head>');
    return new Response(html, { status: product ? 200 : 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return new Response('No pudimos cargar el producto. Intentá nuevamente.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '60', 'Cache-Control': 'no-store' } });
  }
}
