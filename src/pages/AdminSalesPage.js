import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Modal, Descriptions, Form, Input, Select, DatePicker, Card, Row, Col, Tag } from 'antd';
import axios from 'axios';
import moment from 'moment';
import OrderSoldAlert from '../components/OrderSoldAlert';
import { API_URL } from '../config/apiConfig';
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminSalesPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saleDetails, setSaleDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [couriers, setCouriers] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [domicilios, setDomicilios] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [months, setMonths] = useState([]);

  useEffect(() => {
    // Generar meses para el filtro
    const monthsList = Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: moment().month(i).format('MMMM')
    }));
    setMonths(monthsList);
    
    fetchSales();
    fetchCouriers();
    fetchCurrencies();
    fetchDomicilios();
  }, []);

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/listar_venta/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const sortedSales = response.data.sort((a, b) => {
        return new Date(b.horario_deseado_entrega) - new Date(a.horario_deseado_entrega);
      });
      
      setSales(response.data);
      setLoading(false);
    } catch (error) {
      message.error('Error al cargar las ventas');
      setLoading(false);
    }
  };

  const fetchCouriers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/listar_mensajero/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCouriers(response.data);
    } catch (error) {
      message.error('Error al cargar los mensajeros');
    }
  };

  const fetchCurrencies = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/listar_moneda/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCurrencies(response.data);
    } catch (error) {
      message.error('Error al cargar las monedas');
    }
  };

  const fetchDomicilios = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/listar_domicilio/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setDomicilios(response.data);
    } catch (error) {
      message.error('Error al cargar los domicilios');
    }
  };

  const fetchSaleDetails = async (saleId) => {
    try {
      setDetailLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/listar_detalle_venta/${saleId}/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSaleDetails(response.data);
      setDetailModalVisible(true);
      setDetailLoading(false);
    } catch (error) {
      message.error('Error al cargar los detalles de la venta');
      setDetailLoading(false);
    }
  };

  const handleEdit = async (saleId) => {
    try {
      setEditLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/listar_detalle_venta/${saleId}/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      form.setFieldsValue({
        domicilio_id: response.data.domicilio.id,
        mensajero_id: response.data.mensajero?.id,
        horario_deseado_entrega: moment(response.data.horario_deseado_entrega),
        estado: response.data.estado || 'Pendiente',
        descuento: response.data.porcentaje_descuento || 0
      });
      
      setEditingSaleId(saleId);
      setEditModalVisible(true);
      setEditLoading(false);
    } catch (error) {
      message.error('Error al cargar los datos para editar');
      setEditLoading(false);
    }
  };

  const handleUpdateSale = async () => {
    try {
      const values = await form.validateFields();
      setEditLoading(true);
      const token = localStorage.getItem('authToken');
      
      // ✅ 1. PRIMERO verificar si el usuario seleccionó "procesado"
      const userSelectedProcesado = values.estado === 'procesado';
      
      // ✅ 2. SI seleccionó "procesado", enviar la notificación ANTES del PATCH
      if (userSelectedProcesado) {
        console.log('✅ Usuario seleccionó "procesado" - enviando notificación');
        
        // Obtener los datos ACTUALES de la venta
        const currentSale = sales.find(sale => sale.id === editingSaleId) || 
                            filteredSales.find(sale => sale.id === editingSaleId);
        
        if (currentSale) {
          // Enviar notificación con los datos actuales + el nuevo estado
          await OrderSoldAlert.sendOrderNotification({
            ...currentSale,
            saleId: editingSaleId,
            estado: 'procesado' // Forzamos el estado a procesado para la notificación
          });
          console.log('✅ Notificación enviada correctamente');
        }
      }
      
      // ✅ 3. LUEGO ejecutar el PATCH para actualizar la venta
      await axios.patch(`${API_URL}/editar_venta/${editingSaleId}/`, {
        ...values,
        horario_deseado_entrega: values.horario_deseado_entrega.format('YYYY-MM-DDTHH:mm:ss')
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      message.success('Venta actualizada correctamente');
      setEditModalVisible(false);
      fetchSales();
      setEditLoading(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al actualizar la venta');
      setEditLoading(false);
    }
  }; 

  const handleDetails = (saleId) => {
    fetchSaleDetails(saleId);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSaleDetails(null);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    form.resetFields();
  };

  const handleFilter = (values) => {
    let filteredData = [...sales];
    
    if (values.cliente) {
      filteredData = filteredData.filter(sale => 
        (sale.cliente?.username?.toLowerCase().includes(values.cliente.toLowerCase())) ||
        (sale.nombre_cliente?.toLowerCase().includes(values.cliente.toLowerCase()))
      );
    }
    
    if (values.telefono_cliente) {
      filteredData = filteredData.filter(sale => 
        (sale.cliente?.telefono?.includes(values.telefono_cliente)) ||
        (sale.telefono_cliente?.includes(values.telefono_cliente))
      );
    }
    
    if (values.gestor) {
      filteredData = filteredData.filter(sale => 
        sale.gestor?.nombre?.toLowerCase().includes(values.gestor.toLowerCase()) ||
        sale.gestor?.username?.toLowerCase().includes(values.gestor.toLowerCase())
      );
    }
    
    if (values.telefono_gestor) {
      filteredData = filteredData.filter(sale => 
        sale.gestor?.telefono?.includes(values.telefono_gestor)
      );
    }
    
    if (values.domicilio) {
      filteredData = filteredData.filter(sale => 
        sale.domicilio.ubicacion.toLowerCase().includes(values.domicilio.toLowerCase())
      );
    }
    
    if (values.moneda) {
      filteredData = filteredData.filter(sale => 
        sale.moneda.nombre.toLowerCase().includes(values.moneda.toLowerCase())
      );
    }
    
    if (values.mes) {
      filteredData = filteredData.filter(sale => {
        // Parsear la fecha teniendo en cuenta la zona horaria
        const saleDate = moment.parseZone(sale.horario_deseado_entrega);
        return saleDate.month() + 1 === values.mes;
      });
    }
    
    if (values.fecha && values.fecha.length === 2) {
      // Convertimos las fechas seleccionadas a strings YYYY-MM-DD
      const startDate = values.fecha[0].format('YYYY-MM-DD');
      const endDate = values.fecha[1].format('YYYY-MM-DD');
      
      filteredData = filteredData.filter(sale => {
        // Extraemos solo la parte de la fecha (YYYY-MM-DD) del horario deseado
        const saleDate = sale.horario_deseado_entrega.split('T')[0];
        
        // Comparamos directamente como strings
        return saleDate >= startDate && saleDate <= endDate;
      });
    }
    
    const sortedFilteredData = filteredData.sort((a, b) => {
      return new Date(b.horario_deseado_entrega) - new Date(a.horario_deseado_entrega);
    });

    setFilteredSales(filteredData);
  };

  const resetFilters = () => {
    filterForm.resetFields();
    setFilteredSales([]);
  };

  const columns = [
    {
      title: 'Producto/Variación',
      key: 'product',
      render: (_, record) => (
        <div>
          {record.producto ? (
            <>
              <div><strong>Nombre:</strong> {record.producto.nombre}</div>
              <div><strong>Precio:</strong> {record.producto.precio_post_descuento}</div>
              <div><strong>Precio Gestor:</strong> {record.precio_gestor || 0}</div>
            </>
          ) : (
            <>
              <div><strong>Nombre:</strong> {record.variacion.item_info.nombre}</div>
              <div><strong>Color:</strong> {record.variacion.color}</div>
              <div><strong>Modelo:</strong> {record.variacion.modelo}</div>
              <div><strong>Precio:</strong> {record.variacion.precio_post_descuento}</div>
              <div><strong>Precio Gestor:</strong> {record.precio_gestor || 0}</div> 
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Domicilio',
      key: 'domicilio',
      render: (_, record) => (
        <div>
          <div><strong>Ubicación:</strong> {record.domicilio.ubicacion}</div>
          <div><strong>Precio:</strong> {record.domicilio.precio}</div>
        </div>
      ),
    },
    {
      title: 'Horario Entrega',
      dataIndex: 'horario_deseado_entrega',
      key: 'horario_deseado_entrega',
      render: (text) => new Date(text).toLocaleString(),
      width: 180,
    },
    {
      title: 'Cliente',
      key: 'cliente',
      render: (_, record) => (
        <div>
          {record.cliente ? (
            <>
              <div><strong>Usuario:</strong> {record.cliente.username}</div>
              <div><strong>Teléfono:</strong> {record.cliente.telefono}</div>
              <div><strong>Correo:</strong> {record.cliente.correo}</div>
            </>
          ) : record.gestor ? (
            <>
              <div><strong>Cliente:</strong> {record.nombre_cliente}</div>
              <div><strong>Teléfono:</strong> {record.telefono_cliente}</div>
              <div><strong>Gestor:</strong> {record.gestor.nombre} ({record.gestor.username})</div>
              <div><strong>Teléfono Gestor:</strong> {record.gestor.telefono}</div>
              <div><strong>Garantia:</strong> {record.detalle_garantia_gestor ? record.detalle_garantia_gestor.nombre : "sin garantia de gestor"}</div>
            </>
          ) : (
            <>
              <div><strong>Cliente:</strong> {record.nombre_cliente}</div>
              <div><strong>Teléfono:</strong> {record.telefono_cliente}</div>
            </>
          )}
          
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
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 120,
      render: (estado) => estado || 'Pendiente',
    },
    {
      title: 'Total',
      key: 'total',
      render: (_, record) => (
        <div>
          <strong>{record.costo_post_descuento} {record.moneda.nombre}</strong>
        </div>
      ),
      width: 120,
    },
    {
      title: 'Acciones',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            onClick={() => handleEdit(record.id)}
            className="bg-black hover:bg-gray-800 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            Modificar
          </Button>
          <Button 
            onClick={() => handleDetails(record.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            Detalles
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Listado de Ventas</h1>
          <p className="text-gray-600">Gestiona todas las ventas del sistema</p>
        </div>

        {/* Filtros */}
        <Card className="mb-6 rounded-2xl shadow-lg">
          <Form form={filterForm} onFinish={handleFilter} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6} lg={4}>
                <Form.Item name="cliente" label="Cliente">
                  <Input placeholder="Nombre o usuario" className="rounded-xl" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4}>
                <Form.Item name="telefono_cliente" label="Teléfono Cliente">
                  <Input placeholder="Número de teléfono" className="rounded-xl" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4}>
                <Form.Item name="gestor" label="Gestor">
                  <Input placeholder="Nombre o usuario" className="rounded-xl" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4}>
                <Form.Item name="telefono_gestor" label="Teléfono Gestor">
                  <Input placeholder="Número de teléfono" className="rounded-xl" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4}>
                <Form.Item name="domicilio" label="Domicilio">
                  <Input placeholder="Ubicación" className="rounded-xl" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4}>
                <Form.Item name="moneda" label="Moneda">
                  <Input placeholder="Nombre de moneda" className="rounded-xl" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4}>
                <Form.Item name="mes" label="Mes">
                  <Select placeholder="Seleccione mes" className="rounded-xl">
                    {months.map(month => (
                      <Option key={month.value} value={month.value}>{month.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4}>
                <Form.Item name="fecha" label="Rango de fechas">
                  <RangePicker 
                    className="rounded-xl w-full"
                    format="YYYY-MM-DD"  
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row justify="end" gutter={16}>
              <Col>
                <Button 
                  type="default" 
                  onClick={resetFilters}
                  className="rounded-xl border-gray-300"
                >
                  Limpiar
                </Button>
              </Col>
              <Col>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  className="rounded-xl bg-black hover:bg-gray-800 border-none"
                >
                  Filtrar
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <Table 
            columns={columns} 
            dataSource={filteredSales.length > 0 ? filteredSales : sales} 
            rowKey="id" 
            loading={loading}
            scroll={{ x: 1500 }}
            bordered
            className="rounded-2xl"
            rowClassName="hover:bg-orange-50 transition-colors duration-200"
            pagination={{
              className: 'px-6 py-4 bg-white rounded-b-2xl',
              showSizeChanger: true
            }}
          />
        </div>

        {/* Modal de Detalles */}
        <Modal
          title={`Detalles de Venta #${saleDetails?.id || ''}`}
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
          {detailLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : saleDetails ? (
            <Descriptions bordered column={1} className="rounded-lg">
              <Descriptions.Item label="Punto de Referencia">
                {saleDetails.punto_referencia || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Nota">
                {saleDetails.nota || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Porcentaje de Descuento">
                {saleDetails.porcentaje_descuento}%
              </Descriptions.Item>
              
              <Descriptions.Item label="Producto">
                {saleDetails.producto ? (
                  <div>
                    <div><strong>Nombre:</strong> {saleDetails.producto.nombre}</div>
                    <div><strong>Precio:</strong> {saleDetails.producto.precio_post_descuento} {saleDetails.moneda.nombre}</div>
                    <div><strong>Descripción:</strong> {saleDetails.producto.descripcion}</div>
                  </div>
                ) : saleDetails.variacion ? (
                  <div>
                    <div><strong>Nombre:</strong> {saleDetails.variacion.item_info.nombre}</div>
                    <div><strong>Color:</strong> {saleDetails.variacion.color}</div>
                    <div><strong>Modelo:</strong> {saleDetails.variacion.modelo}</div>
                    <div><strong>Precio:</strong> {saleDetails.variacion.precio_post_descuento} {saleDetails.moneda.nombre}</div>
                  </div>
                ) : 'N/A'}
              </Descriptions.Item>

              <Descriptions.Item label="Información del Cliente">
                {saleDetails.cliente ? (
                  <div>
                    <div><strong>Usuario:</strong> {saleDetails.cliente.username}</div>
                    <div><strong>Teléfono:</strong> {saleDetails.cliente.telefono}</div>
                    <div><strong>Correo:</strong> {saleDetails.cliente.correo}</div>
                  </div>
                ) : (
                  <div>
                    <div><strong>Nombre:</strong> {saleDetails.nombre_cliente || 'N/A'}</div>
                    <div><strong>Teléfono:</strong> {saleDetails.telefono_cliente || 'N/A'}</div>
                  </div>
                )}
              </Descriptions.Item>

              {/* Mostrar información del cliente referido en el modal de detalles */}
              {saleDetails.detalle_cliente_referido && (
                <Descriptions.Item label="Cliente Referido">
                  <div style={{ padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '6px' }}>
                    <div><strong>Usuario:</strong> {saleDetails.detalle_cliente_referido.username}</div>
                    <div><strong>Teléfono:</strong> {saleDetails.detalle_cliente_referido.telefono}</div>
                  </div>
                </Descriptions.Item>
              )}

              {saleDetails.gestor && (
                <Descriptions.Item label="Gestor">
                  <div>
                    <div><strong>Nombre:</strong> {saleDetails.gestor.nombre}</div>
                    <div><strong>Usuario:</strong> {saleDetails.gestor.username}</div>
                    <div><strong>Teléfono:</strong> {saleDetails.gestor.telefono}</div>
                    <div><strong>Garantia:</strong> {saleDetails.gestor.detalle_garantia_gestor ? saleDetails.gestor.detalle_garantia_gestor.nombre : "sin garantia de gestor"}</div>
                  </div>
                </Descriptions.Item>
              )}

              {saleDetails.mensajero && (
                <Descriptions.Item label="Mensajero">
                  <div>
                    <div><strong>Nombre:</strong> {saleDetails.mensajero.nombre}</div>
                    <div><strong>Usuario:</strong> {saleDetails.mensajero.username}</div>
                    <div><strong>Teléfono:</strong> {saleDetails.mensajero.telefono}</div>
                  </div>
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Información de Entrega">
                <div>
                  <div><strong>Ubicación:</strong> {saleDetails.domicilio.ubicacion}</div>
                  <div><strong>Precio domicilio:</strong> {saleDetails.domicilio.precio}</div>
                  <div><strong>Horario deseado:</strong> {new Date(saleDetails.horario_deseado_entrega).toLocaleString()}</div>
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Total">
                <strong>{saleDetails.costo_post_descuento} {saleDetails.moneda.nombre}</strong>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <p>No se encontraron detalles para esta venta</p>
          )}
        </Modal>

        {/* Modal de Edición */}
        <Modal
          title={`Modificar Venta #${editingSaleId || ''}`}
          visible={editModalVisible}
          onCancel={handleCloseEditModal}
          onOk={handleUpdateSale}
          confirmLoading={editLoading}
          width={600}
          bodyStyle={{ padding: '24px' }}
          className="rounded-2xl"
          okButtonProps={{
            className: "bg-black hover:bg-gray-800 text-white border-none shadow-md hover:shadow-lg transition-all duration-300"
          }}
          cancelButtonProps={{
            className: "border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300"
          }}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="domicilio_id"
              label="Domicilio"
              rules={[{ required: true, message: 'Seleccione un domicilio' }]}
            >
              <Select 
                placeholder="Seleccione un domicilio"
                className="rounded-xl"
              >
                {domicilios.map(domicilio => (
                  <Option key={domicilio.id} value={domicilio.id}>
                    {domicilio.ubicacion} - {domicilio.precio} USD
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="mensajero_id"
              label="Mensajero"
            >
              <Select 
                placeholder="Seleccione un mensajero" 
                allowClear
                className="rounded-xl"
              >
                {couriers.map(courier => (
                  <Option key={courier.id} value={courier.id}>
                    {courier.nombre} ({courier.username}) - Tel: {courier.telefono}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="horario_deseado_entrega"
              label="Horario deseado de entrega"
              rules={[{ required: true, message: 'Seleccione una fecha' }]}
            >
              <DatePicker 
                showTime 
                format="YYYY-MM-DD HH:mm:ss" 
                style={{ width: '100%' }}
                className="rounded-xl"
              />
            </Form.Item>

            <Form.Item
              name="estado"
              label="Estado"
              rules={[{ required: false, message: 'Seleccione un estado' }]}
            >
              <Select className="rounded-xl">
                <Option value="">Pendiente</Option>
                <Option value="procesado">Procesado</Option>
                <Option value="cancelado">Cancelado</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="descuento"
              label="Descuento (%)"
              rules={[
                { required: true, message: 'Ingrese el descuento' },
              ]}
            >
              <Input 
                type="number" 
                min={0} 
                className="rounded-xl"
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default AdminSalesPage;