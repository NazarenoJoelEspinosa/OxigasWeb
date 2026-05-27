import { motion } from 'framer-motion';

const consultingItems = [
  {
    title: 'Protocolos de Seguridad para Cilindros de Gas',
    desc: 'Asesoramiento sobre el correcto almacenamiento, manipulación y protocolos de seguridad para cilindros de gases comprimidos.',
  },
  {
    title: 'Selección de Equipos de Soldadura',
    desc: 'Ayudamos a elegir el equipo de soldadura adecuado para cada aplicación, optimizando costos y rendimiento.',
  },
  {
    title: 'Consultoría en Herramientas Industriales',
    desc: 'Recomendaciones profesionales sobre la selección de herramientas para maximizar la productividad y vida útil.',
  },
];

export function TechnicalConsulting() {
  return (
    <section id="tecnico" className="py-24 bg-[hsl(var(--surface-1))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary mb-3">ASESORAMIENTO</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[hsl(var(--text-main))] mb-4">
            Asesoramiento Técnico
          </h2>
          <p className="text-xl text-[hsl(var(--text-soft))] max-w-2xl mx-auto">
            Más que productos — somos tu socio técnico
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {consultingItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-[hsl(var(--surface-2))] p-8 rounded-2xl border border-[hsl(var(--surface-3))] hover:border-primary/50 transition-colors"
            >
              <h3 className="text-xl font-bold text-[hsl(var(--text-main))] mb-4">{item.title}</h3>
              <p className="text-[hsl(var(--text-soft))] leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
