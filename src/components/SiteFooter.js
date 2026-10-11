import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Send, Phone, Mail, MapPin } from 'lucide-react';
import logo from '@/assets/logo.png';
import { SITE_INFO } from '../config/siteInfo';
import { useHomeData } from '../utils/homeData';
import '../styles/vjh-theme.css';

const SOCIAL_ICONS = {
  facebook: { label: 'Facebook', icon: <Facebook size={16} /> },
  instagram: { label: 'Instagram', icon: <Instagram size={16} /> },
  twitter: { label: 'Twitter', icon: <Twitter size={16} /> },
  telegram: { label: 'Telegram', icon: <Send size={16} /> },
  revolico: { label: 'Revolico', icon: <span className="vj-footer__social-letter">R</span> },
};

const DEFAULT_LINKS = [
  { texto: 'Ir a la tienda', url: '/shop' },
  { texto: 'Destacados', url: '/#productos' },
  { texto: 'Ventajas', url: '/#ventajas' },
  { texto: 'Recién llegados', url: '/#nuevos' },
];

const FooterLink = ({ url, children }) => {
  if (url?.startsWith('/') && !url.includes('#')) return <Link to={url}>{children}</Link>;
  // Los anclas de la home (#nuevos) deben funcionar tambien desde el catalogo o el producto
  return <a href={url?.startsWith('#') ? `/${url}` : url || '/'}>{children}</a>;
};

const SiteFooter = ({ legalLinks = [] }) => {
  const homeData = useHomeData();
  const configuredGroups = Array.isArray(homeData.footer_links) ? homeData.footer_links : [];
  const groups = configuredGroups.length ? configuredGroups : [{ grupo: 'Videojuegoshabana', links: DEFAULT_LINKS }];
  // Si el administrador ya configuro un grupo de contacto, no se repite el de por defecto
  const hasContactGroup = configuredGroups.some((group) => /contact/i.test(group.grupo || ''));
  const socials = Object.entries(SITE_INFO.socials).filter(([, url]) => url);

  return (
    <footer className="vj-footer">
      <div className="vj-footer__cols">
        <div className="vj-footer__brand">
          <Link to="/" className="vj-footer__logo">
            <img src={logo} alt="" />
            <span>VIDEOJUEGOS <b>HABANA</b></span>
          </Link>
          <p>{homeData.footer_copy || SITE_INFO.description}</p>
          {socials.length > 0 && (
            <div className="vj-footer__socials">
              {socials.map(([key, url]) => (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_ICONS[key]?.label}>
                  {SOCIAL_ICONS[key]?.icon}
                </a>
              ))}
            </div>
          )}
        </div>

        {groups.map((group, index) => (
          <div className="vj-footer__col" key={`${group.grupo}-${index}`}>
            <p className="vj-footer__heading">{group.grupo}</p>
            <div className="vj-footer__links">
              {(group.links || []).map((link, linkIndex) => (
                <FooterLink url={link.url} key={`${link.texto}-${linkIndex}`}>{link.texto}</FooterLink>
              ))}
            </div>
          </div>
        ))}

        {!hasContactGroup && (
          <div className="vj-footer__col vj-footer__col--contact">
            <p className="vj-footer__heading">Contacto</p>
            <div className="vj-footer__contact">
              <a href={SITE_INFO.whatsappUrl} target="_blank" rel="noopener noreferrer" className="vj-footer__contact-strong">
                <Phone size={16} /> {SITE_INFO.phoneLabel}
              </a>
              <a href={`mailto:${SITE_INFO.email}`}>
                <Mail size={16} /> {SITE_INFO.email}
              </a>
              <span>
                <MapPin size={16} /> {SITE_INFO.address}
              </span>
            </div>
          </div>
        )}

        <div className="vj-footer__col">
          <p className="vj-footer__heading">{homeData.footer_hours_label || 'Horario de Atención'}</p>
          <div>
            <p className="vj-footer__hours-days">{homeData.footer_hours_days || SITE_INFO.hoursDays}</p>
            <p className="vj-footer__hours-value">{homeData.footer_hours_value || SITE_INFO.hoursValue}</p>
          </div>
        </div>
      </div>

      <div className="vj-footer__bottom">
        <p>© {new Date().getFullYear()} {homeData.footer_bottom_text || 'Videojuegoshabana. Todos los derechos reservados.'}</p>
        {legalLinks.length > 0 && (
          <div className="vj-footer__legal">
            {legalLinks.map((link) => (
              <button type="button" key={link.label} onClick={link.onClick}>{link.label}</button>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
};

export default SiteFooter;
