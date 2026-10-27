import { useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/lib/models';
import { normalizeQuantity } from '@/lib/format';

export function ProductCard({
  product,
  index,
  onOpen,
  cart,
}: {
  product: Product;
  index: number;
  onOpen: () => void;
  cart: ReturnType<typeof useCart>;
}) {
  const hasImage = product.images && product.images.length > 0;
  const isInCart = cart.has(product.code);
  const [qty, setQty] = useState('1');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="group bg-[hsl(var(--surface-1))] rounded-2xl border border-[hsl(var(--surface-3))] hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 overflow-visible flex flex-col h-full"
    >
      <div role="button" tabIndex={0} aria-label={`Ver ${product.name}`} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }} onClick={onOpen} className="relative aspect-square bg-[hsl(var(--surface-2))] overflow-hidden cursor-pointer rounded-t-2xl">
        {hasImage ? (
          <img
            src={product.images![0]}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[hsl(var(--text-soft))]">
            <span className="text-3xl">📦</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        </div>
      </div>

      <div className="p-3 flex-1 cursor-pointer" role="button" tabIndex={0} aria-label={`Detalles de ${product.name}`} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }} onClick={onOpen}>
        {product.category && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">{product.category}</p>
        )}
        <p className="text-sm font-semibold text-[hsl(var(--text-main))] leading-snug line-clamp-2">{product.name}</p>
        {product.brand && <p className="text-xs text-[hsl(var(--text-soft))] mt-1">{product.brand}</p>}

        {product.price != null && (
          <p className="text-sm font-bold text-primary mt-2">
            ${product.price.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </p>
        )}

        <p className="text-xs text-[hsl(var(--text-soft))]/60 mt-1 font-mono">{product.code}</p>
        {product.description && (
          <p className="text-[11px] text-[hsl(var(--text-soft))] mt-1 line-clamp-1">{product.description}</p>
        )}
      </div>

      <div className="px-3 pb-3 flex flex-col gap-2">
        {!isInCart && (
          <>
            {product.custom_fields && product.custom_fields.length > 0 && product.custom_fields.map(f => (
              <input
                key={f.key}
                type="text"
                aria-label={f.label}
                placeholder={f.placeholder || f.label}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomValues(prev => ({ ...prev, [f.key]: val }));
                }}
                className="w-full h-9 px-3 rounded-lg border border-primary/40 bg-[hsl(var(--surface-0))] text-sm text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-soft))]/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            ))}
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onBlur={() => setQty(normalizeQuantity(qty))}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Cantidad de ${product.name}`}
              placeholder="Cantidad"
              className="w-full h-9 px-3 rounded-lg border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-0))] text-sm text-[hsl(var(--text-main))] focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            cart.toggle(product.code, { ...customValues, cantidad: normalizeQuantity(qty) });
          }}
          className={`w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
            isInCart
              ? 'bg-primary text-white border-primary'
              : 'bg-transparent text-[hsl(var(--text-main))] border-[hsl(var(--surface-3))] hover:border-primary hover:text-primary'
          }`}
        >
          {isInCart ? '✓ En cotización' : '+ Agregar a cotización'}
        </button>
      </div>
    </motion.div>
  );
}

