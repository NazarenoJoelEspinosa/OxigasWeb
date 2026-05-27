import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Sun, Moon, ChevronDown, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import oxiGasLogo from '@assets/logo-v2.png';

type HeaderProps = {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
};

// Navega al home y luego hace scroll al anchor correcto
function useHashNavigate() {
  const [, setLocation] = useLocation();

  return (hash: string) => {
    const id = hash.replace('#', '');

    // Si ya estamos en el home, solo scrollear
    if (window.location.pathname.endsWith('/') || window.location.pathname === '') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Si estamos en otra página, navegar al home y luego scrollear
    setLocation('/');
    // Esperar a que el DOM del home se monte
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 350);
  };
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const navigateTo = useHashNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mainLinks = [
    { name: 'Inicio', hash: 'inicio' },
    { name: 'Marcas', hash: 'marcas' },
    { name: 'Horarios', hash: 'horarios' },
    { name: 'Contacto', hash: 'contacto' },
  ];

  const productLinks = [
    { name: 'Gases comprimidos', hash: 'gases' },
    { name: 'Máquinas', hash: 'maquinas' },
    { name: 'Seguridad', hash: 'seguridad' },
    { name: 'Servicios', hash: 'productos' },
  ];

  return (
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
            // Logo más grande: h-16 mobile, h-19 desktop
            className="h-16 sm:h-22 w-auto object-contain transition-transform hover:scale-[1.02]"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {mainLinks.map((link) => (
            <button
              key={link.name}
              type="button"
              onClick={() => navigateTo(link.hash)}
              className="text-[hsl(var(--text-main))] hover:text-primary font-medium transition-colors bg-transparent border-none cursor-pointer"
            >
              {link.name}
            </button>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 text-[hsl(var(--text-main))] hover:text-primary font-medium transition-colors"
            >
              Productos
              <ChevronDown size={16} />
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
                      Ver catálogo completo
                      <ArrowRight size={16} />
                    </Link>
                    {productLinks.map((link) => (
                      <button
                        key={link.name}
                        type="button"
                        onClick={() => {
                          setProductsOpen(false);
                          navigateTo(link.hash);
                        }}
                        className="w-full text-left block rounded-xl px-4 py-3 text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))] hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
                      >
                        {link.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] px-4 py-2 text-[hsl(var(--text-main))] hover:border-primary transition-colors"
            aria-label="Cambiar modo de color"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
        </nav>

        <div className="lg:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="text-[hsl(var(--text-main))] p-2 hover:bg-[hsl(var(--surface-1))] rounded-lg transition-colors border border-[hsl(var(--surface-3))]"
            aria-label="Cambiar modo de color"
          >
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

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[hsl(var(--surface-1))] border-t border-[hsl(var(--surface-3))] overflow-hidden shadow-xl"
          >
            <div className="px-4 py-6 flex flex-col space-y-2">
              <Link
                href="/productos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-primary/10 text-primary font-semibold"
              >
                Ver catálogo completo
                <ArrowRight size={16} />
              </Link>
              {mainLinks.map((link) => (
                <button
                  key={link.name}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateTo(link.hash);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-[hsl(var(--surface-2))] text-[hsl(var(--text-main))] bg-transparent border-none cursor-pointer"
                >
                  {link.name}
                </button>
              ))}
              {productLinks.map((link) => (
                <button
                  key={link.name}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateTo(link.hash);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-[hsl(var(--surface-2))] text-[hsl(var(--text-main))] bg-transparent border-none cursor-pointer"
                >
                  {link.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
