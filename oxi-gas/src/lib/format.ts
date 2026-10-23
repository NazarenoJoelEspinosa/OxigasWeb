export function normalizeQuantity(value: unknown): string {
  const quantity = Number(value);
  return String(Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1);
}
const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 2 });
export function formatPrecio(price: number): string { return formatter.format(price); }
