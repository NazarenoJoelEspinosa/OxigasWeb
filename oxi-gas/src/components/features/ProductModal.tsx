import { useState, useRef } from 'react';
import { MessageCircle, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { productUrl } from '@/lib/shop-links';
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
  const [imageIndex, setImageIndex] = useState(0);
  const [shareMessage, setShareMessage] = useState('');
  const [showShareLink, setShowShareLink] = useState(false);
  const images = product.images;
  const share = async () => {
    const url = productUrl(product.code);
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMessage('Enlace copiado. Ya podés enviarlo.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShowShareLink(true);
      setShareMessage('Seleccioná y copiá este enlace para compartirlo.');
    }
  };
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({ cantidad: '1' });
  const hasCustomFields = product.custom_fields && product.custom_fields.length > 0;

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent onCloseAutoFocus={event => { event.preventDefault(); previousFocus.current?.focus(); }} aria-describedby={undefined} className="z-[200] bg-[hsl(var(--surface-1))] text-[hsl(var(--text-main))] rounded-3xl w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto p-0 block">
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--surface-3))]">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">{product.category}</span>

        </div>

        <div className="relative bg-[hsl(var(--surface-2))] aspect-video flex items-center justify-center">
          {hasImage ? (
            <img src={images[imageIndex]} alt={`${product.name} — foto ${imageIndex + 1}`} className="w-full h-full object-contain p-6" />
          ) : (
            <span className="text-6xl">📦</span>
          )}
          {images.length > 1 && <>
            <button type="button" aria-label="Foto anterior" onClick={() => setImageIndex(i => (i - 1 + images.length) % images.length)} className="absolute left-2 rounded-full bg-background p-2 shadow"><ChevronLeft /></button>
            <button type="button" aria-label="Foto siguiente" onClick={() => setImageIndex(i => (i + 1) % images.length)} className="absolute right-2 rounded-full bg-background p-2 shadow"><ChevronRight /></button>
          </>}
        </div>
        {images.length > 1 && <div className="px-5 pt-3">
          <p role="status" className="text-xs text-[hsl(var(--text-soft))] mb-2">Foto {imageIndex + 1} de {images.length}</p>
          <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Fotos del producto">
            {images.map((src, i) => <button key={`${src}-${i}`} type="button" aria-label={`Ver foto ${i + 1}`} aria-pressed={i === imageIndex} onClick={() => setImageIndex(i)} className={`shrink-0 rounded-lg border-2 p-1 ${i === imageIndex ? 'border-primary' : 'border-transparent'}`}>
              <img src={src} alt={`Miniatura ${i + 1}`} loading="lazy" className="w-16 h-16 object-contain bg-white rounded" />
            </button>)}
          </div>
        </div>}

        <div className="p-6">
          <DialogTitle className="text-xl font-bold text-[hsl(var(--text-main))] mb-1">{product.name}</DialogTitle>
          {product.brand && <p className="text-sm text-[hsl(var(--text-soft))] mb-1">{product.brand}</p>}
          <p className="text-xs font-mono text-[hsl(var(--text-soft))]/60 mb-4">Código: {product.code}</p>
          <button type="button" onClick={() => void share()} className="inline-flex items-center gap-2 text-sm text-primary font-semibold mb-3"><Share2 size={16} />Compartir producto</button>
          <p role="status" className="text-xs text-[hsl(var(--text-soft))] mb-2">{shareMessage}</p>
          {showShareLink && <input aria-label="Enlace del producto" readOnly value={productUrl(product.code)} onFocus={event => event.currentTarget.select()} className="w-full border rounded p-2 text-sm mb-4" />}

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
              onChange={(e) => setFieldValues((prev) => ({ ...prev, cantidad: e.target.value }))}
              onBlur={() => setFieldValues((prev) => ({ ...prev, cantidad: normalizeQuantity(prev['cantidad']) }))}
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
