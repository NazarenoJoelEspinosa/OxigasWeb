import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Sun, Moon, ChevronDown, ArrowRight, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useThemeContext } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { QuoteCart } from '@/components/features/QuoteCart';
import { useCategoryGroups } from '@/hooks/useCategoryGroups';
const oxiGasLogo = './images/logo_oxigas.png';

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
  const { theme, toggleTheme } = useThemeContext();
  const cart = useCart();
  const { groups } = useCategoryGroups();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const navigateTo = useHashNavigate();

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
  ];

  // Links del dropdown "Productos" — dinámicos desde Supabase (useCategoryGroups).
  // "Ofertas" ya está excluido por el hook. Se muestran las primeras 5 categorías.
  const productLinks = groups.slice(0, 5).map(g => ({
    name: g.label,
    href: `/productos?categoria=${encodeURIComponent(g.label)}`,
  }));

  return (
    <>
      <header
        className={cn(
          'fixed top-0 w-full z-50 transition-all duration-300 border-b',
          isScrolled
            ? 'bg-[hsl(var(--surface-0))]/92 backdrop-blur-md shadow-lg border-[hsl(var(--surface-3))] py-3'
            : 'bg-[hsl(var(--surface-0))] border-transparent py-4'
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
            {mainLinks.map((link) => (
              <button key={link.name} type="button" onClick={() => navigateTo(link.hash)}
                className="text-[hsl(var(--text-main))] hover:text-primary font-medium transition-colors bg-transparent border-none cursor-pointer">
                {link.name}
              </button>
            ))}

            {/* Dropdown Productos */}
            <div className="relative" onMouseEnter={() => setProductsOpen(true)} onMouseLeave={() => setProductsOpen(false)}>
              <Link href="/productos" className="inline-flex items-center gap-2 text-[hsl(var(--text-main))] hover:text-primary font-medium transition-colors">
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
                  >
                    <div className="w-72 rounded-2xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] shadow-2xl p-3">
                      <Link
                        href="/productos"
                        onClick={() => setProductsOpen(false)}
                        className="flex items-center justify-between rounded-xl px-4 py-3 bg-primary/10 text-primary font-semibold hover:bg-primary/15 transition-colors mb-2"
                      >
                        Ver catálogo completo <ArrowRight size={16} />
                      </Link>
                      {productLinks.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          onClick={() => setProductsOpen(false)}
                          className="block rounded-xl px-4 py-3 text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))] hover:text-primary transition-colors"
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Botón carrito */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] px-4 py-2 text-[hsl(var(--text-main))] hover:border-primary transition-colors"
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

            <button type="button" onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] px-4 py-2 text-[hsl(var(--text-main))] hover:border-primary transition-colors"
              aria-label="Cambiar modo de color">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
            </button>
          </nav>

          {/* Mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative text-[hsl(var(--text-main))] p-2 hover:bg-[hsl(var(--surface-1))] rounded-lg transition-colors border border-[hsl(var(--surface-3))]"
              aria-label="Mi cotización"
            >
              <ShoppingCart size={22} />
              {cart.count > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold">
                  {cart.count}
                </span>
              )}
            </button>

            <button type="button" onClick={toggleTheme}
              className="text-[hsl(var(--text-main))] p-2 hover:bg-[hsl(var(--surface-1))] rounded-lg transition-colors border border-[hsl(var(--surface-3))]"
              aria-label="Cambiar modo de color">
              {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <button
              className="text-[hsl(var(--text-main))] p-2 hover:bg-[hsl(var(--surface-1))] rounded-lg transition-colors"
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
              className="lg:hidden bg-[hsl(var(--surface-1))] border-t border-[hsl(var(--surface-3))] overflow-hidden shadow-xl"
            >
              <div className="px-4 py-6 flex flex-col space-y-2">
                <Link href="/productos" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-primary/10 text-primary font-semibold">
                  Ver catálogo completo <ArrowRight size={16} />
                </Link>
                {mainLinks.map((link) => (
                  <button key={link.name} type="button"
                    onClick={() => { setMobileMenuOpen(false); navigateTo(link.hash); }}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-[hsl(var(--surface-2))] text-[hsl(var(--text-main))] bg-transparent border-none cursor-pointer">
                    {link.name}
                  </button>
                ))}
                {productLinks.map((link) => (
                  <Link key={link.name} href={link.href} onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg hover:bg-[hsl(var(--surface-2))] text-[hsl(var(--text-main))]">
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