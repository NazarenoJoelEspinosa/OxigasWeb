import { z } from 'zod';
export const STORAGE_KEY = 'oxi-gas:quote-cart-v2';
export type CartItemFields = Record<string, string>;
export type CartItem = { readonly code: string; readonly fields?: CartItemFields };
const itemSchema = z.object({ code: z.string().trim().min(1), fields: z.record(z.string()).optional() });
export function parseCart(raw: string | null): readonly CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed.flatMap(value => {
      const item = itemSchema.safeParse(value);
      if (!item.success || seen.has(item.data.code)) return [];
      seen.add(item.data.code);
      return [item.data];
    });
  } catch { return []; }
}
