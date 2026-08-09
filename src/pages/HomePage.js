import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FloatingWhatsAppButton from '../components/FloatingWhatsAppButton';
import ChatWidget from '../components/ChatWidget';
import { API_URL } from '../config/apiConfig';
import './HomePage.css';

const fallbackHomeData = {
  hero_eyebrow: 'VIDEOJUEGOS HABANA - TIENDA TECH',
  hero_title: 'Tecnologia real,',
  hero_title_highlight: 'entregada rapido.',
  hero_subtitle: 'Portatiles, consolas y accesorios originales, con una presencia visual mas premium y una navegacion que se siente rapida, tecnica y confiable.',
  hero_primary_button_text: 'Empiece su compra',
  hero_primary_button_url: '/shop',
  hero_secondary_button_text: 'Ver lo nuevo esta semana',
  hero_secondary_button_url: '#nuevos',
  spotlight_status: 'LIVE STOCK',
  spotlight_price: 'DESDE $520',
  spotlight_text: 'Consolas, laptops y perifericos listos para entrega.',
  ticker_items: [
    'Entrega en toda La Habana',
    'Pago contra entrega',
    'Garantia real en cada equipo',
    'Soporte por WhatsApp',
    'Cupones y sistema de puntos',
    'Productos nuevos cada semana',
  ],
  products_eyebrow: 'Lo mas pedido',
  products_title: 'Los favoritos de la casa',
  products_link_text: 'Ver toda la tienda',
  products_link_url: '/shop',
  advantages_eyebrow: 'Por que comprar aqui',
  advantages_title: 'Comprar con nosotros tiene ventajas reales',
  advantages: [
    {
      chip: 'ENV.GRATIS',
      titulo: 'Mensajeria gratis',
      descripcion: 'En compras superiores a 200 USD, la entrega en toda La Habana corre por nuestra cuenta.',
    },
    {
      chip: 'DESCTO',
      titulo: 'Cupones y rebajas',
      descripcion: 'Promociones activas, rebajas y lanzamientos semanales con visibilidad desde el inicio.',
    },
    {
      chip: 'PUNTOS',
      titulo: 'Sistema de puntos',
      descripcion: 'Acumula beneficios por tus compras y aprovecha recompensas en proximos pedidos.',
    },
  ],
  new_eyebrow: 'Recien llegado',
  new_title: 'Nuevo esta semana',
  new_meta: '5 productos anadidos',
  faq_eyebrow: 'Dudas frecuentes',
  faq_title: 'Lo que mas nos preguntan',
  faq_intro: 'Este bloque aterriza dudas comunes sin romper el ritmo visual de la home.',
  faqs: [],
  footer_logo: 'VIDEOJUEGOS HABANA',
  footer_copy: 'Tu tienda de confianza en La Habana. Tecnologia real, entrega rapida y precios justos.',
  footer_links: [],
  footer_hours_label: 'Horario',
  footer_hours_days: 'Lun - Sab',
  footer_hours_value: '9:00 AM - 5:00 PM',
  footer_bottom_text: 'Videojuegos Habana. Todos los derechos reservados.',
  terms_title: 'Terminos y condiciones',
  terms_content: '',
  conditions_title: 'Condiciones de compra',
  conditions_content: '',
};

const resolveHref = (href) => href || '/shop';

const ProductCard = ({ product, compact = false }) => {
  const category = product?.subcategoria?.[0] || product?.categoria?.[0] || 'Producto';
  const price = Number(product?.precio_post_descuento || product?.precio || 0);
  const oldPrice = Number(product?.precio || 0);
  const hasDiscount = oldPrice > price;

  return (
    <Link to={product?.enlace || `/product/${product?.id}`} className={compact ? 'vh-new-card' : 'vh-product-card'}>
      <div
        className={compact ? 'vh-new-card__media' : 'vh-product-card__media'}
        style={product?.imagen ? { backgroundImage: `url(${product.imagen})` } : undefined}
      >
        {!compact && product?.ventas_totales > 0 && <span className="vh-badge">Top ventas</span>}
      </div>
      <div className={compact ? undefined : 'vh-product-card__body'}>
        <p className={compact ? undefined : 'vh-product-card__category'}>{category}</p>
        <h3>{product?.nombre}</h3>
        {compact ? (
          <span>${price.toFixed(2)}</span>
        ) : (
          <p className="vh-product-card__price">
            ${price.toFixed(2)}
            {hasDiscount && <span>${oldPrice.toFixed(2)}</span>}
          </p>
        )}
      </div>
    </Link>
  );
};

