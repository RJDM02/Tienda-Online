// OrderSoldAlert.js
import emailjs from '@emailjs/browser';

const OrderSoldAlert = {
  sendOrderNotification: async (saleData) => {
    try {
      emailjs.init('KUBVDmVnoPlHiAott');
      
      // Función para escape seguro
      const safeValue = (value) => {
        if (value === null || value === undefined || value === '') {
          return 'No disponible';
        }
        return value.toString().trim();
      };

      const cleanNumber = (num) => {
        if (num === null || num === undefined || num === '') return '0';
        const cleaned = num.toString().replace(/[^\d.]/g, '');
        return cleaned || '0';
      };

      // Preparar información del producto
      const productInfo = saleData.producto ? {
        nombre: saleData.producto.nombre,
        precio: saleData.producto.precio_post_descuento,
        precio_gestor: saleData.precio_gestor || 0
      } : saleData.variacion ? {
        nombre: `${saleData.variacion.item_info?.nombre || 'Producto'} - ${saleData.variacion.color || 'Sin color'} (${saleData.variacion.modelo || 'Sin modelo'})`,
        precio: saleData.variacion.precio_post_descuento,
        precio_gestor: saleData.precio_gestor || 0
      } : {
        nombre: 'Producto no especificado',
        precio: 0,
        precio_gestor: 0
      };

      // Preparar información del cliente
      let clienteInfo = {
        usuario: 'No especificado',
        telefono: 'No disponible',
        correo: 'No disponible'
      };
      
      if (saleData.cliente) {
        clienteInfo = {
          usuario: saleData.cliente.username || 'No especificado',
          telefono: saleData.cliente.telefono || 'No disponible',
          correo: saleData.cliente.correo || 'No disponible'
        };
      } else if (saleData.nombre_cliente || saleData.telefono_cliente) {
        clienteInfo = {
          usuario: saleData.nombre_cliente || 'No especificado',
          telefono: saleData.telefono_cliente || 'No disponible',
          correo: 'No disponible'
        };
      }

      // Preparar información del gestor
      let gestorInfo = {
        nombre: 'No aplica',
        usuario: 'No aplica',
        telefono: 'No aplica',
        garantia: 'No aplica'
      };
      
      if (saleData.gestor) {
        gestorInfo = {
          nombre: saleData.gestor.nombre || 'No aplica',
          usuario: saleData.gestor.username || 'No aplica',
          telefono: saleData.gestor.telefono || 'No aplica',
          garantia: saleData.detalle_garantia_gestor?.nombre || 'Sin garantía'
        };
      }

      // Preparar información del cliente referido (SIEMPRE enviar valores)
      let referidoInfo = {
        usuario: 'No tiene cliente referido',
        telefono: ''
      };
      
      if (saleData.detalle_cliente_referido) {
        referidoInfo = {
          usuario: saleData.detalle_cliente_referido.username || 'Cliente referido',
          telefono: saleData.detalle_cliente_referido.telefono || 'No disponible'
        };
      }

      // Preparar información de domicilio
      const domicilioInfo = {
        ubicacion: saleData.domicilio?.ubicacion || 'No especificado',
        precio: saleData.domicilio?.precio || 0
      };

      // Fecha actual
      const now = new Date();
      const formattedDate = now.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Preparar parámetros (SOLO las variables que existen en el template)
      const templateParams = {
        id: safeValue(saleData.saleId || saleData.id || 'N/A'),
        product_name: safeValue(productInfo.nombre),
        product_price: `$${safeValue(cleanNumber(productInfo.precio))}`,
        product_manager_price: `$${safeValue(cleanNumber(productInfo.precio_gestor))}`,
        client_name: safeValue(clienteInfo.usuario),
        client_phone: safeValue(clienteInfo.telefono),
        client_email: safeValue(clienteInfo.correo),
        manager_name: safeValue(gestorInfo.nombre),
        manager_username: safeValue(gestorInfo.usuario),
        manager_phone: safeValue(gestorInfo.telefono),
        manager_warranty: safeValue(gestorInfo.garantia),
        referred_client_name: safeValue(referidoInfo.usuario),
        referred_client_phone: safeValue(referidoInfo.telefono),
        delivery_location: safeValue(domicilioInfo.ubicacion),
        delivery_price: `$${safeValue(cleanNumber(domicilioInfo.precio))}`,
        date: formattedDate
      };

      console.log('Enviando con parámetros:', templateParams);

      // Enviar notificación
      const result = await emailjs.send(
        'service_3dlsoqh',
        'template_h7cx7jp',
        templateParams
      );
      
      console.log('✅ Notificación enviada correctamente');
      return true;

    } catch (error) {
      console.error('❌ Error en OrderSoldAlert:', error);
      return false;
    }
  }
};

export default OrderSoldAlert;