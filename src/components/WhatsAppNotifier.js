// src/components/WhatsAppNotifier.js
const WhatsAppNotifier = {
  sendSaleNotification: (phoneNumber) => {
    // Mensaje básico como solicitaste
    const message = "Se ha realizado un nuevo pedido a su negocio por favor verifique";
    
    // Codificar el mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Crear el enlace de WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Abrir en una nueva pestaña
    window.open(whatsappUrl, '_blank');
  }
};

export default WhatsAppNotifier;