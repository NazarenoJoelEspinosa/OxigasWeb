import { motion, useReducedMotion } from 'framer-motion';
import { MessageCircle, ShieldCheck, Truck, Wrench, MapPin } from 'lucide-react';
import { WHATSAPP_URL } from '@/config/constants';

const trustBadges = [
  { icon: ShieldCheck, label: 'Marcas líderes' },
  { icon: Truck, label: 'Stock permanente' },
  { icon: Wrench, label: 'Asesoramiento' },
];

const zonas = [
  'Caseros', 'Ramos Mejía', 'Castelar', 'Morón',
  'San Justo', 'Villa Lugano', 'y zonas cercanas',
];

export function Hero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="inicio"
      className="relative min-h-[78vh] sm:min-h-[88vh] flex items-center pt-32 sm:pt-36 pb-16 sm:pb-20 overflow-hidden bg-[hsl(var(--surface-0))]"
    >
      <div aria-hidden="true" className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 right-[-10rem] h-[26rem] w-[26rem] rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-7"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6 bg-primary/10 text-primary border border-primary/30 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-[0.18em]"
            >
              <motion.span
                aria-hidden="true"
                animate={prefersReducedMotion ? undefined : { scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="h-2 w-2 rounded-full bg-primary"
              />
              Ferretería Industrial Profesional
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[hsl(var(--text-main))] tracking-tight mb-5 sm:mb-6 leading-[1.05]">
              Gases Comprimidos y{' '}
              <span className="text-primary">Herramientas</span> Industriales
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-[hsl(var(--text-soft))] mb-6 sm:mb-8 font-medium max-w-2xl leading-relaxed">
              Oxígeno · Acetileno · Argón · CO₂ | Equipos profesionales para soldadura y construcción
            </p>

            {/* Zona de cobertura */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-start gap-3 mb-8 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3"
            >
              <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-1">
                  Zona de entrega
                </p>
                <p className="text-sm text-[hsl(var(--text-soft))] leading-relaxed">
                  {zonas.join(' · ')}
                </p>
                <p className="text-xs text-[hsl(var(--text-soft))]/70 mt-1">
                  ¿Estás más lejos? Consultanos igual, te ayudamos.
                </p>
              </div>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <motion.a
                href="#contacto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex justify-center items-center bg-primary hover:bg-primary/90 text-white font-bold text-lg py-4 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300"
              >
                Hacer una consulta
              </motion.a>

              <motion.a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex justify-center items-center gap-3 bg-[#25d366] hover:bg-[#25d366]/90 text-white font-bold text-lg py-4 px-8 rounded-xl shadow-lg shadow-[#25d366]/20 transition-all duration-300"
              >
                <MessageCircle className="w-6 h-6" />
                Escribir por WhatsApp
              </motion.a>
            </div>

            <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {trustBadges.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2 text-sm text-[hsl(var(--text-soft))]">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="uppercase tracking-[0.15em] font-semibold">{label}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Columna derecha: foto del local */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-5 hidden lg:block"
          >
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/30 via-primary/5 to-transparent blur-2xl" aria-hidden="true" />
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 rotate-1">
                {/*
                  FOTO DEL LOCAL: para usar tu imagen real tenés dos opciones:
                  1) Subila a /public/images/ y usá: src="/images/local.jpg"
                  2) Importala: import localPhoto from '@assets/local.jpg'; src={localPhoto}
                  Por ahora queda el placeholder de Unsplash hasta que la subas.
                */}
                <img
                  src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=900&q=80"
                  alt="Local OXI-GAS Ferretería Industrial - Caseros"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--surface-0))]/80 via-transparent to-transparent" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -bottom-6 -left-8 bg-[hsl(var(--surface-2))] border border-[hsl(var(--surface-3))] rounded-2xl px-5 py-4 shadow-xl shadow-black/40 -rotate-2"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--text-soft))] font-bold">Atención</p>
                <p className="text-lg font-bold text-[hsl(var(--text-main))]">Lun a Sáb</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -top-4 -right-6 bg-primary text-white rounded-2xl px-5 py-3 shadow-xl shadow-primary/30 rotate-3"
              >
                <p className="text-xs uppercase tracking-[0.2em] font-bold opacity-80">+60 años</p>
                <p className="text-base font-bold">de experiencia</p>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
