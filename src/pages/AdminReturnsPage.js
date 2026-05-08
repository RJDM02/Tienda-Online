import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, DatePicker, Input, Row, Col, Spin, Statistic, Table, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  FieldTimeOutlined,
  ReloadOutlined,
  RollbackOutlined,
  SearchOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { API_URL } from '../config/apiConfig';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatDateTime = (dateValue) => {
  if (!dateValue) return 'N/A';
  const parsedDate = dayjs(dateValue);
  if (!parsedDate.isValid()) return 'N/A';
  return parsedDate.format('DD/MM/YYYY HH:mm');
};

const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  const parsedDate = dayjs(dateValue);
  if (!parsedDate.isValid()) return 'N/A';
  return parsedDate.format('DD/MM/YYYY');
};

const AdminReturnsPage = () => {
  const [returnsData, setReturnsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState(null);

  const loadReturns = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/listar_devoluciones_venta/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(payload.error || payload.message || 'Error al cargar devoluciones');
      }

      const normalizedData = Array.isArray(payload) ? payload : [];
      normalizedData.sort((a, b) => {
        const dateA = new Date(a.fecha_devolucion || 0).getTime();
        const dateB = new Date(b.fecha_devolucion || 0).getTime();
        return dateB - dateA;
      });

      setReturnsData(normalizedData);
    } catch (err) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const filteredData = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    let data = [...returnsData];

    if (normalizedQuery) {
      data = data.filter((item) => {
        const searchableText = [
          item.producto_nombre,
          item.variacion_modelo,
          item.cliente_nombre,
          item.cliente_telefono,
          item.motivo,
          item.tipo_venta,
          item.id,
          item.historial_venta_id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      });
    }

    if (dateRangeFilter && dateRangeFilter.length === 2) {
      const startMs = dayjs(dateRangeFilter[0]).startOf('day').valueOf();
      const endMs = dayjs(dateRangeFilter[1]).endOf('day').valueOf();

      data = data.filter((item) => {
        const itemDateMs = dayjs(item.fecha_devolucion).valueOf();
        return Number.isFinite(itemDateMs) && itemDateMs >= startMs && itemDateMs <= endMs;
      });
    }

    return data;
  }, [returnsData, searchTerm, dateRangeFilter]);

  const summaryStats = useMemo(() => {
    const total = filteredData.length;
    const products = filteredData.filter((item) => item.tipo_venta === 'producto').length;
    const variations = filteredData.filter((item) => item.tipo_venta === 'variacion').length;
    return { total, products, variations };
  }, [filteredData]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      render: (value) => <Text strong>#{value}</Text>,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo_venta',
      key: 'tipo_venta',
      width: 120,
      render: (value) => (
        <Tag color={value === 'producto' ? 'blue' : 'purple'}>
          {value === 'producto' ? 'Producto' : 'Variacion'}
        </Tag>
      ),
    },
    {
      title: 'Venta Historial',
      dataIndex: 'historial_venta_id',
      key: 'historial_venta_id',
      width: 140,
      render: (value) => <Text>{value || 'N/A'}</Text>,
    },
    {
      title: 'Producto / Variacion',
      key: 'producto_variacion',
      width: 260,
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.producto_nombre || 'N/A'}</div>
          <div className="text-gray-500">{record.variacion_modelo || 'Sin variacion'}</div>
        </div>
      ),
    },
    {
      title: 'Cliente',
      key: 'cliente',
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.cliente_nombre || 'N/A'}</div>
          <div className="text-gray-500">{record.cliente_telefono || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Motivo',
      dataIndex: 'motivo',
      key: 'motivo',
      width: 300,
      ellipsis: true,
    },
    {
      title: 'Fecha Venta',
      dataIndex: 'fecha_venta',
      key: 'fecha_venta',
      width: 140,
      render: (value) => (
        <span>
          <CalendarOutlined className="mr-1 text-orange-500" />
          {formatDate(value)}
        </span>
      ),
    },
    {
      title: 'Fecha Devolucion',
      dataIndex: 'fecha_devolucion',
      key: 'fecha_devolucion',
      width: 180,
      render: (value) => (
        <span>
          <FieldTimeOutlined className="mr-1 text-red-500" />
          {formatDateTime(value)}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <Title level={2} className="text-gray-900 mb-2">
            Devoluciones de Ventas
          </Title>
          <Text className="text-gray-600">
            Vista general de devoluciones gestionadas por la tienda
          </Text>
        </div>

        {error && (
          <Alert
            className="mb-6 rounded-xl"
            type="error"
            showIcon
            message="Error al cargar devoluciones"
            description={error}
          />
        )}

        <Card className="mb-8 rounded-2xl shadow-lg">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={10}>
              <Input
                placeholder="Buscar por producto, cliente, motivo o ID"
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={24} md={10}>
              <RangePicker
                className="w-full"
                value={dateRangeFilter}
                onChange={(dates) => setDateRangeFilter(dates)}
                format="DD/MM/YYYY"
                placeholder={['Desde', 'Hasta']}
              />
            </Col>
            <Col xs={24} sm={24} md={4}>
              <Button icon={<ReloadOutlined />} onClick={loadReturns} className="w-full">
                Recargar
              </Button>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={8}>
            <Card className="rounded-2xl shadow-lg bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200">
              <Statistic
                title={
                  <div className="flex items-center text-blue-700">
                    <RollbackOutlined className="mr-2" />
                    Total Devoluciones
                  </div>
                }
                value={summaryStats.total}
                valueStyle={{ color: '#0284c7' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="rounded-2xl shadow-lg bg-gradient-to-r from-cyan-50 to-emerald-50 border-cyan-200">
              <Statistic
                title={
                  <div className="flex items-center text-cyan-700">
                    <ShoppingOutlined className="mr-2" />
                    Productos
                  </div>
                }
                value={summaryStats.products}
                valueStyle={{ color: '#0e7490' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="rounded-2xl shadow-lg bg-gradient-to-r from-purple-50 to-fuchsia-50 border-purple-200">
              <Statistic
                title={
                  <div className="flex items-center text-purple-700">
                    <UserOutlined className="mr-2" />
                    Variaciones
                  </div>
                }
                value={summaryStats.variations}
                valueStyle={{ color: '#7e22ce' }}
              />
            </Card>
          </Col>
        </Row>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="min-h-[280px] flex items-center justify-center">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredData}
              bordered
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} devoluciones`,
              }}
              scroll={{ x: 1500 }}
              rowClassName="hover:bg-orange-50 transition-colors duration-200"
              locale={{
                emptyText: 'No hay devoluciones registradas para los filtros seleccionados',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReturnsPage;
