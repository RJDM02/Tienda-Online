import React, { useState, useEffect } from 'react';
import { Table, Spin, Alert, Tag, Button, Descriptions, Modal, Input } from 'antd';
import { 
  DollarOutlined, 
  EuroOutlined, 
  MoneyCollectOutlined,
  InfoCircleOutlined,
  GiftOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  UserOutlined,
  PhoneOutlined
} from '@ant-design/icons';

const RecordSalesPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [newCosto, setNewCosto] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch('https://videojuegoshabana.com/api/listar_historial_venta/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener el historial');
        }

        const data = await response.json();

        const sortedSales = data.sort((a, b) => {
          return new Date(b.fecha) - new Date(a.fecha);
        });
        
        setSales(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  const handleEditCosto = (record) => {
    setCurrentEditId(record.id);
    // Establece el valor inicial con el costo existente (producto o variación)
    const initialCosto = record.producto?.costo || record.variacion?.costo || '';
    setNewCosto(initialCosto);
    setEditModalVisible(true);
    setEditError(null);
  };

  const handleSaveCosto = async () => {
    if (!newCosto || isNaN(newCosto)) {
      setEditError('Por favor ingrese un valor numérico válido');
      return;
    }

    try {
      setEditLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`https://videojuegoshabana.com/api/editar_costo/${currentEditId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          costo: parseFloat(newCosto)
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el costo');
      }

      // Actualizar el estado local con el nuevo costo
      setSales(prevSales => prevSales.map(sale => {
        if (sale.id === currentEditId) {
          // Actualiza el costo en producto o variación según corresponda
          if (sale.producto) {
            return { ...sale, producto: { ...sale.producto, costo: newCosto } };
          } else if (sale.variacion) {
            return { ...sale, variacion: { ...sale.variacion, costo: newCosto } };
          }
        }
        return sale;
      }));

      setEditModalVisible(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const getCurrencyIcon = (monedaNombre) => {
    switch (monedaNombre) {
      case 'Dolar':
        return <DollarOutlined className="text-green-600" />;
      case 'Euro':
        return <EuroOutlined className="text-blue-600" />;
      case 'Tranferecia en moneda nacional':
        return <MoneyCollectOutlined className="text-purple-600" />;
      default:
        return null;
    }
  };

  const getStatusTag = (estado) => {
    let color = '';
    switch (estado) {
      case 'procesado':
        color = 'blue';
        break;
      case 'cancelado':
        color = 'red';
        break;
      case 'completado':
        color = 'green';
        break;
      default:
        color = 'gray';
    }
    return <Tag color={color} className="font-medium">{estado}</Tag>;
  };

  const handleShowDetails = (record) => {
    setSelectedSale(record);
    setDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedSale(null);
  };

  const columns = [
    {
      title: 'Producto',
      dataIndex: 'producto',
      key: 'producto',
      render: (producto) => (
        <div className="space-y-1">
          <div className="font-medium">{producto?.nombre || 'N/A'}</div>
          {producto?.regalo && (
            <Tag icon={<GiftOutlined />} color="green">
              Regalo: {producto.regalo_nombre}
            </Tag>
          )}
          {producto?.garantia && (
            <Tag icon={<SafetyCertificateOutlined />} color="orange">
              Garantía: {producto.garantia_tiempo}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Variación',
      dataIndex: 'variacion',
      key: 'variacion',
      render: (variacion) => (
        <div className="space-y-1">
          <div>{variacion?.item_info?.nombre || 'N/A'}</div>
          {variacion?.color && <Tag className="bg-blue-100 text-blue-800">{variacion.color}</Tag>}
          {variacion?.modelo && <Tag className="bg-purple-100 text-purple-800">{variacion.modelo}</Tag>}
        </div>
      ),
    },
    {
      title: 'Precio',
      dataIndex: 'costo_post_descuento',
      key: 'precio',
      render: (precio, record) => (
        <div className="flex items-center">
          <span className="font-bold">{precio}</span> 
          {record.moneda && (
            <span className="ml-2 flex items-center">
              {getCurrencyIcon(record.moneda.nombre)} 
              <span className="ml-1">{record.moneda.nombre}</span>
              {record.moneda.cambio && record.moneda.cambio !== 1 && (
                <span className="text-xs text-gray-500 ml-1">(1:{record.moneda.cambio})</span>
              )}
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Costo',
      dataIndex: 'costo',
      key: 'costo',
      render: (_, record) => {
        // Verificamos si existe costo en producto o variación
        const costo = record.producto?.costo || record.variacion?.costo;
        
        return (
          <div className="flex items-center">
            {costo ? (
              <>
                <span className="font-bold">{costo}</span> 
                {record.moneda && (
                  <span className="ml-2 flex items-center">
                    {getCurrencyIcon(record.moneda.nombre)} 
                    <span className="ml-1">{record.moneda.nombre}</span>
                  </span>
                )}
              </>
            ) : (
              <Tag color="gray">N/A</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Cliente',
      key: 'cliente',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.cliente?.username || record.nombre_cliente || 'N/A'}</div>
          <div className="text-gray-600">{record.cliente?.telefono || record.telefono_cliente || ''}</div>
          
          {/* Mostrar información del cliente referido si existe */}
          {record.detalle_cliente_referido && (
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
              <Tag color="blue" style={{ marginBottom: '4px' }}>Cliente Referido</Tag>
              <div><strong>Usuario:</strong> {record.detalle_cliente_referido.username}</div>
              <div><strong>Teléfono:</strong> {record.detalle_cliente_referido.telefono}</div>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Domicilio',
      dataIndex: 'domicilio',
      key: 'domicilio',
      render: (domicilio) => (
        <div>
          <div>{domicilio?.ubicacion || 'N/A'}</div>
          {domicilio?.precio && (
            <div className="text-gray-600">Costo: {domicilio.precio}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => getStatusTag(estado),
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (fecha) => new Date(fecha).toLocaleString(),
    },
    {
      title: 'Acciones',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button 
            onClick={() => handleShowDetails(record)}
            icon={<InfoCircleOutlined />}
            className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md hover:shadow-lg transition-all duration-300"
          >
            Detalles
          </Button>
          <Button 
            onClick={() => handleEditCosto(record)}
            icon={<EditOutlined />}
            className="bg-green-600 hover:bg-green-700 text-white border-none shadow-md hover:shadow-lg transition-all duration-300"
          >
            Editar
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex justify-center items-center">
        <Spin size="large" className="text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className="max-w-full mx-auto">
          <Alert 
            message="Error" 
            description={error} 
            type="error" 
            showIcon 
            className="rounded-2xl"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Historial de Ventas</h1>
          <p className="text-gray-600">Registro completo de todas las ventas realizadas</p>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <Table 
            columns={columns} 
            dataSource={sales} 
            rowKey="id"
            bordered
            pagination={{ 
              pageSize: 10,
              className: 'px-6 py-4 bg-white rounded-b-2xl',
              showSizeChanger: true
            }}
            scroll={{ x: true }}
            className="rounded-2xl"
            rowClassName="hover:bg-orange-50 transition-colors duration-200"
            loading={loading}
          />
        </div>

        {/* Modal de Detalles */}
        <Modal
          title={`Detalles de Venta #${selectedSale?.id || ''}`}
          visible={detailModalVisible}
          onCancel={handleCloseDetailModal}
          footer={[
            <Button 
              key="close" 
              onClick={handleCloseDetailModal}
              className="bg-black hover:bg-gray-800 text-white border-none shadow-md hover:shadow-lg transition-all duration-300"
            >
              Cerrar
            </Button>,
          ]}
          width={800}
          bodyStyle={{ padding: '24px' }}
          className="rounded-2xl"
        >
          {selectedSale && (
            <Descriptions bordered column={1} className="rounded-lg">
              <Descriptions.Item label="Producto">
                {selectedSale.producto ? (
                  <div className="space-y-2">
                    <div><strong>Nombre:</strong> {selectedSale.producto.nombre}</div>
                    <div><strong>Descripción:</strong> {selectedSale.producto.descripcion || 'N/A'}</div>
                    <div><strong>Precio:</strong> {selectedSale.producto.precio_post_descuento} {selectedSale.moneda.nombre}</div>
                    {selectedSale.producto.regalo && (
                      <div>
                        <strong>Regalo:</strong> {selectedSale.producto.regalo_nombre}
                      </div>
                    )}
                    {selectedSale.producto.garantia && (
                      <div>
                        <strong>Garantía:</strong> {selectedSale.producto.garantia_tiempo}
                      </div>
                    )}
                  </div>
                ) : selectedSale.variacion ? (
                  <div className="space-y-2">
                    <div><strong>Nombre:</strong> {selectedSale.variacion.item_info.nombre}</div>
                    <div><strong>Color:</strong> {selectedSale.variacion.color}</div>
                    <div><strong>Modelo:</strong> {selectedSale.variacion.modelo}</div>
                    <div><strong>Precio:</strong> {selectedSale.variacion.precio_post_descuento} {selectedSale.moneda.nombre}</div>
                  </div>
                ) : 'N/A'}
              </Descriptions.Item>

              <Descriptions.Item label="Información del Cliente">
                {selectedSale.cliente ? (
                  <div className="space-y-1">
                    <div><strong>Usuario:</strong> {selectedSale.cliente.username}</div>
                    <div><strong>Teléfono:</strong> {selectedSale.cliente.telefono}</div>
                    <div><strong>Correo:</strong> {selectedSale.cliente.correo || 'N/A'}</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div><strong>Nombre:</strong> {selectedSale.nombre_cliente || 'N/A'}</div>
                    <div><strong>Teléfono:</strong> {selectedSale.telefono_cliente || 'N/A'}</div>
                  </div>
                )}
              </Descriptions.Item>

              {/* Mostrar información del cliente referido en el modal de detalles */}
              {selectedSale.detalle_cliente_referido && (
                <Descriptions.Item label="Cliente Referido">
                  <div style={{ padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '6px' }}>
                    <div><strong>Usuario:</strong> {selectedSale.detalle_cliente_referido.username}</div>
                    <div><strong>Teléfono:</strong> {selectedSale.detalle_cliente_referido.telefono}</div>
                  </div>
                </Descriptions.Item>
              )}

              {selectedSale.gestor && (
                <Descriptions.Item label="Gestor">
                  <div className="space-y-1">
                    <div><strong>Nombre:</strong> {selectedSale.gestor.nombre}</div>
                    <div><strong>Usuario:</strong> {selectedSale.gestor.username}</div>
                    <div><strong>Teléfono:</strong> {selectedSale.gestor.telefono}</div>
                  </div>
                </Descriptions.Item>
              )}

              {selectedSale.mensajero && (
                <Descriptions.Item label="Mensajero">
                  <div className="space-y-1">
                    <div><strong>Nombre:</strong> {selectedSale.mensajero.nombre}</div>
                    <div><strong>Usuario:</strong> {selectedSale.mensajero.username}</div>
                    <div><strong>Teléfono:</strong> {selectedSale.mensajero.telefono}</div>
                  </div>
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Información de Entrega">
                <div className="space-y-1">
                  <div><strong>Ubicación:</strong> {selectedSale.domicilio?.ubicacion || 'N/A'}</div>
                  <div><strong>Precio domicilio:</strong> {selectedSale.domicilio?.precio || 'N/A'}</div>
                  <div><strong>Horario deseado:</strong> {selectedSale.horario_deseado_entrega ? new Date(selectedSale.horario_deseado_entrega).toLocaleString() : 'N/A'}</div>
                  <div><strong>Punto de referencia:</strong> {selectedSale.punto_referencia || 'N/A'}</div>
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Información Adicional">
                <div className="space-y-1">
                  <div><strong>Estado:</strong> {getStatusTag(selectedSale.estado)}</div>
                  <div><strong>Fecha de venta:</strong> {new Date(selectedSale.fecha).toLocaleString()}</div>
                  <div><strong>Descuento aplicado:</strong> {selectedSale.porcentaje_descuento || 0}%</div>
                  <div><strong>Notas:</strong> {selectedSale.nota || 'N/A'}</div>
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Total">
                <div className="text-xl font-bold">
                  {selectedSale.costo_post_descuento} {selectedSale.moneda.nombre}
                </div>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* Modal de Edición de Costo */}
        <Modal
          title={`Editar Costo - Venta #${currentEditId}`}
          visible={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setEditModalVisible(false)}>
              Cancelar
            </Button>,
            <Button 
              key="save" 
              type="primary" 
              onClick={handleSaveCosto}
              loading={editLoading}
              className="bg-green-600 hover:bg-green-700 border-none"
            >
              Guardar Cambios
            </Button>,
          ]}
          className="rounded-2xl"
        >
          {editError && (
            <Alert 
              message="Error" 
              description={editError} 
              type="error" 
              showIcon 
              className="mb-4 rounded-lg"
            />
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nuevo Costo:
              </label>
              <Input
                type="number"
                value={newCosto}
                onChange={(e) => setNewCosto(e.target.value)}
                placeholder="Ingrese el nuevo costo"
                className="w-full p-2 border rounded-lg"
                prefix={selectedSale?.moneda && getCurrencyIcon(selectedSale.moneda.nombre)}
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Información actual:</h4>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Producto">
                  {sales.find(s => s.id === currentEditId)?.producto?.nombre || 
                  sales.find(s => s.id === currentEditId)?.variacion?.item_info?.nombre || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Moneda">
                  {sales.find(s => s.id === currentEditId)?.moneda?.nombre || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Costo actual">
                  {sales.find(s => s.id === currentEditId)?.producto?.costo || 
                  sales.find(s => s.id === currentEditId)?.variacion?.costo || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default RecordSalesPage;