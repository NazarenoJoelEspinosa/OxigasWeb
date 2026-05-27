import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'oxi-gas:quote-cart-v2';

/** Valores que el usuario completó para los campos variables de un producto. */
export type CartItemFields = Record<string, string>;

/** Un ítem en el carrito: código de producto + valores opcionales de campos. */
export type CartItem = {
  readonly code: string;
  readonly fields?: CartItemFields;
};

function readStorage(): readonly CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is CartItem =>
        typeof value === 'object' && value !== null && typeof (value as CartItem).code === 'string',
    );
  } catch {
    return [];
  }
}

function writeStorage(items: readonly CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage may be unavailable (private mode, quota): silently ignore.
  }
}

export type QuoteCart = {
  readonly codes: readonly string[];
  readonly items: readonly CartItem[];
  readonly count: number;
  has: (code: string) => boolean;
  add: (code: string, fields?: CartItemFields) => void;
  remove: (code: string) => void;
  /**
   * Si el producto ya está en el carrito, lo quita.
   * Si no está, lo agrega con los `fields` provistos (si los hay).
   */
  toggle: (code: string, fields?: CartItemFields) => void;
  clear: () => void;
};

export function useQuoteCart(): QuoteCart {
  const [items, setItems] = useState<readonly CartItem[]>(() => readStorage());

  useEffect(() => {
    writeStorage(items);
  }, [items]);

  useEffect(() => {
    function handleStorage(event: StorageEvent): void {
      if (event.key !== STORAGE_KEY) return;
      setItems(readStorage());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const codes = items.map((item) => item.code);

  const has = useCallback((code: string) => items.some((item) => item.code === code), [items]);

  const add = useCallback((code: string, fields?: CartItemFields) => {
    setItems((current) =>
      current.some((item) => item.code === code)
        ? current
        : [...current, { code, ...(fields ? { fields } : {}) }],
    );
  }, []);

  const remove = useCallback((code: string) => {
    setItems((current) => current.filter((item) => item.code !== code));
  }, []);

  const toggle = useCallback((code: string, fields?: CartItemFields) => {
    setItems((current) =>
      current.some((item) => item.code === code)
        ? current.filter((item) => item.code !== code)
        : [...current, { code, ...(fields ? { fields } : {}) }],
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return {
    codes,
    items,
    count: items.length,
    has,
    add,
    remove,
    toggle,
    clear,
  };
}
