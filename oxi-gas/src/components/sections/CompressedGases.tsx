import { motion } from 'framer-motion';

const base = import.meta.env.BASE_URL;

const gases = [
  {
    title: 'Gas envasado',
    description:
      'Contamos con opciones de gas envasado para distintas necesidades, con atención personalizada y asesoramiento para tu compra.',
    image: `${base}images/gases/ypf-gas.png`,
  },
  {
    title: 'Gases comprimidos',
    description:
      'Disponemos de gases comprimidos para uso industrial, soldadura y trabajos técnicos, con variedad de envases y formatos.',
    image: `${base}images/gases/cilindros-industriales.jpg`,
  },
  {
    title: 'Asesoramiento técnico',
    description:
      'Te ayudamos a elegir el gas y el envase adecuado según tu trabajo. Contamos con stock permanente y atención personalizada.',
    image: `${base}images/gases/asesoramiento.jpg`,
  },
];

export function CompressedGases() {
  return (
    <section id="gases" className="py-24 bg-[hsl(var(--surface-1))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary mb-3">
            GASES
          </p>

          <h2 className="text-4xl md:text-5xl font-extrabold text-[hsl(var(--text-main))] mb-4">
            Soluciones en gases
          </h2>

          <p className="text-lg md:text-xl text-[hsl(var(--text-soft))] max-w-3xl mx-auto">
            Ofrecemos gases para uso industrial, soldadura y aplicaciones técnicas con asesoramiento profesional.
          </p>
        </motion.div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {gases.map((gas, index) => (
            <motion.div
              key={gas.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="group overflow-hidden rounded-3xl bg-[hsl(var(--surface-0))] border border-[hsl(var(--surface-3))] shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              
              <div className="h-72 bg-white flex items-center justify-center p-6">
                <img
                  src={gas.image}
                  alt={gas.title}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-bold text-[hsl(var(--text-main))] mb-3">
                  {gas.title}
                </h3>

                <p className="text-[hsl(var(--text-soft))]">
                  {gas.description}
                </p>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
