import { apiFetch as fetch } from '../auth/session';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  ShieldCheck,
  CreditCard,
  CheckCircle,
  Sparkles,
  MessageCircle,
  ArrowRight,
  ShoppingCart,
  ChevronDown,
  X,
} from 'lucide-react';
import FloatingWhatsAppButton from '../components/FloatingWhatsAppButton';
import ChatWidget from '../components/ChatWidget';
import ProductShareButton from '../components/ProductShareButton';
import SiteFooter from '../components/SiteFooter';
import heroShowcase from '../assets/hero-showcase.jpg';
import { API_URL } from '../config/apiConfig';
import { SITE_INFO } from '../config/siteInfo';
import { useHomeData } from '../utils/homeData';
import '../styles/vjh-theme.css';
import './HomePage.css';

const fallbackHomeData = {
  hero_eyebrow: 'Envío garantizado a toda La Habana',
  hero_title: 'Tecnología real,',
  hero_title_highlight: 'entregada rápido.',
  hero_subtitle: 'La mayor variedad en Cuba. Laptops, tablets, lámparas LED, bocinas JBL, almacenamiento y todos los accesorios tecnológicos que necesita, probados y listos para llevar.',
  hero_primary_button_text: 'Empiece su compra',
  hero_primary_button_url: '/shop',
  hero_secondary_button_text: 'Ver lo nuevo esta semana',
  hero_secondary_button_url: '#nuevos',
  spotlight_status: 'En stock',
  spotlight_price: 'Listo para entregar',
  spotlight_text: 'Consolas, laptops y periféricos',
  ticker_items: [
    'Garantía real en cada equipo',
    'Entrega directa a domicilio',
    'Pago contra entrega',
    'Cupones de descuento y sistema de puntos',
    'Productos nuevos cada semana',
    'Soporte por WhatsApp',
  ],
  products_eyebrow: 'Selección destacada',
  products_title: 'Los favoritos de la casa',
  products_link_text: 'Explorar todos',
  products_link_url: '/shop',
  advantages_eyebrow: '¿Por qué comprar aquí?',
  advantages_title: 'Comprar con nosotros tiene ventajas reales',
  advantages: [
    {
      chip: 'GRATIS',
      titulo: 'Mensajería gratis',
      descripcion: 'En compras superiores a 200 USD, la entrega en toda La Habana corre por nuestra cuenta, directamente a su puerta.',
    },
    {
      chip: 'AHORRO',
      titulo: 'Cupones y rebajas',
      descripcion: 'Promociones activas, rebajas de temporada y lanzamientos semanales con visibilidad de precios desde el inicio.',
    },
    {
      chip: 'LEALTAD',
      titulo: 'Sistema de puntos',
      descripcion: 'Acumule beneficios por sus compras habituales y aproveche recompensas exclusivas y descuentos en sus próximos pedidos.',
    },
  ],
  new_eyebrow: 'Recién llegados',
  new_title: 'Nuevo esta semana',
  new_meta: 'Ver novedades',
  faq_eyebrow: 'Soporte al cliente',
  faq_title: 'Lo que más nos preguntan',
  faq_intro: '¿Tiene dudas sobre cómo comprar, los métodos de pago aceptados o el alcance de los envíos? Aquí tiene respuestas claras.',
  faqs: [],
  terms_title: 'Términos y condiciones',
  terms_content: '',
  conditions_title: 'Condiciones de compra',
  conditions_content: '',
};

const TICKER_ICONS = [ShieldCheck, Truck, CreditCard, CheckCircle, Sparkles, MessageCircle];

const resolveHref = (href) => href || '/shop';

