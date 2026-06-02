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

const testimonials: Testimonial[] = [
  {
    name: 'Marcelo R.',
    role: 'Taller de soldadura, Caseros',
    text: 'Hace más de 10 años que compro los cilindros de oxígeno y acetileno acá. Siempre tienen stock, la entrega es rápida y el trato es excelente. No cambio por nada.',
    stars: 5,
    initials: 'MR',
    color: 'from-blue-500 to-blue-600',
  },
  {
    name: 'Patricia V.',
    role: 'Constructora, Ramos Mejía',
    text: 'Las herramientas eléctricas que compramos rindieron de manera impresionante en la obra. Además, nos ayudaron a elegir el equipo correcto para cada trabajo. Un servicio muy profesional.',
    stars: 5,
    initials: 'PV',
    color: 'from-orange-500 to-orange-600',
  },
  {
    name: 'Diego F.',
    role: 'Metalúrgica, San Justo',
    text: 'Pedimos los electrodos y el alambre MIG en cantidad y siempre lo tienen. Los precios son muy convenientes para compras industriales. Le recomiendo a cualquier taller.',
    stars: 5,
    initials: 'DF',
    color: 'from-green-500 to-green-600',
  },
  {
    name: 'Gustavo M.',
    role: 'Servicio técnico, Morón',
    text: 'Fui por primera vez buscando un equipo para soldar y me asesoraron sin apuro, explicándome cada opción. Me fui con lo que realmente necesitaba, no con lo más caro.',
    stars: 5,
    initials: 'GM',
    color: 'from-purple-500 to-purple-600',
  },
  {
    name: 'Alejandro T.',
    role: 'Carpintería metálica, Castelar',
    text: 'Llevo años siendo cliente y nunca me fallaron. Stock permanente, asesoramiento real y un equipo que sabe del rubro. Es mi proveedor de confianza para todo lo que es soldadura y gases.',
    stars: 5,
    initials: 'AT',
    color: 'from-red-500 to-red-600',
  },
  {
    name: 'Laura S.',
    role: 'Empresa de mantenimiento, Ciudadela',
    text: 'Compramos herramientas eléctricas y materiales de fijación para contratos de mantenimiento industrial. Siempre nos atienden bien y el pedido llega completo y a tiempo.',
    stars: 5,
    initials: 'LS',
    color: 'from-teal-500 to-teal-600',
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
            Talleres, metalúrgicas y empresas de la zona confían en OXI-GAS para su trabajo diario.
          </p>

          {/* Rating global */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-2xl font-extrabold text-[hsl(var(--text-main))]">5.0</span>
            <span className="text-[hsl(var(--text-soft))] text-sm">· Atención de excelencia</span>
          </div>
        </motion.div>

        {/* Grid de testimonios */}
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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