const InfoModal = ({ title, content, onClose }) => {
  if (!title && !content) return null;

  return (
    <div className="vh-modal" role="dialog" aria-modal="true">
      <div className="vh-modal__panel">
        <button className="vh-modal__close" type="button" onClick={onClose} aria-label="Cerrar">
          x
        </button>
        <h2>{title}</h2>
        <p>{content || 'Contenido pendiente de configurar.'}</p>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [homeData, setHomeData] = useState(fallbackHomeData);
  const [topProducts, setTopProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await fetch(`${API_URL}/listar_homepage/`);
        const data = await response.json();
        setHomeData({ ...fallbackHomeData, ...(data?.[0] || {}) });
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };

    const fetchProducts = async () => {
      let recentData = [];

      try {
        const recentResponse = await fetch(`${API_URL}/home/productos_recientes/?limit=5`);
        if (recentResponse.ok) {
          recentData = await recentResponse.json();
          setRecentProducts(Array.isArray(recentData) ? recentData.slice(0, 5) : []);
        }
      } catch (error) {
        console.error('Error fetching recent products:', error);
      }

      try {
        const topResponse = await fetch(`${API_URL}/home/productos_rotativos/?limit=5`);
        if (topResponse.ok) {
          const topData = await topResponse.json();
          const products = Array.isArray(topData) && topData.length ? topData : recentData;
          setTopProducts(Array.isArray(products) ? products.slice(0, 4) : []);
        } else {
          setTopProducts(Array.isArray(recentData) ? recentData.slice(0, 4) : []);
        }
      } catch (error) {
        console.error('Error fetching top products:', error);
        setTopProducts(Array.isArray(recentData) ? recentData.slice(0, 4) : []);
      }
    };

    fetchHomeData();
    fetchProducts();
  }, []);

  const tickerItems = useMemo(() => {
    const items = Array.isArray(homeData.ticker_items) ? homeData.ticker_items : [];
    return items.length ? items : fallbackHomeData.ticker_items;
  }, [homeData.ticker_items]);

  const advantages = Array.isArray(homeData.advantages) ? homeData.advantages : [];
  const faqs = Array.isArray(homeData.faqs) ? homeData.faqs : [];
  const footerGroups = Array.isArray(homeData.footer_links) ? homeData.footer_links : [];

  return (
    <main className="vh-page">
      <section className="vh-hero">
        <div className="vh-hero__grid"></div>
        <div className="vh-container vh-hero__inner">
          <div>
            <p className="vh-eyebrow">{homeData.hero_eyebrow}</p>
            <h1 className="vh-hero__title">
              {homeData.hero_title}
              <span>{homeData.hero_title_highlight}</span>
            </h1>
            <p className="vh-hero__subtitle">{homeData.hero_subtitle}</p>
            <div className="vh-hero__actions">
              <Link to={resolveHref(homeData.hero_primary_button_url)} className="vh-btn vh-btn--primary">
                {homeData.hero_primary_button_text}
              </Link>
              <a href={resolveHref(homeData.hero_secondary_button_url)} className="vh-btn vh-btn--ghost">
                {homeData.hero_secondary_button_text}
              </a>
            </div>
          </div>

          <div className="vh-hero__spotlight">
            <div className="vh-console-card">
              <div className="vh-console-card__top">
                <span className="vh-console-card__status">{homeData.spotlight_status}</span>
                <span className="vh-console-card__price">{homeData.spotlight_price}</span>
              </div>
              <div className="vh-console-card__visual">
                <div className="vh-console-glow"></div>
                <div className="vh-device vh-device--left"></div>
                <div className="vh-device vh-device--center"></div>
                <div className="vh-device vh-device--right"></div>
              </div>
              <div className="vh-console-card__bottom">
                <p>{homeData.spotlight_text}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="vh-ticker">
          <span className="vh-ticker__dot"></span>
          <div className="vh-ticker__track">
            {tickerItems.map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="vh-products" id="productos">
        <div className="vh-container">
          <div className="vh-section-head">
            <div>
              <p className="vh-eyebrow vh-eyebrow--dark">{homeData.products_eyebrow}</p>
              <h2>{homeData.products_title}</h2>
            </div>
            <Link to={resolveHref(homeData.products_link_url)}>{homeData.products_link_text} -></Link>
          </div>

          <div className="vh-products__grid">
            {topProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="vh-advantages">
        <div className="vh-container">
          <p className="vh-eyebrow">{homeData.advantages_eyebrow}</p>
          <h2>{homeData.advantages_title}</h2>
          <div className="vh-advantages__grid">
            {advantages.map((advantage, index) => (
              <article className="vh-advantage-card" key={`${advantage.titulo}-${index}`}>
                <span className="vh-chip">{advantage.chip}</span>
                <h3>{advantage.titulo}</h3>
                <p>{advantage.descripcion}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="vh-new" id="nuevos">
        <div className="vh-container">
          <div className="vh-section-head">
            <div>
              <p className="vh-eyebrow vh-eyebrow--dark">{homeData.new_eyebrow}</p>
              <h2>{homeData.new_title}</h2>
            </div>
            <p className="vh-meta">{homeData.new_meta}</p>
          </div>

          <div className="vh-new__rail">
            {recentProducts.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="vh-faqs">
        <div className="vh-container vh-faqs__layout">
          <div className="vh-faqs__intro">
            <p className="vh-eyebrow vh-eyebrow--dark">{homeData.faq_eyebrow}</p>
            <h2>{homeData.faq_title}</h2>
            <p>{homeData.faq_intro}</p>
          </div>
          <div className="vh-faqs__list">
            {faqs.map((faq, index) => (
              <div className={`vh-faq-item ${openFaq === index ? 'vh-faq-item--open' : ''}`} key={`${faq.pregunta}-${index}`}>
                <button className="vh-faq-item__question" type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                  <span>{faq.pregunta}</span>
                  <span>{openFaq === index ? '-' : '+'}</span>
                </button>
                {openFaq === index && <p>{faq.respuesta}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="vh-footer">
        <div className="vh-container vh-footer__top">
          <div>
            <p className="vh-footer__logo">{homeData.footer_logo}</p>
            <p className="vh-footer__copy">{homeData.footer_copy}</p>
          </div>
          {footerGroups.map((group, index) => (
            <div key={`${group.grupo}-${index}`}>
              <p className="vh-footer__heading">{group.grupo}</p>
              {(group.links || []).map((link, linkIndex) => (
                <a href={link.url || '/'} key={`${link.texto}-${linkIndex}`}>
                  {link.texto}
                </a>
              ))}
            </div>
          ))}
          <div>
            <p className="vh-footer__heading">{homeData.footer_hours_label}</p>
            <p className="vh-footer__hours">{homeData.footer_hours_days}</p>
            <p className="vh-footer__hours vh-footer__hours--strong">{homeData.footer_hours_value}</p>
            <button type="button" className="vh-footer__button" onClick={() => setModal('terms')}>
              {homeData.terms_title}
            </button>
            <button type="button" className="vh-footer__button" onClick={() => setModal('conditions')}>
              {homeData.conditions_title}
            </button>
          </div>
        </div>
        <div className="vh-container vh-footer__bottom">
          <p>{homeData.footer_bottom_text}</p>
        </div>
      </footer>

      {modal === 'terms' && (
        <InfoModal title={homeData.terms_title} content={homeData.terms_content} onClose={() => setModal(null)} />
      )}
      {modal === 'conditions' && (
        <InfoModal title={homeData.conditions_title} content={homeData.conditions_content} onClose={() => setModal(null)} />
      )}
      <ChatWidget />
      <FloatingWhatsAppButton />
    </main>
  );
};

export default HomePage;
