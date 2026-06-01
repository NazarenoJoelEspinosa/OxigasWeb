import { useEffect, useMemo, useState } from 'react';
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
import { supabase } from '@/lib/supabaseClient';
import type { CartItem, QuoteCart as QuoteCartType } from '@/hooks/useQuoteCart';

type CustomField = { key: string; label: string; placeholder?: string };
type Product = {
  id: string;
  code: string;
  name: string;
  brand?: string;
  category?: string;
  images?: string[];
  custom_fields?: CustomField[];
};
type EnrichedItem = { product: Product; cartItem: CartItem };

type QuoteCartProps = {
  cart: QuoteCartType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function buildWhatsAppHref(enrichedItems: readonly EnrichedItem[]): string {
  const lines = enrichedItems.map(({ product, cartItem }) => {
    let line = `• [${product.code}] ${product.name}`;
    const extras: string[] = [];
    const cantidad = cartItem.fields?.['cantidad']?.trim();
    if (cantidad) extras.push(`Cantidad: ${cantidad}`);
    if (cartItem.fields && product.custom_fields) {
      product.custom_fields
        .filter((f) => cartItem.fields![f.key]?.trim())
        .forEach((f) => extras.push(`${f.label}: ${cartItem.fields![f.key].trim()}`));
    }
    if (extras.length > 0) line += ` (${extras.join(', ')})`;
    return line;
  });
  const message = `Hola, quiero consultar los siguientes productos:\n\n${lines.join('\n')}`;
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}

export function QuoteCart({ cart, open, onOpenChange }: QuoteCartProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    supabase
      .from('products')
      .select('id, code, name, brand, category, images, custom_fields')
      .then(({ data }) => {
        if (data) setAllProducts(data as Product[]);
      });
  }, []);

  const enrichedItems = useMemo<readonly EnrichedItem[]>(() => {
    return cart.items
      .map((cartItem) => {
        const product = allProducts.find((p) => p.code === cartItem.code);
        return product ? { product, cartItem } : null;
      })
      .filter((item): item is EnrichedItem => item !== null);
  }, [cart.items, allProducts]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
  );
}

function CartItemRow({
  product,
  cartItem,
  onRemove,
}: {
  product: Product;
  cartItem: CartItem;
  onRemove: () => void;
}) {
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
        aria-label={`Quitar ${product.name}`}
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
        Agregá productos desde el catálogo.
      </p>
    </div>
  );
}