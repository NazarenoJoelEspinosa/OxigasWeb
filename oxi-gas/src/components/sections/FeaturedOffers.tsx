import { motion } from 'framer-motion';
import { MessageCircle, Zap, Percent } from 'lucide-react';
import { whatsappUrl } from '@/config/constants';
import { useFeaturedOffers } from '@/hooks/useFeaturedOffers';

export function FeaturedOffers() {
  const { offers } = useFeaturedOffers();
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {offers.map((offer, index) => (
            <motion.div
              key={offer.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="group overflow-hidden rounded-3xl bg-[hsl(var(--surface-0))] border border-primary/20 shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col relative"
            >
              {/* Badge de descuento */}
              <div className="absolute top-4 right-4 z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg">
                <div className="text-center">
                  <div className="text-xs font-bold">HASTA</div>
                  <div className="text-2xl font-extrabold">{offer.discount}</div>
                </div>
              </div>

              {/* Icon */}
              <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <span className="text-7xl">{offer.icon}</span>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-[hsl(var(--text-main))] mb-3">
                  {offer.title}
                </h3>

                <p className="text-[hsl(var(--text-soft))] mb-6 flex-1">
                  {offer.description}
                </p>

                <a
                  href={whatsappUrl(`Hola OXI-GAS, quiero conocer más sobre la promoción: ${offer.title}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-all duration-300 group/btn"
                >
                  <MessageCircle className="w-4 h-4 group-hover/btn:animate-bounce" />
                  Consultar oferta
                </a>
              </div>
            </motion.div>
          ))}
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
