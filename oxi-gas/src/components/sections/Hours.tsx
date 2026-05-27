import { motion } from 'framer-motion';
import { Clock, MapPin, Phone } from 'lucide-react';
import { CONTACT, ADDRESS, HOURS } from '@/config/constants';

export function Hours() {
  return (
    <section id="horarios" className="py-24 bg-[hsl(var(--surface-0))] border-y border-[hsl(var(--surface-3))]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-4xl font-extrabold text-[hsl(var(--text-main))]">Horarios de Atención</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-[hsl(var(--surface-2))] rounded-2xl p-8 border-l-4 border-primary shadow-lg">
                <h3 className="text-xl font-bold text-[hsl(var(--text-main))] mb-4 uppercase tracking-wider">{HOURS.weekdays.label}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center text-2xl font-medium text-[hsl(var(--text-main))] gap-2 sm:gap-6">
                  <span>{HOURS.weekdays.morning}</span>
                  <span className="hidden sm:block text-[hsl(var(--surface-3))]">|</span>
                  <span>{HOURS.weekdays.afternoon}</span>
                </div>
              </div>

              <div className="bg-[hsl(var(--surface-2))] rounded-2xl p-8 border border-[hsl(var(--surface-3))] shadow-lg">
                <h3 className="text-xl font-bold text-[hsl(var(--text-main))] mb-4 uppercase tracking-wider">{HOURS.saturday.label}</h3>
                <div className="text-2xl font-medium text-[hsl(var(--text-main))]">
                  {HOURS.saturday.hours}
                </div>
                <p className="text-[hsl(var(--text-soft))] mt-4 font-medium">{HOURS.sunday.label}: {HOURS.sunday.hours}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-[hsl(var(--surface-2))] flex items-center justify-center">
                <MapPin className="w-6 h-6 text-[hsl(var(--text-main))]" />
              </div>
              <h2 className="text-4xl font-extrabold text-[hsl(var(--text-main))]">Cómo llegar</h2>
            </div>

            <div className="bg-[hsl(var(--surface-2))] rounded-2xl p-8 h-[calc(100%-5rem)] border border-[hsl(var(--surface-3))] flex flex-col shadow-lg">
              <ul className="space-y-6 mb-8">
                <li className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[hsl(var(--text-main))] font-bold mb-1">Dirección</h4>
                    <p className="text-[hsl(var(--text-soft))]">
                      {ADDRESS.street}<br />{ADDRESS.postalCode} {ADDRESS.city}, Prov. de Buenos Aires
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[hsl(var(--text-main))] font-bold mb-1">Teléfono</h4>
                    <p className="text-[hsl(var(--text-soft))]">{CONTACT.phone}</p>
                  </div>
                </li>
              </ul>

              <div className="flex-grow w-full rounded-xl overflow-hidden border border-[hsl(var(--surface-3))] min-h-[200px]">
                <iframe
                  title="Ubicación OXI-GAS"
                  src={ADDRESS.mapsEmbed}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '200px', display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
