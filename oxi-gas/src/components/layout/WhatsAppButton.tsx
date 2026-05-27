import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { WHATSAPP_URL } from '@/config/constants';

export function WhatsAppButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-[100] bg-[#25d366] hover:bg-[#25d366]/90 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-[#25d366]/40 transition-colors duration-300 group"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 200, damping: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
          
          <motion.span
            className="absolute -inset-2 rounded-full border-2 border-[#25d366]"
            animate={{ opacity: [0, 0.7, 0], scale: [0.9, 1.25, 1.5] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 5, ease: "easeOut" }}
          />
        </motion.a>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        className="bg-[hsl(var(--surface-2))] text-[hsl(var(--text-main))] border-[hsl(var(--surface-3))]"
      >
        <p className="font-medium">Hacé tu pedido</p>
      </TooltipContent>
    </Tooltip>
  );
}