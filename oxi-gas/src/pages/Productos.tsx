import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MessageCircle, Search, SlidersHorizontal,
  X, ZoomIn, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabaseClient';
import { whatsappUrl } from '@/config/constants';
import { useCategoryGroups } from '@/hooks/useCategoryGroups';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type CustomField = { key: string; label: string; placeholder?: string };

type Product = {
  id: string;
  code: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  price?: number;
  images?: string[];
  custom_fields?: CustomField[];
};

// ─── Grupos de categorías anidadas ───────────────────────────────────────────
//
//  Cada grupo tiene un "label" visible y un array de "slugs" que deben
//  coincidir exactamente con los valores del campo `category` en Supabase.
//  Ajustá los slugs según los que realmente tengas en la base de datos.

type CategoryGroup = {
  label: string;
  icon: string;
  slugs: string[];      // valores exactos del campo category en Supabase
};

const ALL = 'all';

function normalize(v: string) {
  return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Productos() {
  const cart = useCart();
  const [location] = useLocation();
  const { groups: CATEGORY_GROUPS } = useCategoryGroups();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<string>(ALL);

  // qué grupos del sidebar están expandidos
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5]));

  const [selected, setSelected] = useState<Product | null>(null);

  /** Dado un valor de category, devuelve el índice del grupo al que pertenece (o -1) */
  const findGroup = (category: string): number => {
    const n = normalize(category);
    for (let i = 0; i < CATEGORY_GROUPS.length; i++) {
      if (CATEGORY_GROUPS[i].slugs.some((s) => normalize(s) === n)) return i;
    }
    return -1; // sin grupo → "Otros" al final
  };

  /** Obtiene todos los slugs válidos para una categoría (mapea genéricos como "herramientas" a sus subcategorías reales) */
  const getCategorySlugs = (cat: string): string[] => {
    if (cat === ALL) return [];
    const groupIndex = findGroup(cat);
    if (groupIndex >= 0) {
      return CATEGORY_GROUPS[groupIndex].slugs;
    }
    return [cat]; // Si no coincide con grupo, devuelve como está (por si hay categoría personalizada)
  };

  // Leer filtro de categoría desde URL (?categoria=xxx)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('categoria');
    if (cat) setCategory(cat);
  }, [location]);

  // Cargar productos desde Supabase
  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setProducts(data as Product[]);
        setLoading(false);
      });
  }, []);

  // Categorías únicas reales (para mostrar subcategorías en el sidebar)
  const allCategories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean) as string[])].sort(),
    [products],
  );

  // Marcas únicas
  const allBrands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean) as string[])].sort(),
    [products],
  );

  // Contar productos por categoría (con los filtros de búsqueda/marca aplicados, sin filtro de cat)
  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
    for (const p of products) {
      if (!p.category) continue;
      if (selectedBrands.size > 0 && (!p.brand || !selectedBrands.has(p.brand))) continue;
      if (terms.length > 0) {
        const hay = normalize(`${p.name} ${p.code} ${p.brand ?? ''} ${p.category ?? ''}`);
        if (!terms.every((t) => hay.includes(t))) continue;
      }
      map[p.category] = (map[p.category] ?? 0) + 1;
    }
    return map;
  }, [products, selectedBrands, query]);

  // Filtrado final
  const filtered = useMemo(() => {
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
    const allowedSlugs = getCategorySlugs(category);
    return products.filter((p) => {
      if (category !== ALL) {
        // Si hay filtro de categoría, verificar que el producto esté en los slugs permitidos
        if (!allowedSlugs.includes(p.category || '')) return false;
      }
      if (selectedBrands.size > 0 && (!p.brand || !selectedBrands.has(p.brand))) return false;
      if (terms.length === 0) return true;
      const hay = normalize(`${p.name} ${p.code} ${p.brand ?? ''} ${p.category ?? ''}`);
      return terms.every((t) => hay.includes(t));
    });
  }, [products, category, selectedBrands, query]);

  const hasFilters = query !== '' || selectedBrands.size > 0 || category !== ALL;

  const resetFilters = () => {
    setQuery('');
    setSelectedBrands(new Set());
    setCategory(ALL);
  };

  const toggleBrand = (b: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      next.has(b) ? next.delete(b) : next.add(b);
      return next;
    });
  };

  const toggleGroup = (i: number) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  // Construir árbol: grupos → subcategorías reales que pertenecen al grupo
  const groupedCategories = useMemo(() => {
    // Clasificar cada categoría real en un grupo
    const buckets: Record<number, string[]> = {};
    const ungrouped: string[] = [];

    for (const cat of allCategories) {
      const gi = findGroup(cat);
      if (gi >= 0) {
        buckets[gi] = [...(buckets[gi] ?? []), cat];
      } else {
        ungrouped.push(cat);
      }
    }

    // Si hay categorías sin grupo, las metemos en "Otros" (índice 5)
    if (ungrouped.length > 0) {
      buckets[5] = [...(buckets[5] ?? []), ...ungrouped];
    }

    return buckets;
  }, [allCategories]);

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[hsl(var(--text-soft))] hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-4xl font-extrabold text-[hsl(var(--text-main))]">Productos</h1>
          <p className="text-[hsl(var(--text-soft))]">
            {loading
              ? 'Cargando...'
              : `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`}
            {hasFilters && (
              <button onClick={resetFilters} className="ml-3 text-primary text-sm hover:underline">
                Limpiar filtros
              </button>
            )}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ─── SIDEBAR ─────────────────────────────────────────────────── */}
          <aside className="w-full lg:w-64 shrink-0 space-y-4">

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--text-soft))]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] text-sm text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-soft))] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-[hsl(var(--text-soft))]" />
                </button>
              )}
            </div>

            {/* Categorías anidadas */}
            <div className="bg-[hsl(var(--surface-1))] rounded-2xl border border-[hsl(var(--surface-3))] overflow-hidden">
              <div className="px-4 py-3 border-b border-[hsl(var(--surface-3))]">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--text-soft))]">Categorías</p>
              </div>

              {/* "Todas" */}
              <button
                onClick={() => setCategory(ALL)}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors border-b border-[hsl(var(--surface-3))]/40 ${
                  category === ALL
                    ? 'text-primary font-semibold bg-primary/10'
                    : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'
                }`}
              >
                Todas las categorías
              </button>

              {/* Grupos */}
              {CATEGORY_GROUPS.map((group, gi) => {
                const subcats = groupedCategories[gi] ?? [];
                if (subcats.length === 0) return null; // ocultar grupos vacíos
                const isOpen = openGroups.has(gi);
                const groupTotal = subcats.reduce((acc, c) => acc + (countByCategory[c] ?? 0), 0);
                const groupActive = subcats.some((c) => c === category);

                return (
                  <div key={group.label} className="border-b border-[hsl(var(--surface-3))]/40 last:border-0">
                    {/* Cabecera del grupo */}
                    <button
                      onClick={() => toggleGroup(gi)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors ${
                        groupActive
                          ? 'text-primary bg-primary/5'
                          : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span aria-hidden="true">{group.icon}</span>
                        {group.label}
                        {groupTotal > 0 && (
                          <span className="text-[10px] font-bold bg-[hsl(var(--surface-3))] text-[hsl(var(--text-soft))] px-1.5 py-0.5 rounded-full">
                            {groupTotal}
                          </span>
                        )}
                      </span>
                      {isOpen
                        ? <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        : <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      }
                    </button>

                    {/* Subcategorías */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-[hsl(var(--surface-0))]/60"
                        >
                          {subcats.map((c) => {
                            const count = countByCategory[c] ?? 0;
                            return (
                              <button
                                key={c}
                                onClick={() => setCategory(c === category ? ALL : c)}
                                className={`w-full flex items-center justify-between pl-9 pr-4 py-2 text-xs transition-colors ${
                                  category === c
                                    ? 'text-primary font-semibold bg-primary/10'
                                    : 'text-[hsl(var(--text-soft))] hover:text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'
                                }`}
                              >
                                <span className="truncate">{c}</span>
                                {count > 0 && (
                                  <span className={`text-[10px] ml-1 shrink-0 font-bold px-1.5 py-0.5 rounded-full ${
                                    category === c
                                      ? 'bg-primary/20 text-primary'
                                      : 'bg-[hsl(var(--surface-3))] text-[hsl(var(--text-soft))]'
                                  }`}>
                                    {count}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Marcas con checkboxes */}
            <div className="bg-[hsl(var(--surface-1))] rounded-2xl border border-[hsl(var(--surface-3))] overflow-hidden">
              <div className="px-4 py-3 border-b border-[hsl(var(--surface-3))] flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--text-soft))]">Marcas</p>
                {selectedBrands.size > 0 && (
                  <button
                    onClick={() => setSelectedBrands(new Set())}
                    className="text-[10px] text-primary hover:underline font-semibold"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <div className="py-2 max-h-64 overflow-y-auto">
                {allBrands.map((b) => {
                  const checked = selectedBrands.has(b);
                  const count = products.filter(
                    (p) =>
                      p.brand === b &&
                      (category === ALL || p.category === category),
                  ).length;
                  return (
                    <label
                      key={b}
                      className={`flex items-center gap-3 px-4 py-2 cursor-pointer text-sm transition-colors ${
                        checked
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleBrand(b)}
                        className="h-3.5 w-3.5 rounded border-[hsl(var(--surface-3))] accent-primary"
                      />
                      <span className="flex-1 truncate">{b}</span>
                      {count > 0 && (
                        <span className="text-[10px] font-bold text-[hsl(var(--text-soft))]">{count}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ─── GRID ────────────────────────────────────────────────────── */}
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
                <button
                  onClick={resetFilters}
                  className="mt-4 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
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

      <AnimatePresence>
        {selected && (
          <ProductModal product={selected} cart={cart} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </main>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

function ProductCard({
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
  const [qty, setQty] = useState(1);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="group bg-[hsl(var(--surface-1))] rounded-2xl border border-[hsl(var(--surface-3))] hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 overflow-visible flex flex-col h-full"
    >
      <div onClick={onOpen} className="relative aspect-square bg-[hsl(var(--surface-2))] overflow-hidden cursor-pointer rounded-t-2xl">
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

      <div className="p-3 flex-1 cursor-pointer" onClick={onOpen}>
        {product.category && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">{product.category}</p>
        )}
        <p className="text-sm font-semibold text-[hsl(var(--text-main))] leading-snug line-clamp-2">{product.name}</p>
        {product.brand && <p className="text-xs text-[hsl(var(--text-soft))] mt-1">{product.brand}</p>}
        {product.price && product.category?.toLowerCase() === 'ofertas' && (
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
                placeholder={f.placeholder ?? f.label}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomValues(prev => ({ ...prev, [f.key]: val }));
                }}
                className="w-full h-9 px-3 rounded-lg border border-amber-500/40 bg-[hsl(var(--surface-0))] text-sm text-[hsl(var(--text-main))] placeholder:text-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            ))}
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              onClick={(e) => e.stopPropagation()}
              placeholder="Cantidad"
              className="w-full h-9 px-3 rounded-lg border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-0))] text-sm text-[hsl(var(--text-main))] focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            cart.toggle(product.code, { cantidad: String(qty), ...customValues });
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

// ─── ProductModal ─────────────────────────────────────────────────────────────

function ProductModal({
  product,
  cart,
  onClose,
}: {
  product: Product;
  cart: ReturnType<typeof useCart>;
  onClose: () => void;
}) {
  const hasImage = product.images && product.images.length > 0;
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({ cantidad: '1' });
  const hasCustomFields = product.custom_fields && product.custom_fields.length > 0;

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
        onClick={(e) => e.stopPropagation()}
        className="bg-[hsl(var(--surface-1))] rounded-3xl border border-[hsl(var(--surface-3))] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--surface-3))]">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">{product.category}</span>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[hsl(var(--surface-2))] transition-colors">
            <X className="w-5 h-5 text-[hsl(var(--text-main))]" />
          </button>
        </div>

        <div className="bg-[hsl(var(--surface-2))] aspect-video flex items-center justify-center">
          {hasImage ? (
            <img src={product.images![0]} alt={product.name} className="w-full h-full object-contain p-6" />
          ) : (
            <span className="text-6xl">📦</span>
          )}
        </div>

        <div className="p-6">
          <h2 className="text-xl font-bold text-[hsl(var(--text-main))] mb-1">{product.name}</h2>
          {product.brand && <p className="text-sm text-[hsl(var(--text-soft))] mb-1">{product.brand}</p>}
          <p className="text-xs font-mono text-[hsl(var(--text-soft))]/60 mb-4">Código: {product.code}</p>

          {product.description && (
            <p className="text-sm text-[hsl(var(--text-soft))] leading-relaxed mb-6 border-l-2 border-primary/30 pl-3">
              {product.description}
            </p>
          )}

          {product.price && product.category?.toLowerCase() === 'ofertas' && (
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
              value={fieldValues['cantidad']}
              onChange={(e) => setFieldValues((prev) => ({ ...prev, cantidad: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-0))] text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <a
            href={whatsappUrl(
              `Hola OXI-GAS, quiero consultar por:\n*${product.name}*\nCódigo: ${product.code}${product.brand ? `\nMarca: ${product.brand}` : ''}\nCantidad: ${fieldValues['cantidad'] || '1'}`,
            )}
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