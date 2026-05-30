import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageCircle, Search, SlidersHorizontal, X, ZoomIn } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { QuoteCart } from '@/components/features/QuoteCart';
import { useQuoteCart } from '@/hooks/useQuoteCart';
import { supabase } from '@/lib/supabaseClient';
import { whatsappUrl, WHATSAPP_URL } from '@/config/constants';

type CustomField = { key: string; label: string; placeholder?: string };

type Product = {
  id: string;
  code: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  images?: string[];
  custom_fields?: CustomField[];
};

const ALL = 'all';

function normalize(v: string) {
  return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function Productos() {
  const cart = useQuoteCart();
  const [location] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('categoria');
    if (cat) setCategory(cat);
  }, [location]);

  useEffect(() => {
    supabase.from('products').select('*').order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setProducts(data as Product[]);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() =>
    [...new Set(products.map(p => p.category).filter(Boolean) as string[])].sort(), [products]);

  const brands = useMemo(() =>
    [...new Set(products.map(p => p.brand).filter(Boolean) as string[])].sort(), [products]);

  const filtered = useMemo(() => {
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
    return products.filter(p => {
      if (category !== ALL && p.category !== category) return false;
      if (brand !== ALL && p.brand !== brand) return false;
      if (terms.length === 0) return true;
      const haystack = normalize(`${p.name} ${p.code} ${p.brand ?? ''} ${p.category ?? ''}`);
      return terms.every(t => haystack.includes(t));
    });
  }, [products, category, brand, query]);

  const resetFilters = () => { setQuery(''); setBrand(ALL); setCategory(ALL); };
  const hasFilters = query !== '' || brand !== ALL || category !== ALL;

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        {/* Breadcrumb */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[hsl(var(--text-soft))] hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-4xl font-extrabold text-[hsl(var(--text-main))]">Productos</h1>
          <p className="text-[hsl(var(--text-soft))]">
            {loading ? 'Cargando...' : `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`}
            {hasFilters && <button onClick={resetFilters} className="ml-3 text-primary text-sm hover:underline">Limpiar filtros</button>}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* SIDEBAR */}
          <aside className="w-full lg:w-64 shrink-0">
            {/* Búsqueda */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--text-soft))]" />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] text-sm text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-soft))] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-[hsl(var(--text-soft))]" />
                </button>
              )}
            </div>

            {/* Categorías */}
            <div className="bg-[hsl(var(--surface-1))] rounded-2xl border border-[hsl(var(--surface-3))] overflow-hidden mb-4">
              <div className="px-4 py-3 border-b border-[hsl(var(--surface-3))]">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--text-soft))]">Categorías</p>
              </div>
              <div className="py-2">
                <button
                  onClick={() => setCategory(ALL)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${category === ALL ? 'text-primary font-semibold bg-primary/10' : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'}`}
                >
                  Todas las categorías
                </button>
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${category === c ? 'text-primary font-semibold bg-primary/10' : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Marcas */}
            <div className="bg-[hsl(var(--surface-1))] rounded-2xl border border-[hsl(var(--surface-3))] overflow-hidden">
              <div className="px-4 py-3 border-b border-[hsl(var(--surface-3))]">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--text-soft))]">Marcas</p>
              </div>
              <div className="py-2">
                <button
                  onClick={() => setBrand(ALL)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${brand === ALL ? 'text-primary font-semibold bg-primary/10' : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'}`}
                >
                  Todas las marcas
                </button>
                {brands.map(b => (
                  <button
                    key={b}
                    onClick={() => setBrand(b)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${brand === b ? 'text-primary font-semibold bg-primary/10' : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* GRID */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <SlidersHorizontal className="h-12 w-12 text-[hsl(var(--text-soft))] mb-4" />
                <h2 className="text-xl font-bold text-[hsl(var(--text-main))]">Sin resultados</h2>
                <p className="text-[hsl(var(--text-soft))] mt-2">Probá con otros filtros o consultanos directamente.</p>
                <button onClick={resetFilters} className="mt-4 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Ver todos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                {filtered.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    onOpen={() => setSelected(product)}
                    cart={cart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppButton />
      <QuoteCart cart={cart} />

      {/* MODAL */}
      <AnimatePresence>
        {selected && (
          <ProductModal product={selected} cart={cart} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </main>
  );
}

function ProductCard({ product, index, onOpen, cart }: {
  product: Product;
  index: number;
  onOpen: () => void;
  cart: ReturnType<typeof useQuoteCart>;
}) {
  const hasImage = product.images && product.images.length > 0;
  const isInCart = cart.has(product.code);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
    className="group bg-[hsl(var(--surface-1))] rounded-2xl border border-[hsl(var(--surface-3))] hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 overflow-visible flex flex-col h-full"
    >
      {/* Imagen — clickeable para abrir modal */}
      <div
        onClick={onOpen}
        className="relative aspect-square bg-[hsl(var(--surface-2))] overflow-hidden cursor-pointer"
      >
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

      {/* Info — clickeable para abrir modal */}
      <div className="p-3 flex-1 cursor-pointer" onClick={onOpen}>
        {product.category && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">{product.category}</p>
        )}
        <p className="text-sm font-semibold text-[hsl(var(--text-main))] leading-snug line-clamp-2">{product.name}</p>
        {product.brand && (
          <p className="text-xs text-[hsl(var(--text-soft))] mt-1">{product.brand}</p>
        )}
        <p className="text-xs text-[hsl(var(--text-soft))]/60 mt-1 font-mono">{product.code}</p>
      </div>

      {/* Botón cotización */}
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => cart.toggle(product.code)}
          className={`w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${isInCart
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

function ProductModal({ product, cart, onClose }: { product: Product; cart: ReturnType<typeof useQuoteCart>; onClose: () => void }) {
  const hasImage = product.images && product.images.length > 0;
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({ cantidad: '' });
  const hasCustomFields = product.custom_fields && product.custom_fields.length > 0;

  const message = `Hola OXI-GAS, quiero consultar por:\n*${product.name}*\nCódigo: ${product.code}${product.brand ? `\nMarca: ${product.brand}` : ''}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-[hsl(var(--surface-1))] rounded-3xl border border-[hsl(var(--surface-3))] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header modal */}
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--surface-3))]">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">{product.category}</span>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[hsl(var(--surface-2))] transition-colors">
            <X className="w-5 h-5 text-[hsl(var(--text-main))]" />
          </button>
        </div>

        {/* Imagen */}
        <div className="bg-[hsl(var(--surface-2))] aspect-video flex items-center justify-center">
          {hasImage ? (
            <img src={product.images![0]} alt={product.name} className="w-full h-full object-contain p-6" />
          ) : (
            <span className="text-6xl">📦</span>
          )}
        </div>

        {/* Contenido */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-[hsl(var(--text-main))] mb-1">{product.name}</h2>
          {product.brand && <p className="text-sm text-[hsl(var(--text-soft))] mb-1">{product.brand}</p>}
          <p className="text-xs font-mono text-[hsl(var(--text-soft))]/60 mb-4">Código: {product.code}</p>

          {product.description && (
            <p className="text-sm text-[hsl(var(--text-soft))] leading-relaxed mb-6 border-l-2 border-primary/30 pl-3">
              {product.description}
            </p>
          )}

          {hasCustomFields && (
            <div className="mb-4 space-y-3">
              {product.custom_fields!.map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-[hsl(var(--text-soft))] mb-1 block">{f.label}</label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={fieldValues[f.key] ?? ''}
                    onChange={e => setFieldValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-0))] text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              ))}
            </div>
          )}

          <a
            href={whatsappUrl(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#25d366]/90 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-[#25d366]/20"
          >
            <MessageCircle className="w-5 h-5" />
            Consultar por WhatsApp
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}