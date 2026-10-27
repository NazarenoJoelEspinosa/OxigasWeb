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
import { productSchema, type Product } from '@/lib/models';
import { readAllPages } from '@/lib/pagination';
import type { CartItem, QuoteCart as QuoteCartType } from '@/hooks/useQuoteCart';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [request, setRequest] = useState(0);
  const codesKey = JSON.stringify([...cart.codes].sort());
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const codes: string[] = JSON.parse(codesKey);
    setLoading(true); setError(false);
    const load = async () => {
      const products: Product[] = [];
      for (let i = 0; i < codes.length; i += 100) {
        const rows = await readAllPages((from, to) => supabase.from('products').select('*').eq('visible', true).in('code', codes.slice(i, i + 100)).order('id').range(from, to).abortSignal(controller.signal));
        products.push(...rows.map(row => productSchema.parse(row)));
      }
      if (!controller.signal.aborted) setAllProducts(products);
    };
    void load().catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, codesKey, request]);

  const enrichedItems = useMemo<readonly EnrichedItem[]>(() => {
    return cart.items
      .map((cartItem) => {
        const product = allProducts.find((p) => p.code === cartItem.code);
        return product ? { product, cartItem } : null;
      })
      .filter((item): item is EnrichedItem => item !== null);
  }, [cart.items, allProducts]);

  const unavailable = cart.items.filter(item => !allProducts.some(p => p.code === item.code));
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
          {loading ? <p role="status">Cargando tu cotización...</p> : error ? <div role="alert"><p>No pudimos cargar los productos.</p><button onClick={() => setRequest(n => n + 1)} className="text-primary underline">Reintentar</button></div> : cart.count === 0 ? (
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
          {!loading && !error && unavailable.map(item => <div key={item.code} className="mt-4 rounded-lg border border-border p-3"><p>El producto {item.code} ya no está disponible.</p><button className="text-primary underline" onClick={() => cart.remove(item.code)}>Quitar de la cotización</button></div>)}
        </div>

        {!loading && !error && enrichedItems.length > 0 && (
          <SheetFooter className="flex-col gap-3 sm:flex-col sm:space-x-0 border-t border-[hsl(var(--surface-3))] pt-4">
            <a
              href={buildWhatsAppHref(enrichedItems)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25d366] hover:bg-[#25d366]/90 text-white font-bold text-base py-3 px-4 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Enviar cotización por WhatsApp
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
