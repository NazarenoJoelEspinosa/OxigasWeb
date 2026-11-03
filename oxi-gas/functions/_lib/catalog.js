export const SITE = 'https://oxigas.com.ar';
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export async function config(context) {
  if (context.env.VITE_SUPABASE_URL && context.env.VITE_SUPABASE_ANON_KEY) return { url: context.env.VITE_SUPABASE_URL, key: context.env.VITE_SUPABASE_ANON_KEY };
  const response = await context.env.ASSETS.fetch(new URL('/catalog-config.json', context.request.url));
  if (!response.ok) throw new Error('Configuración no disponible');
  const data = await response.json();
  if (!data.url || !data.key) throw new Error('Configuración incompleta');
  return data;
}
export async function publicProducts(context, params) {
  const { url, key } = await config(context);
  const endpoint = new URL('/rest/v1/products', url);
  for (const [name, value] of Object.entries({ select: 'code,name,description,brand,category,images', visible: 'eq.true', order: 'code', ...params })) endpoint.searchParams.set(name, String(value));
  const response = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Catálogo no disponible');
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Respuesta inválida');
  return rows;
}
