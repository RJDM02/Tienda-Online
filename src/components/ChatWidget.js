import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

const WEBHOOK_BASE =
  'https://n8n.srv918533.hstgr.cloud/webhook/364d33dd-9a6c-436c-9335-26c6bfdbdfe4/chat';
const CHAT_CSS_URL = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
const CHAT_BUNDLE_URL = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';
const CHAT_OVERRIDE_STYLE_ID = 'vhb-n8n-chat-overrides';

const getLocale = () => {
  if (typeof navigator === 'undefined') return 'es';
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es';
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const localeRef = useRef(getLocale());
  const chatContainerRef = useRef(null);
  const cssLoadedRef = useRef(false);
  const initKeyRef = useRef(null);

  const toggle = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    if (!isOpen || !chatContainerRef.current) return undefined;

    let destroyed = false;

    if (!cssLoadedRef.current) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = CHAT_CSS_URL;
      document.head.appendChild(css);
      cssLoadedRef.current = true;
    }

    if (!document.getElementById(CHAT_OVERRIDE_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = CHAT_OVERRIDE_STYLE_ID;
      style.textContent = `
        .vhb-n8n-chat {
          --chat--color--primary: #FF6B00;
          --chat--color--primary-shade-50: #E55D00;
          --chat--color--primary--shade-100: #CC5400;
          --chat--color--secondary: #FF6B00;
          --chat--color-secondary-shade-50: #E55D00;
          --chat--header--background: #0F173F;
          --chat--header--color: #FFFFFF;
          --chat--header--padding: 0.85rem 1rem;
          --chat--heading--font-size: 1.28rem;
          --chat--subtitle--font-size: 0.92rem;
          --chat--subtitle--line-height: 1.35;
          --chat--message--font-size: 0.93rem;
          --chat--messages-list--padding: 0.75rem;
          --chat--textarea--height: 44px;
          --chat--input--padding: 0.6rem 0.75rem;
        }

        .vhb-n8n-chat h1 {
          margin: 0 !important;
          line-height: 1.15 !important;
          font-size: 1.28rem !important;
          letter-spacing: 0 !important;
        }

        .vhb-n8n-chat p {
          line-height: 1.35;
        }
      `;
      document.head.appendChild(style);
    }

    const initChat = async () => {
      try {
        const locale = localeRef.current;
        const nextKey = `${WEBHOOK_BASE}|${locale}`;
        if (initKeyRef.current === nextKey) return;

        chatContainerRef.current.innerHTML = '';

        const mod = await import(/* webpackIgnore: true */ CHAT_BUNDLE_URL);

        if (destroyed) return;
        if (typeof mod.createChat !== 'function') {
          console.error('n8n chat: createChat not available');
          return;
        }

        mod.createChat({
          webhookUrl: WEBHOOK_BASE,
          mode: 'fullscreen',
          target: chatContainerRef.current,
          locale,
          chatInputKey: 'chatInput',
          chatSessionKey: 'sessionId',
          metadata: { language: locale },
          initialMessages: [],
          i18n: {
            en: { title: 'Soy VJH bot', subtitle: 'en que puedo ayudarte?' },
            es: { title: 'Asistente', subtitle: 'En que podemos ayudarte?' }
          }
        });

        initKeyRef.current = nextKey;
      } catch (error) {
        console.error('Error loading n8n chat:', error);
      }
    };

    initChat();

    return () => {
      destroyed = true;
      initKeyRef.current = null;
      if (chatContainerRef.current) {
        chatContainerRef.current.innerHTML = '';
      }
    };
  }, [isOpen]);

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[min(320px,calc(100vw-20px))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
          <div className="bg-white overflow-hidden" style={{ height: 'min(380px, 55vh)' }}>
            <div
              ref={chatContainerRef}
              className="h-full w-full vhb-n8n-chat"
              style={{ position: 'relative' }}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6B00] text-white shadow-xl transition-transform hover:-translate-y-1 hover:scale-105 hover:bg-[#E55D00]"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
};

export default ChatWidget;
