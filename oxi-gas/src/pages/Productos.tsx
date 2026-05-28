import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Check, PackageSearch, Plus, Search, SlidersHorizontal, Tag, X } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { QuoteCart } from '@/components/features/QuoteCart';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/hooks/useTheme';
import { useQuoteCart } from '@/hooks/useQuoteCart';
import { supabase } from '@/lib/supabaseClient';

type CustomField = {
  key: string;
  label: string;
  placeholder?: string;
};

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

const ALL = 'all' as const;
type Filter = string | typeof ALL;

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

type NormalizedProduct = Product & { normalized: string };

function filterProducts(products: NormalizedProduct[], brand: Filter, category: Filter, query: string): NormalizedProduct[] {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return products.filter((p) => {
    if (brand !== ALL && p.brand !== brand) return false;
    if (category !== ALL && p.category !== category) return false;
    if (terms.length === 0) return true;
    return terms.every((t) => p.normalized.includes(t));
  });
}

export default function Productos() {
  const { theme, toggleTheme } = useTheme();
  const cart = useQuoteCart();
  const [brand, setBrand] = useState<Filter>(ALL);
  const [category, setCategory] = useState<Filter>(ALL);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.from('products').select('*').order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setProducts(data as Product[]);
        setCargando(false);
      });
  }, []);

  const normalizedProducts = useMemo<NormalizedProduct[]>(() =>
    products.map((p) => ({ ...p, normalized: normalize(`${p.name} ${p.code} ${p.brand ?? ''}`) })),
    [products]);

  const brands = useMemo(() => [...new Set(products.map((p) => p.brand).filter(Boolean) as string[])].sort(), [products]);
  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean) as string[])].sort(), [products]);
  const filtered = useMemo(() => filterProducts(normalizedProducts, brand, category, query), [normalizedProducts, brand, category, query]);
  const hasActiveFilters = brand !== ALL || category !== ALL || query.trim() !== '';
  const resetFilters = () => { setBrand(ALL); setCategory(ALL); setQuery(''); };

  return (
    <main className="min-h-screen bg-background relative">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <section className="pt-32 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[hsl(var(--text-soft))] hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />Volver al inicio
        </Link>
        <div className="mt-6 flex flex-col gap-4">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Catálogo</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[hsl(var(--text-main))] tracking-tight">Todos nuestros productos</h1>
          <p className="text-lg text-[hsl(var(--text-soft))] max-w-2xl">Filtrá por marca o categoría para encontrar lo que necesitás. Para cotizar o consultar stock, escribinos por WhatsApp.</p>
        </div>
      </section>

      <section className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5 pb-5 border-b border-[hsl(var(--surface-3))]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Filtrar por</h2>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/15 text-primary border-primary/30 px-3 py-1 text-sm font-bold">
                {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
              </Badge>
              {hasActiveFilters && (
                <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--text-soft))] hover:text-primary transition-colors">
                  <X className="h-3.5 w-3.5" />Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="filter-search" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--text-soft))]">
                <Search className="h-3.5 w-3.5" />Buscar
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--text-soft))]" />
                <input id="filter-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscá por nombre, código o marca"
                  className="w-full h-11 pl-10 pr-10 rounded-md border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-2))] text-sm text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-soft))] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors" />
                {query !== '' && (
                  <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-6 w-6 rounded-full text-[hsl(var(--text-soft))] hover:text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-3))] transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="filter-category" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--text-soft))]">
                <Tag className="h-3.5 w-3.5" />Categoría
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="filter-category" className="w-full h-11"><SelectValue placeholder="Todas las categorías" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas las categorías</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="filter-brand" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--text-soft))]">
                <Building2 className="h-3.5 w-3.5" />Marca
              </label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger id="filter-brand" className="w-full h-11"><SelectValue placeholder="Todas las marcas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas las marcas</SelectItem>
                  {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-[hsl(var(--surface-3))]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--text-soft))]">Activos:</span>
              {query.trim() !== '' && <FilterChip label={`"${query.trim()}"`} onRemove={() => setQuery('')} />}
              {category !== ALL && <FilterChip label={category} onRemove={() => setCategory(ALL)} />}
              {brand !== ALL && <FilterChip label={brand} onRemove={() => setBrand(ALL)} />}
            </div>
          )}
        </div>

        <div className="mt-10">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
              <p className="text-[hsl(var(--text-soft))]">Cargando productos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onReset={resetFilters} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index}
                  selected={cart.has(product.code)}
                  onToggle={(fv) => cart.toggle(product.code, fv)} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
      <QuoteCart cart={cart} />
    </main>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold px-3 py-1.5 border border-primary/30 transition-colors">
      {label}<X className="h-3 w-3" />
    </button>
  );
}

