import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { onRequestGet as productPage, onRequestHead as productHead } from '../functions/producto/[code].js';
import { onRequestGet as sitemap } from '../functions/sitemap.xml.js';

test('fichas públicas entregan HTML, metadatos y JSON seguro; ocultos no se publican', async t => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const context = { params: { code: 'A' }, request: new Request('https://oxigas.com.ar/producto/A'), env: { VITE_SUPABASE_URL: 'https://fixture.supabase.co', VITE_SUPABASE_ANON_KEY: 'public-fixture', ASSETS: { fetch: async () => new Response(html) } } };
  const product = { code: 'A', name: 'TUBO PVC <script>', description: 'Descripción "segura"', brand: 'Bosch', images: ['https://example.test/foto.jpg'] };
  let hidden = false, failure = false;
  t.mock.method(globalThis, 'fetch', async url => {
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get('visible'), 'eq.true');
    if (failure) return new Response('', { status: 500 });
    return Response.json(hidden || Number(parsed.searchParams.get('offset') || 0) > 0 ? [] : [product]);
  });
  const response = await productPage(context);
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /<h1>Tubo PVC &lt;Script&gt;<\/h1>/);
  assert.match(body, /property="og:image" content="https:\/\/example.test\/foto.jpg"/);
  const structured = [...body.matchAll(/<script[^>]*type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  assert.equal(structured.find(item => item['@type'] === 'Product').name, 'Tubo PVC <Script>');
  const map = await (await sitemap(context)).text();
  assert.match(map, /https:\/\/oxigas.com.ar\/producto\/A/);
  hidden = true;
  assert.equal((await productHead(context)).status, 404);
  const missing = await productPage(context);
  assert.equal(missing.status, 404); assert.match(await missing.text(), /noindex/);
  assert.doesNotMatch(await (await sitemap(context)).text(), /\/producto\/A/);
  failure = true;
  assert.equal((await productPage(context)).status, 503);
  assert.equal((await sitemap(context)).status, 503);
});
