import { HOURS } from '@/config/constants';

function isOpenNow(): { open: boolean; message: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Dom, 1=Lun, 6=Sáb
  const minutes = now.getHours() * 60 + now.getMinutes();

  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  if (day >= 1 && day <= 5) {
    const morning = minutes >= toMin('08:00') && minutes < toMin('12:00');
    const afternoon = minutes >= toMin('13:30') && minutes < toMin('18:00');
    if (morning) return { open: true, message: 'Abierto · Cierra a las 12:00' };
    if (afternoon) return { open: true, message: 'Abierto · Cierra a las 18:00' };
    if (minutes < toMin('08:00')) return { open: false, message: 'Abre hoy a las 08:00' };
    if (minutes >= toMin('12:00') && minutes < toMin('13:30')) return { open: false, message: 'Abre a las 13:30' };
    return { open: false, message: 'Abre mañana a las 08:00' };
  }

  if (day === 6) {
    if (minutes >= toMin('08:00') && minutes < toMin('13:00'))
      return { open: true, message: 'Abierto · Cierra a las 13:00' };
    if (minutes < toMin('08:00')) return { open: false, message: 'Abre hoy a las 08:00' };
    return { open: false, message: 'Abre el lunes a las 08:00' };
  }

  return { open: false, message: 'Abre el lunes a las 08:00' };
}

export function OpenStatus() {
  const { open, message } = isOpenNow();

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
      open
        ? 'bg-green-500/10 text-green-500 border-green-500/30'
        : 'bg-red-500/10 text-red-400 border-red-500/30'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
      {message}
    </span>
  );
}