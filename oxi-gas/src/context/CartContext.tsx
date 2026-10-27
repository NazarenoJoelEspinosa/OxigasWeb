import { createContext, useContext, useState } from 'react';
import { useQuoteCart, type QuoteCart } from '@/hooks/useQuoteCart';

type CartContextValue = QuoteCart & { isOpen: boolean; setOpen: (open: boolean) => void };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useQuoteCart();
  const [isOpen, setOpen] = useState(false);
  return <CartContext.Provider value={{ ...cart, isOpen, setOpen }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
