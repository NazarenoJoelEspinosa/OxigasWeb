import { z } from 'zod';
export const customFieldSchema = z.object({ key: z.string().min(1), label: z.string().min(1), placeholder: z.string().optional() });
export type CustomField = z.infer<typeof customFieldSchema>;
const optionalText = z.string().nullable().optional().transform(v => v ?? undefined);
export const productSchema = z.object({
  id: z.string(), code: z.string(), name: z.string(),
  description: optionalText, brand: optionalText, category: optionalText,
  price: z.number().finite().nonnegative().nullable().optional().transform(v => v ?? undefined),
  visible: z.boolean().nullable().optional().transform(v => v === undefined ? true : v === true),
  images: z.array(z.string()).nullable().optional().transform(v => v ?? []),
  custom_fields: z.array(customFieldSchema).nullable().optional().transform(v => v ?? []),
});
export type Product = z.infer<typeof productSchema>;
export const offerSchema = z.object({
  id: z.string(), name: z.string(), product_code: optionalText,
  description: optionalText, brand: optionalText, image: optionalText,
  price: z.number().finite().nonnegative().nullable().optional().transform(v => v ?? undefined),
  original_price: z.number().finite().nonnegative().nullable().optional().transform(v => v ?? undefined),
  visible: z.boolean(), sort_order: z.number(), created_at: optionalText,
});
export type Offer = z.infer<typeof offerSchema>;
export function errorMessage(error: unknown, fallback = 'No pudimos completar la operación. Intentá de nuevo.'): string {
  if (error instanceof z.ZodError) return 'La respuesta contiene datos inválidos. Contactá al administrador.';
  if (error instanceof Error) return error.message;
  return fallback;
}
export function isMissingTable(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error &&
    (error.code === '42P01' || error.code === 'PGRST205');
}
export function stableCustomFields(fields: CustomField[]): CustomField[] {
  const keys = new Set<string>();
  return fields.filter(f => f.label.trim()).map(f => {
    const key = f.key.trim();
    if (!key || keys.has(key)) throw new Error('Los campos deben tener identificadores únicos.');
    keys.add(key);
    return { ...f, key, label: f.label.trim(), placeholder: f.placeholder?.trim() ?? '' };
  });
}
