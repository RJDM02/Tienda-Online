import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../config/apiConfig';

const getReferidoId = () => {
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      return jwtDecode(token).referido_id || null;
    }
  } catch (error) {
    console.error('Error al decodificar el token:', error);
  }
  return null;
};

// El frontend es una SPA sin metadatos Open Graph: el unico enlace que genera
// vista previa (imagen, titulo y descripcion) es el endpoint publico del backend.
export const getShareUrl = (productId, referidoId = getReferidoId()) => {
  const base = API_BASE_URL || window.location.origin;
  const url = `${base}/api/share/product/${productId}/`;
  return referidoId ? `${url}?ref=${encodeURIComponent(referidoId)}` : url;
};

const formatWarranty = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  return /^\d+$/.test(text) ? `${text} dias` : text;
};

const formatGift = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || null;
  return value || null;
};

const buildShareText = ({ nombre, condicion, precio, precioAnterior, descripcion, garantia, regalo }, referidoId, shareUrl) => {
  const description = (descripcion || '').trim();
  const shortDescription = description.length > 200 ? `${description.substring(0, 200).trimEnd()}...` : description;
  const hasDiscount = precioAnterior && Number(precioAnterior) > Number(precio);
  const warranty = formatWarranty(garantia);
  const gift = formatGift(regalo);

  // El enlace es la unica URL del mensaje: WhatsApp y Telegram generan la vista
  // previa a partir de la primera URL que encuentran en el texto.
  return [
    nombre,
    condicion ? `Condición: ${condicion}` : null,
    precio ? (hasDiscount ? `Precio: $${precio} (antes $${precioAnterior})` : `Precio: $${precio}`) : null,
    shortDescription || null,
    warranty ? `Garantia: ${warranty}` : null,
    gift ? `Regalo incluido: ${gift}` : null,
    referidoId ? `Codigo de referido: ${referidoId}` : null,
    shareUrl,
  ].filter(Boolean).join('\n');
};

const copyToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textArea);
  if (!copied) throw new Error('No se pudo copiar al portapapeles');
};

// Devuelve 'shared' | 'copied' | 'cancelled' | 'whatsapp'
export const shareProduct = async (product) => {
  const referidoId = getReferidoId();
  const shareUrl = getShareUrl(product.id, referidoId);
  const text = buildShareText(product, referidoId, shareUrl);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile && navigator.share) {
    try {
      // Solo texto (con el enlace dentro): al pasar tambien `url`, Android duplica el
      // enlace y algunas apps en iOS descartan el texto.
      await navigator.share({ title: product.nombre, text });
      return 'shared';
    } catch (error) {
      // El usuario cerro el menu de compartir: no es un error.
      if (error?.name === 'AbortError') return 'cancelled';
      console.warn('No se pudo abrir el menu de compartir, se copia el enlace.', error);
    }
  }

  try {
    await copyToClipboard(text);
    return 'copied';
  } catch (error) {
    console.error('Error al compartir:', error);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    return 'whatsapp';
  }
};
