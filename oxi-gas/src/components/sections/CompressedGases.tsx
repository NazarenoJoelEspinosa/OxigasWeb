import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { whatsappUrl } from '@/config/constants';

const base = import.meta.env.BASE_URL;

const gases = [
  {
    title: 'Recambio de garrafas en Ciudadela',
    description:
      'Recambio de garrafas de 10 y 15 kg, tubos de 45 kg y garrafas de gas para autoelevadores Clark. Consultá disponibilidad y las opciones para tu envase.',
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
            Gases industriales para soldadura y trabajos técnicos, y recambio de gas envasado en Ciudadela, con atención y asesoramiento personalizado.
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
                  alt={index === 0 ? 'Gas envasado: garrafas para recambio en OXI-GAS, Ciudadela' : gas.title}
                  loading="lazy"
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
                {index === 0 && <div className="mt-4 space-y-4">
                  <p className="text-sm text-[hsl(var(--text-soft))]">
                    ¿Buscás recarga de gas o de garrafas? Trabajamos mediante recambio: entregás el envase vacío y recibís otro lleno. Podés retirarlo en nuestro local o pedir la entrega a domicilio.
                  </p>
                  <p className="text-sm text-[hsl(var(--text-soft))]">
                    <strong>Retiro en el local:</strong> si venís a buscar la garrafa, te sale más barato. Estamos en Acosta 1906, Ciudadela.
                  </p>
                  <p className="text-sm text-[hsl(var(--text-soft))]">
                    <strong>Entrega a domicilio opcional:</strong> llevamos el envase lleno a tu puerta y retiramos el vacío. Consultá disponibilidad y coordiná el servicio por WhatsApp.
                  </p>
                  <p className="text-sm font-semibold text-primary">Reparto únicamente en Ciudadela, Caseros y Ramos Mejía.</p>
                  <a href={whatsappUrl('Hola OXI-GAS, quiero consultar por recambio de garrafas. Mi envase es de: 10 kg / 15 kg / 45 kg / autoelevador Clark. Quisiera conocer la disponibilidad y el precio para retirar en el local o pedir entrega a domicilio en Ciudadela, Caseros o Ramos Mejía.')}
                    target="_blank" rel="noopener noreferrer" className="inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90">
                    Consultar recambio por WhatsApp
                  </a>
                  <Link href="/productos?categoria=Gases" className="block text-sm text-primary underline">Ver productos de gases en la tienda</Link>
                </div>}
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