const ProductCard = ({ product, isNew = false }) => {
  const category = product?.subcategoria?.[0] || product?.categoria?.[0] || 'Producto';
  const price = Number(product?.precio_post_descuento || product?.precio || 0);
  const oldPrice = Number(product?.precio || 0);
  const hasDiscount = oldPrice > price;
  const productUrl = product?.enlace || `/product/${product?.id}`;

  return (
    <article className="vj-card">
      <Link to={productUrl} className="vj-card__media">
        {product?.imagen && <img src={product.imagen} alt={product.nombre} loading="lazy" />}
        <div className="vj-card__badges">
          {isNew && <span className="vj-badge">Nuevo</span>}
          {hasDiscount && <span className="vj-badge vj-badge--sale">Oferta</span>}
          {!isNew && !hasDiscount && product?.ventas_totales > 0 && <span className="vj-badge">Top ventas</span>}
        </div>
      </Link>
      <div className="vj-card__body">
        <div className="vj-card__meta">
          <div className="vj-card__category-row">
            <span className="vj-card__category">{category}</span>
          </div>
          <Link to={productUrl} className="vj-card__title">{product?.nombre}</Link>
        </div>
        <div className="vj-card__footer">
          <div className="vj-card__prices">
            {hasDiscount && <span className="vj-card__price-old">${oldPrice.toFixed(2)}<i> USD</i></span>}
            <span className="vj-card__price">${price.toFixed(2)}<i> USD</i></span>
          </div>
          <div className="vj-card__actions">
            <ProductShareButton
              product={{
                id: product.id,
                nombre: product.nombre,
                condicion: product.condicion,
                precio: price.toFixed(2),
                precioAnterior: hasDiscount ? oldPrice.toFixed(2) : null,
                descripcion: product.descripcion,
              }}
            />
            <Link to={productUrl} className="vj-card__icon-btn vj-card__icon-btn--cart" aria-label="Ver y comprar" title="Ver y comprar">
              <ShoppingCart size={18} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

const InfoModal = ({ title, content, onClose }) => {
  if (!title && !content) return null;

  return (
    <div className="vjh-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="vjh-modal__panel" onClick={(e) => e.stopPropagation()}>
        <button className="vjh-modal__close" type="button" onClick={onClose} aria-label="Cerrar">
          <X size={16} />
        </button>
        <h2>{title}</h2>
        <p>{content || 'Contenido pendiente de configurar.'}</p>
      </div>
    </div>
  );
};

const HomePage = () => {
  const homeData = useHomeData(fallbackHomeData);
  const [topProducts, setTopProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);
  const [modal, setModal] = useState(null);

  useEffect(() => {
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
          setTopProducts(Array.isArray(products) ? products.slice(0, 5) : []);
        } else {
          setTopProducts(Array.isArray(recentData) ? recentData.slice(0, 5) : []);
        }
      } catch (error) {
        console.error('Error fetching top products:', error);
        setTopProducts(Array.isArray(recentData) ? recentData.slice(0, 5) : []);
      }
    };

    fetchProducts();
  }, []);

  const tickerItems = useMemo(() => {
    const items = Array.isArray(homeData.ticker_items) ? homeData.ticker_items : [];
    return items.length ? items : fallbackHomeData.ticker_items;
  }, [homeData.ticker_items]);

  const advantages = Array.isArray(homeData.advantages) ? homeData.advantages : [];
  const faqs = Array.isArray(homeData.faqs) ? homeData.faqs : [];
  const spotlightProduct = topProducts[0];

  const renderTickerGroup = (hidden) => (
    <div className="vjh-ticker__group" aria-hidden={hidden || undefined}>
      {tickerItems.map((item, index) => {
        const Icon = TICKER_ICONS[index % TICKER_ICONS.length];
        return (
          <span className="vjh-ticker__item" key={`${item}-${index}`}>
            <Icon size={18} />
            {item}
            <i aria-hidden="true">{"//"}</i>
          </span>
        );
      })}
    </div>
  );

  return (
    <main className="vjh-home vj-scope">
      <section className="vjh-hero">
        <div className="vjh-hero__glow" aria-hidden="true"></div>
        <div className="vjh-hero__text">
          <span className="vjh-hero__tag">
            <Truck size={14} />
            {homeData.hero_eyebrow}
          </span>
          <h1>
            {homeData.hero_title} <span>{homeData.hero_title_highlight}</span>
          </h1>
          <p>{homeData.hero_subtitle}</p>
          <div className="vjh-hero__actions">
            <Link to={resolveHref(homeData.hero_primary_button_url)} className="vj-btn vj-btn--primary">
              {homeData.hero_primary_button_text}
            </Link>
            <a href={resolveHref(homeData.hero_secondary_button_url)} className="vj-btn vjh-hero__ghost">
              {homeData.hero_secondary_button_text}
            </a>
          </div>
        </div>

        <div className="vjh-hero__visual">
          <img src={heroShowcase} alt="Laptops, tablets y accesorios disponibles en la tienda" />
          {spotlightProduct ? (
            <Link to={spotlightProduct.enlace || `/product/${spotlightProduct.id}`} className="vjh-hero__spec">
              {spotlightProduct.imagen && <img src={spotlightProduct.imagen} alt="" />}
              <span>
                <b>{spotlightProduct.nombre}</b>
                <em>{homeData.spotlight_status} • ${Number(spotlightProduct.precio_post_descuento || spotlightProduct.precio || 0).toFixed(2)} USD</em>
              </span>
            </Link>
          ) : (
            <div className="vjh-hero__spec">
              <span>
                <b>{homeData.spotlight_text}</b>
                <em>{homeData.spotlight_status} • {homeData.spotlight_price}</em>
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="vjh-ticker">
        <div className="vjh-ticker__track">
          {renderTickerGroup(false)}
          {renderTickerGroup(true)}
        </div>
      </div>

      <section className="vjh-section" id="productos">
        <div className="vjh-section__head">
          <div>
            <p className="vj-eyebrow">{homeData.products_eyebrow}</p>
            <h2>{homeData.products_title}</h2>
          </div>
          <Link to={resolveHref(homeData.products_link_url)} className="vjh-section__link">
            {homeData.products_link_text} <ArrowRight size={14} />
          </Link>
        </div>

        <div className="vjh-products">
          {topProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="vjh-section vjh-section--dark" id="ventajas">
        <div className="vjh-section__head vjh-section__head--center">
          <div>
            <p className="vj-eyebrow">{homeData.advantages_eyebrow}</p>
            <h2>{homeData.advantages_title}</h2>
          </div>
        </div>
        <div className="vjh-advantages">
          {advantages.map((advantage, index) => (
            <article className="vjh-advantage" key={`${advantage.titulo}-${index}`}>
              <span className="vjh-advantage__chip">{advantage.chip}</span>
              <h3>{advantage.titulo}</h3>
              <p>{advantage.descripcion}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="vjh-section" id="nuevos">
        <div className="vjh-section__head">
          <div>
            <p className="vj-eyebrow">{homeData.new_eyebrow}</p>
            <h2>{homeData.new_title}</h2>
          </div>
          <Link to="/shop" className="vjh-section__link">
            Ver novedades <ArrowRight size={14} />
          </Link>
        </div>

        <div className="vjh-products">
          {recentProducts.map((product) => (
            <ProductCard key={product.id} product={product} isNew />
          ))}
        </div>
      </section>

      <section className="vjh-section vjh-faq">
        <div className="vjh-faq__intro">
          <span className="vjh-faq__badge">{homeData.faq_eyebrow}</span>
          <h2>{homeData.faq_title}</h2>
          <p>{homeData.faq_intro}</p>
          <a href={SITE_INFO.whatsappUrl} target="_blank" rel="noopener noreferrer" className="vjh-faq__contact">
            <MessageCircle size={18} />
            ¿Aún con dudas? Consúltenos por WhatsApp
          </a>
        </div>
        <div className="vjh-faq__list">
          {faqs.map((faq, index) => (
            <div className={`vjh-faq__item ${openFaq === index ? 'is-open' : ''}`} key={`${faq.pregunta}-${index}`}>
              <button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                <span>{faq.pregunta}</span>
                <ChevronDown size={20} />
              </button>
              {openFaq === index && <p>{faq.respuesta}</p>}
            </div>
          ))}
        </div>
      </section>

      <SiteFooter
        legalLinks={[
          { label: homeData.terms_title, onClick: () => setModal('terms') },
          { label: homeData.conditions_title, onClick: () => setModal('conditions') },
        ]}
      />

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
