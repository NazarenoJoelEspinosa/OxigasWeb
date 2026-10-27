import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { ProductCard } from '@/components/features/ProductCard';
import { ProductModal } from '@/components/features/ProductModal';
import {
  ArrowLeft, Search, SlidersHorizontal,
  X,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { useCart } from '@/context/CartContext';
import { loadShopProducts } from '@/lib/catalog';
import type { Product } from '@/lib/models';
import { useCategoryGroups } from '@/hooks/useCategoryGroups';
import { belongsToCategory, categoryBranch, categoryPath, orderedCategories } from '@/lib/categories';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';

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
  const filtersButton = useRef<HTMLButtonElement>(null);

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

  // Las categorías se mantienen visibles aunque la búsqueda no tenga resultados.
  const categoryOptions = useMemo(() => {
    const options = CATEGORY_GROUPS.filter((group, i) => !group.parent_id && products.some(p => group.id ? belongsToCategory(p, group.id, CATEGORY_GROUPS) : findGroup(p.category ?? '') === i))
      .map(group => ({ value: group.id ? '__node__' + group.id : group.label, label: group.label }));
    const ungrouped = [...new Set(products.filter(p => p.product_category_links.length === 0).map(p => p.category).filter((cat): cat is string => Boolean(cat) && findGroup(cat!) < 0))];
    return [...options, ...ungrouped.sort((a, b) => a.localeCompare(b, 'es')).map(cat => ({ value: EXACT_PREFIX + cat, label: cat }))];
  }, [products, CATEGORY_GROUPS]);

  const matchesCategory = (product: Product) => {
    if (category === ALL) return true;
    if (category.startsWith('__node__')) return belongsToCategory(product, category.slice(8), CATEGORY_GROUPS);
    if (category.startsWith(EXACT_PREFIX)) return normalize(product.category ?? '') === normalize(category.slice(EXACT_PREFIX.length));
    const parent = SIDEBAR_PARENTS.find(p => p.label === category);
    const index = findGroup(product.category ?? '');
    if (parent) return parent.childLabels.some(label => normalize(CATEGORY_GROUPS[index]?.label ?? '') === normalize(label));
    const target = findGroup(category);
    if (target >= 0 && CATEGORY_GROUPS[target].id) return belongsToCategory(product, CATEGORY_GROUPS[target].id!, CATEGORY_GROUPS);
    return target >= 0 ? index === target : normalize(product.category ?? '') === normalize(category);
  };
  const selectedNode = category.startsWith('__node__') ? CATEGORY_GROUPS.find(cat => cat.id === category.slice(8)) : undefined;
  const childCategories = selectedNode ? CATEGORY_GROUPS.filter(cat => cat.parent_id === selectedNode.id && products.some(p => belongsToCategory(p, cat.id!, CATEGORY_GROUPS))) : [];
  const exactCategories = [...new Set(products.map(p => p.category).filter((cat): cat is string => Boolean(cat)))].sort((a, b) => a.localeCompare(b, 'es'));

  // Filtrado: soporta filtro por grupo, por grupo padre, y por categoría exacta (EXACT_PREFIX)
  const filtered = useMemo(() => {
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      if (!matchesCategory(p)) return false;
      if (selectedBrands.size > 0 && (!p.brand || !includesBrand(selectedBrands, p.brand))) return false;
      if (terms.length === 0) return true;
      const hay = normalize(`${p.name} ${p.code} ${p.brand ?? ''} ${p.category ?? ''} ${p.product_category_links.map(link => categoryPath(link.category_id, CATEGORY_GROUPS)).join(' ')}`);
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
    <main className="min-h-screen bg-background pt-20 sm:pt-28">
      <Header />
      <nav aria-label="Categorías de la tienda" className="border-b border-primary/20 bg-primary/10">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8 py-2">
          {[{ value: ALL, label: 'Todos los productos' }, ...categoryOptions].map(option => {
            const active = category === option.value || (selectedNode && option.value.startsWith('__node__') && categoryBranch(option.value.slice(8), CATEGORY_GROUPS).has(selectedNode.id!));
            return <button key={option.value} type="button" aria-pressed={active}
              onClick={() => setCategory(option.value)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${active ? 'bg-primary text-white' : 'text-[hsl(var(--text-main))] hover:bg-primary/10'}`}>
              {option.label}
            </button>;
          })}
        </div>
      </nav>

      {selectedNode && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-2">
        <p className="text-sm font-semibold">{categoryPath(selectedNode.id!, CATEGORY_GROUPS)}</p>
        <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Subcategorías">
          <button type="button" onClick={() => setCategory(selectedNode.parent_id ? '__node__' + selectedNode.parent_id : ALL)} className="shrink-0 border rounded-lg px-3 py-2 text-sm">← {selectedNode.parent_id ? 'Categoría superior' : 'Todas las categorías'}</button>
          {childCategories.map(cat => <button type="button" key={cat.id} onClick={() => setCategory('__node__' + cat.id)} className="shrink-0 border border-primary/30 text-primary rounded-lg px-3 py-2 text-sm">{cat.label}</button>)}
        </div>
      </div>}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[hsl(var(--text-soft))] hover:text-primary mb-4"><ArrowLeft className="h-4 w-4" />Volver al inicio</Link>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold">Tienda</h1>
            <p role="status" className="text-sm text-[hsl(var(--text-soft))] mt-1">
              {loadError ? 'Catálogo temporalmente no disponible' : loading ? 'Cargando...' : `${filtered.length} producto${filtered.length === 1 ? '' : 's'}`}
            </p>
          </div>
          {hasFilters && <button type="button" onClick={resetFilters} className="text-primary text-sm hover:underline py-2">Limpiar filtros</button>}
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 mb-4">
          <div className="relative col-span-2 sm:flex-1">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--text-soft))]" />
            <input type="search" value={query} onChange={e => setQuery(e.target.value)}
              aria-label="Buscar en la tienda por producto, marca o código" placeholder="Producto, marca o código..."
              className="shop-search w-full h-11 pl-10 pr-10 rounded-xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            {query && <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4" /></button>}
          </div>
          <button ref={filtersButton} type="button" onClick={() => setDrawerOpen(true)} aria-haspopup="dialog"
            className="h-11 px-4 rounded-xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] inline-flex items-center justify-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" />Filtros
            {(selectedBrands.size > 0 || category !== ALL) && <span className="rounded-full bg-primary text-white px-2 text-xs">{selectedBrands.size + (category !== ALL ? 1 : 0)}</span>}
          </button>
          <select aria-label="Ordenar productos" value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}
            className="h-11 min-w-0 px-3 rounded-xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] text-sm">
            <option value="category-asc">Por categoría</option><option value="name-asc">Nombre A→Z</option>
          </select>
        </div>
        {hasFilters && <div aria-label="Filtros activos" className="flex flex-wrap gap-2 mb-5 text-xs">
          {category !== ALL && <button type="button" onClick={() => setCategory(ALL)} aria-label="Quitar filtro de categoría" className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-2">{selectedNode ? categoryPath(selectedNode.id!, CATEGORY_GROUPS) : category.startsWith(EXACT_PREFIX) ? category.slice(EXACT_PREFIX.length) : category}<X size={12} /></button>}
          {[...selectedBrands].map(brand => <button type="button" key={brand} onClick={() => toggleBrand(brand)} aria-label={`Quitar marca ${brand}`} className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-2">{brand}<X size={12} /></button>)}
        </div>}

        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent onCloseAutoFocus={event => { event.preventDefault(); filtersButton.current?.focus(); }} className="w-full sm:max-w-md flex flex-col">
            <SheetHeader className="text-left"><SheetTitle>Filtros de la tienda</SheetTitle><SheetDescription>Elegí una categoría o las marcas que buscás.</SheetDescription></SheetHeader>
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              <div>
                <label htmlFor="shop-category" className="block font-semibold text-sm mb-2">Categoría</label>
                <select id="shop-category" value={category} onChange={e => setCategory(e.target.value)} className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm">
                  <option value={ALL}>Todas las categorías</option>
                  <optgroup label="Grupos">
                    {SIDEBAR_PARENTS.filter(parent => CATEGORY_GROUPS.some(g => parent.childLabels.includes(g.label))).map(parent => <option key={parent.label} value={parent.label}>{parent.label}</option>)}
                    {categoryOptions.filter(option => !option.value.startsWith(EXACT_PREFIX)).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </optgroup>
                  <optgroup label="Categorías y subcategorías">{orderedCategories(CATEGORY_GROUPS).filter(cat => cat.id).map(cat => <option key={cat.id} value={'__node__' + cat.id}>{categoryPath(cat.id!, CATEGORY_GROUPS)}</option>)}</optgroup>
                  <optgroup label="Categorías específicas">{exactCategories.map(cat => <option key={cat} value={EXACT_PREFIX + cat}>{cat}</option>)}</optgroup>
                  {category !== ALL && !category.startsWith(EXACT_PREFIX) && !categoryOptions.some(option => option.value === category) && !SIDEBAR_PARENTS.some(parent => parent.label === category) && <option value={category}>{category}</option>}
                </select>
              </div>
              <fieldset>
                <legend className="font-semibold text-sm mb-2">Marcas</legend>
                {selectedBrands.size > 0 && <button type="button" onClick={() => setSelectedBrands(new Set())} className="text-primary text-xs mb-2">Limpiar marcas</button>}
                {allBrands.map(brand => {
                  const checked = includesBrand(selectedBrands, brand);
                  const count = products.filter(p => brandKey(p.brand ?? '') === brandKey(brand) && matchesCategory(p)).length;
                  if (count === 0 && !checked) return null;
                  return <label key={brand} className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-primary/5 cursor-pointer text-sm">
                    <input type="checkbox" checked={checked} onChange={() => toggleBrand(brand)} className="h-4 w-4 accent-primary" />
                    <span className="flex-1">{brand}</span><span className="text-[hsl(var(--text-soft))]">{count}</span>
                  </label>;
                })}
                {allBrands.length === 0 && <p className="text-sm text-[hsl(var(--text-soft))]">No hay marcas disponibles.</p>}
              </fieldset>
            </div>
            <SheetFooter className="flex-col sm:flex-col gap-3 border-t border-border pt-4">
              <button type="button" onClick={() => setDrawerOpen(false)} className="bg-primary text-white py-3 rounded-xl font-semibold">Ver {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}</button>
              <button type="button" onClick={resetFilters} className="text-primary text-sm py-2">Limpiar todos los filtros</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {loading ? <div role="status" className="flex items-center justify-center py-24"><span className="sr-only">Cargando productos</span><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>
          : loadError ? <div role="alert" className="py-24 text-center space-y-4"><h2 className="text-xl font-bold">No pudimos cargar la tienda</h2><p>Intentá de nuevo en unos instantes.</p><button type="button" className="rounded-lg bg-primary text-white px-5 py-3" onClick={() => setRequest(n => n + 1)}>Reintentar</button></div>
          : filtered.length === 0 ? <div className="py-24 text-center"><h2 className="text-xl font-bold">Sin resultados</h2><p className="mt-2 text-[hsl(var(--text-soft))]">Probá con otros filtros o consultanos directamente.</p><button type="button" onClick={resetFilters} className="mt-4 bg-primary text-white px-5 py-3 rounded-xl">Ver todos</button></div>
          : <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
              {paginatedProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} onOpen={() => selectProduct(product)} cart={cart} />)}
            </div>
            {totalPages > 1 && <nav aria-label="Páginas de productos" className="flex flex-wrap items-center justify-center gap-2 mt-10">
              <button type="button" aria-label="Página anterior" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="h-10 px-3 rounded-xl border border-border disabled:opacity-30">←</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1).map((page, index, pages) => <span key={page} className="inline-flex items-center gap-2">
                {index > 0 && page - pages[index - 1] > 1 && <span aria-hidden="true">…</span>}
                <button type="button" aria-label={`Página ${page}`} aria-current={page === currentPage ? 'page' : undefined} onClick={() => goToPage(page)} className={`h-10 w-10 rounded-xl border text-sm font-semibold ${page === currentPage ? 'bg-primary text-white border-primary' : 'border-border hover:text-primary'}`}>{page}</button>
              </span>)}
              <button type="button" aria-label="Página siguiente" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="h-10 px-3 rounded-xl border border-border disabled:opacity-30">→</button>
            </nav>}
          </>}
      </div>
      <Footer />
      {!loading && !loadError && productCode && !selected && <div role="status" className="fixed bottom-24 left-4 right-4 z-40 bg-background border rounded-xl p-4 shadow-lg text-center">El producto de este enlace ya no está disponible. <button onClick={() => selectProduct(null)} className="text-primary underline">Seguir en la tienda</button></div>}
      <WhatsAppButton />
      {selected && <ProductModal key={selected.code} product={selected} onClose={() => selectProduct(null)} />}
    </main>
  );
}
