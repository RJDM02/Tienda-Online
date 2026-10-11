import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ProductShareButton from './ProductShareButton';
import '../styles/vjh-theme.css';

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Imagen+no+disponible';

const CardItem = ({ product, searchTerm = '', userRole }) => {
  const navigate = useNavigate();
  const hasDiscount = product.descuento > 0;
  const { addToCart } = useCart();

  const productImage = product.imagenes?.length > 0 ? product.imagenes[0].imagen : PLACEHOLDER_IMAGE;
  const subcategories = product.subcategorias_detalle || [];
  const hasVariations = product.variaciones?.length > 0;
  const inStock = product.estado && product.total_item > 0;

  const handleViewDetails = () => {
    navigate(`/product/${product.id}`);
  };

  const highlightSearchTerm = (text) => {
    if (!searchTerm || !text) return text;

    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <mark>{text.substring(index, index + searchTerm.length)}</mark>
        {text.substring(index + searchTerm.length)}
      </>
    );
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();

    if (hasVariations) {
      handleViewDetails();
      return;
    }
    const availableStock = product.total_item;

    if (availableStock <= 0) {
      alert('No hay stock disponible para este producto');
      return;
    }

    addToCart({
      id: product.id,
      nombre: product.nombre,
      precio_post_descuento: product.precio_post_descuento,
      imagenes: product.imagenes,
      garantia_tiempo: product.garantia_tiempo,
      regalo_nombre: product.regalo_nombre,
      availableStock: availableStock,
      punto_venta: product.punto_venta,
      punto_venta_detalle: product.punto_venta_detalle,
      productData: product
    });
  };

  // Determinar si mostrar la comisión
  const isManager = userRole === 'Gestor de Venta';
  const isAdmin = userRole === 'Administrador' || userRole === 'Super_Administrador';
  const isPosManager = userRole === 'Encargado de Punto de Venta';
  const showCommission = isManager || isAdmin;
  // Solo el personal interno necesita ver en qué punto de venta está el producto
  const showPuntoVenta = isManager || isAdmin || isPosManager;

  const stockLabel = product.estado ? (product.total_item > 0 ? 'Disponible' : 'Agotado') : 'No disponible';
  const cartLabel = !product.estado
    ? 'No disponible'
    : product.total_item === 0
      ? 'Sin stock'
      : hasVariations
        ? 'Seleccionar opciones'
        : 'Añadir al carrito';

  return (
    <article className="vj-card">
      <Link to={`/product/${product.id}`} className="vj-card__media">
        <img
          src={productImage}
          alt={product.nombre}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = PLACEHOLDER_IMAGE;
          }}
        />
        <div className="vj-card__badges">
          <span className={`vj-badge vj-badge--pill ${inStock ? 'vj-badge--ok' : 'vj-badge--off'}`}>{stockLabel}</span>
          {hasDiscount && (
            <span className="vj-badge vj-badge--pill vj-badge--sale vj-badge--end">-{parseFloat(product.descuento)}%</span>
          )}
        </div>
      </Link>

      <div className="vj-card__body">
        <div className="vj-card__meta">
          <div className="vj-card__category-row">
            {subcategories.length > 0 && (
              <span className="vj-card__category">
                {highlightSearchTerm(subcategories[0].nombre)}
                {subcategories.length > 1 && ` +${subcategories.length - 1}`}
              </span>
            )}
            {product.condicion_detalle && <span className="vj-card__tag">{product.condicion_detalle.nombre}</span>}
          </div>
          <Link to={`/product/${product.id}`} className="vj-card__title">
            {highlightSearchTerm(product.nombre)}
          </Link>
        </div>

        {/* Mostrar comisión si es gestor o admin */}
        {showCommission && product.comision && <span className="vj-card__chip">Comisión: ${product.comision}</span>}

        <div className="vj-card__footer">
          <div className="vj-card__prices">
            {hasDiscount && <span className="vj-card__price-old">${product.precio}<i> USD</i></span>}
            <span className="vj-card__price">${hasDiscount ? product.precio_post_descuento : product.precio}<i> USD</i></span>
          </div>
          <div className="vj-card__actions">
            <ProductShareButton
              product={{
                id: product.id,
                nombre: product.nombre,
                condicion: product.condicion_detalle?.nombre,
                precio: hasDiscount ? product.precio_post_descuento : product.precio,
                precioAnterior: hasDiscount ? product.precio : null,
                descripcion: product.descripcion,
                garantia: product.garantia_tiempo,
                regalo: product.regalo_nombre,
              }}
            />
            <button
              type="button"
              className="vj-card__icon-btn vj-card__icon-btn--cart"
              onClick={handleAddToCart}
              disabled={!inStock}
              aria-label={cartLabel}
              title={cartLabel}
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>

        {/* Punto de venta, visible solo para personal interno */}
        {showPuntoVenta && <p className="vj-card__note">{product.punto_venta_detalle?.nombre || 'Sede Principal'}</p>}
      </div>
    </article>
  );
};

CardItem.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    nombre: PropTypes.string.isRequired,
    descripcion: PropTypes.string,
    imagenes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        imagen: PropTypes.string.isRequired,
      })
    ).isRequired,
    precio: PropTypes.string.isRequired,
    precio_post_descuento: PropTypes.string.isRequired,
    descuento: PropTypes.number.isRequired,
    estado: PropTypes.bool.isRequired,
    cantidad: PropTypes.number.isRequired,
    total_item: PropTypes.number.isRequired,
    subcategorias_detalle: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        nombre: PropTypes.string.isRequired,
      })
    ).isRequired,
    garantia_tiempo: PropTypes.string,
    regalo_nombre: PropTypes.string,
    variaciones: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        cantidad: PropTypes.number.isRequired,
        estado: PropTypes.bool.isRequired,
      })
    ),
    condicion_detalle: PropTypes.shape({
      id: PropTypes.number.isRequired,
      nombre: PropTypes.string.isRequired,
    }),
    comision: PropTypes.string,
  }).isRequired,
  searchTerm: PropTypes.string,
  userRole: PropTypes.string,
};

export default React.memo(CardItem);
