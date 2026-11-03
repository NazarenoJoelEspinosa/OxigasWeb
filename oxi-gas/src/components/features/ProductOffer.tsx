import { Link } from 'wouter';
import type { Product } from '@/lib/models';
import { formatPrecio, hasPriceDiscount } from '@/lib/format';

export function ProductOffer({ offer }: { offer: Product['shop_offer'] }) {
  if (!offer) return null;
  const discounted = hasPriceDiscount(offer.price, offer.original_price);
  return <div className="mx-3 mb-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">
    <p className="font-semibold text-primary">{discounted ? 'Este artículo está en oferta' : 'Precio publicado en Ofertas'}</p>
    {offer.price != null && <p className="mt-1 font-bold text-primary">{formatPrecio(offer.price)}
      {discounted && <span className="ml-2 text-xs font-normal text-[hsl(var(--text-soft))] line-through">{formatPrecio(offer.original_price!)}</span>}
    </p>}
    <Link href={`/ofertas#oferta-${encodeURIComponent(offer.id)}`} className="mt-2 inline-block text-xs text-primary underline">Ver en Ofertas</Link>
  </div>;
}
