import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { ProductOffer } from '@/components/features/ProductOffer';
import { useCart } from '@/context/CartContext';
import { loadProductByCode } from '@/lib/catalog';
import type { Product } from '@/lib/models';
import { formatProductName, normalizeQuantity } from '@/lib/format';
import { whatsappUrl } from '@/config/constants';

export default function Producto() {
  const [, params] = useRoute('/producto/:code');
  const code = params?.code ?? '';
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const [photo, setPhoto] = useState(0);
  const [quantity, setQuantity] = useState('1');
  const [fields, setFields] = useState<Record<string, string>>({});
  const cart = useCart();
  useEffect(() => {
    const controller = new AbortController(); setStatus('loading'); setProduct(null); setPhoto(0); setQuantity('1'); setFields({});
    loadProductByCode(code, controller.signal).then(row => { if (!controller.signal.aborted) { setProduct(row); setStatus(row ? 'ready' : 'missing'); } })
      .catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [code, attempt]);
  useEffect(() => {
    document.title = product ? `${formatProductName(product.name)} | OXI-GAS` : 'Producto | OXI-GAS';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description && product) description.content = product.description || `Consultá por ${formatProductName(product.name)} en OXI-GAS, Ciudadela.`;
    if (product) {
      const image = product.images.find(value => /^https?:\/\//i.test(value)) || 'https://oxigas.com.ar/og-image.jpg';
      const url = `https://oxigas.com.ar/producto/${encodeURIComponent(product.code)}`;
      for (const [key, value] of Object.entries({ 'og:title': document.title, 'og:description': description?.content ?? '', 'og:url': url, 'og:image': image, 'og:type': 'product' })) {
        const meta = document.querySelector<HTMLMetaElement>(`meta[property="${key}"]`); if (meta) meta.content = value;
      }
      let schema = document.getElementById('product-schema');
      if (!schema) { schema = document.createElement('script'); schema.id = 'product-schema'; schema.setAttribute('type', 'application/ld+json'); document.head.appendChild(schema); }
      schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: formatProductName(product.name), sku: product.code, description: description?.content, image, ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}) });
    }
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (robots && status === 'missing') robots.content = 'noindex, follow';
  }, [product, status]);
  return <main className="min-h-screen bg-background"><Header /><div className="max-w-6xl mx-auto px-4 pt-28 pb-16">
    <Link href="/productos" className="text-primary underline">← Volver a la tienda</Link>
    {status === 'loading' && <p role="status" className="py-12">Cargando producto...</p>}
    {status === 'missing' && <h1 className="text-2xl font-bold py-12">Este producto no está disponible</h1>}
    {status === 'error' && <div role="alert" className="py-12">No pudimos cargar el producto. <button onClick={() => setAttempt(n => n + 1)} className="underline">Reintentar</button></div>}
    {product && status === 'ready' && <div className="grid md:grid-cols-2 gap-8 mt-8">
      <div><div className="aspect-square bg-muted rounded-2xl flex items-center justify-center">{product.images[photo] ? <img src={product.images[photo]} alt={`${formatProductName(product.name)} — foto ${photo + 1}`} className="w-full h-full object-contain p-4" /> : <p>Sin foto disponible</p>}</div>
        {product.images.length > 1 && <div className="flex flex-wrap gap-2 mt-3">{product.images.map((image, i) => <button key={i} aria-label={`Ver foto ${i + 1}`} aria-pressed={photo === i} onClick={() => setPhoto(i)} className="rounded border border-border p-1"><img src={image} alt="" className="h-16 w-16 object-contain" /></button>)}</div>}
      </div>
      <div className="space-y-4"><p className="text-primary">{product.category}</p><h1 className="text-3xl font-bold">{formatProductName(product.name)}</h1><p>{product.brand}</p><p className="text-sm text-muted-foreground">Código: {product.code}</p><p className="whitespace-pre-line">{product.description}</p>
        <ProductOffer offer={product.shop_offer} />
        <p className="text-sm text-muted-foreground">Consultá disponibilidad y condiciones antes de confirmar tu pedido.</p>
        {product.custom_fields.map(f => <label key={f.key} className="block text-sm">{f.label}<input className="block w-full rounded-lg border border-border bg-background p-2 mt-1" value={fields[f.key] ?? ''} placeholder={f.placeholder} onChange={e => setFields(current => ({ ...current, [f.key]: e.target.value }))} /></label>)}
        <label className="block">Cantidad<input type="number" min="1" step="1" aria-label="Cantidad del producto" value={quantity} onChange={e => setQuantity(e.target.value)} onBlur={() => setQuantity(normalizeQuantity(quantity))} className="ml-3 w-24 border border-border rounded-lg p-2 bg-background" /></label>
        <button className="block rounded-lg bg-primary text-white px-5 py-3" onClick={() => { cart.updateFields(product.code, { ...fields, cantidad: normalizeQuantity(quantity) }); cart.add(product.code, { ...fields, cantidad: normalizeQuantity(quantity) }); cart.setOpen(true); }}>{cart.has(product.code) ? 'Actualizar mi cotización' : 'Agregar a cotización'}</button>
        <a href={whatsappUrl(`Hola OXI-GAS, quiero consultar por [${product.code}] ${formatProductName(product.name)}. Cantidad: ${normalizeQuantity(quantity)}. ${window.location.href}`)} target="_blank" rel="noopener noreferrer" className="inline-block text-primary underline">Consultar este producto por WhatsApp</a>
      </div>
    </div>}
  </div><Footer /><WhatsAppButton /></main>;
}
