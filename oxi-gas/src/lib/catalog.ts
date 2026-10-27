import { supabase } from './supabaseClient';
import { isMissingTable, productSchema } from './models';
import { readAllPages } from './pagination';
import type { ProductRow } from './database.types';
export async function loadProducts(signal?: AbortSignal, publicOnly = true) {
  const rows = await readAllPages<ProductRow>((from, to) => {
    let q = supabase.from('products').select('*, product_category_links(category_id,is_primary)').order('id').range(from, to);
    if (publicOnly) q = q.eq('visible', true);
    return signal ? q.abortSignal(signal) : q;
  });
  return rows.map(row => productSchema.parse(row));
}
export async function loadShopProducts(signal: AbortSignal) {
  const [products, offerCodes] = await Promise.all([
    loadProducts(signal),
    readAllPages<{ product_code: string | null }>((from, to) => supabase.from('offers')
      .select('product_code').eq('visible', true).not('product_code', 'is', null)
      .order('id').range(from, to).abortSignal(signal))
      .catch(error => { if (isMissingTable(error)) return []; throw error; }),
  ]);
  const codes = new Set(offerCodes.map(o => o.product_code));
  return products.filter(p => p.category?.trim().toLowerCase() !== 'ofertas' && !codes.has(p.code));
}
