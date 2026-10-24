import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { ProductCard } from '@/components/features/ProductCard';
import { ProductModal } from '@/components/features/ProductModal';
import {
  ArrowLeft, ArrowUpDown, ChevronDown, Search, SlidersHorizontal,
  X,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { useCart } from '@/context/CartContext';
import { loadShopProducts } from '@/lib/catalog';
import type { Product } from '@/lib/models';
import { useCategoryGroups } from '@/hooks/useCategoryGroups';

// ─── Tipos ────────────────────────────────────────────────────────────────────

const ALL = 'all';
const PRODUCTS_PER_PAGE = 12;

type SortOption = 'category-asc' | 'name-asc';

function normalize(v: string) {
  return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const SIDEBAR_PARENTS: { label: string; icon: string; childLabels: string[] }[] = [
  { label: 'Herramientas', icon: '🔨', childLabels: ['Herramientas Manuales', 'Herramientas Eléctricas'] },
];

const EXACT_PREFIX = '__exact__';
const brandKey = (value: string) => {
  const key = normalize(value).replace(/[^a-z0-9]/g, '');
  const aliases: Record<string, string> = { bd: 'blackdecker', blackanddecker: 'blackdecker', bremenn: 'bremen', lusqstoff: 'lusqtoff' };
  return aliases[key] ?? key;
};
const includesBrand = (selected: Set<string>, brand: string) => [...selected].some(item => brandKey(item) === brandKey(brand));

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Productos() {
  const cart = useCart();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const urlParams = new URLSearchParams(search);
  const urlQuery = urlParams.get('q') ?? '';
  const urlCategory = urlParams.get('categoria') ?? ALL;
  const urlBrand = urlParams.get('marca') ?? '';
  const productCode = urlParams.get('producto');
  const { groups: CATEGORY_GROUPS } = useCategoryGroups();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [request, setRequest] = useState(0);
  const [query, setQuery] = useState(() => new URLSearchParams(search).get('q') ?? '');
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<string>(() => new URLSearchParams(search).get('categoria') ?? ALL);
  const [sortBy, setSortBy] = useState<SortOption>('category-asc');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sincronizar con parámetros de URL cuando el usuario navega desde el header
  useEffect(() => {
    setQuery(urlQuery);
    setCategory(urlCategory);
    setSelectedBrands(new Set(urlBrand ? [urlBrand] : []));
  }, [urlQuery, urlCategory, urlBrand]);
  const selected = products.find(product => product.code === productCode) ?? null;
  const selectProduct = (product: Product | null) => {
    const params = new URLSearchParams(search);
    if (product) params.set('producto', product.code);
    else params.delete('producto');
    setLocation('/productos' + (params.size ? '?' + params.toString() : ''), { replace: !product });
  };
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

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError(false);
    loadShopProducts(controller.signal).then(data => {
      if (!controller.signal.aborted) setProducts(data);
    }).catch(() => {
      if (!controller.signal.aborted) setLoadError(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [request]);

  // Marcas únicas
  const allBrands = useMemo(
    () => [...new Map(products.filter(p => p.brand).map(p => [brandKey(p.brand!), p.brand!])).values()].sort((a,b) => a.localeCompare(b, 'es')),
    [products],
  );

  // Contar productos por grupo (respetando filtros de búsqueda y marca, ignorando filtro de categoría)
  const countByGroup = useMemo(() => {
    const counts = new Array(CATEGORY_GROUPS.length).fill(0);
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
    for (const p of products) {
      if (selectedBrands.size > 0 && (!p.brand || !includesBrand(selectedBrands, p.brand))) continue;
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
      if (selectedBrands.size > 0 && (!p.brand || !includesBrand(selectedBrands, p.brand))) continue;
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
      if (selectedBrands.size > 0 && (!p.brand || !includesBrand(selectedBrands, p.brand))) return false;
      if (terms.length === 0) return true;
      const hay = normalize(`${p.name} ${p.code} ${p.brand ?? ''} ${p.category ?? ''}`);
      return terms.every((t) => hay.includes(t));
    });
  }, [products, category, selectedBrands, query, CATEGORY_GROUPS]);

  const hasFilters = query !== '' || selectedBrands.size > 0 || category !== ALL;

  // ─── Ordenamiento ──────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'name-asc') return arr.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return arr.sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '', 'es'));
  }, [filtered, sortBy]);

  // ─── Paginación ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // Resetear a página 1 cuando cambian los filtros o el orden
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedBrands, category, sortBy]);

  const totalPages = Math.ceil(sorted.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = sorted.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setQuery('');
    setSelectedBrands(new Set());
    setCategory(ALL);
    setSortBy('category-asc');
  };

  const toggleBrand = (b: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      const existing = [...next].find(item => brandKey(item) === brandKey(b));
      if (existing !== undefined) next.delete(existing); else next.add(b);
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

        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-4xl font-extrabold text-[hsl(var(--text-main))]">Tienda</h1>
          <p className="text-[hsl(var(--text-soft))]">
            {loadError ? 'Catálogo temporalmente no disponible' : loading
              ? 'Cargando...'
              : `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`}
            {hasFilters && (
              <button onClick={resetFilters} className="ml-3 text-primary text-sm hover:underline">
                Limpiar filtros
              </button>
            )}
          </p>
        </div>

        {/* ─── BARRA MOBILE (solo visible en < lg) ──────────────────────────── */}
        <div className="grid grid-cols-2 lg:hidden gap-2 mb-4">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--text-soft))]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar en la tienda por producto, marca o código"
              placeholder="Producto, marca o código..."
              className="shop-search w-full h-11 pl-10 pr-10 rounded-xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] text-sm text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-soft))] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            />
            {query && (
              <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-[hsl(var(--text-soft))]" />
              </button>
            )}
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative h-11 px-3.5 rounded-xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] text-[hsl(var(--text-main))] flex items-center gap-1.5 text-sm font-medium shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {(selectedBrands.size > 0 || category !== ALL) && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                {selectedBrands.size + (category !== ALL ? 1 : 0)}
              </span>
            )}
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-11 px-3 rounded-xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] text-sm text-[hsl(var(--text-main))] focus:outline-none focus:ring-2 focus:ring-primary/40 shrink-0"
          >
            <option value="category-asc">Categoría</option>
            <option value="name-asc">Nombre A→Z</option>
          </select>
        </div>

        {/* ─── DRAWER MOBILE ────────────────────────────────────────────────── */}
        {drawerOpen && (
          <div className="fixed inset-0 z-[150] lg:hidden flex">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            {/* Panel */}
            <div className="relative ml-auto w-72 h-full bg-[hsl(var(--surface-0))] shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-4 border-b border-[hsl(var(--surface-3))]">
                <p className="font-bold text-[hsl(var(--text-main))]">Filtros</p>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[hsl(var(--surface-2))] transition-colors"
                >
                  <X className="h-5 w-5 text-[hsl(var(--text-main))]" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-4">
                {/* Categorías en drawer */}
                <div className="bg-[hsl(var(--surface-1))] rounded-2xl border border-[hsl(var(--surface-3))] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[hsl(var(--surface-3))]">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--text-soft))]">Categorías</p>
                  </div>
                  <button
                    onClick={() => { setCategory(ALL); setDrawerOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors border-b border-[hsl(var(--surface-3))]/40 ${category === ALL ? 'text-primary font-semibold bg-primary/10' : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'}`}
                  >
                    Todas las categorías
                  </button>
                  {sidebarItems.map((item) => {
                    if (item.type === 'parent') {
                      const isActive = category === item.label;
                      return (
                        <button key={`drawer-parent-${item.label}`}
                          onClick={() => { setCategory(isActive ? ALL : item.label); setDrawerOpen(false); }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b border-[hsl(var(--surface-3))]/40 text-left ${isActive ? 'text-primary font-semibold bg-primary/10' : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'}`}
                        >
                          <span>{item.icon}</span>{item.label}
                          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[hsl(var(--surface-3))] text-[hsl(var(--text-soft))]">{item.count}</span>
                        </button>
                      );
                    }
                    if (item.type === 'child') {
                      const isActive = !category.startsWith(EXACT_PREFIX) && findGroup(category) === item.gi;
                      return (
                        <button key={`drawer-child-${item.label}`}
                          onClick={() => { setCategory(isActive ? ALL : item.label); setDrawerOpen(false); }}
                          className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-sm transition-colors border-b border-[hsl(var(--surface-3))]/40 text-left ${isActive ? 'text-primary font-semibold bg-primary/10' : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'}`}
                        >
                          <span>{item.icon}</span>{item.label}
                          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[hsl(var(--surface-3))] text-[hsl(var(--text-soft))]">{item.count}</span>
                        </button>
                      );
                    }
                    const isActive = !category.startsWith(EXACT_PREFIX) && findGroup(category) === item.gi;
                    return (
                      <button key={`drawer-group-${item.label}`}
                        onClick={() => { setCategory(isActive ? ALL : item.label); setDrawerOpen(false); }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b border-[hsl(var(--surface-3))]/40 text-left ${isActive ? 'text-primary font-semibold bg-primary/10' : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'}`}
                      >
                        <span>{item.icon}</span>{item.label}
                        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[hsl(var(--surface-3))] text-[hsl(var(--text-soft))]">{item.count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Marcas en drawer */}
                <div className="bg-[hsl(var(--surface-1))] rounded-2xl border border-[hsl(var(--surface-3))] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[hsl(var(--surface-3))] flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--text-soft))]">Marcas</p>
                    {selectedBrands.size > 0 && (
                      <button onClick={() => setSelectedBrands(new Set())} className="text-[10px] text-primary hover:underline font-semibold">Limpiar</button>
                    )}
                  </div>
                  <div className="py-2 max-h-64 overflow-y-auto">
                    {allBrands.map((b) => {
                      const checked = includesBrand(selectedBrands, b);
                      const targetGi = findGroup(category);
                      const count = products.filter((p) => brandKey(p.brand ?? '') === brandKey(b) && (category === ALL || (targetGi >= 0 ? findGroup(p.category || '') === targetGi : normalize(p.category || '') === normalize(category)))).length;
                      if (count === 0 && !checked) return null;
                      return (
                        <label key={b} className={`flex items-center gap-3 px-4 py-2 cursor-pointer text-sm transition-colors ${checked ? 'bg-primary/10 text-primary font-semibold' : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleBrand(b)} className="h-3.5 w-3.5 rounded border-[hsl(var(--surface-3))] accent-primary" />
                          <span className="flex-1 truncate">{b}</span>
                          {count > 0 && <span className="text-[10px] font-bold text-[hsl(var(--text-soft))]">{count}</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botón aplicar */}
              <div className="p-4 border-t border-[hsl(var(--surface-3))]">
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  Ver {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ─── SIDEBAR DESKTOP (oculto en mobile) ──────────────────────── */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-4">

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--text-soft))]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar en la tienda por producto, marca o código"
              placeholder="Producto, marca o código..."
                className="shop-search w-full h-11 pl-10 pr-10 rounded-xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] text-sm text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-soft))] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
              />
              {query && (
                <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-[hsl(var(--text-soft))]" />
                </button>
              )}
            </div>

            {/* Ordenar (desktop) */}
            <div className="bg-[hsl(var(--surface-1))] rounded-2xl border border-[hsl(var(--surface-3))] overflow-hidden">
              <div className="px-4 py-3 border-b border-[hsl(var(--surface-3))] flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-[hsl(var(--text-soft))]" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--text-soft))]">Ordenar</p>
              </div>
              {(['category-asc', 'name-asc'] as SortOption[]).map((opt) => {
                const labels: Record<SortOption, string> = {
                  'category-asc': 'Categoría',
                  'name-asc': 'Nombre A→Z',
                };
                return (
                  <button key={opt} onClick={() => setSortBy(opt)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-[hsl(var(--surface-3))]/40 last:border-0 ${sortBy === opt ? 'text-primary font-semibold bg-primary/10' : 'text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))]'}`}
                  >
                    {labels[opt]}
                  </button>
                );
              })}
            </div>
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
                  const checked = includesBrand(selectedBrands, b);
                  const targetGi = findGroup(category);
                  const count = products.filter(
                    (p) => brandKey(p.brand ?? '') === brandKey(b) && (
                      category === ALL ||
                      (targetGi >= 0 ? findGroup(p.category || '') === targetGi : normalize(p.category || '') === normalize(category))
                    ),
                  ).length;
                  if (count === 0 && !checked) return null;
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
            ) : loadError ? (
              <div role="alert" className="py-24 text-center space-y-4">
                <h2 className="text-xl font-bold">No pudimos cargar la tienda</h2>
                <p>Intentá de nuevo en unos instantes.</p>
                <button className="rounded-lg bg-primary text-white px-5 py-3" onClick={() => setRequest(n => n + 1)}>Reintentar</button>
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
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                  {paginatedProducts.map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={i}
                      onOpen={() => selectProduct(product)}
                      cart={cart}
                    />
                  ))}
                </div>

                {/* ─── Paginación ───────────────────────────────────────── */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-10">
                    {/* Botón anterior */}
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-9 px-3 rounded-xl border border-[hsl(var(--surface-3))] text-sm font-medium text-[hsl(var(--text-main))] hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ←
                    </button>

                    {/* Números de página */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Mostrar: primera, última, actual y las 2 adyacentes; el resto como "..."
                      const isFirst = page === 1;
                      const isLast = page === totalPages;
                      const isNearCurrent = Math.abs(page - currentPage) <= 1;
                      if (!isFirst && !isLast && !isNearCurrent) {
                        // Mostrar "..." solo una vez entre grupos
                        const prevPage = page - 1;
                        const prevIsFirst = prevPage === 1;
                        const prevIsNearCurrent = Math.abs(prevPage - currentPage) <= 1;
                        if (!prevIsFirst && !prevIsNearCurrent) return null;
                        return (
                          <span key={`ellipsis-${page}`} className="h-9 w-9 flex items-center justify-center text-sm text-[hsl(var(--text-soft))]">
                            …
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`h-9 w-9 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                            page === currentPage
                              ? 'bg-primary text-white border-primary shadow-md shadow-primary/30'
                              : 'border-[hsl(var(--surface-3))] text-[hsl(var(--text-main))] hover:border-primary hover:text-primary'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    {/* Botón siguiente */}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-9 px-3 rounded-xl border border-[hsl(var(--surface-3))] text-sm font-medium text-[hsl(var(--text-main))] hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
      {!loading && !loadError && productCode && !selected && <div role="status" className="fixed bottom-20 left-4 right-4 z-40 bg-background border rounded-xl p-4 shadow-lg text-center">El producto de este enlace ya no está disponible. <button onClick={() => selectProduct(null)} className="text-primary underline">Seguir en la tienda</button></div>}
      <WhatsAppButton />

      <>
        {selected && (
          <ProductModal key={selected.code} product={selected} onClose={() => selectProduct(null)} />
        )}
      </>
    </main>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

