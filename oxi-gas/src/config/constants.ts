// ─────────────────────────────────────────────
//  Constantes globales de OXI-GAS
//  Editá este archivo para actualizar datos de
//  contacto, dirección y horarios en todo el sitio.
// ─────────────────────────────────────────────

export const WHATSAPP_NUMBER = '5491134446666';

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export function whatsappUrl(message: string): string {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}

// ── Contacto ──────────────────────────────────
export const CONTACT = {
  phone: '+54 9 11 3444-6666',
  instagram: '@ferreteriaoxigas',
  instagramUrl: 'https://www.instagram.com/ferreteriaoxigas/',
} as const;

// ── Dirección ─────────────────────────────────
export const ADDRESS = {
  street: 'Acosta 1906',
  city: 'Ciudadela',
  province: 'Provincia de Buenos Aires',
  postalCode: 'B1702GHF',
  full: 'Acosta 1906, Ciudadela, Provincia de Buenos Aires',
  mapsEmbed:
    'https://maps.google.com/maps?q=Acosta+1906,+Ciudadela,+Provincia+de+Buenos+Aires,+Argentina&output=embed&hl=es&z=16',
} as const;

// ── Horarios ──────────────────────────────────
export const HOURS = {
  weekdays: {
    label: 'Lunes a Viernes',
    morning: '08:00 – 12:00',
    afternoon: '13:30 – 18:00',
    short: '8 a 12hs / 13:30 a 18hs',
  },
  saturday: {
    label: 'Sábados',
    hours: '08:00 – 13:00',
    short: '8 a 13hs',
  },
  sunday: {
    label: 'Domingos',
    hours: 'Cerrado',
  },
} as const;
