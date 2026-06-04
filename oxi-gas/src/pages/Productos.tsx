import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronDown, MessageCircle, Search, SlidersHorizontal,
  X, ZoomIn,
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

const ALL = 'all';

function normalize(v: string) {
  return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const SIDEBAR_PARENTS: { label: string; icon: string; childLabels: string[] }[] = [
  { label: 'Herramientas', icon: '🔨', childLabels: ['Herramientas Manuales', 'Herramientas Eléctricas'] },
];

const EXACT_PREFIX = '__exact__';

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Productos() {
  const cart = useCart();
  useLocation(); // mantiene compatibilidad con wouter para re-renders en cambios de ruta
  const search = useSearch();
  const { groups: CATEGORY_GROUPS } = useCategoryGroups();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<string>(ALL);
  const [selected, setSelected] = useState<Product | null>(null);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    new Set(SIDEBAR_PARENTS.map(p => p.label))
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  /** Devuelve el índice del grupo al que pertenece una categoría (por label o por slug). -1 si no matchea. */
  const findGroup = (cat: string): number => {
    const n = normalize(cat);
    for (let i = 0; i < CATEGORY_GROUPS.length; i++) {
      if (normalize(CATEGORY_GROUPS[i].label) === n) return i;
      if (CATEGORY_GROUPS[i].slugs.some((s) => normalize(s) === n)) return i;
    }
    return -1;
  };

  // Scroll al tope al montar la página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Leer filtro de categoría desde URL — usa useSearch() para detectar cambios de query params
  // incluso cuando el pathname /productos no cambia (fix de navegación entre categorías)
  useEffect(() => {
    const params = new URLSearchParams(search);
    const cat = params.get('categoria');
    setCategory(cat ?? ALL);
  }, [search, CATEGORY_GROUPS]);

  // Cargar productos desde Supabase, excluyendo los que tienen oferta activa
  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*').order('name', { ascending: true }),
      supabase.from('offers').select('product_code').eq('visible', true).not('product_code', 'is', null),
    ]).then(([productsRes, offersRes]) => {
      const offerCodes = new Set<string>(
        ((offersRes.data ?? []) as { product_code: string }[])
          .map((o) => o.product_code)
          .filter(Boolean)
      );
      const allProducts = (productsRes.data ?? []) as Product[];
      // Filtrar: excluir los productos cuyo código tiene oferta activa
      // y los de categoría "Ofertas" (legado)
      const filtered = allProducts.filter(
        (p) =>
          p.category?.toLowerCase() !== 'ofertas' &&
          (!p.code || !offerCodes.has(p.code))
      );
      setProducts(filtered);
      setLoading(false);
    }).catch(() => {
      // Si la tabla offers no existe todavía, cargar todos los productos igualmente
      supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })
        .then(({ data, error }) => {
          if (!error && data) {
            setProducts((data as Product[]).filter(p => p.category?.toLowerCase() !== 'ofertas'));
          }
          setLoading(false);
        });
    });
  }, []);

  // Marcas únicas
  const allBrands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean) as string[])].sort(),
    [products],
  );

  // Contar productos por grupo (respetando filtros de búsqueda y marca, ignorando filtro de categoría)
  const countByGroup = useMemo(() => {
    const counts = new Array(CATEGORY_GROUPS.length).fill(0);
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
    for (const p of products) {
      if (selectedBrands.size > 0 && (!p.brand || !selectedBrands.has(p.brand))) continue;
      if (terms.length > 0) {
        const hay = normalize(`${p.name} ${p.code} ${p.brand ?? ''} ${p.category ?? ''}`);
        if (!terms.every((t) => hay.includes(t))) continue;
      }
      const gi = findGroup(p.category || '');
      if (gi >= 0) counts[gi]++;
    }
    return counts as number[];
  }, [products, selectedBrands, query, CATEGORY_GROUPS]);

  // Sidebarr items: pre-computed list with parent/child hierarchy
  type SidebarItem =
    | { type: 'parent'; label: string; icon: string; count: number; childLabels: string[] }
    | { type: 'child'; label: string; icon: string; count: number; gi: number; parentLabel: string }
    | { type: 'group'; label: string; icon: string; count: number; gi: number };

  const sidebarItems = useMemo((): SidebarItem[] => {
    const renderedParents = new Set<string>();
    const items: SidebarItem[] = [];
    CATEGORY_GROUPS.forEach((group, gi) => {
      const parentCfg = SIDEBAR_PARENTS.find(p => p.childLabels.includes(group.label));
      if (parentCfg) {
        if (!renderedParents.has(parentCfg.label)) {
          renderedParents.add(parentCfg.label);
          const childIndices = parentCfg.childLabels
            .map(lbl => CATEGORY_GROUPS.findIndex(g => g.label === lbl))
            .filter(i => i >= 0);
          const parentCount = childIndices.reduce((sum, i) => sum + (countByGroup[i] ?? 0), 0);
          if (parentCount > 0) {
            items.push({ type: 'parent', label: parentCfg.label, icon: parentCfg.icon, count: parentCount, childLabels: parentCfg.childLabels });
          }
        }
        const count = countByGroup[gi] ?? 0;
        if (count > 0) {
          items.push({ type: 'child', label: group.label, icon: group.icon, count, gi, parentLabel: parentCfg.label });
        }
      } else {
        const count = countByGroup[gi] ?? 0;
        if (count > 0) {
          items.push({ type: 'group', label: group.label, icon: group.icon, count, gi });
        }
      }
    });
    return items;
  }, [CATEGORY_GROUPS, countByGroup]);

  // Subcategorías reales por grupo (categorías exactas de los productos, agrupadas y contadas)
  const subsByGroup = useMemo(() => {
    const result = new Map<number, Array<{ cat: string; count: number }>>();
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
    for (const p of products) {
      if (!p.category) continue;
      if (selectedBrands.size > 0 && (!p.brand || !selectedBrands.has(p.brand))) continue;
      if (terms.length > 0) {
        const hay = normalize(`${p.name} ${p.code} ${p.brand ?? ''} ${p.category ?? ''}`);
        if (!terms.every((t) => hay.includes(t))) continue;
      }
      const gi = findGroup(p.category);
      if (gi < 0) continue;
      if (!result.has(gi)) result.set(gi, []);
      const arr = result.get(gi)!;
      const existing = arr.find(x => normalize(x.cat) === normalize(p.category!));
      if (existing) { existing.count++; } else { arr.push({ cat: p.category, count: 1 }); }
    }
    result.forEach((items) => items.sort((a, b) => a.cat.localeCompare(b.cat, 'es')));
    return result;
  }, [products, selectedBrands, query, CATEGORY_GROUPS]);

  // Filtrado: soporta filtro por grupo, por grupo padre, y por categoría exacta (EXACT_PREFIX)
  const filtered = useMemo(() => {
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
    const isExact = category.startsWith(EXACT_PREFIX);
    const exactCat = isExact ? category.slice(EXACT_PREFIX.length) : '';
    const parentCfg = isExact ? null : SIDEBAR_PARENTS.find(p => p.label === category);
    const targetGroupIdx = (isExact || parentCfg) ? -2 : findGroup(category);
    return products.filter((p) => {
      if (category !== ALL) {
        if (isExact) {
          if (normalize(p.category || '') !== normalize(exactCat)) return false;
        } else {
          const pGroupIdx = findGroup(p.category || '');
          if (parentCfg) {
            const childIndices = parentCfg.childLabels
              .map(lbl => CATEGORY_GROUPS.findIndex(g => g.label === lbl))
              .filter(i => i >= 0);
            if (!childIndices.includes(pGroupIdx)) return false;
          } else if (targetGroupIdx >= 0) {
            if (pGroupIdx !== targetGroupIdx) return false;
          } else {
            if (normalize(p.category || '') !== normalize(category)) return false;
          }
        }
      }
      if (selectedBrands.size > 0 && (!p.brand || !selectedBrands.has(p.brand))) return false;
      if (terms.length === 0) return true;
      const hay = normalize(`${p.name} ${p.code} ${p.brand ?? ''} ${p.category ?? ''}`);
      return terms.every((t) => hay.includes(t));
    });
  }, [products, category, selectedBrands, query, CATEGORY_GROUPS]);

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

            {/* Categorías — grupos planos y clickeables */}
            <div className="bg-[hsl(var(--surface-1))] rounded-2xl border border-[hsl(var(--surface-3))] overflow-hidden">
              <div className="px-4 py-3 border-b border-[hsl(var(--surface-3))]">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--text-soft))]">Categorías</p>
              </div>

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

              {sidebarItems.map((item) => {

                // ── Herramientas parent row ──
                if (item.type === 'parent') {
                  const isActive = category === item.label;
                  const isExpanded = expandedParents.has(item.label);
                  return (
                    <div key={`parent-${item.label}`}>
                      <div className={`flex items-center border-b border-[hsl(var(--surface-3))]/40 ${isActive ? 'bg-primary/10' : ''}`}>
                        <button
                          onClick={() => {
                            setCategory(isActive ? ALL : item.label);
                            if (!isExpanded) setExpandedParents(prev => { const n = new Set(prev); n.add(item.label); return n; });
                          }}
                          className={`flex-1 flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors text-left ${isActive ? 'text-primary font-semibold' : 'text-[hsl(var(--text-main))] hover:text-primary'}`}
                        >
                          <span aria-hidden="true">{item.icon}</span>
                          {item.label}
                        </button>
                        <div className="flex items-center gap-1 pr-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isActive ? 'bg-primary/20 text-primary' : 'bg-[hsl(var(--surface-3))] text-[hsl(var(--text-soft))]'}`}>
                            {item.count}
                          </span>
                          <button onClick={() => setExpandedParents(prev => { const n = new Set(prev); n.has(item.label) ? n.delete(item.label) : n.add(item.label); return n; })} className="p-0.5 rounded hover:bg-[hsl(var(--surface-3))] transition-colors">
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform text-[hsl(var(--text-soft))] ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // ── Sub-grupo (ej: Herramientas Manuales / Eléctricas) ──
                if (item.type === 'child') {
                  if (!expandedParents.has(item.parentLabel)) return null;
                  const isGroupActive = !category.startsWith(EXACT_PREFIX) && findGroup(category) === item.gi;
                  const isExpanded = expandedGroups.has(item.gi);
                  const subs = subsByGroup.get(item.gi) ?? [];
                  return (
                    <div key={item.label}>
                      <div className={`flex items-center border-b border-[hsl(var(--surface-3))]/40 ${isGroupActive ? 'bg-primary/10' : ''}`}>
                        <button
                          onClick={() => setCategory(isGroupActive ? ALL : item.label)}
                          className={`flex-1 flex items-center gap-2 pl-9 pr-2 py-2 text-sm transition-colors text-left ${isGroupActive ? 'text-primary font-semibold' : 'text-[hsl(var(--text-main))] hover:text-primary'}`}
                        >
                          <span aria-hidden="true">{item.icon}</span>
                          {item.label}
                        </button>
                        <div className="flex items-center gap-1 pr-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isGroupActive ? 'bg-primary/20 text-primary' : 'bg-[hsl(var(--surface-3))] text-[hsl(var(--text-soft))]'}`}>
                            {item.count}
                          </span>
                          {subs.length > 1 && (
                            <button onClick={() => setExpandedGroups(prev => { const n = new Set(prev); n.has(item.gi) ? n.delete(item.gi) : n.add(item.gi); return n; })} className="p-0.5 rounded hover:bg-[hsl(var(--surface-3))] transition-colors">
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform text-[hsl(var(--text-soft))] ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                      </div>
                      {isExpanded && subs.map(({ cat, count }) => {
                        const isSubActive = category === EXACT_PREFIX + cat;
                        return (
                          <button key={cat} onClick={() => setCategory(isSubActive ? ALL : EXACT_PREFIX + cat)}
                            className={`w-full flex items-center justify-between pl-14 pr-4 py-1.5 text-xs transition-colors border-b border-[hsl(var(--surface-3))]/40 last:border-0 ${isSubActive ? 'text-primary font-semibold bg-primary/10' : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'}`}
                          >
                            <span className="truncate">{cat}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${isSubActive ? 'bg-primary/20 text-primary' : 'bg-[hsl(var(--surface-3))] text-[hsl(var(--text-soft))]'}`}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                }

                // ── Grupo estándar (Gases, Soldadura, Fijación, etc.) ──
                const isGroupActive = !category.startsWith(EXACT_PREFIX) && findGroup(category) === item.gi;
                const isExpanded = expandedGroups.has(item.gi);
                const subs = subsByGroup.get(item.gi) ?? [];
                return (
                  <div key={item.label}>
                    <div className={`flex items-center border-b border-[hsl(var(--surface-3))]/40 ${isGroupActive ? 'bg-primary/10' : ''}`}>
                      <button
                        onClick={() => setCategory(isGroupActive ? ALL : item.label)}
                        className={`flex-1 flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors text-left ${isGroupActive ? 'text-primary font-semibold' : 'text-[hsl(var(--text-main))] hover:text-primary'}`}
                      >
                        <span aria-hidden="true">{item.icon}</span>
                        {item.label}
                      </button>
                      <div className="flex items-center gap-1 pr-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isGroupActive ? 'bg-primary/20 text-primary' : 'bg-[hsl(var(--surface-3))] text-[hsl(var(--text-soft))]'}`}>
                          {item.count}
                        </span>
                        {subs.length > 1 && (
                          <button onClick={() => setExpandedGroups(prev => { const n = new Set(prev); n.has(item.gi) ? n.delete(item.gi) : n.add(item.gi); return n; })} className="p-0.5 rounded hover:bg-[hsl(var(--surface-3))] transition-colors">
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform text-[hsl(var(--text-soft))] ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>
                    {isExpanded && subs.map(({ cat, count }) => {
                      const isSubActive = category === EXACT_PREFIX + cat;
                      return (
                        <button key={cat} onClick={() => setCategory(isSubActive ? ALL : EXACT_PREFIX + cat)}
                          className={`w-full flex items-center justify-between pl-9 pr-4 py-1.5 text-xs transition-colors border-b border-[hsl(var(--surface-3))]/40 last:border-0 ${isSubActive ? 'text-primary font-semibold bg-primary/10' : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'}`}
                        >
                          <span className="truncate">{cat}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${isSubActive ? 'bg-primary/20 text-primary' : 'bg-[hsl(var(--surface-3))] text-[hsl(var(--text-soft))]'}`}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Marcas */}
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
                  const targetGi = findGroup(category);
                  const count = products.filter(
                    (p) => p.brand === b && (
                      category === ALL ||
                      (targetGi >= 0 ? findGroup(p.category || '') === targetGi : normalize(p.category || '') === normalize(category))
                    ),
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