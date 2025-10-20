import { MessageCircle } from 'lucide-react';

const FloatingWhatsAppButton = () => (
  <a
    href="https://wa.me/52904461"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Abrir chat de WhatsApp"
    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:-translate-y-1 hover:scale-105 hover:bg-[#1EBE5D]"
  >
    <MessageCircle size={28} />
    <span className="sr-only">WhatsApp</span>
  </a>
);

export default FloatingWhatsAppButton;