function ProductCard({ product, index, selected, onToggle }: { product: Product; index: number; selected: boolean; onToggle: (fv?: Record<string, string>) => void }) {
  const hasCustomFields = product.custom_fields && product.custom_fields.length > 0;

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = { cantidad: '' };
    product.custom_fields?.forEach((f) => { initial[f.key] = ''; });
    return initial;
  });

  const cantidadFilled = fieldValues['cantidad']?.trim() !== '';
  const customFilled = !hasCustomFields || product.custom_fields!.every((f) => fieldValues[f.key]?.trim() !== '');
  const allFilled = cantidadFilled && customFilled;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}>
      <Card className={`h-full transition-all duration-300 hover:shadow-lg ${selected ? 'border-primary/70 bg-[hsl(var(--surface-2))] ring-2 ring-primary/30' : 'border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] hover:border-primary/60'}`}>
        <CardHeader className="gap-3">
          {product.images?.[0] && (
            <img src={product.images[0]} alt={product.name} className="w-full h-40 object-contain rounded-lg bg-[hsl(var(--surface-2))]" />
          )}
          <div className="flex items-start justify-between gap-2">
            {product.category && <Badge variant="outline" className="uppercase tracking-wider text-[10px]">{product.category}</Badge>}
            {hasCustomFields && <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 uppercase tracking-wider text-[10px]">A medida</Badge>}
          </div>
          <CardTitle className="text-lg text-[hsl(var(--text-main))] leading-snug">{product.name}</CardTitle>
          {product.brand && <CardDescription className="text-sm text-[hsl(var(--text-soft))]">{product.brand}</CardDescription>}
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[hsl(var(--text-soft))]">
            <span className="uppercase tracking-wider font-semibold">Código:</span>
            <span className="text-[hsl(var(--text-main))]">{product.code}</span>
          </div>
          {product.description && <p className="text-xs text-[hsl(var(--text-soft))] line-clamp-2">{product.description}</p>}

          <div className={`flex flex-col gap-2.5 p-3 rounded-lg border ${hasCustomFields ? 'bg-amber-500/5 border-amber-500/20' : 'bg-[hsl(var(--surface-2))] border-[hsl(var(--surface-3))]'}`}>
            {hasCustomFields && <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Completá las medidas para cotizar</p>}

            <div className="flex flex-col gap-1">
              <label htmlFor={`${product.id}-cantidad`} className="text-xs font-semibold text-[hsl(var(--text-soft))]">Cantidad</label>
              <input id={`${product.id}-cantidad`} type="text" inputMode="numeric"
                value={fieldValues['cantidad'] ?? ''}
                onChange={(e) => setFieldValues((prev) => ({ ...prev, cantidad: e.target.value.replace(/[^0-9]/g, '') }))}
                placeholder="Ej: 2"
                className="h-9 px-3 rounded-md border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-0))] text-sm text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-soft))] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors" />
            </div>

            {hasCustomFields && product.custom_fields!.map((field) => (
              <div key={field.key} className="flex flex-col gap-1">
                <label htmlFor={`${product.id}-${field.key}`} className="text-xs font-semibold text-[hsl(var(--text-soft))]">{field.label}</label>
                <input id={`${product.id}-${field.key}`} type="text"
                  value={fieldValues[field.key] ?? ''}
                  onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder ?? ''}
                  className="h-9 px-3 rounded-md border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-0))] text-sm text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-soft))] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors" />
              </div>
            ))}
          </div>

          <button type="button" onClick={() => onToggle(fieldValues)} disabled={!allFilled && !selected}
            className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm py-2.5 px-4 transition-colors border ${
              selected ? 'bg-primary text-white border-primary hover:bg-primary/90'
              : !allFilled ? 'bg-transparent text-[hsl(var(--text-soft))] border-[hsl(var(--surface-3))] opacity-50 cursor-not-allowed'
              : 'bg-transparent text-[hsl(var(--text-main))] border-[hsl(var(--surface-3))] hover:border-primary hover:text-primary'
            }`}>
            {selected ? <><Check className="w-4 h-4" />Agregado a la cotización</> : <><Plus className="w-4 h-4" />Agregar a la cotización</>}
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 rounded-2xl border border-dashed border-[hsl(var(--surface-3))]">
      <PackageSearch className="h-12 w-12 text-[hsl(var(--text-soft))] mb-4" />
      <h2 className="text-xl font-bold text-[hsl(var(--text-main))]">No encontramos productos con esos filtros</h2>
      <p className="mt-2 text-[hsl(var(--text-soft))] max-w-md">Probá con otra combinación o consultanos directamente.</p>
      <button type="button" onClick={onReset} className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-sm py-2.5 px-5 transition-colors">
        Limpiar filtros
      </button>
    </div>
  );
}