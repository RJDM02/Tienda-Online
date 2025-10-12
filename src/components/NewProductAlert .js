// NewProductAlert.js
import emailjs from '@emailjs/browser';

const NewProductAlert = {
  sendNewProductNotification: async (productData) => {
    try {
      // Obtener el último ID del producto
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ No hay token de autenticación');
        return false;
      }

      // Obtener el último ID
      const lastIdResponse = await fetch('https://videojuegoshabana.com/api/ultimo_item_id/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!lastIdResponse.ok) {
        console.error('❌ Error al obtener el último ID');
        return false;
      }

      const lastIdData = await lastIdResponse.json();
      const nuevoId = lastIdData.ultimo_id;
      const productUrl = `https://videojuegoshabana.com/product/${nuevoId}`;

      // Configuración inicial de EmailJS
      emailjs.init('43JY6cqNgcoQxmrtm');

      // Preparar parámetros para el email
      const templateParams = {
        product_name: productData.nombre || 'Producto sin nombre',
        product_price: `$${productData.precio || 0}`,
        product_commission: `${productData.comision || 0}`,
        product_discount: `${productData.descuento || 0}`,
        product_description: productData.descripcion || 'Sin descripción',
        product_url: productUrl,
      };

      console.log('Enviando notificación de nuevo producto con parámetros:', templateParams);

      // Enviar notificación
      try {
        await emailjs.send(
          'service_57tzcap', // Tu Service ID de EmailJS
          'template_ghk335s', // Tu Template ID de EmailJS para nuevos productos
          templateParams
        );
        
        console.log('✅ Notificación de nuevo producto enviada correctamente');
        return true;
      } catch (error) {
        console.error('❌ Error al enviar notificación de nuevo producto:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error general en NewProductAlert:', error);
      return false;
    }
  }
};

export default NewProductAlert;