/**
 * OffersAdmin
 *
 * Muestra los productos con categoría "Ofertas" desde la tabla `products`.
 * El admin gestiona las ofertas simplemente asignando categoría "Ofertas"
 * y cargando precio en el formulario de productos (ProductForm).
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Tag, RefreshCw, Info } from 'lucide-react';

type OfertaProducto = {
  id: string;
  name: string;
  brand?: string;
  price?: number;
  images?: string[];
  visible: boolean;
};

export default function OffersAdmin() {
  const [products, setProducts] = useState<OfertaProducto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id, name, brand, price, images, visible')
      .ilike('category', 'ofertas')
      .order('name', { ascending: true });
    setProducts((data ?? []) as OfertaProducto[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[hsl(var(--text-main))]">Ofertas Destacadas</h2>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[hsl(var(--surface-3))] rounded-lg text-[hsl(var(--text-main))] hover:border-primary transition-colors text-sm"
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-[hsl(var(--text-soft))]">
          Las ofertas se gestionan desde <strong className="text-[hsl(var(--text-main))]">Productos</strong>.
          Asigná la categoría <strong className="text-primary">Ofertas</strong> a un producto y cargá su precio
          para que aparezca automáticamente en el carrusel de la home.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-[hsl(var(--text-soft))]">
          <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-[hsl(var(--text-main))]">No hay productos en oferta</p>
          <p className="text-sm mt-1">Asigná la categoría "Ofertas" a un producto desde el panel de Productos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-[hsl(var(--surface-2))] border border-[hsl(var(--surface-3))] flex items-center gap-4 hover:border-primary/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-[hsl(var(--surface-3))] overflow-hidden shrink-0 flex items-center justify-center">
                {p.images?.[0]
                  ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain p-1" />
                  : <span className="text-xl">🏷️</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[hsl(var(--text-main))] truncate">{p.name}</p>
                {p.brand && <p className="text-xs text-[hsl(var(--text-soft))]">{p.brand}</p>}
              </div>
              <div className="text-right shrink-0">
                {p.price != null
                  ? <p className="font-bold text-primary">${p.price.toLocaleString('es-AR')}</p>
                  : <p className="text-xs text-amber-500 font-semibold">Sin precio</p>
                }
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${
                  p.visible
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-[hsl(var(--surface-3))] text-[hsl(var(--text-soft))]'
                }`}>
                  {p.visible ? 'Visible' : 'Oculto'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
