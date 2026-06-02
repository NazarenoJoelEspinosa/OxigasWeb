import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Zap, Percent, ChevronLeft, ChevronRight } from 'lucide-react';
import { whatsappUrl } from '@/config/constants';
import { useFeaturedOffers } from '@/hooks/useFeaturedOffers';

export function FeaturedOffers() {
  const { offers } = useFeaturedOffers();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  // Auto-advance cada 6 segundos
  useEffect(() => {
    if (!autoplay || offers.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [autoplay, offers.length]);

  const handlePrev = () => {
    setAutoplay(false);
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  const handleNext = () => {
    setAutoplay(false);
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  if (offers.length === 0) return null;

  const currentOffer = offers[currentIndex];

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
            <Percent className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
              PROMOCIONES
            </p>
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold text-[hsl(var(--text-main))] mb-4">
            Ofertas Destacadas
          </h2>

          <p className="text-lg md:text-xl text-[hsl(var(--text-soft))] max-w-3xl mx-auto">
            Aprovecha nuestras promociones especiales en productos seleccionados. Descuentos limitados por tiempo.
          </p>
        </motion.div>

        {/* Carrusel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="group overflow-hidden rounded-3xl bg-[hsl(var(--surface-0))] border border-primary/20 shadow-xl flex flex-col md:flex-row relative"
            >
              {/* Imagen o icono */}
              <div className="w-full md:w-1/2 h-80 md:h-auto bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                {currentOffer.image ? (
                  <motion.img
                    src={currentOffer.image}
                    alt={currentOffer.title}
                    className="w-full h-full object-cover"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                ) : (
                  <motion.span
                    className="text-9xl"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {currentOffer.icon}
                  </motion.span>
                )}
              </div>

              {/* Contenido */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                {/* Badge de descuento */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg mb-6 self-start">
                  <div className="text-center">
                    <div className="text-xs font-bold">HASTA</div>
                    <div className="text-2xl font-extrabold">{currentOffer.discount}</div>
                  </div>
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-[hsl(var(--text-main))] mb-4">
                  {currentOffer.title}
                </h3>

                <p className="text-lg text-[hsl(var(--text-soft))] mb-8">
                  {currentOffer.description}
                </p>

                <a
                  href={whatsappUrl(`Hola OXI-GAS, quiero conocer más sobre la promoción: ${currentOffer.title}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-base transition-all duration-300 group/btn w-fit"
                >
                  <MessageCircle className="w-5 h-5 group-hover/btn:animate-bounce" />
                  Consultar oferta
                </a>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controles del carrusel */}
          {offers.length > 1 && (
            <>
              {/* Botones de navegación */}
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 hover:bg-white text-primary shadow-lg transition-all duration-300 hover:shadow-xl md:left-0 md:-translate-x-6"
                aria-label="Oferta anterior"
              >
                <ChevronLeft size={24} />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 hover:bg-white text-primary shadow-lg transition-all duration-300 hover:shadow-xl md:right-0 md:translate-x-6"
                aria-label="Próxima oferta"
              >
                <ChevronRight size={24} />
              </button>

              {/* Indicadores de página */}
              <div className="flex items-center justify-center gap-3 mt-8">
                {offers.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      setAutoplay(false);
                      setCurrentIndex(index);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'bg-primary w-8'
                        : 'bg-primary/30 w-2 hover:bg-primary/50'
                    }`}
                    aria-label={`Ir a oferta ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Banner adicional */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20"
        >
          <div className="flex items-center gap-4 mb-4">
            <Zap className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold text-[hsl(var(--text-main))]">
              ¿No ves la oferta que buscas?
            </h3>
          </div>
          <p className="text-[hsl(var(--text-soft))] mb-4">
            Contactanos directamente por WhatsApp. Tenemos promociones personalizadas según tu volumen de compra.
          </p>
          <a
            href={whatsappUrl('Hola OXI-GAS, quiero conocer todas vuestras ofertas y promociones actuales.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all duration-300"
          >
            <MessageCircle className="w-5 h-5" />
            Escribinos por WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  );
}
