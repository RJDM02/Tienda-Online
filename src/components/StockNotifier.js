import React from 'react';
import emailjs from '@emailjs/browser';

import { API_URL } from '../config/apiConfig';
const StockNotifier = {
  sendLowStockNotification: async (notification) => {
    try {
      // 1. Verificar si la notificación es de tipo producto y tiene descripción
      if (notification.tipo !== 'producto' || !notification.descripcion) {
        return;
      }

      // 2. Obtener la lista de administradores y super administradores
      const response = await fetch(`${API_URL}/listar_admin_superadmin/`);

      if (!response.ok) {
        throw new Error('Error al obtener la lista de administradores');
      }

      const admins = await response.json();

      // 3. Filtrar solo los que tienen correo electrónico
      const adminsWithEmail = admins.filter(admin => admin.correo);

      if (adminsWithEmail.length === 0) {
        console.log('No hay administradores con correo electrónico registrado');
        return;
      }

      // 4. Configurar EmailJS
      emailjs.init('W_yqO85fndwrvO0wa');

      // 5. Enviar correo a cada administrador
      const emailPromises = adminsWithEmail.map(admin => {
        const templateParams = {
          to_name: admin.nombre,
          to_email: admin.correo,
          message: notification.descripcion,
          subject: 'Alerta de Stock Bajo'
        };

        return emailjs.send(
          'service_codv2pm',
          'template_7b57irv', 
          templateParams
        );
      });

      await Promise.all(emailPromises);
      console.log('Notificaciones de stock bajo enviadas a los administradores');
    } catch (error) {
      console.error('Error al enviar notificaciones de stock bajo:', error);
    }
  }
};

export default StockNotifier;