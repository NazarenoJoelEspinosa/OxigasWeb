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
  const expanded = value.trim()
    .replace(/\bDISCO\s+C\.\s*PLANO\b/gi, 'Disco De Corte Plano')
    .replace(/\bJUEGO\s+DESTORNILLADORES\b/gi, 'Juego De Destornilladores')
    .replace(/\bAMOLAD\s*\/\s*(?:ANG\b)?/gi, 'Amoladora Angular ')
    .replace(/\bA\s+BAT\./gi, 'A Batería')
    .replace(/\s*\+\s*H\.\s*ELECTRICA\b/gi, '')
    .replace(/\bH\.\s*ELECTRICA\s*/gi, '')
    .replace(/\b([CPS])\s*\/\s*/gi, (_m, prefix: string) => ({ C: 'Con ', P: 'Para ', S: 'Sin ' })[prefix.toUpperCase()]!)
    .replace(/\b(\d+)\s*(?:PCS|PIEZAS|P)(?=\b|\.)/gi, '$1 Piezas')
    .replace(/\bGRS?\b/gi, 'g')
    .replace(/\bLUSQSTOFF\b/gi, 'Lusqtoff')
    .replace(/\bPROFECIONAL\b/gi, 'Profesional')
    .replace(/\bCARPINTINTERO\b/gi, 'Carpintero');
  const formatted = expanded.replace(/\s+/g, ' ').trim().toLocaleLowerCase('es')
    .replace(/(^|[^\p{L}\p{N}\p{M}])(\p{L})/gu, (_match, separator: string, letter: string) => separator + letter.toLocaleUpperCase('es'));
  const acronyms = new Set(['pvc', 'sds', 'mig', 'mag', 'tig', 'mma', 'hss', 'led', 'usb', 'bsp', 'npt', 'epp', 'hvlp', 'tbi', 'yh', 'att', 'ypf', 'gws', 'wd', 'ms', 'pu']);
  const units: Record<string, string> = { mm: 'mm', cm: 'cm', kg: 'kg', g: 'g', ml: 'ml', rpm: 'rpm', kw: 'kW', w: 'W', v: 'V', ah: 'Ah', mah: 'mAh', nm: 'Nm' };
  return formatted.replace(/[\p{L}]+/gu, token => {
    const key = token.toLocaleLowerCase('es');
    return acronyms.has(key) ? key.toUpperCase() : units[key] ?? token;
  });
}
