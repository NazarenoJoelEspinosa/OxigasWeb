export function normalizeQuantity(value: unknown): string {
  const quantity = Number(value);
  return String(Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1);
}
const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 2 });
export function formatPrecio(price: number): string { return formatter.format(price); }

/** Formato de presentación; no modifica el nombre guardado en el catálogo. */
export function formatProductName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')
    .replace(/(^|[^\p{L}\p{N}\p{M}])(\p{L})/gu, (_match, separator: string, letter: string) => separator + letter.toLocaleUpperCase('es'));
}
