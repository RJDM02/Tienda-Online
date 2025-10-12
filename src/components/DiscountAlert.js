// DiscountAlert.js
import emailjs from '@emailjs/browser';

const DiscountAlert = {
  sendDiscountNotification: async (productData, oldDiscount, newDiscount) => {
    try {
      // Solo enviar notificación si el descuento cambió y es mayor a 0
      if (oldDiscount === newDiscount || newDiscount <= 0) {
        return false;
      }

      // Configuración inicial de EmailJS
      emailjs.init('iiIkN9nVBQJlpYrix');

      // Preparar parámetros para el email
      const templateParams = {
        product_name: productData.nombre || 'Producto sin nombre',
        product_id: productData.id || 'N/A',
        product_url: `https://videojuegoshabana.com/product/${productData.id || ''}`,
        discount_amount: `${newDiscount || 0}`,
        old_discount: `${oldDiscount || 0}`,
        discount_change: `${newDiscount - oldDiscount}`,
        product_price: `$${productData.precio || 0}`,
        discounted_price: `$${productData.precio_post_descuento || 0}`
      };

      console.log('Enviando notificación de descuento con parámetros:', templateParams);

      // Enviar notificación
      try {
        await emailjs.send(
          'service_lua6okw', // Tu Service ID de EmailJS
          'template_1dw78p9', // Template ID para alertas de descuento
          templateParams
        );
        
        console.log('✅ Notificación de descuento enviada correctamente');
        return true;
      } catch (error) {
        console.error('❌ Error al enviar notificación de descuento:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error general en DiscountAlert:', error);
      return false;
    }
  }
};

export default DiscountAlert;