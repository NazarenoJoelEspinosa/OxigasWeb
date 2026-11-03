import { supabase } from './supabaseClient';
import { isMissingTable, productSchema, offerSchema } from './models';
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
  const [products, offers] = await Promise.all([
    loadProducts(signal),
    readAllPages((from, to) => supabase.from('offers')
      .select('*').eq('visible', true).not('product_code', 'is', null)
      .order('sort_order').order('id').range(from, to).abortSignal(signal))
      .catch(error => { if (isMissingTable(error)) return []; throw error; }),
  ]);
  const byCode = new Map<string, ReturnType<typeof offerSchema.parse>>();
  for (const row of offers) {
    const offer = offerSchema.parse(row);
    const code = offer.product_code?.trim();
    if (code && !byCode.has(code)) byCode.set(code, offer);
  }
  return products.map(product => {
    const offer = byCode.get(product.code.trim());
    return offer ? { ...product, shop_offer: { id: offer.id, price: offer.price, original_price: offer.original_price } } : product;
  });
}
