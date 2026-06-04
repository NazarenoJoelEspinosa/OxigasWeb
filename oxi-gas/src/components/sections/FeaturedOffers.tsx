import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Zap, Tag, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { whatsappUrl } from '@/config/constants';
import { useOffers } from '@/hooks/useOffers';

function formatPrecio(precio: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio);
}

export function FeaturedOffers() {
  const { offers, status } = useOffers(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay || offers.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [autoplay, offers.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [offers.length]);

  const handlePrev = () => {
    setAutoplay(false);
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  const handleNext = () => {
    setAutoplay(false);
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  if (status === 'loading' || status === 'no-table' || offers.length === 0) return null;

  const oferta = offers[currentIndex];

  return (
    <section id="ofertas" className="py-24 bg-gradient-to-b from-[hsl(var(--surface-0))] to-[hsl(var(--surface-1))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Tag className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">OFERTAS</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[hsl(var(--text-main))] mb-4">
            Productos en Oferta
          </h2>
          <p className="text-lg md:text-xl text-[hsl(var(--text-soft))] max-w-3xl mx-auto">
            Productos seleccionados a precios especiales. Consultá disponibilidad.
          </p>
        </motion.div>

        {/* Carrusel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden rounded-3xl bg-[hsl(var(--surface-0))] border border-primary/20 shadow-xl flex flex-col md:flex-row"
            >
              {/* Imagen */}
              <div className="w-full md:w-1/2 h-80 md:h-auto bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                {oferta.image ? (
                  <motion.img
                    src={oferta.image}
                    alt={oferta.name}
                    className="w-full h-full object-contain p-8"
                    initial={{ scale: 0.97 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                ) : (
                  <motion.span
                    className="text-9xl select-none"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    🏷️
                  </motion.span>
                )}
              </div>

              {/* Datos */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                {/* Precios */}
                {oferta.price != null && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
                      <Tag className="w-4 h-4 text-primary" />
                      <span className="text-2xl font-extrabold text-primary">
                        {formatPrecio(oferta.price)}
                      </span>
                    </div>
                    {oferta.original_price != null && (
                      <span className="text-lg text-[hsl(var(--text-soft))] line-through">
                        {formatPrecio(oferta.original_price)}
                      </span>
                    )}
                  </div>
                )}

                {oferta.brand && (
                  <p className="text-sm font-semibold uppercase tracking-widest text-primary/70 mb-2">
                    {oferta.brand}
                  </p>
                )}

                <h3 className="text-3xl md:text-4xl font-bold text-[hsl(var(--text-main))] mb-4">
                  {oferta.name}
                </h3>

                {oferta.description && (
                  <p className="text-lg text-[hsl(var(--text-soft))] mb-8 line-clamp-3">
                    {oferta.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <a
                    href={whatsappUrl(`Hola OXI-GAS, quiero consultar el precio del producto en oferta: ${oferta.name}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-base transition-all duration-300 group/btn"
                  >
                    <MessageCircle className="w-5 h-5 group-hover/btn:animate-bounce" />
                    Consultar por WhatsApp
                  </a>
                  {offers.length > 1 && (
                    <Link
                      href="/ofertas"
                      className="inline-flex items-center gap-2 py-3 px-5 rounded-xl border border-[hsl(var(--surface-3))] hover:border-primary text-[hsl(var(--text-main))] hover:text-primary font-semibold text-base transition-colors"
                    >
                      Ver todas <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {offers.length > 1 && (
            <>
              <button onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 hover:bg-white text-primary shadow-lg transition-all duration-300 hover:shadow-xl md:left-0 md:-translate-x-6"
                aria-label="Oferta anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <button onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 hover:bg-white text-primary shadow-lg transition-all duration-300 hover:shadow-xl md:right-0 md:translate-x-6"
                aria-label="Siguiente oferta"
              >
                <ChevronRight size={24} />
              </button>
              <div className="flex items-center justify-center gap-3 mt-8">
                {offers.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => { setAutoplay(false); setCurrentIndex(index); }}
                    className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-primary w-8' : 'bg-primary/30 w-2 hover:bg-primary/50'}`}
                    aria-label={`Ir a oferta ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Banner inferior */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center gap-6"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-[hsl(var(--text-main))]">
                ¿Querés ver todas las ofertas?
              </h3>
            </div>
            <p className="text-[hsl(var(--text-soft))] text-sm">
              Tenemos promociones especiales según tu volumen de compra.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap shrink-0">
            <Link
              href="/ofertas"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary text-primary hover:bg-primary/10 font-semibold transition-colors text-sm"
            >
              Ver catálogo de ofertas <ArrowRight size={15} />
            </Link>
            <a
              href={whatsappUrl('Hola OXI-GAS, quiero conocer todas las ofertas y promociones disponibles.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
