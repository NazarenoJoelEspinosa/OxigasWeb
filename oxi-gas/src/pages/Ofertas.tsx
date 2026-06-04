import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { MessageCircle, Tag, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { whatsappUrl } from '@/config/constants';
import { useOffers, OFFERS_TABLE_SQL } from '@/hooks/useOffers';

function formatPrecio(precio: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio);
}

export default function Ofertas() {
  const { offers, status } = useOffers(true);

  return (
    <main className="min-h-screen bg-[hsl(var(--surface-1))]">
      <Header />

      <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header de sección */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[hsl(var(--text-soft))] hover:text-primary transition-colors mb-6">
            <ArrowLeft size={16} />
            Volver al inicio
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 text-primary">
              <Tag size={20} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[hsl(var(--text-main))]">
              Ofertas
            </h1>
          </div>
          <p className="text-[hsl(var(--text-soft))] text-lg max-w-xl">
            Productos seleccionados a precios especiales. Consultá disponibilidad por WhatsApp.
          </p>
        </motion.div>

        {/* Estados */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[hsl(var(--text-soft))]">Cargando ofertas...</p>
          </div>
        )}

        {status === 'no-table' && (
          <div className="max-w-xl mx-auto p-6 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-900">Tabla de ofertas no configurada</p>
                <p className="text-sm text-amber-700 mt-1">
                  El administrador del sitio debe crear la tabla en Supabase para activar esta sección.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'ready' && offers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-6xl mb-4">🏷️</span>
            <h2 className="text-2xl font-bold text-[hsl(var(--text-main))] mb-2">
              Sin ofertas activas en este momento
            </h2>
            <p className="text-[hsl(var(--text-soft))] mb-6 max-w-xs">
              Consultanos por WhatsApp — siempre tenemos promociones disponibles.
            </p>
            <a
              href={whatsappUrl('Hola OXI-GAS, quiero conocer las ofertas y promociones disponibles.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
            >
              <MessageCircle size={18} />
              Consultar por WhatsApp
            </a>
          </div>
        )}

        {status === 'ready' && offers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {offers.map((offer, i) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group flex flex-col rounded-2xl bg-[hsl(var(--surface-0))] border border-[hsl(var(--surface-3))] hover:border-primary/40 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Imagen */}
                <div className="relative h-52 bg-gradient-to-br from-primary/8 to-primary/4 flex items-center justify-center overflow-hidden">
                  {offer.image ? (
                    <img
                      src={offer.image}
                      alt={offer.name}
                      className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-6xl select-none">🏷️</span>
                  )}
                  {/* Badge descuento */}
                  {offer.price != null && offer.original_price != null && (
                    <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                      -{Math.round((1 - offer.price / offer.original_price) * 100)}%
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 p-4">
                  {offer.brand && (
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
                      {offer.brand}
                    </p>
                  )}
                  <h3 className="font-bold text-[hsl(var(--text-main))] text-base leading-snug mb-2 line-clamp-2">
                    {offer.name}
                  </h3>
                  {offer.description && (
                    <p className="text-sm text-[hsl(var(--text-soft))] line-clamp-2 mb-3 flex-1">
                      {offer.description}
                    </p>
                  )}

                  {/* Precio */}
                  {offer.price != null && (
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-xl font-extrabold text-primary">
                        {formatPrecio(offer.price)}
                      </span>
                      {offer.original_price != null && (
                        <span className="text-sm text-[hsl(var(--text-soft))] line-through">
                          {formatPrecio(offer.original_price)}
                        </span>
                      )}
                    </div>
                  )}

                  <a
                    href={whatsappUrl(`Hola OXI-GAS, quiero consultar la oferta: ${offer.name}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#25d366] hover:bg-[#1ebe5d] text-white font-semibold text-sm transition-colors"
                  >
                    <MessageCircle size={15} />
                    Consultar por WhatsApp
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
      <WhatsAppButton />
    </main>
  );
}
