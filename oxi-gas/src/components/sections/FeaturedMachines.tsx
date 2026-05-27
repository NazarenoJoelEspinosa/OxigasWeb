import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { whatsappUrl } from '@/config/constants';

const machines = [
  {
    name: 'Amoladoras',
    brand: 'Bosch',
    image: `${import.meta.env.BASE_URL}images/maquinas/bosch-1.png`,
  },
  {
    name: 'Taladros y atornilladores',
    brand: 'DeWalt',
    image: `${import.meta.env.BASE_URL}images/maquinas/dewalt-1.png`,
  },
  {
    name: 'Herramientas eléctricas',
    brand: 'Stanley',
    image: `${import.meta.env.BASE_URL}images/maquinas/stanley-1.png`,
  },
];

export function FeaturedMachines() {
  return (
    <section id="maquinas" className="py-24 bg-[hsl(var(--surface-1))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary mb-3">
            MÁQUINAS
          </p>

          <h2 className="text-4xl md:text-5xl font-extrabold text-[hsl(var(--text-main))] mb-4">
            Máquinas destacadas
          </h2>

          <p className="text-lg md:text-xl text-[hsl(var(--text-soft))] max-w-3xl mx-auto">
            Una selección de máquinas y herramientas de marcas reconocidas para trabajos exigentes, profesionales y de uso general.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {machines.map((machine, index) => {
            return (
              <motion.a
                key={machine.name}
                href={whatsappUrl(`Hola OXI-GAS, quiero consultar por ${machine.name} de ${machine.brand}.`)}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="group overflow-hidden rounded-3xl bg-[hsl(var(--surface-0))] border border-[hsl(var(--surface-3))] shadow-xl hover:-translate-y-2 transition-all duration-300"
              >

                <div className="h-72 bg-white flex items-center justify-center">
                  <img
                    src={machine.image}
                    alt={machine.name}
                    className="max-h-full max-w-full object-contain p-6"
                  />
                </div>

                <div className="p-6">
                  <p className="text-sm uppercase tracking-[0.2em] text-primary font-bold mb-2">
                    {machine.brand}
                  </p>

                  <h3 className="text-2xl font-bold text-[hsl(var(--text-main))] mb-3">
                    {machine.name}
                  </h3>

                  <p className="text-[hsl(var(--text-soft))] mb-5">
                    Consultá disponibilidad, precio y opciones de esta línea directamente por WhatsApp.
                  </p>

                  <div className="inline-flex items-center gap-2 rounded-full bg-[#25d366] text-white px-4 py-2 font-semibold">
                    <MessageCircle size={16} />
                    Consultar por WhatsApp
                  </div>
                </div>

              </motion.a>
            );
          })}

        </div>
      </div>
    </section>
  );
}
