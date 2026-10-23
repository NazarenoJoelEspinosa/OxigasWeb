import { useCallback, useEffect, useState } from 'react';

import { STORAGE_KEY, parseCart, type CartItem, type CartItemFields } from '@/lib/cart-storage';
export type { CartItem, CartItemFields } from '@/lib/cart-storage';
function readStorage(): readonly CartItem[] {
  try { return typeof window === 'undefined' ? [] : parseCart(window.localStorage.getItem(STORAGE_KEY)); }
  catch { return []; }
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
      if (event.key !== STORAGE_KEY && event.key !== null) return;
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
