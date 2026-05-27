import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Boxes, Layers, ShieldCheck, type LucideIcon } from 'lucide-react';
import { PRODUCTS, PRODUCT_BRANDS, PRODUCT_CATEGORIES } from '@/data/products';

type Highlight = {
  icon: LucideIcon;
  title: string;
  description: string;
};

function buildHighlights(): Highlight[] {
  if (PRODUCTS.length === 0) {
    return [
      { icon: Boxes, title: 'Catálogo en armado', description: 'Estamos cargando los productos más vendidos.' },
      { icon: Layers, title: 'Múltiples categorías', description: 'Soldadura, neumática, herramientas y más.' },
      { icon: ShieldCheck, title: 'Marcas líderes', description: 'Trabajamos con marcas reconocidas del rubro.' },
    ];
  }
  return [
    {
      icon: Boxes,
      title: `${PRODUCTS.length}+ productos`,
      description: 'Catálogo completo en una sola vista',
    },
    {
      icon: Layers,
      title: `${PRODUCT_CATEGORIES.length} categorías`,
      description: 'Soldadura, neumática, herramientas y más',
    },
    {
      icon: ShieldCheck,
      title: `${PRODUCT_BRANDS.length} marcas`,
      description: 'Las mejores marcas del rubro industrial',
    },
  ];
}

export function CatalogPreview() {
  const highlights = buildHighlights();

  return (
    <section
      id="catalogo"
      className="py-20 bg-[hsl(var(--surface-2))] border-y border-[hsl(var(--surface-3))]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Nuestro catálogo
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold text-[hsl(var(--text-main))] tracking-tight leading-tight">
              Encontrá lo que necesitás <br className="hidden sm:block" />
              en segundos
            </h2>
            <p className="mt-5 text-lg text-[hsl(var(--text-soft))] max-w-xl leading-relaxed">
              Explorá todos nuestros productos filtrando por marca o categoría. Cotizá lo que te
              interese directamente por WhatsApp.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/productos"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-base py-3.5 px-7 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02]"
              >
                Ver catálogo completo
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/productos"
                className="inline-flex items-center justify-center gap-2 border border-[hsl(var(--surface-3))] hover:border-primary text-[hsl(var(--text-main))] hover:text-primary font-semibold text-base py-3.5 px-7 rounded-xl transition-colors"
              >
                Filtrar por marca
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-4">
            {highlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                  className="rounded-2xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-1))] p-5 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15 text-primary mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-[hsl(var(--text-main))]">{item.title}</h3>
                  <p className="mt-1 text-sm text-[hsl(var(--text-soft))]">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
