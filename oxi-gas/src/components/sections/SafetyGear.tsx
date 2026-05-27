import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const safetyItems = [
  'Máscaras y pantallas para soldadura',
  'Guantes de cuero reforzado y resistentes al calor',
  'Ropa de trabajo ignífuga certificada',
  'Calzado de seguridad con punta de acero',
  'Protectores auditivos y lentes de seguridad',
  'Arneses y equipos para trabajo en altura',
];

export function SafetyGear() {
  return (
    <section id="seguridad" className="py-24 bg-[hsl(var(--surface-1))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary font-bold tracking-[0.25em] uppercase text-sm mb-4 block">
              SEGURIDAD PROFESIONAL
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[hsl(var(--text-main))] mb-6">
              Equipos de Protección Personal
            </h2>
            <p className="text-xl text-[hsl(var(--text-soft))] mb-8 leading-relaxed">
              Contamos con la línea completa de EPP certificado para soldadura y trabajo industrial pesado. Protección con estándares internacionales.
            </p>

            <ul className="space-y-4 mb-10">
              {safetyItems.map((item) => (
                <li key={item} className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mr-3 mt-0.5" />
                  <span className="text-[hsl(var(--text-main))] text-lg">{item}</span>
                </li>
              ))}
            </ul>

            <a
              href="#contacto"
              className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20"
            >
              Hacer una Consulta
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative h-[600px] rounded-3xl overflow-hidden group shadow-2xl shadow-black/50"
          >
            <img
              src="https://images.unsplash.com/photo-1607400201515-c2c41c07d307?auto=format&fit=crop&w=800&q=80"
              alt="Equipos de Protección Personal"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--surface-0))]/90 via-[hsl(var(--surface-0))]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 w-full">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-2xl font-bold text-white">Equipos Certificados</h3>
                <p className="text-white/80 mt-1">Protección Industrial</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
