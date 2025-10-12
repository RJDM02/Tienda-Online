import emailjs from '@emailjs/browser';
import { jwtDecode } from 'jwt-decode';

const AdminNotifier2 = {
  /*
  sendNewSaleNotification: async (saleData, saleType = 'gestor') => {
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

      // 3. Determinar información básica
      let client_name = saleData.clientName || 'No especificado';
      let client_phone = saleData.clientPhone || 'No especificado';
      const seller_name = userData ? userData.username : (saleType === 'gestor' ? 'Gestor' : 'Administrador');
      
      // Para ventas admin con cliente registrado
      if (saleType === 'admin' && saleData.clientType === 'registered') {
        client_name = saleData.clientUsername || client_name;
        client_phone = saleData.clientTelefono || client_phone;
      }

      // Formatear fecha y hora
      const delivery_date = new Date(saleData.deliveryDateTime).toLocaleDateString();
      const delivery_time = new Date(saleData.deliveryDateTime).toLocaleTimeString();

      // Crear lista de productos
      let products_list = '';
      saleData.cartItems.forEach(item => {
        const productUrl = `https://videojuegoshabana.com/product/${item.id}`;
        products_list += `• ${item.name || 'Producto'}: ${productUrl}\n`;
      });

      // 4. Preparar parámetros SIMPLIFICADOS
      const templateParams = {
        sale_type: saleType === 'gestor' ? 'Venta de Gestor' : 'Venta de Administrador',
        client_name: client_name,
        client_phone: client_phone,
        seller_name: seller_name,
        currency_name: saleData.currencyName || 'No especificada',
        currency_rate: saleData.currencyRate || 'N/A',
        delivery_location: saleData.deliveryLocation || 'No especificado',
        delivery_price: saleData.deliveryPrice || 'N/A',
        delivery_date: delivery_date,
        delivery_time: delivery_time,
        reference_point: saleData.referencePoint || 'No especificado',
        note: saleData.note || 'Ninguna',
        products: products_list || 'No hay productos',
        precio_gestor: saleData.managerPrice || 'No aplica',
        discount: saleData.discount || '0',
        messenger: saleData.messengerName || 'No asignado'
      };

      console.log('Enviando notificación con parámetros:', templateParams);

      // 5. Enviar notificación
      try {
        await emailjs.send(
          'service_q3iuv9a',
          'template_w06rvy4', 
          templateParams
        );
        
        console.log('✅ Notificación enviada correctamente');
        return true;
      } catch (error) {
        console.error('❌ Error al enviar notificación:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error general en AdminNotifier2:', error);
      return false;
    }
  }*/
};

export default AdminNotifier2;