import { apiFetch as fetch } from '../auth/session';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Modal,
  Box,
  TextField,
  Rating,
  Typography
} from '@mui/material';
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingCart, ShieldCheck, Gift, Star, StarHalf } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import CardItem from '../components/CardItem';
import ProductShareButton from '../components/ProductShareButton';
import SiteFooter from '../components/SiteFooter';
import FloatingWhatsAppButton from '../components/FloatingWhatsAppButton';
import ChatWidget from '../components/ChatWidget';
import { useCart } from '../context/CartContext';

import { API_URL } from '../config/apiConfig';
import '../styles/vjh-theme.css';
import './ProductView.css';
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'min(400px, calc(100vw - 32px))',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const ProductView = ({ onShowLogin = () => {} }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const { addToCart } = useCart();
  const [openCommentModal, setOpenCommentModal] = useState(false);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [userData, setUserData] = useState(null);
  const [autoSelectedVariation, setAutoSelectedVariation] = useState(false);

  // Estados para el manejo de gestos táctiles
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isTouch, setIsTouch] = useState(false);

  const getCurrentUser = () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      const decoded = jwtDecode(token);
      setUserData(decoded);
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  useEffect(() => {
    getCurrentUser();

    // Capturar código de referido de la URL y guardarlo en localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');

    if (refParam) {
      localStorage.setItem('referralCode', refParam);
    }
  }, []);

  const isAdmin = userData && (userData.rol === 'Administrador' || userData.rol === 'Super_Administrador');
  const isCourier = userData && (userData.rol === 'Mensajero');
  const isManager = userData && (userData.rol === 'Gestor de Venta');
  const isClient = userData && !isAdmin && !isCourier && !isManager;

  const fetchRelatedProducts = useCallback(async (categoryName) => {
    try {
      setLoadingRelated(true);
      const encodedCategory = encodeURIComponent(categoryName);
      const response = await fetch(
        `${API_URL}/listar_item_activo/?categoria=${encodedCategory}`
      );

      if (!response.ok) {
        throw new Error('Error al cargar productos relacionados');
      }

      const data = await response.json();

      // Asegurarnos de trabajar con el array de resultados
      const results = data.results || [];

      // Filtrar para excluir el producto actual
      const filtered = results.filter(item =>
        item.id !== parseInt(id)
      );

      setRelatedProducts(filtered.slice(0, 5));
    } catch (err) {
      console.error('Error fetching related products:', err);
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
    }
  }, [id]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_URL}/listar_detalle_item/${id}/`);
      if (!response.ok) {
        throw new Error('Error al cargar comentarios');
      }
      const data = await response.json();

      const sortedComments = (data.comentarios || []).sort((a, b) => b.puntos - a.puntos);

      setComments(sortedComments);
      setAverageRating(data.puntuacion_promedio || 0);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const getProductImages = (productData = product) => {
    if (!productData) return [];

    const productImages = productData.imagenes?.map(img => img.imagen) || [];

    if (productData.variaciones) {
      productData.variaciones.forEach(variation => {
        if (variation.imagen && variation.cantidad > 0 && !productImages.includes(variation.imagen)) {
          productImages.push(variation.imagen);
        }
      });
    }

    if (productData.video) {
      productImages.push(productData.video);
    }

    if (productImages.length === 0) {
      return ['https://via.placeholder.com/600x400/f3f4f6/9ca3af?text=Imagen+no+disponible'];
    }

    return productImages;
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/listar_detalle_item/${id}/`);

        if (!response.ok) {
          throw new Error('Producto no encontrado');
        }

        const data = await response.json();
        setProduct(data);

        // Auto-seleccionar variación si el producto base no tiene stock
        if ((data.cantidad === 0 || !data.cantidad) && data.variaciones?.length > 0) {
          const firstAvailableVariation = data.variaciones.find(v => v.cantidad > 0);
          if (firstAvailableVariation) {
            setSelectedVariation(firstAvailableVariation);
            setSelectedColor(firstAvailableVariation.color);
            setSelectedModel(firstAvailableVariation.modelo);
            setAutoSelectedVariation(true);

            // Encontrar índice de la imagen de la variación
            const images = getProductImages(data);
            const variationImageIndex = images.findIndex(img => img === firstAvailableVariation.imagen);
            if (variationImageIndex !== -1) {
              setCurrentImageIndex(variationImageIndex);
            }
          }
        }

        const sortedComments = (data.comentarios || []).sort((a, b) => b.puntos - a.puntos);
        setComments(sortedComments);
        setAverageRating(data.puntuacion_promedio || 0);

        if (data.subcategorias_detalle?.length > 0) {
          fetchRelatedProducts(data.subcategorias_detalle[0].categoria.nombre);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, fetchRelatedProducts]);

  // Funciones para manejar gestos táctiles
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsTouch(true);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }

    setIsTouch(false);
  };

  const handleOpenCommentModal = () => {
    if (!isClient) {
      alert('Solo los clientes pueden dejar comentarios');
      return;
    }
    if (!userData) {
      onShowLogin();
      return;
    }
    setOpenCommentModal(true);
  };

  const handleCloseCommentModal = () => {
    setOpenCommentModal(false);
    setComment('');
    setRating(0);
  };

  const handleSubmitComment = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No estás autenticado');
      }

      const commentData = {
        puntos: rating * 2,
        comentario: comment
      };

      if (selectedVariation) {
        commentData.variacion_id = selectedVariation.id;
      } else {
        commentData.producto_id = product.id;
      }

      const response = await fetch(`${API_URL}/crear_comentario/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(commentData)
      });

      if (!response.ok) {
        throw new Error('Error al enviar comentario');
      }

      await fetchComments();
      handleCloseCommentModal();
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert(err.message);
    }
  };

  const renderStars = (ratingValue) => {
    const stars = [];
    const fullStars = Math.floor(ratingValue / 2);
    const hasHalfStar = ratingValue % 2 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} size={16} fill="currentColor" />);
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="pv-star-half">
          <Star size={16} />
          <StarHalf size={16} fill="currentColor" />
        </span>
      );
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} />);
    }

    return stars;
  };

  const getAvailableColors = () => {
    if (!product?.variaciones) return [];
    return Array.from(new Set(
      product.variaciones
        .filter(v => v.cantidad > 0)
        .map(v => v.color)
    ));
  };

  const getAvailableModels = () => {
    if (!product?.variaciones) return [];
    return Array.from(new Set(
      product.variaciones
        .filter(v => v.cantidad > 0)
        .map(v => v.modelo)
    ));
  };

  const formatWarrantyDays = (value) => {
    if (!value) return value;
    const text = String(value).trim();
    return /^\d+$/.test(text) ? `${text} días` : text;
  };

  const getWarrantyAndGiftInfo = () => {
    if (selectedVariation) {
      return {
        garantia: formatWarrantyDays(selectedVariation.garantia_tiempo),
        regalo: selectedVariation.regalo_nombre
      };
    }
    return {
      garantia: formatWarrantyDays(product?.garantia_tiempo),
      regalo: product?.regalo_nombre
    };
  };

  const getAvailableStock = () => {
    if (selectedVariation) {
      return selectedVariation.cantidad;
    }
    return product?.cantidad || 0;
  };

  const handleColorSelect = (color) => {
    const newColor = selectedColor === color ? null : color;
    setSelectedColor(newColor);
    updateSelectedVariation(newColor, selectedModel);
    setAutoSelectedVariation(false);
  };

  const handleModelSelect = (modelo) => {
    const newModel = selectedModel === modelo ? null : modelo;
    setSelectedModel(newModel);
    updateSelectedVariation(selectedColor, newModel);
    setAutoSelectedVariation(false);
  };

  const updateSelectedVariation = (color, modelo) => {
    const images = getProductImages();

    if (!color && !modelo) {
      setSelectedVariation(null);
      setCurrentImageIndex(0);
      return;
    }

    const variation = product?.variaciones?.find(v =>
      (color ? v.color === color : true) &&
      (modelo ? v.modelo === modelo : true) &&
      v.cantidad > 0
    );

    if (variation) {
      setSelectedVariation(variation);

      if (variation.imagen) {
        const variationImageIndex = images.findIndex(img => img === variation.imagen);
        if (variationImageIndex !== -1) {
          setCurrentImageIndex(variationImageIndex);
        }
      }
    } else {
      setSelectedVariation(null);
    }
  };

  const nextImage = () => {
    const images = getProductImages();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    const images = getProductImages();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const getCurrentPrice = () => {
    if (selectedVariation) {
      const precioFinalVariacion = selectedVariation.precio_post_descuento ?? selectedVariation.precio;
      return parseFloat(precioFinalVariacion).toFixed(2);
    }
    return product ? parseFloat(product.precio_post_descuento).toFixed(2) : '0.00';
  };

  const getOriginalPrice = () => {
    if (selectedVariation) {
      return parseFloat(selectedVariation.precio).toFixed(2);
    }
    return product ? parseFloat(product.precio).toFixed(2) : '0.00';
  };

  const hasDiscount = () => {
    if (selectedVariation) {
      const precioBase = parseFloat(selectedVariation.precio || 0);
      const precioFinalRaw = selectedVariation.precio_post_descuento ?? selectedVariation.precio ?? 0;
      const precioFinal = parseFloat(precioFinalRaw);
      return precioFinal < precioBase;
    }
    return product?.descuento > 0;
  };

  const handleAddToCart = () => {
    const availableStock = getAvailableStock();

    if (!product.estado || availableStock === 0) {
      alert('No hay stock disponible para esta selección');
      return;
    }

    // Obtener código de referido de localStorage
    const referralCode = localStorage.getItem('referralCode') || '';

    if (selectedVariation) {
      addToCart({
        id: product.id,
        nombre: product.nombre,
        imagenes: product.imagenes,
        variacion: {
          id: selectedVariation.id,
          precio_post_descuento: selectedVariation.precio_post_descuento ?? selectedVariation.precio,
          imagen: selectedVariation.imagen || (product.imagenes && product.imagenes[0]?.imagen),
          color: selectedVariation.color,
          modelo: selectedVariation.modelo,
          garantia_tiempo: selectedVariation.garantia_tiempo,
          regalo_nombre: selectedVariation.regalo_nombre,
          cantidad: selectedVariation.cantidad,
          punto_venta: selectedVariation.punto_venta || product.punto_venta,
          punto_venta_detalle: selectedVariation.punto_venta_detalle || product.punto_venta_detalle
        },
        cantidad: 1,
        availableStock: availableStock,
        punto_venta: selectedVariation.punto_venta || product.punto_venta,
        punto_venta_detalle: selectedVariation.punto_venta_detalle || product.punto_venta_detalle,
        productData: product,
        referralCode: referralCode // ← PASAR CÓDIGO DE REFERIDO
      });
    } else {
      addToCart({
        id: product.id,
        nombre: product.nombre,
        precio_post_descuento: product.precio_post_descuento,
        imagenes: product.imagenes,
        garantia_tiempo: product.garantia_tiempo,
        regalo_nombre: product.regalo_nombre,
        cantidad: 1,
        availableStock: availableStock,
        punto_venta: product.punto_venta,
        punto_venta_detalle: product.punto_venta_detalle,
        productData: product,
        referralCode: referralCode // ← PASAR CÓDIGO DE REFERIDO
      });
    }
  };

  // Las lineas "Etiqueta: valor" de la descripcion se muestran como ficha tecnica
  const renderDescription = (text) =>
    (text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => {
      const match = line.match(/^([^:]{2,32}):\s*(.+)$/);
      return match ? (
        <p key={index} className="pv-spec">
          <b>{match[1]}:</b>
          <span>{match[2]}</span>
        </p>
      ) : (
        <p key={index} className="pv-spec">
          <span>{line}</span>
        </p>
      );
    });

  if (loading) {
    return (
      <div className="pv-page vj-scope">
        <div className="pv-state">
          <div className="vj-spinner"></div>
          <p>Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pv-page vj-scope">
        <div className="pv-state">
          <div className="pv-state__card">
            <h1>{error}</h1>
            <p>El producto que buscas no está disponible</p>
            <button type="button" className="vj-btn vj-btn--primary" onClick={() => navigate(-1)}>
              Volver a la tienda
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const images = getProductImages();
  const { garantia, regalo: regaloRaw } = getWarrantyAndGiftInfo();
  // regalo_nombre puede llegar como lista (vacia si no hay regalo)
  const regalo = (Array.isArray(regaloRaw) ? regaloRaw.filter(Boolean).join(", ") : regaloRaw) || null;
  const availableStock = getAvailableStock();
  const canBuy = product.estado && availableStock > 0;
  const mainSubcategory = product.subcategorias_detalle?.[0];
  const availableColors = getAvailableColors();
  const availableModels = getAvailableModels();

  return (
    <div className="pv-page vj-scope">
      <div className="pv-utility">
        <button type="button" className="pv-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} />
          Volver a la tienda
        </button>
        {mainSubcategory && (
          <div className="pv-breadcrumbs">
            <span>{mainSubcategory.categoria?.nombre}</span>
            <i>/</i>
            <b>{mainSubcategory.nombre}</b>
          </div>
        )}
      </div>

      <div className="pv-container">
        {/* Sección de imágenes */}
        <div className="pv-left">
          <div
            className="pv-visual"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'pan-y' }}
          >
            {images[currentImageIndex].endsWith('.mp4') ? (
              <video src={images[currentImageIndex]} controls />
            ) : (
              <img
                src={images[currentImageIndex]}
                alt={product.nombre}
                className={isTouch ? 'is-touching' : ''}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/600x400/f3f4f6/9ca3af?text=Imagen+no+disponible';
                }}
              />
            )}

            {images.length > 1 && (
              <>
                <button type="button" className="pv-visual__nav pv-visual__nav--prev" onClick={prevImage} aria-label="Imagen anterior">
                  <ChevronLeft size={20} />
                </button>
                <button type="button" className="pv-visual__nav pv-visual__nav--next" onClick={nextImage} aria-label="Imagen siguiente">
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <div className="pv-visual__badges">
              <span className={`pv-badge ${canBuy ? 'pv-badge--ok' : 'pv-badge--off'}`}>
                {product.estado ? (availableStock > 0 ? 'Disponible' : 'Agotado') : 'No disponible'}
              </span>
              {hasDiscount() && <span className="pv-badge pv-badge--sale">-{product.descuento}%</span>}
              {(isManager || isAdmin) && (
                <span className="pv-badge pv-badge--info">Stock total: {product.total_item > 5 ? 5 : product.total_item}</span>
              )}
            </div>
          </div>

          {images.length > 1 && (
            <div className="pv-dots">
              {images.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={currentImageIndex === index ? 'is-active' : ''}
                  aria-label={`Ver imagen ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sección de detalles del producto */}
        <div className="pv-right">
          <div className="pv-header">
            <h1>{product.nombre}</h1>

            {autoSelectedVariation && (
              <p className="pv-notice">
                Hemos seleccionado el modelo automáticamente por usted, pero puede seleccionar cualquier otro modelo o color que desee.
              </p>
            )}

            {isManager && (
              <div className="pv-inventory">
                <h3>Información de inventario</h3>
                <div>
                  <p>
                    Stock total en sistema:
                    <b>{product.total_item <= 5 ? product.total_item : 5} unidades</b>
                  </p>
                  <p>
                    Disponibles actualmente:
                    <b>{availableStock <= 5 ? availableStock : 5} unidades</b>
                  </p>
                </div>
              </div>
            )}

            <div className="pv-price-box">
              {hasDiscount() && (
                <div className="pv-price-box__old">
                  <span>${getOriginalPrice()} USD</span>
                  <b>{product.descuento}% OFF</b>
                </div>
              )}
              <p className="pv-price-box__price">${getCurrentPrice()} USD</p>
            </div>
          </div>

          {(garantia || regalo) && (
            <div className="pv-benefits">
              <h3>Beneficios adicionales</h3>
              {garantia && (
                <p>
                  <ShieldCheck size={18} />
                  Garantía incluida {garantia}
                </p>
              )}
              {regalo && (
                <p>
                  <Gift size={18} />
                  Regalo especial: {regalo}
                </p>
              )}
            </div>
          )}

          <div className="pv-options">
            {/* Selector de versión base */}
            <div className="pv-tags">
              <button
                type="button"
                onClick={() => {
                  setSelectedVariation(null);
                  setSelectedColor(null);
                  setSelectedModel(null);
                  setAutoSelectedVariation(false);
                }}
                disabled={!product.cantidad}
                className={`pv-tag ${!selectedVariation ? 'is-active' : ''}`}
              >
                Versión base {!product.cantidad && '(Agotada)'}
              </button>
            </div>

            {product.variaciones && product.variaciones.length > 0 && (
              <>
                <h2 className="pv-heading">
                  {product.cantidad > 0 ? 'Opciones disponibles' : 'Selecciona una variación disponible'}
                </h2>

                {availableColors.length > 0 && (
                  <div className="pv-option-group">
                    <h3>Color</h3>
                    <div className="pv-tags">
                      {availableColors.map(color => (
                        <button
                          type="button"
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          className={`pv-tag ${selectedColor === color ? 'is-active' : ''}`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {availableModels.length > 0 && (
                  <div className="pv-option-group">
                    <h3>Modelo</h3>
                    <div className="pv-tags">
                      {availableModels.map(modelo => (
                        <button
                          type="button"
                          key={modelo}
                          onClick={() => handleModelSelect(modelo)}
                          className={`pv-tag ${selectedModel === modelo ? 'is-active' : ''}`}
                        >
                          {modelo}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="pv-description">
            <h2 className="pv-heading">Descripción</h2>
            <div className="pv-specs">{renderDescription(product.descripcion)}</div>
          </div>

          <div className="pv-cta">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canBuy}
              className="vj-btn vj-btn--primary pv-cta__cart"
            >
              <ShoppingCart size={18} />
              <span>
                {!product.estado ? 'Producto no disponible' :
                 availableStock === 0 ? 'Sin stock' :
                 `Añadir al carrito - $${getCurrentPrice()}`}
              </span>
            </button>

            <div className="pv-cta__secondary">
              <div className="vj-btn vj-btn--outline pv-rating" title="Valoración del producto">
                {renderStars(averageRating)}
                <span>({(averageRating / 2).toFixed(1)})</span>
              </div>

              <ProductShareButton
                className="vj-btn vj-btn--outline"
                iconSize={14}
                product={{
                  id: product.id,
                  nombre: product.nombre,
                  condicion: product.condicion_detalle?.nombre,
                  precio: getCurrentPrice(),
                  precioAnterior: hasDiscount() ? getOriginalPrice() : null,
                  descripcion: product.descripcion,
                  garantia,
                  regalo,
                }}
              >
                <span>Compartir</span>
              </ProductShareButton>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de comentarios */}
      <section className="pv-comments">
        <div className="pv-comments__head">
          <h2>Comentarios</h2>
          {isClient && (
            <button type="button" className="vj-btn vj-btn--primary pv-comments__add" onClick={handleOpenCommentModal}>
              Añadir Comentario
            </button>
          )}
        </div>

        {comments.length > 0 ? (
          <>
            <div className="pv-comments__list">
              {comments.map((commentItem) => (
                <article key={commentItem.id} className="pv-comment">
                  <div className="pv-comment__head">
                    <span className="pv-comment__avatar">{commentItem.cliente_username.charAt(0).toUpperCase()}</span>
                    <div>
                      <h3>{commentItem.cliente_username}</h3>
                      <div className="pv-rating">{renderStars(commentItem.puntos)}</div>
                    </div>
                  </div>
                  <p>{commentItem.comentario}</p>
                </article>
              ))}
            </div>

            {comments.length > 3 && <p className="pv-comments__hint">Desliza para ver más comentarios</p>}
          </>
        ) : (
          <p className="pv-empty">No hay comentarios aún. {isClient ? "Sé el primero en opinar." : ""}</p>
        )}
      </section>

      {/* Productos relacionados */}
      <section className="pv-related">
        <div>
          <p className="vj-eyebrow">Recomendaciones</p>
          <h2>Productos relacionados</h2>
        </div>

        {loadingRelated ? (
          <div className="pv-state pv-state--inline">
            <div className="vj-spinner"></div>
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="pv-related__grid">
            {relatedProducts.map(product => (
              <CardItem key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="pv-empty">No encontramos productos relacionados</p>
        )}
      </section>

      <SiteFooter />

      {/* Modal para agregar comentarios */}
      <Modal
        open={openCommentModal}
        onClose={handleCloseCommentModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2" className="mb-4">
            Añadir Comentario
          </Typography>
          <div className="mb-4">
            <Typography component="legend">Calificación</Typography>
            <Rating
              name="simple-controlled"
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
              precision={0.5}
            />
          </div>
          <TextField
            id="outlined-multiline-static"
            label="Comentario"
            multiline
            rows={4}
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mb-4"
          />
          <div className="flex justify-end space-x-2">
            <Button onClick={handleCloseCommentModal}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handleSubmitComment}
              sx={{ backgroundColor: '#e8611a', '&:hover': { backgroundColor: '#cf5413' } }}
            >
              Enviar
            </Button>
          </div>
        </Box>
      </Modal>
      <ChatWidget />
      <FloatingWhatsAppButton />
    </div>
  );
};

export default ProductView;
