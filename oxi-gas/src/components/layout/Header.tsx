import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { QuoteCart } from '@/components/features/QuoteCart';
const oxiGasLogo = `${import.meta.env.BASE_URL}images/logo_oxigas_white.svg`;

type NavLink =
  | { kind: 'section'; name: string; hash: string }
  | { kind: 'route'; name: string; href: string };

const mainLinks: NavLink[] = [
  { kind: 'section', name: 'Inicio', hash: 'inicio' },
  { kind: 'route', name: 'Tienda', href: '/productos' },
  { kind: 'route', name: 'Ofertas', href: '/ofertas' },
  { kind: 'section', name: 'Marcas', hash: 'marcas' },
  { kind: 'section', name: 'Horarios', hash: 'horarios' },
  { kind: 'section', name: 'Contacto', hash: 'contacto' },
];

function useHashNavigate() {
  const [, setLocation] = useLocation();
  return (hash: string) => {
    const id = hash.replace('#', '');
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setLocation('/#' + encodeURIComponent(id));
  };
}

export function Header() {
  const cart = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const navigateTo = useHashNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-2 sm:gap-4">
          <Link href="/" aria-label="OXI-GAS - Inicio" className="shrink-0">
            <img
              src={oxiGasLogo}
              alt="OXI-GAS Ferretería Industrial"
              className="h-12 sm:h-20 max-w-[40vw] sm:max-w-none w-auto object-contain transition-transform hover:scale-[1.02]"
            />
          </Link>

          <nav aria-label="Navegación principal" className="hidden lg:flex items-center gap-6">
            {mainLinks.map((link) =>
              link.kind === 'route' ? (
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
          <div className="lg:hidden flex items-center gap-1">
            <Link href="/productos" onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg bg-primary px-2.5 py-2 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Tienda
            </Link>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative text-[hsl(var(--h-text))] p-1.5 hover:bg-[hsl(var(--h-surface))] rounded-lg transition-colors border border-[hsl(var(--h-border))]"
              aria-label="Mi cotización"
            >
              <ShoppingCart size={20} />
              {cart.count > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold">
                  {cart.count}
                </span>
              )}
            </button>

            <button
              className="text-[hsl(var(--h-text))] p-2 hover:bg-[hsl(var(--h-surface))] rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
              id="mobile-navigation"
              className="lg:hidden bg-[hsl(var(--h-surface))] border-t border-[hsl(var(--h-border))] overflow-hidden shadow-xl"
            >
              <div className="px-4 py-6 flex flex-col space-y-2">
                {mainLinks.map((link) =>
                  link.kind === 'route' ? (
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <QuoteCart cart={cart} open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
