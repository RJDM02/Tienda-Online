import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Typography, 
  Card, 
  Alert, 
  Row, 
  Col, 
  Statistic, 
  Tag,
  Divider,
  Select,
  Input,
  DatePicker,
  Button
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  TruckOutlined,
  CalendarOutlined,
  TagOutlined,
  BgColorsOutlined,
  FilterOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

import { API_URL } from '../config/apiConfig';
const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AccountingAdminPage = () => {
  const [accountingData, setAccountingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    ganancia: 0,
    precio_post_descuento: 0,
    costo: 0,
    comision: 0,
    domicilio_costo: 0,
    ganancia_cliente: 0
  });
  
  // Filter states
  const [monthFilter, setMonthFilter] = useState(null);
  const [productFilter, setProductFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState(null);

  useEffect(() => {
    const fetchAccountingData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
          `${API_URL}/listar_contabilidad_superadministrador/`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const sortedData = response.data.sort((a, b) => {
          return new Date(b.fecha) - new Date(a.fecha);
        });

        setAccountingData(response.data);
        setFilteredData(response.data);
        calculateTotals(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAccountingData();
  }, []);

  useEffect(() => {
    // Apply filters whenever filter criteria or original data changes
    let filtered = [...accountingData];
    
    // Apply month filter
    if (monthFilter) {
      filtered = filtered.filter(item => {
        const itemDate = moment(item.fecha);
        return itemDate.month() === monthFilter.month() && 
               itemDate.year() === monthFilter.year();
      });
    }
    
    // Apply date range filter
    if (dateRangeFilter && dateRangeFilter.length === 2) {
      filtered = filtered.filter(item => {
        const itemDate = moment(item.fecha);
        return itemDate.isBetween(dateRangeFilter[0], dateRangeFilter[1], null, '[]');
      });
    }
    
    // Apply product name filter
    if (productFilter) {
      const searchTerm = productFilter.toLowerCase();
      filtered = filtered.filter(item => {
        if (item.tipo === 'producto') {
          return item.datos_producto.nombre.toLowerCase().includes(searchTerm);
        } else {
          return item.datos_variacion.modelo.toLowerCase().includes(searchTerm);
        }
      });
    }
    
     const sortedFilteredData = filtered.sort((a, b) => {
      return new Date(b.fecha) - new Date(a.fecha);
    });

    setFilteredData(filtered);
    calculateTotals(filtered);
  }, [accountingData, monthFilter, productFilter, dateRangeFilter]);

  const calculateTotals = (data) => {
    let gananciaTotal = 0;
    let precioTotal = 0;
    let costoTotal = 0;
    let comisionTotal = 0;
    let domicilioTotal = 0;
    let gananciaClienteTotal = 0;

    data.forEach(item => {
      gananciaTotal += item.ganancia;
      gananciaClienteTotal += item.ganancia_cliente || 0;
      
      if (item.tipo === 'producto') {
        precioTotal += item.datos_producto.precio_post_descuento;
        costoTotal += item.datos_producto.costo;
        
        // Solo sumar comisión si hay gestor
        if (item.gestor !== null) {
          comisionTotal += item.datos_producto.comision || 0;
        }
        
        // Solo sumar domicilio si el precio es >= 200
        if (item.datos_producto.precio_post_descuento >= 200) {
          domicilioTotal += item.datos_producto.domicilio_costo || 0;
        }
      } else if (item.tipo === 'variacion') {
        precioTotal += item.datos_variacion.precio_post_descuento;
        costoTotal += item.datos_variacion.costo;
        
        // Solo sumar comisión si hay gestor
        if (item.gestor !== null) {
          comisionTotal += item.datos_variacion.comision || 0;
        }
        
        // Solo sumar domicilio si el precio es >= 200
        if (item.datos_variacion.precio_post_descuento >= 200) {
          domicilioTotal += item.datos_variacion.domicilio_costo || 0;
        }
      }
    });

    setTotals({
      ganancia: gananciaTotal,
      precio_post_descuento: precioTotal,
      costo: costoTotal,
      comision: comisionTotal,
      domicilio_costo: domicilioTotal,
      ganancia_cliente: gananciaClienteTotal
    });
  };

  const handleMonthChange = (date) => {
    setMonthFilter(date);
    setDateRangeFilter(null); // Clear date range filter when month is selected
  };

  const handleDateRangeChange = (dates) => {
    setDateRangeFilter(dates);
    setMonthFilter(null); // Clear month filter when date range is selected
  };

  const handleProductFilterChange = (e) => {
    setProductFilter(e.target.value);
  };

  const clearFilters = () => {
    setMonthFilter(null);
    setDateRangeFilter(null);
    setProductFilter('');
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (text) => <Text strong>#{text}</Text>
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 120,
      render: (text) => (
        <div className="flex items-center">
          <CalendarOutlined className="mr-2 text-orange-500" />
          <Text>{text}</Text>
        </div>
      ),
      sorter: (a, b) => moment(a.fecha).unix() - moment(b.fecha).unix()
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 100,
      render: (text) => (
        <Tag color={text === 'producto' ? 'blue' : 'purple'} className="rounded-lg">
          {text === 'producto' ? 'Producto' : 'Variación'}
        </Tag>
      ),
      filters: [
        { text: 'Producto', value: 'producto' },
        { text: 'Variación', value: 'variacion' },
      ],
      onFilter: (value, record) => record.tipo === value,
    },
    {
      title: 'Nombre/Modelo',
      key: 'nombre',
      width: 200,
      render: (_, record) => (
        <div className="flex items-center">
          <TagOutlined className="mr-2 text-orange-500" />
          <Text>
            {record.tipo === 'producto' 
              ? record.datos_producto.nombre 
              : record.datos_variacion.modelo}
          </Text>
        </div>
      ),
    },
    {
      title: 'Color',
      key: 'color',
      width: 100,
      render: (_, record) => (
        record.tipo === 'variacion' ? (
          <div className="flex items-center">
            <BgColorsOutlined className="mr-2 text-orange-500" />
            <Text>{record.datos_variacion.color}</Text>
          </div>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Costo',
      key: 'costo',
      width: 100,
      render: (_, record) => {
        const costo = record.tipo === 'producto' 
          ? record.datos_producto?.costo 
          : record.datos_variacion?.costo;
        return costo ? (
          <Text className="text-red-600 font-semibold">
            ${costo.toFixed(2)}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: 'Precio Venta',
      key: 'precio',
      width: 120,
      render: (_, record) => {
        const precio = record.tipo === 'producto' 
          ? record.datos_producto?.precio_post_descuento 
          : record.datos_variacion?.precio_post_descuento;
        return precio ? (
          <div className="flex items-center">
            <DollarOutlined className="mr-1 text-blue-500" />
            <Text className="text-blue-600 font-semibold">
              ${precio.toFixed(2)}
            </Text>
          </div>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: 'Comisión',
      key: 'comision',
      width: 100,
      render: (_, record) => {
        // Mostrar comisión solo si hay gestor
        if (record.gestor === null) return <Text type="secondary">-</Text>;
        
        const comision = record.tipo === 'producto' 
          ? record.datos_producto?.comision 
          : record.datos_variacion?.comision;
        return comision ? (
          <Text className="text-purple-600 font-semibold">
            ${comision.toFixed(2)}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: 'Ganancia Cliente',
      key: 'ganancia_cliente',
      width: 120,
      render: (_, record) => {
        // Mostrar ganancia del cliente solo si hay cliente referido
        if (!record.detalle_cliente_referido) return <Text type="secondary">-</Text>;
        
        return record.ganancia_cliente ? (
          <div className="flex items-center">
            <UserOutlined className="mr-1 text-cyan-500" />
            <Text className="text-cyan-600 font-semibold">
              ${record.ganancia_cliente.toFixed(2)}
            </Text>
          </div>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: 'Domicilio',
      key: 'domicilio',
      width: 100,
      render: (_, record) => {
        const precio = record.tipo === 'producto' 
          ? record.datos_producto?.precio_post_descuento 
          : record.datos_variacion?.precio_post_descuento;
        
        // No mostrar domicilio si precio es menor a 200
        if (precio < 200) return <Text type="secondary">-</Text>;
        
        const domicilio = record.tipo === 'producto' 
          ? record.datos_producto?.domicilio_costo 
          : record.datos_variacion?.domicilio_costo;
        return domicilio ? (
          <div className="flex items-center">
            <TruckOutlined className="mr-1 text-orange-500" />
            <Text className="text-orange-600 font-semibold">
              ${domicilio.toFixed(2)}
            </Text>
          </div>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: 'Ganancia',
      dataIndex: 'ganancia',
      key: 'ganancia',
      width: 120,
      render: (text) => text ? (
        <div className="flex items-center">
          <BarChartOutlined className="mr-1 text-green-500" />
          <Text className="text-green-600 font-bold">
            ${text.toFixed(2)}
          </Text>
        </div>
      ) : <Text type="secondary">-</Text>,
      sorter: (a, b) => a.ganancia - b.ganancia,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <Title level={2} className="text-gray-900 mb-2">
            Contabilidad General de Ventas
          </Title>
          <Text className="text-gray-600">
            Panel administrativo de contabilidad y análisis financiero
          </Text>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert 
            message="Error al cargar los datos" 
            description={error} 
            type="error" 
            showIcon 
            className="mb-6 rounded-xl"
          />
        )}

        {/* Filter Section */}
        <Card className="mb-8 rounded-2xl shadow-lg">
          <Title level={4} className="mb-4">
            <FilterOutlined className="mr-2" />
            Filtros
          </Title>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong className="block mb-2">Mes y Año</Text>
                <DatePicker 
                  picker="month" 
                  onChange={handleMonthChange} 
                  value={monthFilter}
                  className="w-full"
                  placeholder="Seleccionar mes"
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong className="block mb-2">Rango de Fechas</Text>
                <RangePicker 
                  onChange={handleDateRangeChange} 
                  value={dateRangeFilter}
                  className="w-full"
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong className="block mb-2">Buscar Producto</Text>
                <Input 
                  placeholder="Nombre del producto" 
                  prefix={<SearchOutlined />} 
                  value={productFilter}
                  onChange={handleProductFilterChange}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6} className="flex items-end">
              <Button 
                type="default" 
                onClick={clearFilters}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </Col>
          </Row>
          
          {/* Active filters indicator */}
          {(monthFilter || dateRangeFilter || productFilter) && (
            <div className="mt-4">
              <Text type="secondary" className="mr-2">Filtros activos:</Text>
              {monthFilter && (
                <Tag color="blue" className="mr-2">
                  Mes: {monthFilter.format('MMMM YYYY')}
                </Tag>
              )}
              {dateRangeFilter && (
                <Tag color="geekblue" className="mr-2">
                  Rango: {dateRangeFilter[0].format('DD/MM/YYYY')} - {dateRangeFilter[1].format('DD/MM/YYYY')}
                </Tag>
              )}
              {productFilter && (
                <Tag color="purple" className="mr-2">
                  Producto: {productFilter}
                </Tag>
              )}
            </div>
          )}
        </Card>

        {/* Cards de Estadísticas */}
        <Row gutter={[24, 24]} className="mb-8">
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-2xl shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <Statistic
                title={
                  <div className="flex items-center text-green-700">
                    <BarChartOutlined className="mr-2" />
                    Ganancia Total
                  </div>
                }
                value={totals.ganancia}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#059669', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-2xl shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <Statistic
                title={
                  <div className="flex items-center text-blue-700">
                    <ShoppingCartOutlined className="mr-2" />
                    Total Ventas
                  </div>
                }
                value={totals.precio_post_descuento}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#0284c7', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-2xl shadow-lg bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
              <Statistic
                title={
                  <div className="flex items-center text-red-700">
                    <DollarOutlined className="mr-2" />
                    Total Costos
                  </div>
                }
                value={totals.costo}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#dc2626', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-2xl shadow-lg bg-gradient-to-r from-cyan-50 to-sky-50 border-cyan-200">
              <Statistic
                title={
                  <div className="flex items-center text-cyan-700">
                    <UserOutlined className="mr-2" />
                    Ganancia Clientes
                  </div>
                }
                value={totals.ganancia_cliente}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#0891b2', fontSize: '24px' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabla Principal */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <Title level={4} className="mb-0">
              Detalle de Transacciones
            </Title>
            <Text type="secondary">
              Mostrando {filteredData.length} de {accountingData.length} registros
            </Text>
          </div>
          
          <Table 
            columns={columns} 
            dataSource={filteredData} 
            rowKey="id"
            loading={loading}
            scroll={{ x: 1300 }}
            bordered
            className="rounded-2xl"
            rowClassName="hover:bg-orange-50 transition-colors duration-200"
            pagination={{
              className: 'px-6 py-4 bg-white rounded-b-2xl',
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} transacciones`
            }}
            locale={{
              emptyText: (
                <div className="py-8">
                  <BarChartOutlined className="text-4xl text-gray-300 mb-4" />
                  <Text className="text-gray-500">No hay datos de contabilidad disponibles</Text>
                  {(monthFilter || dateRangeFilter || productFilter) && (
                    <Button 
                      type="link" 
                      onClick={clearFilters}
                      className="mt-2"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              )
            }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row className="bg-gradient-to-r from-gray-50 to-gray-100 font-bold">
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong className="text-gray-800">TOTALES GENERALES</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text type="secondary">-</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Text type="secondary">-</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Text className="text-red-600 font-bold">
                      ${totals.costo.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <Text className="text-blue-600 font-bold">
                      ${totals.precio_post_descuento.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <Text className="text-purple-600 font-bold">
                      ${totals.comision.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    <Text className="text-cyan-600 font-bold">
                      ${totals.ganancia_cliente.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7}>
                    <Text className="text-orange-600 font-bold">
                      ${totals.domicilio_costo.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8}>
                    <Text className="text-green-600 font-bold">
                      ${totals.ganancia.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </div>

        {/* Resumen Footer */}
        <Card className="mt-8 rounded-2xl shadow-lg bg-gradient-to-r from-gray-50 to-slate-50">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Divider orientation="left">
                <Text strong>Resumen Financiero</Text>
              </Divider>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                <BarChartOutlined className="text-2xl text-green-500 mb-2" />
                <div className="text-green-600 font-bold text-xl">
                  ${totals.ganancia.toFixed(2)}
                </div>
                <Text className="text-gray-500">Ganancia Neta</Text>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                <ShoppingCartOutlined className="text-2xl text-blue-500 mb-2" />
                <div className="text-blue-600 font-bold text-xl">
                  ${totals.precio_post_descuento.toFixed(2)}
                </div>
                <Text className="text-gray-500">Ingresos Totales</Text>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                <DollarOutlined className="text-2xl text-red-500 mb-2" />
                <div className="text-red-600 font-bold text-xl">
                  ${totals.costo.toFixed(2)}
                </div>
                <Text className="text-gray-500">Costos Operativos</Text>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                <DollarOutlined className="text-2xl text-purple-500 mb-2" />
                <div className="text-purple-600 font-bold text-xl">
                  ${totals.comision.toFixed(2)}
                </div>
                <Text className="text-gray-500">Total Comisiones</Text>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                <UserOutlined className="text-2xl text-cyan-500 mb-2" />
                <div className="text-cyan-600 font-bold text-xl">
                  ${totals.ganancia_cliente.toFixed(2)}
                </div>
                <Text className="text-gray-500">Ganancia Clientes</Text>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                <TruckOutlined className="text-2xl text-orange-500 mb-2" />
                <div className="text-orange-600 font-bold text-xl">
                  ${totals.domicilio_costo.toFixed(2)}
                </div>
                <Text className="text-gray-500">Costos Envío</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default AccountingAdminPage;