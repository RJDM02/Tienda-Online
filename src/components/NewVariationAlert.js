// NewVariationAlert.js
import emailjs from '@emailjs/browser';

const NewVariationAlert = {
  sendNewVariationNotification: async (variationData) => {
    try {
      // Configuración inicial de EmailJS
      emailjs.init('43JY6cqNgcoQxmrtm');

      // Preparar parámetros simplificados para el email
      const templateParams = {
        variation_color: variationData.color || 'Sin color',
        variation_model: variationData.modelo || 'Sin modelo',
        variation_price: `$${variationData.precio || 0}`,
        variation_commission: `$${variationData.comision || 0}`,
        variation_url: variationData.url,
      };

      console.log('Enviando notificación de nueva variación con parámetros:', templateParams);

      // Enviar notificación
      try {
        await emailjs.send(
          'service_57tzcap', // Tu Service ID de EmailJS
          'template_xmxb2ug', // Template ID para nuevas variaciones
          templateParams
        );
        
        console.log('✅ Notificación de nueva variación enviada correctamente');
        return true;
      } catch (error) {
        console.error('❌ Error al enviar notificación de nueva variación:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error general en NewVariationAlert:', error);
      return false;
    }
  }
};

export default NewVariationAlert;