import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, Link } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShareIcon from '@mui/icons-material/Share';
import { Chip, Tooltip, Snackbar, Alert } from '@mui/material';
import { useCart } from '../context/CartContext';
import { jwtDecode } from 'jwt-decode';
import './CardItem.css';

const CardItem = ({ product, searchTerm = '', userRole }) => {
  const navigate = useNavigate();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const hasDiscount = product.descuento > 0;
  const { addToCart } = useCart();
  
  // Obtener referido_id del token si existe
  const getReferidoId = () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const decodedToken = jwtDecode(token);
        return decodedToken.referido_id || null;
      }
    } catch (error) {
      console.error('Error al decodificar el token:', error);
    }
    return null;
  };
  
  const productImage = product.imagenes?.length > 0 
    ? product.imagenes[0].imagen 
    : 'https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Imagen+no+disponible';
  
  const handleViewDetails = () => {
    navigate(`/product/${product.id}`);
  };

  const highlightSearchTerm = (text) => {
    if (!searchTerm || !text) return text;
    
    const term = searchTerm.toLowerCase();
    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(term);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <span className="bg-yellow-200">{text.substring(index, index + term.length)}</span>
        {text.substring(index + term.length)}
      </>
    );
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    
    if (product.variaciones?.length > 0) {
      handleViewDetails();
      return;
    }
    const availableStock = product.total_item

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
      availableStock: availableStock
    });
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    
    const referidoId = getReferidoId();
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const mainImageUrl = productImage?.startsWith('http')
      ? productImage
      : `${window.location.origin}${productImage?.startsWith('/') ? '' : '/'}${productImage || ''}`;

    // Colocamos primero la imagen del producto para que la previsualizacion en apps como WhatsApp use esa foto
    const shareLines = [
      mainImageUrl,
      productUrl,
      `${product.nombre}`,
      product.condicion_detalle?.nombre ? `Condición: ${product.condicion_detalle.nombre}` : null,
      hasDiscount ? `Precio: $${product.precio_post_descuento} (antes $${product.precio})` : `Precio: $${product.precio}`,
      `${product.descripcion?.substring(0, 500) || 'Producto destacado'}...`,
    ];

    // Eliminar entradas vacías antes de componer el mensaje
    const filteredShareLines = shareLines.filter(Boolean);

    if (referidoId) {
      filteredShareLines.push(`Codigo de referido: ${referidoId}`);
    }

    const composedText = filteredShareLines.join('\n');

    setOpenSnackbar(false);

    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        // Intentar compartir con imagen adjunta y texto completo
        if (navigator.canShare && mainImageUrl) {
          try {
            const response = await fetch(mainImageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'producto.jpg', { type: blob.type || 'image/jpeg' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: product.nombre,
                text: composedText,
                files: [file],
              });
              return;
            }
          } catch (error) {
            console.warn('No se pudo adjuntar la imagen al compartir, usando texto.', error);
          }
        }

        if (navigator.share) {
          await navigator.share({
            title: product.nombre,
            text: composedText,
          });
          return;
        }

        if (navigator.userAgent.match(/WhatsApp/i)) {
          window.open(`whatsapp://send?text=${encodeURIComponent(composedText)}`);
          return;
        }
      }

      if (navigator.userAgent.match(/FBAN|FBAV/i)) {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(composedText)}`, '_blank');
        return;
      }

      if (navigator.userAgent.match(/Twitter/i)) {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(composedText)}&url=${encodeURIComponent(productUrl)}`, '_blank');
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(composedText);
        setOpenSnackbar(true);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = composedText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setOpenSnackbar(true);
      }
    } catch (err) {
      console.error('Error al compartir:', err);
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(composedText)}`, '_blank');
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Determinar si mostrar la comisión
  const isManager = userRole === 'Gestor de Venta';
  const isAdmin = userRole === 'Administrador' || userRole === 'Super_Administrador';
  const showCommission = isManager || isAdmin;

  return (
    <div className="catalog-card bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col h-full group">
      {/* Imagen del producto con overlay */}
      <Link
        to={`/product/${product.id}`}
        className="catalog-card-media relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden cursor-pointer block"
      >
        <img
          src={productImage}
          alt={product.nombre}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Imagen+no+disponible';
          }}
        />
        
        {/* Overlay con botones */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 items-center justify-center opacity-0 group-hover:opacity-100 hidden md:flex">
          <div className="flex space-x-3">
            <Tooltip title="Ver detalles">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleViewDetails();
                }}
                className="bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110"
              >
                <VisibilityIcon sx={{ fontSize: 20 }} />
              </button>
            </Tooltip>
            <Tooltip title="Añadir al carrito">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart(e);
                }}
                disabled={!product.estado || product.total_item === 0}
                className={`p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 ${
                  product.estado && product.total_item > 0
                    ? 'bg-[#FF6B00] hover:bg-[#E55D00] text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCartIcon sx={{ fontSize: 20 }} />
              </button>
            </Tooltip>
            <Tooltip title="Compartir producto">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleShare(e);
                }}
                className="bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110"
              >
                <ShareIcon sx={{ fontSize: 20 }} />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Badge de descuento */}
        {hasDiscount && (
          <div className="absolute top-2 right-2">
            <Chip
              label={`-${product.descuento}%`}
              size="small"
              sx={{
                backgroundColor: '#ef4444',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.7rem',
                height: '20px',
                '& .MuiChip-label': {
                  padding: '0 6px',
                },
              }}
            />
          </div>
        )}

        {/* Badge de estado */}
        <div className="absolute top-2 left-2">
          <Chip
            label={product.estado ? (product.total_item > 0 ? 'Disponible' : 'Agotado') : 'No disponible'}
            size="small"
            sx={{
              backgroundColor: product.estado 
                ? (product.total_item > 0 ? '#22c55e' : '#6b7280') 
                : '#6b7280',
              color: 'white',
              fontWeight: 'medium',
              fontSize: '0.65rem',
              height: '18px',
              '& .MuiChip-label': {
                padding: '0 4px',
              },
            }}
          />
        </div>

        {/* Badge de condición del producto */}
        {product.condicion_detalle && (
          <div className="absolute bottom-2 left-2">
            <Chip
              label={product.condicion_detalle.nombre}
              size="small"
              sx={{
                backgroundColor: '#3b82f6',
                color: 'white',
                fontWeight: 'medium',
                fontSize: '0.65rem',
                height: '18px',
                '& .MuiChip-label': {
                  padding: '0 4px',
                },
              }}
            />
          </div>
        )}
      </Link>

      {/* Contenido de la tarjeta */}
      <div className="catalog-card-body p-3 md:p-4 lg:p-6 flex-grow flex flex-col">
        <Link
          to={`/product/${product.id}`}
          className="catalog-card-title text-[0.78rem] sm:text-[0.82rem] md:text-sm lg:text-base font-semibold text-gray-900 mb-1 leading-[1.15] tracking-[-0.01em] break-words line-clamp-3 hover:text-[#FF6B00] transition-colors duration-200 cursor-pointer"
          style={{
            fontFamily: "'Roboto Condensed', 'Arial Narrow', 'Liberation Sans Narrow', 'Helvetica Neue', Arial, sans-serif",
          }}
        >
          {highlightSearchTerm(product.nombre)}
        </Link>
        
        {/* Mostrar comisión si es gestor o admin */}
        {showCommission && product.comision && (
          <div className="catalog-card-commission mb-2">
            <Chip
              label={`Comisión: $${product.comision}`}
              size="small"
              sx={{
                backgroundColor: '#10b981',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                height: '24px',
                '& .MuiChip-label': {
                  padding: '0 8px',
                },
              }}
            />
          </div>
        )}

        {/* Subcategorías */}
        <div className="catalog-card-tags flex flex-wrap gap-1 mb-3 md:mb-4">
          {product.subcategorias_detalle.slice(0, 1).map(subcat => (
            <Chip
              key={subcat.id}
              label={highlightSearchTerm(subcat.nombre)}
              size="small"
              sx={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                fontSize: '0.6rem',
                fontWeight: 'medium',
                height: '16px',
                '& .MuiChip-label': {
                  padding: '0 4px',
                },
                '&:hover': {
                  backgroundColor: '#e5e7eb',
                }
              }}
            />
          ))}
          {product.subcategorias_detalle.length > 1 && (
            <Chip
              label={`+${product.subcategorias_detalle.length - 1}`}
              size="small"
              sx={{
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                fontSize: '0.6rem',
                height: '16px',
                '& .MuiChip-label': {
                  padding: '0 4px',
                },
              }}
            />
          )}
        </div>
        
        <div className="catalog-card-price mt-auto">
          {hasDiscount ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-gray-400 line-through text-xs md:text-sm font-medium">
                  ${product.precio}
                </span>
                <span className="text-xs text-red-600 font-bold bg-red-50 px-1 py-0.5 rounded">
                  -{product.descuento}%
                </span>
              </div>
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-[#FF6B00]">
                ${product.precio_post_descuento}
              </div>
            </div>
          ) : (
            <div className="text-lg md:text-xl lg:text-2xl font-bold text-[#FF6B00]">
              ${product.precio}
            </div>
          )}
        </div>
      </div>
      
      <div className="catalog-card-actions p-3 md:p-4 lg:p-6 pt-0">
        <button
          onClick={handleAddToCart}
          disabled={!product.estado || product.total_item === 0}
          className={`w-full py-2 md:py-3 px-3 md:px-4 rounded-lg md:rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 flex items-center justify-center space-x-1 md:space-x-2 text-sm md:text-base ${
            product.estado && product.total_item > 0
              ? 'bg-black hover:bg-gray-800 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <ShoppingCartIcon sx={{ fontSize: 16 }} />
          <span className="truncate">
            {!product.estado ? 'No disponible' : 
             product.total_item === 0 ? 'Sin stock' : 
             product.variaciones?.length > 0 ? 'Seleccionar' : 'Añadir'}
          </span>
        </button>
      </div>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          ¡Información del producto copiada al portapapeles!
        </Alert>
      </Snackbar>
    </div>
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
