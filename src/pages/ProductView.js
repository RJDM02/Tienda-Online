import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, 
  IconButton, 
  Chip, 
  Tooltip, 
  Modal,
  Box,
  TextField,
  Rating,
  Typography,
  Avatar,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  ArrowBack, 
  ArrowForward, 
  ShoppingCart, 
  Favorite, 
  FavoriteBorder, 
  Share,
  Star,
  StarBorder,
  StarHalf
} from '@mui/icons-material';
import { jwtDecode } from 'jwt-decode';
import Navbar from '../components/Navbar';
import CardItem from '../components/CardItem';
import { useCart } from '../context/CartContext';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const ProductView = ({ onShowLogin = () => {} }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
        `https://videojuegoshabana.com/api/listar_item_activo/?categoria=${encodedCategory}`
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
      
      setRelatedProducts(filtered.slice(0, 4));
    } catch (err) {
      console.error('Error fetching related products:', err);
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
    }
  }, [id]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`https://videojuegoshabana.com/api/listar_detalle_item/${id}/`);
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
        const response = await fetch(`https://videojuegoshabana.com/api/listar_detalle_item/${id}/`);
        
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

      const response = await fetch('https://videojuegoshabana.com/api/crear_comentario/', {
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
      stars.push(<Star key={`full-${i}`} sx={{ color: '#FFD700' }} />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" sx={{ color: '#FFD700' }} />);
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(<StarBorder key={`empty-${i}`} sx={{ color: '#FFD700' }} />);
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

  const getWarrantyAndGiftInfo = () => {
    if (selectedVariation) {
      return {
        garantia: selectedVariation.garantia_tiempo,
        regalo: selectedVariation.regalo_nombre
      };
    }
    return {
      garantia: product?.garantia_tiempo,
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
      return parseFloat(selectedVariation.precio).toFixed(2);
    }
    return product ? parseFloat(product.precio_post_descuento).toFixed(2) : '0.00';
  };

  const getOriginalPrice = () => {
    if (selectedVariation) {
      return parseFloat(selectedVariation.item_info?.precio_base || selectedVariation.precio).toFixed(2);
    }
    return product ? parseFloat(product.precio).toFixed(2) : '0.00';
  };

  const hasDiscount = () => {
    if (selectedVariation) {
      return false;
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
          precio_post_descuento: selectedVariation.precio,
          imagen: selectedVariation.imagen || (product.imagenes && product.imagenes[0]?.imagen),
          color: selectedVariation.color,
          modelo: selectedVariation.modelo,
          garantia_tiempo: selectedVariation.garantia_tiempo,
          regalo_nombre: selectedVariation.regalo_nombre,
          cantidad: selectedVariation.cantidad
        },
        cantidad: 1,
        availableStock: availableStock,
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
        referralCode: referralCode // ← PASAR CÓDIGO DE REFERIDO
      });
    }
  };

  const handleShare = () => {
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
    
    const referidoId = getReferidoId();
    const images = getProductImages();
    const mainImage = images.length > 0 ? images[0] : '';
    const { garantia, regalo } = getWarrantyAndGiftInfo();
    
    let shareText = `${product.nombre}\nPrecio: $${getCurrentPrice()}`;
    
    if (garantia) {
      shareText += `\nGarantía: ${garantia}`;
    }
    if (regalo) {
      shareText += `\nRegalo incluido: ${regalo}`;
    }
    
    // Construir URL con parámetro de referido si existe
    let productUrl = `${window.location.origin}/product/${product.id}`;
    if (referidoId) {
      productUrl += `?ref=${referidoId}`;
    }
    
    shareText += `\n\n${product.descripcion?.substring(0, 500) || 'Producto destacado'}...\n\n${productUrl}`;
    
    if (mainImage) {
      shareText += `\nImagen del producto: ${mainImage}`;
    }
    
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobileDevice && navigator.share) {
      navigator.share({
        title: `${product.nombre} - $${getCurrentPrice()}`,
        text: shareText,
        url: productUrl,
      }).catch(err => {
        console.log('Error al compartir:', err);
        shareFallback(shareText);
      });
    } else {
      shareFallback(shareText);
    }
  };

  const shareFallback = (shareText) => {
    // Extraer la URL limpia del texto para evitar duplicados
    const urlMatch = shareText.match(/(https?:\/\/[^\s]+)/);
    const cleanUrl = urlMatch ? urlMatch[0] : `${window.location.origin}/product/${product.id}`;
    const cleanShareText = shareText.replace(cleanUrl, '').trim();
    
    if (window.location.href.includes('web.whatsapp.com')) {
      window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(cleanShareText + '\n\n' + cleanUrl)}`, '_blank');
    } 
    else if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.open(`whatsapp://send?text=${encodeURIComponent(cleanShareText + '\n\n' + cleanUrl)}`, '_blank');
    }
    else {
      navigator.clipboard.writeText(cleanShareText + '\n\n' + cleanUrl);
      alert('El texto se ha copiado al portapapeles. Pégalo en WhatsApp manualmente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <Navbar onShowLogin={onShowLogin} />
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Cargando producto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <Navbar onShowLogin={onShowLogin} />
        <div className="container mx-auto p-6 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{error}</h1>
            <p className="text-gray-600 mb-6">El producto que buscas no está disponible</p>
            <Button 
              variant="contained" 
              className="bg-[#FF6B00] hover:bg-[#E55D00] shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              onClick={() => navigate(-1)}
            >
              Volver a la tienda
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const images = getProductImages();
  const { garantia, regalo } = getWarrantyAndGiftInfo();
  const availableStock = getAvailableStock();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <Navbar onShowLogin={onShowLogin} />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          className="mb-6 bg-white hover:bg-gray-50 text-gray-700 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 rounded-xl"
        >
          Volver a la tienda
        </Button>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="lg:flex">
            {/* Sección de imágenes */}
            <div className="lg:w-1/2 relative">
              <div 
                className="relative h-96 lg:h-[600px] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'pan-y' }}
              >
                {images[currentImageIndex].endsWith('.mp4') ? (
                  <video 
                    src={images[currentImageIndex]} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={images[currentImageIndex]}
                    alt={product.nombre}
                    className={`w-full h-full object-contain transition-transform duration-300 ${
                      isTouch ? 'scale-95' : 'hover:scale-105'
                    }`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/600x400/f3f4f6/9ca3af?text=Imagen+no+disponible';
                    }}
                  />
                )}
                
                {images.length > 1 && (
                  <>
                    <IconButton
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <ArrowBack />
                    </IconButton>
                    <IconButton
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <ArrowForward />
                    </IconButton>
                  </>
                )}

                <div className="absolute top-4 left-4 flex flex-col space-y-2">
                  <Chip
                    label={product.estado ? (availableStock > 0 ? 'Disponible' : 'Agotado') : 'No disponible'}
                    sx={{
                      backgroundColor: product.estado 
                        ? (availableStock > 0 ? '#22c55e' : '#6b7280') 
                        : '#6b7280',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                    }}
                  />
                  {hasDiscount() && (
                    <Chip
                      label={`-${product.descuento}%`}
                      sx={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                      }}
                    />
                  )}
                  {isManager || isAdmin && (
                    <Chip
                      label={`Stock total: ${product.total_item}`}
                      sx={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                      }}
                    />
                  )}
                </div>
              </div>
              
              {/* Miniaturas de imágenes */}
              {images.length > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-4 h-4 rounded-full transition-all duration-200 ${
                        currentImageIndex === index ? 'bg-[#FF6B00] scale-110' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Sección de detalles del producto */}
            <div className="lg:w-1/2 p-8">
              <div className="mb-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">{product.nombre}</h1>
                
                {autoSelectedVariation && (
                  <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 text-left">
                    <p>Hemos seleccionado el modelo automáticamente por usted, pero puede seleccionar cualquier otro modelo o color que desee.</p>
                  </div>
                )}

                {isManager && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3 flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">Información de inventario</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-blue-600">Stock total en sistema:</p>
                            <p className="text-lg font-bold text-blue-900">
                              {product.total_item <= 5 ? product.total_item : '5 o más'} unidades
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-blue-600">Disponibles actualmente:</p>
                            <p className="text-lg font-bold text-blue-900">{availableStock <= 5 ? availableStock : '5 o más'} unidades</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.subcategorias_detalle?.map(subcat => (
                    <div key={subcat.id} className="flex items-center">
                      <Chip
                        label={subcat.categoria?.nombre}
                        size="small"
                        sx={{
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          fontSize: '0.75rem',
                          fontWeight: 'medium',
                        }}
                      />
                      <span className="mx-2 text-gray-400">/</span>
                      <Chip
                        label={subcat.nombre}
                        size="small"
                        sx={{
                          backgroundColor: '#FF6B00',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 'medium',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-8 p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl">
                {hasDiscount() ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 line-through text-xl font-medium">
                        ${getOriginalPrice()}
                      </span>
                      <Chip
                        label={`${product.descuento}% OFF`}
                        size="small"
                        sx={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </div>
                    <div className="text-4xl font-bold text-[#FF6B00]">
                      ${getCurrentPrice()}
                    </div>
                  </div>
                ) : (
                  <div className="text-4xl font-bold text-[#FF6B00]">
                    ${getCurrentPrice()}
                  </div>
                )}
              </div>

              {(garantia || regalo) && (
                <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Beneficios adicionales</h3>
                  <div className="space-y-3">
                    {garantia && (
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Garantía incluida</p>
                          <p className="text-sm text-gray-600">{garantia}</p>
                        </div>
                      </div>
                    )}
                    
                    {regalo && (
                      <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-lg mr-3">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4H5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Regalo especial</p>
                          <p className="text-sm text-gray-600">{regalo}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selector de versión base */}
              <div className="mb-4">
                <button
                  onClick={() => {
                    setSelectedVariation(null);
                    setSelectedColor(null);
                    setSelectedModel(null);
                    setAutoSelectedVariation(false);
                  }}
                  disabled={!product.cantidad}
                  className={`px-4 py-2 rounded-lg ${
                    !selectedVariation 
                      ? 'bg-[#FF6B00] text-white' 
                      : `bg-gray-100 ${!product.cantidad ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-200'}`
                  }`}
                >
                  Versión base {!product.cantidad && '(Agotada)'}
                </button>
              </div>

              {product.variaciones && product.variaciones.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {product.cantidad > 0 ? 'Opciones disponibles' : 'Selecciona una variación disponible'}
                  </h2>
                  
                  {getAvailableColors().length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Color</h3>
                      <div className="flex flex-wrap gap-3">
                        {getAvailableColors().map(color => (
                          <button
                            key={color}
                            onClick={() => handleColorSelect(color)}
                            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 ${
                              selectedColor === color ? 
                              'bg-[#FF6B00] text-white' : 
                              'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {getAvailableModels().length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Modelo</h3>
                      <div className="flex flex-wrap gap-3">
                        {getAvailableModels().map(modelo => (
                          <button
                            key={modelo}
                            onClick={() => handleModelSelect(modelo)}
                            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 ${
                              selectedModel === modelo ? 
                              'bg-[#FF6B00] text-white' : 
                              'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            {modelo}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Descripción</h2>
                <div className="prose prose-gray max-w-none text-left">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{product.descripcion}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.estado || availableStock === 0}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-3 ${
                    product.estado && availableStock > 0
                      ? 'bg-black hover:bg-gray-800 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart sx={{ fontSize: 24 }} />
                  <span>
                    {!product.estado ? 'Producto no disponible' : 
                     availableStock === 0 ? 'Sin stock' : 
                     `Añadir al carrito - $${getCurrentPrice()}`}
                  </span>
                </button>
                
                <div className="flex gap-3">
                  <Tooltip title="Valoración del producto">
                    <button
                      className="flex-1 py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 flex items-center justify-center space-x-2 border border-gray-200"
                    >
                      <div className="flex">
                        {renderStars(averageRating)}
                      </div>
                    </button>
                  </Tooltip>
                  
                  <Tooltip title="Compartir producto">
                    <button
                      onClick={handleShare}
                      className="flex-1 py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 flex items-center justify-center space-x-2 border border-gray-200"
                    >
                      <Share />
                      <span>Compartir</span>
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sección de comentarios */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Comentarios</h2>
            {isClient && (
              <Button 
                variant="contained" 
                className="bg-[#FF6B00] hover:bg-[#E55D00] shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                onClick={handleOpenCommentModal}
              >
                Añadir Comentario
              </Button>
            )}
          </div>
          
          {comments.length > 0 ? (
            <div className="space-y-6">
              <div 
                className={`${isMobile ? 'flex overflow-x-auto pb-4 -mx-4 px-4 space-x-4' : 'overflow-y-auto'}`}
                style={isMobile ? {} : { maxHeight: '500px' }}
              >
                {comments.map((commentItem, index) => (
                  <div 
                    key={commentItem.id} 
                    className={`${isMobile ? 'flex-shrink-0 w-80' : 'border-b border-gray-200 pb-6'} ${index >= 3 ? 'mt-6' : ''}`}
                  >
                    <div className="flex items-start mb-3">
                      <Avatar className="mr-3 bg-[#FF6B00]">
                        {commentItem.cliente_username.charAt(0).toUpperCase()}
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-gray-800">{commentItem.cliente_username}</h3>
                        <div className="flex">
                          {renderStars(commentItem.puntos)}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 pl-14">{commentItem.comentario}</p>
                  </div>
                ))}
              </div>
              
              {comments.length > 3 && (
                <div className="text-center text-sm text-gray-500 mt-2">
                  {isMobile ? "Desliza horizontalmente para ver más comentarios" : "Desliza para ver más comentarios"}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay comentarios aún. {isClient ? "Sé el primero en opinar." : ""}</p>
            </div>
          )}
        </div>
        
        {/* Productos relacionados */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos relacionados</h2>
          
          {loadingRelated ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className={`${isMobile ? 'flex overflow-x-auto pb-4 -mx-4 px-4 space-x-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
              {relatedProducts.map(product => (
                <div key={product.id} className={isMobile ? 'flex-shrink-0 w-64' : ''}>
                  <CardItem product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No encontramos productos relacionados</p>
            </div>
          )}
        </div>
      </div>

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
              className="bg-[#FF6B00] hover:bg-[#E55D00]"
            >
              Enviar
            </Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default ProductView;