export function normalizeQuantity(value: unknown): string {
  const quantity = Number(value);
  return String(Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1);
}
const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 2 });
export function formatPrecio(price: number): string { return formatter.format(price); }

export function hasPriceDiscount(price?: number | null, originalPrice?: number | null): boolean {
  return price != null && originalPrice != null && Number.isFinite(price) && Number.isFinite(originalPrice)
    && price >= 0 && originalPrice > price;
}

/** Formato de presentación; no modifica el nombre guardado en el catálogo. */
export function formatProductName(value: string): string {
  const formatted = value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')
    .replace(/(^|[^\p{L}\p{N}\p{M}])(\p{L})/gu, (_match, separator: string, letter: string) => separator + letter.toLocaleUpperCase('es'));
  const acronyms = new Set(['pvc', 'sds', 'mig', 'mag', 'tig', 'mma', 'hss', 'led', 'usb', 'bsp', 'npt', 'epp']);
  const units: Record<string, string> = { mm: 'mm', cm: 'cm', kg: 'kg', ml: 'ml', rpm: 'rpm', kw: 'kW', w: 'W', v: 'V', ah: 'Ah', mah: 'mAh', nm: 'Nm' };
  return formatted.replace(/[\p{L}]+/gu, token => {
    const key = token.toLocaleLowerCase('es');
    return acronyms.has(key) ? key.toUpperCase() : units[key] ?? token;
  });
}
