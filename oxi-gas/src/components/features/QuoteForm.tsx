import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { whatsappUrl, ADDRESS } from '@/config/constants';

type FormFields = {
  nombre: string;
  empresa: string;
  telefono: string;
  direccion: string;
  mensaje: string;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;

function validateForm(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  const nombreTrimmed = fields.nombre.trim();
  if (!nombreTrimmed) {
    errors.nombre = 'El nombre es obligatorio.';
  } else if (nombreTrimmed.length < 3) {
    errors.nombre = 'Ingresá tu nombre completo (mínimo 3 caracteres).';
  } else if (/^\d+$/.test(nombreTrimmed)) {
    errors.nombre = 'El nombre no puede ser solo números.';
  } else if (!/[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]{2,}/.test(nombreTrimmed)) {
    errors.nombre = 'Ingresá un nombre válido.';
  }

  const telefonoLimpio = fields.telefono.replace(/\D/g, '');
  if (!telefonoLimpio) {
    errors.telefono = 'El teléfono es obligatorio.';
  } else if (telefonoLimpio.length < 10 || telefonoLimpio.length > 11) {
    errors.telefono = 'Ingresá un número válido (10 u 11 dígitos, sin el 0 ni el 15).';
  }

  const mensajeTrimmed = fields.mensaje.trim();
  if (!mensajeTrimmed) {
    errors.mensaje = 'Contanos en qué te podemos ayudar.';
  } else if (mensajeTrimmed.length < 10) {
    errors.mensaje = 'Por favor escribí un poco más de detalle (mínimo 10 caracteres).';
  }

  return errors;
}

const inputBase =
  'w-full bg-[hsl(var(--surface-0))] border rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all';

export function QuoteForm() {
  const [fields, setFields] = useState<FormFields>({
    nombre: '',
    empresa: '',
    telefono: '',
    direccion: '',
    mensaje: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormFields, boolean>>>({});

  const set = (key: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = key === 'telefono' ? e.target.value.replace(/\D/g, '') : e.target.value;
    const updated = { ...fields, [key]: value };
    setFields(updated);
    if (touched[key]) {
      setErrors(validateForm(updated));
    }
  };

  const blur = (key: keyof FormFields) => () => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validateForm(fields));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const allTouched = { nombre: true, empresa: true, telefono: true, direccion: true, mensaje: true };
    setTouched(allTouched);
    const validationErrors = validateForm(fields);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const lines = [
      'Hola OXI-GAS, me comunico desde la web.',
      '',
      `*Nombre:* ${fields.nombre}`,
      fields.empresa ? `*Empresa:* ${fields.empresa}` : null,
      `*Teléfono:* ${fields.telefono}`,
      fields.direccion ? `*Dirección:* ${fields.direccion}` : null,
      '',
      '*Consulta:*',
      fields.mensaje,
    ]
      .filter((l) => l !== null)
      .join('\n');

    const url = whatsappUrl(lines);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const fieldClass = (key: keyof FormFields) =>
    `${inputBase} ${touched[key] && errors[key] ? 'border-red-500/70' : 'border-[hsl(var(--surface-3))]'}`;

  return (
    <section id="contacto" className="py-24 bg-[hsl(var(--surface-2))]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary mb-3">Contacto</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[hsl(var(--text-main))] mb-4">
            ¿En qué te podemos ayudar?
          </h2>
          <p className="text-xl text-[hsl(var(--text-soft))] max-w-2xl mx-auto">
            Dejanos tu consulta y te respondemos a la brevedad en horario de atención.
            También podés escribirnos directo por WhatsApp.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-[hsl(var(--surface-1))] rounded-3xl p-8 md:p-12 shadow-2xl border border-[hsl(var(--surface-3))]"
          >
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="nombre" className="block text-sm font-medium text-[hsl(var(--text-soft))]">
                    Nombre completo <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    value={fields.nombre}
                    onChange={set('nombre')}
                    onBlur={blur('nombre')}
                    className={fieldClass('nombre')}
                    placeholder="Juan Pérez"
                    autoComplete="name"
                  />
                  {touched.nombre && errors.nombre && (
                    <p className="text-xs text-red-400 mt-1">{errors.nombre}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="empresa" className="block text-sm font-medium text-[hsl(var(--text-soft))]">
                    Empresa (Opcional)
                  </label>
                  <input
                    type="text"
                    id="empresa"
                    value={fields.empresa}
                    onChange={set('empresa')}
                    className={fieldClass('empresa')}
                    placeholder="Nombre de tu empresa"
                    autoComplete="organization"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="telefono" className="block text-sm font-medium text-[hsl(var(--text-soft))]">
                    Teléfono <span className="text-primary">*</span>
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    value={fields.telefono}
                    onChange={set('telefono')}
                    onBlur={blur('telefono')}
                    className={fieldClass('telefono')}
                    placeholder="Ej: 1123456789"
                    autoComplete="tel"
                    inputMode="numeric"
                  />
                  {touched.telefono && errors.telefono && (
                    <p className="text-xs text-red-400 mt-1">{errors.telefono}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="direccion" className="block text-sm font-medium text-[hsl(var(--text-soft))]">
                    Dirección (Opcional)
                  </label>
                  <input
                    type="text"
                    id="direccion"
                    value={fields.direccion}
                    onChange={set('direccion')}
                    className={fieldClass('direccion')}
                    placeholder="Ej: Acosta 1906, Ciudadela"
                    autoComplete="street-address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="mensaje" className="block text-sm font-medium text-[hsl(var(--text-soft))]">
                  ¿En qué te podemos ayudar? <span className="text-primary">*</span>
                </label>
                <textarea
                  id="mensaje"
                  value={fields.mensaje}
                  onChange={set('mensaje')}
                  onBlur={blur('mensaje')}
                  rows={5}
                  className={`${fieldClass('mensaje')} resize-none`}
                  placeholder="Contanos tu consulta, qué producto buscás, si necesitás un presupuesto, etc."
                />
                {touched.mensaje && errors.mensaje && (
                  <p className="text-xs text-red-400 mt-1">{errors.mensaje}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
              >
                Enviar consulta por WhatsApp
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-[hsl(var(--surface-1))] rounded-3xl p-8 border border-[hsl(var(--surface-3))] shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
              <MapPin className="w-7 h-7 text-primary" />
            </div>

            <h3 className="text-2xl font-bold text-[hsl(var(--text-main))] mb-4">Dirección del local</h3>

            <p className="text-[hsl(var(--text-soft))] text-lg leading-relaxed mb-6">
              {ADDRESS.street}
              <br />
              {ADDRESS.city}, {ADDRESS.province}
            </p>

            <div className="rounded-2xl overflow-hidden border border-[hsl(var(--surface-3))]">
              <iframe
                title="Mapa OXI-GAS"
                src={ADDRESS.mapsEmbed}
                width="100%"
                height="260"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
