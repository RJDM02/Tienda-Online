import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Snackbar, Alert } from '@mui/material';
import { shareProduct } from '../utils/shareProduct';

// Boton de compartir reutilizable: catalogo, home, relacionados y detalle del producto.
const ProductShareButton = ({ product, className = 'vj-card__icon-btn', iconSize = 18, children }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCopied(false);
    const result = await shareProduct(product);
    if (result === 'copied') setCopied(true);
  };

  return (
    <>
      <button type="button" className={className} onClick={handleShare} aria-label="Compartir producto" title="Compartir producto">
        <Share2 size={iconSize} />
        {children}
      </button>
      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopied(false)} severity="success" sx={{ width: '100%' }}>
          ¡Enlace del producto copiado! Pégalo en WhatsApp para enviarlo con vista previa.
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProductShareButton;
