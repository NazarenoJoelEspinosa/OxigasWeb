import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Zap, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { whatsappUrl } from '@/config/constants';
import { useOfertasProducts } from '@/hooks/useOfertasProducts';

function formatPrecio(precio: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio);
}

export function FeaturedOffers() {
  const { products, status } = useOfertasProducts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  // Auto-advance cada 6 segundos
  useEffect(() => {
    if (!autoplay || products.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [autoplay, products.length]);

  const handlePrev = () => {
    setAutoplay(false);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleNext = () => {
    setAutoplay(false);
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  // Mientras carga o si no hay productos en oferta, no renderizar la sección
  if (status === 'loading' || products.length === 0) return null;

  const producto = products[currentIndex];

  return (
    <section id="ofertas" className="py-24 bg-gradient-to-b from-[hsl(var(--surface-0))] to-[hsl(var(--surface-1))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Tag className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
              OFERTAS
            </p>
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
              {/* Imagen del producto */}
              <div className="w-full md:w-1/2 h-80 md:h-auto bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                {producto.images?.[0] ? (
                  <motion.img
                    src={producto.images[0]}
                    alt={producto.name}
                    className="w-full h-full object-cover"
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

              {/* Datos del producto */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">

                {/* Precio destacado */}
                {producto.price != null && (
                  <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 mb-6 self-start">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="text-2xl font-extrabold text-primary">
                      {formatPrecio(producto.price)}
                    </span>
                  </div>
                )}

                {/* Marca */}
                {producto.brand && (
                  <p className="text-sm font-semibold uppercase tracking-widest text-primary/70 mb-2">
                    {producto.brand}
                  </p>
                )}

                {/* Nombre */}
                <h3 className="text-3xl md:text-4xl font-bold text-[hsl(var(--text-main))] mb-4">
                  {producto.name}
                </h3>

                {/* Descripción */}
                {producto.description && (
                  <p className="text-lg text-[hsl(var(--text-soft))] mb-8 line-clamp-3">
                    {producto.description}
                  </p>
                )}

                {/* CTA WhatsApp */}
                
                  href={whatsappUrl(
                    `Hola OXI-GAS, quiero consultar el precio del producto en oferta: ${producto.name}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-base transition-all duration-300 group/btn w-fit"
                >
                  <MessageCircle className="w-5 h-5 group-hover/btn:animate-bounce" />
                  Consultar por WhatsApp
                </a>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controles de navegación */}
          {products.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 hover:bg-white text-primary shadow-lg transition-all duration-300 md:left-0 md:-translate-x-6"
                aria-label="Producto anterior"
              >
                <ChevronLeft size={24} />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 hover:bg-white text-primary shadow-lg transition-all duration-300 md:right-0 md:translate-x-6"
                aria-label="Siguiente producto"
              >
                <ChevronRight size={24} />
              </button>

              {/* Indicadores */}
              <div className="flex items-center justify-center gap-3 mt-8">
                {products.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => { setAutoplay(false); setCurrentIndex(index); }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'bg-primary w-8'
                        : 'bg-primary/30 w-2 hover:bg-primary/50'
                    }`}
                    aria-label={`Ir al producto ${index + 1}`}
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
          className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20"
        >
          <div className="flex items-center gap-4 mb-4">
            <Zap className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold text-[hsl(var(--text-main))]">
              ¿Querés conocer todas nuestras ofertas?
            </h3>
          </div>
          <p className="text-[hsl(var(--text-soft))] mb-4">
            Contactanos directamente por WhatsApp. Tenemos promociones especiales según tu volumen de compra.
          </p>
          
            href={whatsappUrl('Hola OXI-GAS, quiero conocer todas las ofertas y promociones disponibles.')}
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