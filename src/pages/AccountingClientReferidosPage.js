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
  Space,
  Statistic
} from 'antd';
import {
  EyeOutlined,
  DeleteOutlined,
  DollarOutlined,
  UserOutlined,
  SearchOutlined,
  FilterOutlined,
  TeamOutlined
} from '@ant-design/icons';

import { API_URL } from '../config/apiConfig';
const { Title, Text } = Typography;

const AccountingClientReferidosPage = () => {
  const [clientesReferidos, setClientesReferidos] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    username: '',
    telefono: '',
    producto: ''
  });
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [gananciaTotal, setGananciaTotal] = useState(0);

  useEffect(() => {
    fetchClientesReferidos();
  }, []);

  const fetchClientesReferidos = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/listar_contabilidad_cliente_referido/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setClientesReferidos(response.data);
      setFilteredClientes(response.data);
      
      // Calcular ganancia total
      const total = response.data.reduce((sum, cliente) => {
        return sum + parseFloat(cliente.ganancia_cliente || 0);
      }, 0);
      setGananciaTotal(total);
      
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener los clientes referidos:', error);
      setLoading(false);
      message.error('Error al cargar los clientes referidos');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    let result = [...clientesReferidos];
    
    if (filters.username) {
      result = result.filter(cliente => 
        cliente.username.toLowerCase().includes(filters.username.toLowerCase())
      );
    }
    
    if (filters.telefono) {
      result = result.filter(cliente => 
        cliente.telefono.includes(filters.telefono)
      );
    }
    
    if (filters.producto) {
      result = result.filter(cliente => 
        cliente.producto.toLowerCase().includes(filters.producto.toLowerCase())
      );
    }
    
    setFilteredClientes(result);
  };

  const resetFilters = () => {
    setFilters({
      username: '',
      telefono: '',
      producto: ''
    });
    setFilteredClientes(clientesReferidos);
    setSearchText('');
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredClientes(clientesReferidos);
      return;
    }
    
    const filtered = clientesReferidos.filter(cliente => {
      return (
        cliente.username.toLowerCase().includes(value.toLowerCase()) ||
        cliente.telefono.includes(value) ||
        cliente.producto.toLowerCase().includes(value.toLowerCase())
      );
    });
    
    setFilteredClientes(filtered);
  };

  const handleOpenModal = (cliente) => {
    setSelectedCliente(cliente);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCliente(null);
  };

  const handleEliminarCliente = (clienteId) => {
    setClienteToDelete(clienteId);
    setConfirmModalVisible(true);
  };

  const confirmDelete = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/eliminar_contabilidad_cliente_referido/${clienteToDelete}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Actualizar la lista después de eliminar
      const updatedClientes = clientesReferidos.filter(
        cliente => cliente.id !== clienteToDelete
      );
      
      setClientesReferidos(updatedClientes);
      setFilteredClientes(updatedClientes);
      
      // Recalcular ganancia total
      const total = updatedClientes.reduce((sum, cliente) => {
        return sum + parseFloat(cliente.ganancia_cliente || 0);
      }, 0);
      setGananciaTotal(total);
      
      message.success('Registro eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el registro:', error);
      message.error('Error al eliminar el registro');
    } finally {
      setProcessing(false);
      setConfirmModalVisible(false);
      setClienteToDelete(null);
    }
  };

  const cancelDelete = () => {
    setConfirmModalVisible(false);
    setClienteToDelete(null);
  };

  const clientesColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
      render: (text) => (
        <div className="flex items-center">
          <UserOutlined className="mr-2 text-blue-500" />
          <Text>{text}</Text>
        </div>
      )
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      render: (text) => <Text>{text}</Text>
    },
    {
      title: 'Producto',
      dataIndex: 'producto',
      key: 'producto',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Variación',
      dataIndex: 'variacion',
      key: 'variacion',
      render: (text) => text || <Text type="secondary">N/A</Text>
    },
    {
      title: 'Ganancia',
      dataIndex: 'ganancia_cliente',
      key: 'ganancia_cliente',
      render: (value) => (
        <div className="flex items-center">
          <DollarOutlined className="mr-1 text-green-500" />
          <Text strong className="text-green-600">
            ${parseFloat(value).toFixed(2)}
          </Text>
        </div>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleOpenModal(record)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 border-none"
          >
            Detalles
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleEliminarCliente(record.id)}
            loading={processing}
            className="rounded-xl"
          >
            Eliminar
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <Title level={2} className="text-gray-900 mb-2">
            <TeamOutlined className="mr-2" />
            Gestión de Contabilidad - Clientes Referidos
          </Title>
          <Text className="text-gray-600">
            Administra la contabilidad de todos los clientes referidos
          </Text>
        </div>

        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card className="rounded-2xl shadow-lg">
              <Statistic
                title="Total de Clientes Referidos"
                value={clientesReferidos.length}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card className="rounded-2xl shadow-lg">
              <Statistic
                title="Ganancia Total Generada"
                value={gananciaTotal}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card className="rounded-2xl shadow-lg">
              <Statistic
                title="Registros Filtrados"
                value={filteredClientes.length}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Card className="mb-6 rounded-2xl shadow-lg">
          <Title level={4} className="mb-4">
            <FilterOutlined className="mr-2" />
            Filtros de Búsqueda
          </Title>
          
          <div className="mb-6">
            <Input
              placeholder="Buscar clientes referidos..."
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
                <Text strong className="block mb-1">Usuario</Text>
                <Input
                  placeholder="Filtrar por usuario"
                  value={filters.username}
                  onChange={(e) => handleFilterChange('username', e.target.value)}
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
                <Text strong className="block mb-1">Producto</Text>
                <Input
                  placeholder="Filtrar por producto"
                  value={filters.producto}
                  onChange={(e) => handleFilterChange('producto', e.target.value)}
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
            columns={clientesColumns}
            dataSource={filteredClientes}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1000 }}
            bordered
            className="rounded-2xl"
            rowClassName="hover:bg-blue-50 transition-colors duration-200"
            pagination={{
              className: 'px-6 py-4 bg-white rounded-b-2xl',
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} clientes referidos`
            }}
            locale={{
              emptyText: (
                <div className="py-8">
                  <TeamOutlined className="text-4xl text-gray-300 mb-4" />
                  <Text className="text-gray-500">No se encontraron clientes referidos con los filtros aplicados</Text>
                </div>
              )
            }}
          />
        </div>

        {/* Modal de detalles */}
        <Modal
          title={
            <div className="flex items-center">
              <UserOutlined className="mr-2 text-blue-500" />
              <span>Detalles del Cliente Referido</span>
            </div>
          }
          open={modalOpen}
          onCancel={handleCloseModal}
          footer={[
            <Button 
              key="close" 
              onClick={handleCloseModal}
              className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
            >
              Cerrar
            </Button>,
          ]}
          width={600}
          bodyStyle={{ padding: '24px' }}
          className="rounded-2xl"
        >
          {selectedCliente && (
            <div>
              <Row gutter={16} className="mb-4">
                <Col span={12}>
                  <Card size="small" title="ID" className="rounded-xl">
                    <Text strong>#{selectedCliente.id}</Text>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="Usuario" className="rounded-xl">
                    <Text>{selectedCliente.username}</Text>
                  </Card>
                </Col>
              </Row>
              
              <Row gutter={16} className="mb-4">
                <Col span={12}>
                  <Card size="small" title="Teléfono" className="rounded-xl">
                    <Text>{selectedCliente.telefono}</Text>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="Producto" className="rounded-xl">
                    <Tag color="blue">{selectedCliente.producto}</Tag>
                  </Card>
                </Col>
              </Row>
              
              <Row gutter={16} className="mb-4">
                <Col span={12}>
                  <Card size="small" title="Variación" className="rounded-xl">
                    <Text>{selectedCliente.variacion || 'N/A'}</Text>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="Ganancia" className="rounded-xl">
                    <div className="flex items-center">
                      <DollarOutlined className="mr-1 text-green-500" />
                      <Text strong className="text-green-600">
                        ${parseFloat(selectedCliente.ganancia_cliente).toFixed(2)}
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Modal>

        {/* Modal de confirmación para eliminar */}
        <Modal
          title="Confirmar Eliminación"
          open={confirmModalVisible}
          onOk={confirmDelete}
          onCancel={cancelDelete}
          okText="Sí, eliminar"
          cancelText="Cancelar"
          confirmLoading={processing}
          okButtonProps={{ danger: true }}
        >
          <p>¿Está seguro que desea eliminar este registro? Esta acción no se puede deshacer.</p>
        </Modal>
      </div>
    </div>
  );
};

export default AccountingClientReferidosPage;