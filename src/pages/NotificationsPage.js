import React, { useState, useEffect } from 'react';
import { Table, Button, message, Spin } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import StockNotifier from '../components/StockNotifier';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener datos del usuario y token
  const userData = JSON.parse(localStorage.getItem('userData'));
  const token = localStorage.getItem('authToken');

  // Determinar el rol del usuario
  const isCourier = userData && (userData.rol === 'Mensajero');
  const isManager = userData && (userData.rol === 'Gestor de Venta');
  const isAdmin = userData && (userData.rol === 'Administrador');
  const isSuperAdmin = userData && (userData.rol === 'Super_Administrador');

  // Obtener el endpoint correcto según el rol
  const getEndpoint = () => {
    if (isSuperAdmin) return 'https://videojuegoshabana.com/api/listar_notificaciones_super_administrador/';
    if (isAdmin) return 'https://videojuegoshabana.com/api/listar_notificaciones_administrador/';
    if (isManager) return 'https://videojuegoshabana.com/api/listar_notificaciones_gestor/';
    if (isCourier) return 'https://videojuegoshabana.com/api/listar_notificaciones_mensajero/';
    return null;
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const endpoint = getEndpoint();
      if (!endpoint) {
        throw new Error('No se pudo determinar el endpoint para este usuario');
      }

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    
      setNotifications(response.data);
      // Verificar y enviar notificaciones de stock bajo
      response.data.forEach(notification => {
        if (notification.tipo === 'producto') {
          StockNotifier.sendLowStockNotification(notification);
        }
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Error al cargar las notificaciones');
      setLoading(false);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (id) => {
    try {
      await axios.delete(`https://videojuegoshabana.com/api/eliminar_notificacion/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      message.success('Notificación eliminada correctamente');
      // Refresh notifications after deletion
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
      message.error('Error al eliminar la notificación');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Columns for the table
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 120,
      render: (tipo) => {
        const tipoMap = {
          'mensajeria': 'Mensajería',
          'producto': 'Producto',
          // Agrega más tipos si es necesario
        };
        return tipoMap[tipo] || tipo;
      },
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 120,
      render: (fecha) => dayjs(fecha).format('DD/MM/YYYY'),
    },
    {
      title: 'Acción',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteNotification(record.id)}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>{error}</h3>
        <Button type="primary" onClick={fetchNotifications}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Notificaciones</h1>
      <Table
        columns={columns}
        dataSource={notifications}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />
    </div>
  );
};

export default NotificationsPage;