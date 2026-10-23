import { useState, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { whatsappUrl } from '@/config/constants';
import type { Product } from '@/lib/models';
import { normalizeQuantity } from '@/lib/format';

export function ProductModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const previousFocus = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const hasImage = product.images && product.images.length > 0;
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({ cantidad: '1' });
  const hasCustomFields = product.custom_fields && product.custom_fields.length > 0;

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent onCloseAutoFocus={event => { event.preventDefault(); previousFocus.current?.focus(); }} aria-describedby={undefined} className="z-[200] bg-[hsl(var(--surface-1))] text-[hsl(var(--text-main))] rounded-3xl w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto p-0 block">
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--surface-3))]">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">{product.category}</span>

        </div>

        <div className="bg-[hsl(var(--surface-2))] aspect-video flex items-center justify-center">
          {hasImage ? (
            <img src={product.images![0]} alt={product.name} className="w-full h-full object-contain p-6" />
          ) : (
            <span className="text-6xl">📦</span>
          )}
        </div>

        <div className="p-6">
          <DialogTitle className="text-xl font-bold text-[hsl(var(--text-main))] mb-1">{product.name}</DialogTitle>
          {product.brand && <p className="text-sm text-[hsl(var(--text-soft))] mb-1">{product.brand}</p>}
          <p className="text-xs font-mono text-[hsl(var(--text-soft))]/60 mb-4">Código: {product.code}</p>

          {product.description && (
            <p className="text-sm text-[hsl(var(--text-soft))] leading-relaxed mb-6 border-l-2 border-primary/30 pl-3">
              {product.description}
            </p>
          )}

          {/* FIX 6 (modal): Comparación case-insensitive para mostrar precio */}
          {product.price != null && product.category?.toLowerCase() === 'ofertas' && (
            <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">Precio especial en oferta</p>
              <p className="text-3xl font-bold text-primary">
                ${product.price.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}

          {hasCustomFields && (
            <div className="mb-4 space-y-3">
              {product.custom_fields!.map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-[hsl(var(--text-soft))] mb-1 block">{f.label}</label>
                  <input
                    type="text"
                    aria-label={f.label}
                    placeholder={f.placeholder}
                    value={fieldValues[f.key] ?? ''}
                    onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-0))] text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mb-4">
            <label className="text-xs font-semibold text-[hsl(var(--text-soft))] mb-1 block">Cantidad</label>
            <input
              type="number"
              min="1"
              aria-label="Cantidad"
              value={fieldValues['cantidad']}
              onChange={(e) => setFieldValues((prev) => ({ ...prev, cantidad: normalizeQuantity(e.target.value) }))}
              className="w-full h-10 px-3 rounded-lg border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-0))] text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <a
            href={whatsappUrl(
              `Hola OXI-GAS, quiero consultar por:\n*${product.name}*\nCódigo: ${product.code}${product.brand ? `\nMarca: ${product.brand}` : ''}\nCantidad: ${normalizeQuantity(fieldValues['cantidad'])}${product.custom_fields.map(f => fieldValues[f.key]?.trim() ? `\n${f.label}: ${fieldValues[f.key].trim()}` : '').join('')}`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#25d366]/90 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-[#25d366]/20"
          >
            <MessageCircle className="w-5 h-5" />
            Consultar por WhatsApp
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
