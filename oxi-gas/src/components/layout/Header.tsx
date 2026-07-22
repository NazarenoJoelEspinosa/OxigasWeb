import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, ChevronDown, ArrowRight, ShoppingCart, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { QuoteCart } from '@/components/features/QuoteCart';
import { useCategoryGroups } from '@/hooks/useCategoryGroups';
const oxiGasLogo = './images/logo_oxigas_white.svg';

function useHashNavigate() {
  const [, setLocation] = useLocation();
  return (hash: string) => {
    const id = hash.replace('#', '');
    if (window.location.pathname.endsWith('/') || window.location.pathname === '') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setLocation('/');
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 350);
  };
}

export function Header() {
  const cart = useCart();
  const { groups } = useCategoryGroups();
  const [, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigateTo = useHashNavigate();

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerSearch.trim()) return;
    setProductsOpen(false);
    setHeaderSearch('');
    setLocation(`/productos?q=${encodeURIComponent(headerSearch.trim())}`);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mainLinks = [
    { name: 'Inicio', hash: 'inicio' },
    { name: 'Marcas', hash: 'marcas' },
    { name: 'Horarios', hash: 'horarios' },
    { name: 'Contacto', hash: 'contacto' },
    { name: 'Ofertas', href: '/ofertas' },
  ];

  // Links del dropdown "Productos" — dinámicos desde Supabase (useCategoryGroups).
  // "Ofertas" ya está excluido por el hook. Se muestran las primeras 5 categorías.
  const productLinks = groups.slice(0, 4).map(g => ({
    name: g.label,
    href: `/productos?categoria=${encodeURIComponent(g.label)}`,
  }));

  return (
    <>
      <header
        className={cn(
          'header-dark fixed top-0 w-full z-50 transition-all duration-300 border-b',
          isScrolled
            ? 'bg-[hsl(var(--h-bg))]/95 backdrop-blur-md shadow-lg border-[hsl(var(--h-border))] py-3'
            : 'bg-[hsl(var(--h-bg))] border-transparent py-4'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
          <Link href="/" aria-label="OXI-GAS - Inicio" className="shrink-0">
            <img
              src={oxiGasLogo}
              alt="OXI-GAS Ferretería Industrial"
              className="h-16 sm:h-20 w-auto object-contain transition-transform hover:scale-[1.02]"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {mainLinks.map((link) =>
              'href' in link ? (
                <Link key={link.name} href={link.href}
                  className="text-[hsl(var(--h-text))] hover:text-primary font-medium transition-colors">
                  {link.name}
                </Link>
              ) : (
                <button key={link.name} type="button" onClick={() => navigateTo(link.hash)}
                  className="text-[hsl(var(--h-text))] hover:text-primary font-medium transition-colors bg-transparent border-none cursor-pointer">
                  {link.name}
                </button>
              )
            )}

            {/* Dropdown Productos */}
            <div className="relative" onMouseEnter={() => setProductsOpen(true)} onMouseLeave={() => setProductsOpen(false)}>
              <Link href="/productos" className="inline-flex items-center gap-2 text-[hsl(var(--h-text))] hover:text-primary font-medium transition-colors">
                Productos <ChevronDown size={16} />
              </Link>
              <AnimatePresence>
                {productsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 top-full pt-4"
                    onAnimationComplete={() => searchInputRef.current?.focus()}
                  >
                    <div className="w-80 rounded-2xl border border-[hsl(var(--h-border))] bg-[hsl(var(--h-surface))] shadow-2xl p-3 flex flex-col gap-1">
                      {/* Buscador rápido */}
                      <form onSubmit={handleHeaderSearch} className="relative mb-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--h-soft))] pointer-events-none" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={headerSearch}
                          onChange={(e) => setHeaderSearch(e.target.value)}
                          placeholder="Buscar productos..."
                          className="w-full rounded-xl border border-[hsl(var(--h-border))] bg-[hsl(var(--h-surface2))] pl-8 pr-4 py-2.5 text-sm text-[hsl(var(--h-text))] placeholder:text-[hsl(var(--h-soft))] focus:outline-none focus:border-primary transition-colors"
                        />
                      </form>

                      <Link
                        href="/productos"
                        onClick={() => setProductsOpen(false)}
                        className="flex items-center justify-between rounded-xl px-4 py-3 bg-primary/10 text-primary font-semibold hover:bg-primary/15 transition-colors"
                      >
                        Ver catálogo completo <ArrowRight size={16} />
                      </Link>

                      <div className="pt-1 border-t border-[hsl(var(--h-border))]/60">
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--h-soft))]">Categorías</p>
                        {productLinks.map((link) => (
                          <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setProductsOpen(false)}
                            className="block rounded-xl px-4 py-2.5 text-sm text-[hsl(var(--h-text))] hover:bg-[hsl(var(--h-surface2))] hover:text-primary transition-colors"
                          >
                            {link.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Botón carrito */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--h-border))] bg-[hsl(var(--h-surface))] px-4 py-2 text-[hsl(var(--h-text))] hover:border-primary transition-colors"
              aria-label="Mi cotización"
            >
              <ShoppingCart size={18} />
              <span className="text-sm">Cotización</span>
              {cart.count > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-primary text-white text-xs font-bold">
                  {cart.count}
                </span>
              )}
            </button>
          </nav>

          {/* Mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative text-[hsl(var(--h-text))] p-2 hover:bg-[hsl(var(--h-surface))] rounded-lg transition-colors border border-[hsl(var(--h-border))]"
              aria-label="Mi cotización"
            >
              <ShoppingCart size={22} />
              {cart.count > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold">
                  {cart.count}
                </span>
              )}
            </button>

            <button
              className="text-[hsl(var(--h-text))] p-2 hover:bg-[hsl(var(--h-surface))] rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Menú mobile */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[hsl(var(--h-surface))] border-t border-[hsl(var(--h-border))] overflow-hidden shadow-xl"
            >
              <div className="px-4 py-6 flex flex-col space-y-2">
                <Link href="/productos" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-primary/10 text-primary font-semibold">
                  Ver catálogo completo <ArrowRight size={16} />
                </Link>
                {mainLinks.map((link) =>
                  'href' in link ? (
                    <Link key={link.name} href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg hover:bg-[hsl(var(--h-surface2))] text-[hsl(var(--h-text))]">
                      {link.name}
                    </Link>
                  ) : (
                    <button key={link.name} type="button"
                      onClick={() => { setMobileMenuOpen(false); navigateTo(link.hash); }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-[hsl(var(--h-surface2))] text-[hsl(var(--h-text))] bg-transparent border-none cursor-pointer">
                      {link.name}
                    </button>
                  )
                )}
                {productLinks.map((link) => (
                  <Link key={link.name} href={link.href} onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg hover:bg-[hsl(var(--h-surface2))] text-[hsl(var(--h-text))]">
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <QuoteCart cart={cart} open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
