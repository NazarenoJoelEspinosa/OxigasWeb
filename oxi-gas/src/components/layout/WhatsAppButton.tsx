import { MessageCircle, ShoppingCart } from 'lucide-react';
import { WHATSAPP_URL } from '@/config/constants';
import { useCart } from '@/context/CartContext';

export function WhatsAppButton() {
  const cart = useCart();
  const className = 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-white shadow-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary';
  if (cart.count > 0) return (
    <button type="button" onClick={() => cart.setOpen(true)}
      className={className + ' bg-primary hover:bg-primary/90'}
      aria-label={`Ver mi cotización · ${cart.count} ${cart.count === 1 ? 'producto' : 'productos'}`}>
      <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="text-left text-sm font-semibold leading-tight">Ver mi cotización
        <span className="block text-xs font-normal mt-0.5">{cart.count} {cart.count === 1 ? 'producto' : 'productos'}</span>
      </span>
    </button>
  );
  return (
    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
      aria-label="¿Necesitás ayuda? Consultar por WhatsApp"
      className={className + ' bg-[#16863e] hover:bg-[#116e32]'}>
      <MessageCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
      <span className="text-sm font-semibold">¿Necesitás ayuda?</span>
    </a>
  );
}
