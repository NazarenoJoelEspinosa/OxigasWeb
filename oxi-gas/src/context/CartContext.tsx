import { createContext, useContext } from 'react';
import { useQuoteCart, type QuoteCart } from '@/hooks/useQuoteCart';

const CartContext = createContext<QuoteCart | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useQuoteCart();
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}