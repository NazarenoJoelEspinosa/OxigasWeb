import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import logo3m from '@assets/logo-3m.png';
import logoDewalt from '@assets/logo-dewalt.png';
import logoBremen from '@assets/logo-bremen.png';
import logoBosch from '@assets/logo-bosch.png';
import { whatsappUrl } from '@/config/constants';

const base = import.meta.env.BASE_URL;

const brands = [
  { name: '3M', src: logo3m },
  { name: 'DeWalt', src: logoDewalt },
  { name: 'Stanley', src: `${base}images/logos/stanley.png` },
  { name: 'Black & Decker', src: `${base}images/logos/blackdecker.png` },
  { name: 'Bosch', src: logoBosch },
  { name: 'Bremen', src: logoBremen },
  { name: 'Intraud', src: `${base}images/logos/intraud.png` },
  { name: 'Acindar', src: `${base}images/logos/acindar.png` },
  { name: 'Aleba', src: `${base}images/logos/aleba.png` },
  { name: 'Bahco', src: `${base}images/logos/bahco.png` },
  { name: 'Bulit', src: `${base}images/logos/bulit.png` },
  { name: 'Conarco', src: `${base}images/logos/conarco.png` },
  { name: 'Doble A', src: `${base}images/logos/doblea.png` },
  { name: 'Dogo', src: `${base}images/logos/dogo.png` },
  { name: 'Einhell', src: `${base}images/logos/einhell.png` },
  { name: 'Fischer', src: `${base}images/logos/fischer.png` },
  { name: 'Hamilton', src: `${base}images/logos/hamilton.png` },
  { name: 'Laser', src: `${base}images/logos/laser.png` },
  { name: 'Libus', src: `${base}images/logos/libus.png` },
  { name: 'Loctite', src: `${base}images/logos/loctite.png` },
  { name: 'Lusqtoff', src: `${base}images/logos/lusqtoff.png` },
  { name: 'Makita', src: `${base}images/logos/makita.png` },
  { name: 'Nebraska', src: `${base}images/logos/nebraska.png` },
  { name: 'Ombu', src: `${base}images/logos/ombu.png` },
  { name: 'Poxipol', src: `${base}images/logos/poxipol.png` },
  { name: 'Ruhlmann', src: `${base}images/logos/ruhlmann.png` },
  { name: 'Rust Oleum', src: `${base}images/logos/rustoleum.png` },
  { name: 'Siloc', src: `${base}images/logos/siloc.png` },
  { name: 'Sin Par', src: `${base}images/logos/sinpar.png` },
  { name: 'Skil', src: `${base}images/logos/skil.png` },
  { name: 'Suprabond', src: `${base}images/logos/suprabond.png` },
  { name: 'Tel', src: `${base}images/logos/tel.png` },
  { name: 'Truper', src: `${base}images/logos/truper.png` },
  { name: 'Tyrolit', src: `${base}images/logos/tyrolit.png` },
  { name: 'Uranga', src: `${base}images/logos/uranga.png` },
  { name: 'WD-40', src: `${base}images/logos/wd40.png` },
];

// Primeras marcas "destacadas" que se muestran en el grid fijo
const FEATURED_COUNT = 8;
const featuredBrands = brands.slice(0, FEATURED_COUNT);
// El resto va al carrusel
const carouselBrands = brands.slice(FEATURED_COUNT);

function BrandCard({ brand, index }: { brand: typeof brands[0]; index: number }) {
  return (
    <motion.a
      href={whatsappUrl(`Hola OXI-GAS, quiero consultar por productos de la marca ${brand.name}.`)}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -4, scale: 1.03 }}
      className="group flex flex-col items-center justify-center rounded-2xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 p-3 h-[90px] sm:h-[100px]"
    >
      <div className="w-full h-full rounded-xl bg-white flex items-center justify-center overflow-hidden px-3">
        <img
          src={brand.src}
          alt={brand.name}
          className="max-w-full max-h-[44px] object-contain transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // Si la imagen no carga, mostrar el nombre de la marca
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('span')) {
              const span = document.createElement('span');
              span.textContent = brand.name;
              span.className = 'text-xs font-bold text-gray-700 text-center';
              parent.appendChild(span);
            }
          }}
        />
      </div>
    </motion.a>
  );
}

export function Brands() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(160);

  useEffect(() => {
    const updateSizes = () => {
      if (window.innerWidth < 640) setCardWidth(150);
      else if (window.innerWidth < 768) setCardWidth(160);
      else setCardWidth(170);
    };
    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollBy({ left: direction === 'left' ? -(cardWidth * 3) : cardWidth * 3, behavior: 'smooth' });
  };

  return (
    <section id="marcas" className="py-24 bg-[hsl(var(--surface-0))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary mb-3">MARCAS</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[hsl(var(--text-main))] mb-4">
            Marcas de confianza
          </h2>
          <p className="text-lg md:text-xl text-[hsl(var(--text-soft))] max-w-2xl mx-auto">
            Trabajamos con marcas reconocidas para ofrecer calidad, respaldo y las mejores opciones.
            Tocá cualquier marca para consultarnos por WhatsApp.
          </p>
        </motion.div>

        {/* Grid de marcas destacadas — 4 columnas desktop, 3 tablet, 2 mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {featuredBrands.map((brand, i) => (
            <BrandCard key={brand.name} brand={brand} index={i} />
          ))}
        </div>

        {/* Divisor con texto */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center gap-4 mb-6"
        >
          <div className="flex-1 h-px bg-[hsl(var(--surface-3))]" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--text-soft))] shrink-0">
            {brands.length} marcas en total
          </p>
          <div className="flex-1 h-px bg-[hsl(var(--surface-3))]" />
        </motion.div>

        {/* Carrusel para el resto de marcas */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] text-[hsl(var(--text-main))] hover:border-primary hover:text-primary transition-all duration-300"
            aria-label="Ver marcas anteriores"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="relative flex-1 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 md:w-10 bg-gradient-to-r from-[hsl(var(--surface-0))] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 md:w-10 bg-gradient-to-l from-[hsl(var(--surface-0))] to-transparent z-10" />

            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto scroll-smooth no-scrollbar snap-x snap-mandatory px-1"
            >
              {carouselBrands.map((brand, index) => (
                <a
                  key={brand.name}
                  href={whatsappUrl(`Hola OXI-GAS, quiero consultar por productos de la marca ${brand.name}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group snap-center flex-shrink-0 w-[150px] h-[80px] sm:w-[160px] sm:h-[85px] md:w-[170px] md:h-[90px] rounded-2xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] hover:border-primary hover:-translate-y-1 transition-all duration-300 px-3"
                >
                  <div className="w-full h-full rounded-xl bg-white flex items-center justify-center overflow-hidden px-2">
                    <img
                      src={brand.src}
                      alt={brand.name}
                      className="max-w-full max-h-[38px] object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('span')) {
                          const span = document.createElement('span');
                          span.textContent = brand.name;
                          span.className = 'text-[10px] font-bold text-gray-700 text-center leading-tight';
                          parent.appendChild(span);
                        }
                      }}
                    />
                  </div>
                </a>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => scroll('right')}
            className="shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] text-[hsl(var(--text-main))] hover:border-primary hover:text-primary transition-all duration-300"
            aria-label="Ver más marcas"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Nota de pie */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-[hsl(var(--text-soft))]/60 mt-6"
        >
          ¿No encontrás la marca que buscás? Consultanos igual, trabajamos con muchos proveedores.
        </motion.p>
      </div>
    </section>
  );
}
