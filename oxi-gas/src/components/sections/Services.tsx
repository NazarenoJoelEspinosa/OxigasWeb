import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { useCategoryGroups } from '@/hooks/useCategoryGroups';

export function Services() {
  const { groups, status } = useCategoryGroups();

  const HOME_LABELS = ['Gases', 'Soldadura', 'Herramientas Manuales', 'Herramientas Eléctricas'];
  const categorias = groups.filter((g) => HOME_LABELS.includes(g.label));

  return (
    <section id="productos" className="py-24 bg-[hsl(var(--surface-0))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary mb-3">
            CATEGORÍAS
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[hsl(var(--text-main))] mb-4">
            Categorías de Productos
          </h2>
          <p className="text-xl text-[hsl(var(--text-soft))] max-w-2xl mx-auto">
            Todo lo que necesitás para tu trabajo industrial
          </p>
        </motion.div>

        {/* Skeleton mientras carga desde Supabase */}
        {status === 'loading' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-[hsl(var(--surface-2))] rounded-2xl p-8 h-64 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {categorias.map((group, index) => {
              // Slugs que empiezan con mayúscula = nombres de productos reales,
              // no slugs técnicos (ej: "Oxígeno", "Acetileno" en vez de "gases").
              const ejemplos = group.slugs
                .filter((s) => /^[A-ZÁÉÍÓÚÑÜ]/.test(s))
                .slice(0, 5);

              return (
                <motion.div
                  key={group.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.5 }}
                  className="bg-[hsl(var(--surface-2))] rounded-2xl p-8 shadow-lg border-t-4 border-t-primary border-x border-b border-[hsl(var(--surface-3))]/60 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col"
                >
                  {/* Ícono emoji desde Supabase */}
                  <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-4xl" role="img" aria-label={group.label}>
                      {group.icon}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-[hsl(var(--text-main))] mb-4">
                    {group.label}
                  </h3>

                  {/* Ejemplos de productos de esta categoría */}
                  {ejemplos.length > 0 && (
                    <ul className="space-y-3 mb-8 flex-1">
                      {ejemplos.map((item) => (
                        <li
                          key={item}
                          className="flex items-center text-[hsl(var(--text-main))]"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  <Link
                    href={`/productos?categoria=${encodeURIComponent(group.label)}`}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary/10 hover:bg-primary hover:text-white text-primary font-semibold text-sm transition-all duration-300 group mt-auto"
                  >
                    Ver productos
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}