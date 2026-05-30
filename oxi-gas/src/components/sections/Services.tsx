import { motion } from 'framer-motion';
import { Flame, Wrench, Hammer, ArrowRight, type LucideIcon } from 'lucide-react';
import { Link } from 'wouter';

type Category = {
  icon: LucideIcon;
  title: string;
  description: string;
  items: string[];
  filter: string;
};

const categories: Category[] = [
  {
    icon: Flame,
    title: 'Gases Comprimidos',
    description: 'Venta y Alquiler de gases para la industria',
    items: ['Oxigeno', 'Acetileno', 'Argón', 'CO₂ (Gas Carbonico)', 'Nitrogeno', 'Mix 20 (Atal)', 'Mix 310 (Noxal)'],
    filter: 'gases',
  },
  {
    icon: Wrench,
    title: 'Herramientas',
    description: 'Equipos de alta resistencia para construcción y mantenimiento industrial.',
    items: ['Amoladoras', 'Taladros', 'Compresores', 'Destornilladores'],
    filter: 'herramientas',
  },
  {
    icon: Hammer,
    title: 'Soldadura',
    description: 'Todo lo que necesitás para soldar de forma profesional.',
    items: ['Electrodos', 'Alambre MIG', 'Accesorios MIG', 'Discos de corte'],
    filter: 'soldadura',
  },
];

export function Services() {
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
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary mb-3">CATEGORÍAS</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[hsl(var(--text-main))] mb-4">
            Categorías de Productos
          </h2>
          <p className="text-xl text-[hsl(var(--text-soft))] max-w-2xl mx-auto">
            Todo lo que necesitás para tu trabajo industrial
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-[hsl(var(--surface-2))] rounded-2xl p-8 shadow-lg border-t-4 border-t-primary border-x border-b border-[hsl(var(--surface-3))]/60 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col"
              >
                <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
                  <Icon className="w-10 h-10 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-[hsl(var(--text-main))] mb-4">{category.title}</h3>
                <p className="text-[hsl(var(--text-soft))] text-lg mb-6 leading-relaxed">{category.description}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {category.items.map((item) => (
                    <li key={item} className="flex items-center text-[hsl(var(--text-main))]">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/productos?categoria=${encodeURIComponent(category.filter)}`}
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary/10 hover:bg-primary hover:text-white text-primary font-semibold text-sm transition-all duration-300 group"
                >
                  Ver productos
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
