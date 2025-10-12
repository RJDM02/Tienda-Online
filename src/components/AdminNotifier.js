import emailjs from '@emailjs/browser';
import { jwtDecode } from 'jwt-decode';

const AdminNotifier = {
  /*
  sendNewSaleNotification: async (saleData) => {
    try {
      // 1. Verificar si hay token en localStorage
      const token = localStorage.getItem('authToken');
      let userData = null;
      
      if (token) {
        try {
          const decoded = jwtDecode(token);
          userData = {
            username: decoded.username,
            telefono: decoded.telefono || 'No disponible'
          };
        } catch (error) {
          console.error('Error decodificando token:', error);
        }
      }

      // 2. Configuración inicial de EmailJS
      emailjs.init('gikqF7oP0VedxQhNH');

      // 3. Preparar información para el correo
      const client_name = userData ? userData.username : saleData.clientName;
      const client_phone = userData ? userData.telefono : saleData.clientPhone;
      const seller_name = userData ? userData.username : 'Cliente no registrado';
      
      // Formatear fecha y hora
      const delivery_date = new Date(saleData.deliveryDateTime).toLocaleDateString();
      const delivery_time = new Date(saleData.deliveryDateTime).toLocaleTimeString();

      // Crear lista de productos CON ENLACES
      let products_list = '';
      saleData.cartItems.forEach(item => {
        const productUrl = `https://videojuegoshabana.com/product/${item.id}`;
        products_list += `• ${item.id || 'Producto'}: ${productUrl}\n`;
      });

      // 4. Preparar parámetros
      const templateParams = {
        client_name: client_name,
        client_phone: client_phone,
        seller_name: 'Osvaldo',
        currency_name: saleData.currencyName || 'No especificada',
        currency_rate: saleData.currencyRate || 'N/A',
        delivery_location: saleData.deliveryLocation || 'No especificado',
        delivery_price: saleData.deliveryPrice || 'N/A',
        delivery_date: delivery_date,
        delivery_time: delivery_time,
        reference_point: saleData.referencePoint || 'No especificado',
        note: saleData.note || 'Ninguna',
        products: products_list || 'No hay productos'
      };

      console.log('Parámetros enviados a EmailJS:', templateParams);

      // 5. Enviar notificación
      try {
        const response = await emailjs.send(
          'service_q3iuv9a',
          'template_s7edv5j', 
          templateParams
        );
        
        console.log('✅ Notificación enviada correctamente');
        return true;
      } catch (error) {
        console.error('❌ Error al enviar notificación:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error general en AdminNotifier:', error);
      return false;
    }
  }*/
};

export default AdminNotifier;