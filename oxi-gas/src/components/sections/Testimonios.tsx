import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

type Testimonial = {
  name: string;
  role: string;
  text: string;
  stars: number;
  initials: string;
  color: string;
};

// ── Opiniones reales extraídas de Google Maps ─────────────────────────────────
const testimonials: Testimonial[] = [
  {
    name: 'Alejandro Gamino',
    role: 'Cliente verificado · Google',
    text: 'Muy buena atención, amplio surtido, precios razonables.',
    stars: 4,
    initials: 'A',
    color: 'from-blue-500 to-blue-600',
  },
  {
    name: 'Jorge Luis Szwedak',
    role: 'Cliente verificado · Google',
    text: 'Muy buena ferretería, excelente atención y buenos precios.',
    stars: 5,
    initials: 'J',
    color: 'from-orange-500 to-orange-600',
  },
  {
    name: 'Gabriel Campanelli',
    role: 'Cliente verificado · Google',
    text: 'Atiende toda la familia, hay un señor muy mayor con buen trato.',
    stars: 5,
    initials: 'CG',
    color: 'from-green-500 to-green-600',
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${count} estrellas de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < count ? 'fill-amber-400 text-amber-400' : 'text-[hsl(var(--surface-3))]'}`}
        />
      ))}
    </div>
  );
}

export function Testimonios() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section
      id="testimonios"
      className="py-24 bg-[hsl(var(--surface-0))] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary mb-3">
            LO QUE DICEN NUESTROS CLIENTES
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[hsl(var(--text-main))] mb-4">
            Más de 60 años de confianza
          </h2>
          <p className="text-xl text-[hsl(var(--text-soft))] max-w-2xl mx-auto">
            Más de 343 clientes dejaron su opinión en Google. Esto es lo que dicen.
          </p>

          {/* Rating global */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < 5 ? 'fill-amber-400 text-amber-400' : 'text-amber-200'}`} />
              ))}
            </div>
            <span className="text-2xl font-extrabold text-[hsl(var(--text-main))]">4.7</span>
            <a
              href="https://maps.google.com/?q=Oxigas+Acosta+1906+Ciudadela"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline font-semibold"
            >
              343 opiniones en Google ↗
            </a>
          </div>
        </motion.div>

        {/* Grid de testimonios */}
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="group relative bg-[hsl(var(--surface-2))] rounded-2xl p-6 border border-[hsl(var(--surface-3))]/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 flex flex-col gap-4"
            >
              {/* Comilla decorativa */}
              <Quote
                className="absolute top-4 right-4 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors"
                aria-hidden="true"
              />

              <StarRating count={t.stars} />

              <p className="text-[hsl(var(--text-soft))] text-sm leading-relaxed flex-1">
                "{t.text}"
              </p>

              {/* Autor */}
              <div className="flex items-center gap-3 pt-2 border-t border-[hsl(var(--surface-3))]/40">
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                  aria-hidden="true"
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-[hsl(var(--text-main))]">{t.name}</p>
                  <p className="text-xs text-[hsl(var(--text-soft))]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA inferior */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 text-center"
        >
          <p className="text-[hsl(var(--text-soft))] mb-4">¿Querés ser el próximo cliente satisfecho?</p>
          <a
            href="https://wa.me/5491134446666?text=Hola%20OXI-GAS%2C%20quiero%20hacer%20una%20consulta"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02]"
          >
            Consultanos por WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  );
}