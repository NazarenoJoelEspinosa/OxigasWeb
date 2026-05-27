import { Phone, Clock, Instagram, MessageCircle } from 'lucide-react';
import { WHATSAPP_URL, CONTACT, HOURS } from '@/config/constants';
import oxiGasLogo from '@assets/logo-v2.png';

const quickLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Productos', href: '#productos' },
  { label: 'Seguridad', href: '#seguridad' },
  { label: 'Marcas', href: '#marcas' },
  { label: 'Horarios', href: '#horarios' },
  { label: 'Contacto', href: '#contacto' },
];

export function Footer() {
  return (
    <footer className="bg-[hsl(var(--surface-0))] text-[hsl(var(--text-main))] pt-20 pb-10 border-t border-[hsl(var(--surface-3))]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">

          <div className="col-span-1">
            <a href="#inicio" className="inline-block mb-6" aria-label="Volver al inicio">
              <img
                src={oxiGasLogo}
                alt="OXI-GAS Ferretería Industrial"
                className="h-14 w-auto"
              />
            </a>
            <p className="text-[hsl(var(--text-soft))] text-lg mb-6 leading-relaxed">
              Tu ferretería industrial de confianza. Proveemos soluciones integrales en gases comprimidos y herramientas de primera línea.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25d366] hover:bg-[#25d366]/90 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Hacer un pedido
            </a>
          </div>

          <div className="col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-6">Enlaces Rápidos</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[hsl(var(--text-soft))] hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-6">Información</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-[hsl(var(--text-soft))] hover:text-[#25d366] transition-colors group"
                >
                  <div className="w-10 h-10 bg-[hsl(var(--surface-2))] rounded-full flex items-center justify-center mr-4 group-hover:bg-[#25d366]/20 transition-colors shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="text-lg">{CONTACT.phone}</span>
                </a>
              </li>
              <li className="flex items-center text-[hsl(var(--text-soft))]">
                <div className="w-10 h-10 bg-[hsl(var(--surface-2))] rounded-full flex items-center justify-center mr-4 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-sm">
                  Lun-Vie: {HOURS.weekdays.short}<br />Sáb: {HOURS.saturday.short}
                </span>
              </li>
              <li>
                <a
                  href={CONTACT.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-[hsl(var(--text-soft))] hover:text-[#e1306c] transition-colors group"
                >
                  <div className="w-10 h-10 bg-[hsl(var(--surface-2))] rounded-full flex items-center justify-center mr-4 group-hover:bg-[#e1306c]/20 transition-colors shrink-0">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <span className="text-lg">{CONTACT.instagram}</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-[hsl(var(--surface-3))]/50 pt-8 flex flex-col items-center text-center text-[hsl(var(--text-soft))] text-sm">
          <p>&copy; {new Date().getFullYear()} OXI-GAS Ferretería Industrial. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
