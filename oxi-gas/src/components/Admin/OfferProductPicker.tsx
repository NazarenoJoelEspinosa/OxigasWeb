import { useEffect, useState } from 'react';
import { loadProducts } from '@/lib/catalog';
import type { Product } from '@/lib/models';

export function OfferProductPicker({ onSelect }: { onSelect: (product: Product) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setStatus('loading');
    loadProducts(controller.signal, false).then(rows => { if (!controller.signal.aborted) { setProducts(rows); setStatus('ready'); } })
      .catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [attempt]);
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  const matches = products.filter(p => normalize(p.name + ' ' + p.code).includes(normalize(query.trim())));
  return <div className="rounded-xl border border-border p-3 space-y-2">
    <label htmlFor="offer-product-search" className="block text-sm font-semibold">Elegir producto del catálogo (opcional)</label>
    <input id="offer-product-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre o código" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
    {status === 'loading' && <p role="status" className="text-xs">Cargando productos...</p>}
    {status === 'error' && <p role="alert">No se cargó el catálogo. <button type="button" onClick={() => setAttempt(n => n + 1)} className="underline">Reintentar productos</button></p>}
    {status === 'ready' && query.trim() && <div className="max-h-52 overflow-y-auto">
      {matches.slice(0, 20).map(p => <button key={p.id} type="button" className="flex items-center gap-2 w-full text-left border-b border-border py-2 text-sm" onClick={() => { onSelect(p); setQuery(''); }}>
        {p.images[0] && <img src={p.images[0]} alt="" className="h-10 w-10 object-contain" />}<span>{p.code} · {p.name}{!p.visible && ' · Oculto en tienda'}</span>
      </button>)}
      {!matches.length && <p className="text-sm">No encontramos productos.</p>}
      {matches.length > 20 && <p className="text-xs">Se muestran 20 resultados. Afiná la búsqueda.</p>}
    </div>}
    <p className="text-xs text-muted-foreground">Podés publicar un artículo independiente sin seleccionar un producto.</p>
  </div>;
}
