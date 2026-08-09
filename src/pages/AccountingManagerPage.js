import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  Button,
  Modal,
  Typography,
  Card,
  message,
  Tag,
  Row,
  Col,
  Divider,
  Input,
  Space
} from 'antd';
import {
  EyeOutlined,
  DeleteOutlined,
  DollarOutlined,
  UserOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';

import { API_URL } from '../config/apiConfig';
const { Title, Text } = Typography;

const AccountingManagerPage = () => {
  const [gestores, setGestores] = useState([]);
  const [filteredGestores, setFilteredGestores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGestor, setSelectedGestor] = useState(null);
  const [contabilidadData, setContabilidadData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    nombre: '',
    telefono: '',
    username: ''
  });
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [contabilidadToDeactivate, setContabilidadToDeactivate] = useState(null);

  useEffect(() => {
    const fetchGestores = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${API_URL}/listar_trabajador/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const gestoresFiltrados = response.data.filter(
          trabajador => trabajador.rol === 'Gestor de Venta'
        );
        
        setGestores(gestoresFiltrados);
        setFilteredGestores(gestoresFiltrados);
        setLoading(false);
      } catch (error) {
        console.error('Error al obtener los gestores:', error);
        setLoading(false);
        message.error('Error al cargar los gestores');
      }
    };

    fetchGestores();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    let result = [...gestores];
    
    if (filters.nombre) {
      result = result.filter(gestor => 
        gestor.nombre.toLowerCase().includes(filters.nombre.toLowerCase())
      );
    }
    
    if (filters.telefono) {
      result = result.filter(gestor => 
        gestor.telefono.includes(filters.telefono)
      );
    }
    
    if (filters.username) {
      result = result.filter(gestor => 
        gestor.username.toLowerCase().includes(filters.username.toLowerCase())
      );
    }
    
    setFilteredGestores(result);
  };

  const resetFilters = () => {
    setFilters({
      nombre: '',
      telefono: '',
      username: ''
    });
    setFilteredGestores(gestores);
    setSearchText('');
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredGestores(gestores);
      return;
    }
    
    const filtered = gestores.filter(gestor => {
      return (
        gestor.nombre.toLowerCase().includes(value.toLowerCase()) ||
        gestor.telefono.includes(value) ||
        gestor.username.toLowerCase().includes(value.toLowerCase())
      );
    });
    
    setFilteredGestores(filtered);
  };

  const handleOpenModal = async (gestorId, gestorNombre) => {
    setSelectedGestor({ id: gestorId, nombre: gestorNombre });
    setDetailLoading(true);
    setModalOpen(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/listar_contabilidad_gestor/${gestorId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setContabilidadData(response.data);
    } catch (error) {
      console.error('Error al obtener la contabilidad:', error);
      message.error('Error al cargar la contabilidad del gestor');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setContabilidadData(null);
    setSelectedGestor(null);
  };

  const handleDesactivarContabilidad = (contabilidadId) => {
    setContabilidadToDeactivate(contabilidadId);
    setConfirmModalVisible(true);
  };

  const handleDesactivarTodas = () => {
    setContabilidadToDeactivate('all');
    setConfirmModalVisible(true);
  };

  const confirmDeactivate = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('authToken');

      if (contabilidadToDeactivate === 'all') {
        const activas = (contabilidadData?.ventas_asociadas || []).filter(
          (venta) => venta.estado_contabilidad
        );

        if (activas.length === 0) {
          message.info('No hay contabilidades activas para desactivar');
          return;
        }

        await Promise.all(
          activas.map((venta) =>
            axios.delete(`${API_URL}/desactivar_contabilidad/${venta.contabilidad_id}/`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
          )
        );

        const updatedVentas = contabilidadData.ventas_asociadas.filter(
          (venta) => !activas.some((activa) => activa.contabilidad_id === venta.contabilidad_id)
        );

        setContabilidadData({
          ...contabilidadData,
          ventas_asociadas: updatedVentas,
          ganancia_total_pendiente: updatedVentas.reduce(
            (total, venta) => total + venta.ganancia_cobrar, 0
          )
        });
        message.success('Todas las contabilidades activas fueron desactivadas');
      } else {
        await axios.delete(`${API_URL}/desactivar_contabilidad/${contabilidadToDeactivate}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const updatedVentas = contabilidadData.ventas_asociadas.filter(
          venta => venta.contabilidad_id !== contabilidadToDeactivate
        );
        
        setContabilidadData({
          ...contabilidadData,
          ventas_asociadas: updatedVentas,
          ganancia_total_pendiente: updatedVentas.reduce(
            (total, venta) => total + venta.ganancia_cobrar, 0
          )
        });
        
        message.success('Contabilidad desactivada correctamente');
      }
    } catch (error) {
      console.error('Error al desactivar la contabilidad:', error);
      message.error('Error al desactivar la contabilidad');
    } finally {
      setProcessing(false);
      setConfirmModalVisible(false);
      setContabilidadToDeactivate(null);
    }
  };

  const cancelDeactivate = () => {
    setConfirmModalVisible(false);
    setContabilidadToDeactivate(null);
  };

  const gestoresColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text) => (
        <div className="flex items-center">
          <UserOutlined className="mr-2 text-orange-500" />
          <Text>{text}</Text>
        </div>
      )
    },
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      render: (text) => <Text>{text}</Text>
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => handleOpenModal(record.id, record.nombre)}
          loading={processing}
          className="rounded-xl bg-black hover:bg-gray-800 border-none"
        >
          Ver Contabilidad
        </Button>
      )
    }
  ];

  const contabilidadColumns = [
    {
      title: 'ID Contabilidad',
      dataIndex: 'contabilidad_id',
      key: 'contabilidad_id',
      width: 130,
      render: (text) => <Text strong>#{text}</Text>
    },
    {
      title: 'ID Venta',
      dataIndex: 'venta_historial_id',
      key: 'venta_historial_id',
      width: 100,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Venta Asociada',
      key: 'venta_asociada',
      width: 200,
      render: (_, record) => (
        <Text>
          {record.venta_producto ? record.venta_producto : record.venta_variacion}
        </Text>
      )
    },
    {
      title: 'Ganancia a Cobrar',
      dataIndex: 'ganancia_cobrar',
      key: 'ganancia_cobrar',
      width: 150,
      render: (value) => (
        <div className="flex items-center">
          <DollarOutlined className="mr-1 text-green-500" />
          <Text strong className="text-green-600">
            ${value.toFixed(2)}
          </Text>
        </div>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'estado_contabilidad',
      key: 'estado_contabilidad',
      width: 100,
      render: (estado) => (
        <Tag color={estado ? 'green' : 'red'}>
          {estado ? 'Activa' : 'Inactiva'}
        </Tag>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        record.estado_contabilidad && (
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDesactivarContabilidad(record.contabilidad_id)}
            loading={processing}
            className="rounded-xl"
          >
            Desactivar
          </Button>
        )
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <Title level={2} className="text-gray-900 mb-2">
            Gestión de Contabilidad - Gestores
          </Title>
          <Text className="text-gray-600">
            Administra la contabilidad de todos los gestores de venta
          </Text>
        </div>

        <Card className="mb-6 rounded-2xl shadow-lg">
          <Title level={4} className="mb-4">
            <FilterOutlined className="mr-2" />
            Filtros de Búsqueda
          </Title>
          
          <div className="mb-6">
            <Input
              placeholder="Buscar gestores..."
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                handleSearch(e.target.value);
              }}
              className="rounded-xl"
              style={{ width: 300 }}
            />
          </div>
          
          <div className="mb-4">
            <Title level={5} className="mb-3">Filtros Avanzados</Title>
            <Space size="large" wrap>
              <div>
                <Text strong className="block mb-1">Nombre</Text>
                <Input
                  placeholder="Filtrar por nombre"
                  value={filters.nombre}
                  onChange={(e) => handleFilterChange('nombre', e.target.value)}
                  className="rounded-xl"
                  style={{ width: 200 }}
                />
              </div>
              
              <div>
                <Text strong className="block mb-1">Teléfono</Text>
                <Input
                  placeholder="Filtrar por teléfono"
                  value={filters.telefono}
                  onChange={(e) => handleFilterChange('telefono', e.target.value)}
                  className="rounded-xl"
                  style={{ width: 200 }}
                />
              </div>
              
              <div>
                <Text strong className="block mb-1">Usuario</Text>
                <Input
                  placeholder="Filtrar por username"
                  value={filters.username}
                  onChange={(e) => handleFilterChange('username', e.target.value)}
                  className="rounded-xl"
                  style={{ width: 200 }}
                />
              </div>
              
              <div className="flex items-end space-x-2">
                <Button
                  type="primary"
                  onClick={applyFilters}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 border-none"
                >
                  Aplicar Filtros
                </Button>
                <Button
                  onClick={resetFilters}
                  className="rounded-xl"
                >
                  Limpiar
                </Button>
              </div>
            </Space>
          </div>
        </Card>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <Table 
            columns={gestoresColumns}
            dataSource={filteredGestores}
            rowKey="id"
            loading={loading}
            scroll={{ x: 800 }}
            bordered
            className="rounded-2xl"
            rowClassName="hover:bg-orange-50 transition-colors duration-200"
            pagination={{
              className: 'px-6 py-4 bg-white rounded-b-2xl',
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} gestores`
            }}
            locale={{
              emptyText: (
                <div className="py-8">
                  <UserOutlined className="text-4xl text-gray-300 mb-4" />
                  <Text className="text-gray-500">No se encontraron gestores con los filtros aplicados</Text>
                </div>
              )
            }}
          />
        </div>

        <Modal
          title={
            <div className="flex items-center">
              <DollarOutlined className="mr-2 text-orange-500" />
              <span>Contabilidad del Gestor: {selectedGestor?.nombre}</span>
            </div>
          }
          open={modalOpen}
          onCancel={handleCloseModal}
          footer={[
            <Button 
              key="close" 
              onClick={handleCloseModal}
              className="bg-black hover:bg-gray-800 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
            >
              Cerrar
            </Button>,
          ]}
          width={1000}
          bodyStyle={{ padding: '24px' }}
          className="rounded-2xl"
        >
          {detailLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : contabilidadData ? (
            <div>
              <Card className="mb-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <Row gutter={16} align="middle">
                  <Col span={4}>
                    <div className="flex justify-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarOutlined className="text-2xl text-green-600" />
                      </div>
                    </div>
                  </Col>
                  <Col span={20}>
                    <Title level={4} className="mb-2 text-green-800">
                      Ganancia Total Pendiente
                    </Title>
                    <Title level={2} className="mb-0 text-green-600">
                      ${contabilidadData.ganancia_total_pendiente.toFixed(2)}
                    </Title>
                  </Col>
                </Row>
              </Card>

              <Divider orientation="left">
                <Text strong>Detalle de Ventas Asociadas</Text>
              </Divider>

              {contabilidadData?.ventas_asociadas?.length > 0 && (
                <div className="flex justify-end mb-3">
                  <Button
                    type="primary"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDesactivarTodas}
                    loading={processing}
                    disabled={!contabilidadData.ventas_asociadas.some((venta) => venta.estado_contabilidad)}
                    className="rounded-xl"
                  >
                    Desactivar todas
                  </Button>
                </div>
              )}

              <Table
                columns={contabilidadColumns}
                dataSource={contabilidadData.ventas_asociadas}
                rowKey="contabilidad_id"
                scroll={{ x: 600 }}
                bordered
                className="rounded-xl"
                rowClassName="hover:bg-orange-50 transition-colors duration-200"
                pagination={{
                  size: 'small',
                  showSizeChanger: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} de ${total} registros`
                }}
                locale={{
                  emptyText: (
                    <div className="py-8">
                      <DollarOutlined className="text-4xl text-gray-300 mb-4" />
                      <Text className="text-gray-500">
                        No hay registros de contabilidad para este gestor
                      </Text>
                    </div>
                  )
                }}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <Text className="text-gray-500">
                No se encontraron datos de contabilidad para este gestor
              </Text>
            </div>
          )}
        </Modal>

        {/* Modal de confirmacion para desactivar */}
        <Modal
          title={contabilidadToDeactivate === 'all' ? 'Confirmar desactivacion masiva' : 'Confirmar desactivacion'}
          open={confirmModalVisible}
          onOk={confirmDeactivate}
          onCancel={cancelDeactivate}
          okText="Si, desactivar"
          cancelText="Cancelar"
          confirmLoading={processing}
          okButtonProps={{ danger: true }}
        >
          <p>
            {contabilidadToDeactivate === 'all'
              ? 'Esta seguro que desea desactivar todas las contabilidades activas? Esta accion no se puede deshacer.'
              : 'Esta seguro que desea desactivar esta contabilidad? Esta accion no se puede deshacer.'}
          </p>
        </Modal>
      </div>
    </div>
  );
};

export default AccountingManagerPage;


