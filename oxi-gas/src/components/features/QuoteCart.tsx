import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, ShoppingCart, Trash2, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { WHATSAPP_URL } from '@/config/constants';
import { PRODUCTS, type Product } from '@/data/products';
import type { CartItem, QuoteCart as QuoteCartType } from '@/hooks/useQuoteCart';

type QuoteCartProps = {
  cart: QuoteCartType;
};

type EnrichedItem = {
  product: Product;
  cartItem: CartItem;
};

function buildWhatsAppHref(enrichedItems: readonly EnrichedItem[]): string {
  const lines = enrichedItems.map(({ product, cartItem }) => {
    let line = `• [${product.code}] ${product.name}`;
    const extras: string[] = [];

    // Cantidad (campo estándar agregado a todos los productos)
    const cantidad = cartItem.fields?.['cantidad']?.trim();
    if (cantidad) extras.push(`Cantidad: ${cantidad}`);

    // Custom fields del producto (metros cúbicos, etc.)
    if (cartItem.fields && product.custom_fields) {
      const fieldParts = product.custom_fields
        .filter((f) => cartItem.fields![f.key]?.trim())
        .map((f) => `${f.label}: ${cartItem.fields![f.key].trim()}`);
      extras.push(...fieldParts);
    }

    if (extras.length > 0) line += ` (${extras.join(', ')})`;
    return line;
  });
  const message = `Hola, quiero consultar los siguientes productos:\n\n${lines.join('\n')}`;
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}

export function QuoteCart({ cart }: QuoteCartProps) {
  const [open, setOpen] = useState(false);

  const enrichedItems = useMemo<readonly EnrichedItem[]>(() => {
    return cart.items
      .map((cartItem) => {
        const product = PRODUCTS.find((p) => p.code === cartItem.code);
        return product ? { product, cartItem } : null;
      })
      .filter((item): item is EnrichedItem => item !== null);
  }, [cart.items]);

  return (
    <>
      <AnimatePresence>
        {cart.count > 0 && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            aria-label={`Abrir cotización (${cart.count} productos)`}
            className="fixed z-40 bottom-6 left-6 inline-flex items-center gap-3 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold pl-5 pr-6 py-3.5 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.03]"
          >
            <span className="relative inline-flex">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-white text-primary text-xs font-bold">
                {cart.count}
              </span>
            </span>
            <span className="hidden sm:inline text-sm uppercase tracking-wider">
              Mi cotización
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md flex flex-col bg-[hsl(var(--surface-1))] border-l border-[hsl(var(--surface-3))] text-[hsl(var(--text-main))]"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2 text-[hsl(var(--text-main))]">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Mi cotización
            </SheetTitle>
            <SheetDescription className="text-[hsl(var(--text-soft))]">
              Revisá los productos y mandanos todo en un solo mensaje por WhatsApp.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
            {enrichedItems.length === 0 ? (
              <EmptyCart />
            ) : (
              <ul className="flex flex-col gap-3">
                {enrichedItems.map(({ product, cartItem }) => (
                  <CartItemRow
                    key={product.code}
                    product={product}
                    cartItem={cartItem}
                    onRemove={() => cart.remove(product.code)}
                  />
                ))}
              </ul>
            )}
          </div>

          {enrichedItems.length > 0 && (
            <SheetFooter className="flex-col gap-3 sm:flex-col sm:space-x-0 border-t border-[hsl(var(--surface-3))] pt-4">
              <a
                href={buildWhatsAppHref(enrichedItems)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25d366] hover:bg-[#25d366]/90 text-white font-bold text-base py-3 px-4 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Cotizar {enrichedItems.length}{' '}
                {enrichedItems.length === 1 ? 'producto' : 'productos'} por WhatsApp
              </a>
              <button
                type="button"
                onClick={() => cart.clear()}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--text-soft))] hover:text-destructive transition-colors py-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Vaciar lista
              </button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

type CartItemRowProps = {
  product: Product;
  cartItem: CartItem;
  onRemove: () => void;
};

function CartItemRow({ product, cartItem, onRemove }: CartItemRowProps) {
  // Build a summary of completed fields (cantidad + custom fields)
  const fieldSummary = useMemo(() => {
    if (!cartItem.fields) return null;
    const parts: string[] = [];

    const cantidad = cartItem.fields['cantidad']?.trim();
    if (cantidad) parts.push(`Cantidad: ${cantidad}`);

    if (product.custom_fields) {
      product.custom_fields
        .filter((f) => cartItem.fields![f.key]?.trim())
        .forEach((f) => parts.push(`${f.label}: ${cartItem.fields![f.key].trim()}`));
    }

    return parts.length > 0 ? parts.join(' · ') : null;
  }, [product.custom_fields, cartItem.fields]);

  return (
    <li className="flex items-start gap-3 rounded-xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-2))] p-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono uppercase tracking-wider text-[hsl(var(--text-soft))]">
          {product.code}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[hsl(var(--text-main))] leading-snug">
          {product.name}
        </p>
        <p className="mt-1 text-xs text-[hsl(var(--text-soft))]">{product.brand}</p>
        {fieldSummary && (
          <p className="mt-1.5 text-xs font-medium text-amber-600 bg-amber-500/10 rounded px-2 py-1 leading-snug">
            {fieldSummary}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar ${product.name} de la cotización`}
        className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md text-[hsl(var(--text-soft))] hover:text-destructive hover:bg-[hsl(var(--surface-3))] transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-[hsl(var(--surface-2))] text-[hsl(var(--text-soft))] mb-4">
        <ShoppingCart className="h-6 w-6" />
      </div>
      <p className="font-semibold text-[hsl(var(--text-main))]">Tu lista está vacía</p>
      <p className="mt-1 text-sm text-[hsl(var(--text-soft))] max-w-xs">
        Tocá el casillero de cada producto que quieras incluir en tu cotización.
      </p>
    </div>
  );
}
