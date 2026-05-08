import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../config/apiConfig';

const { RangePicker } = DatePicker;

const estadoTagColor = {
  pendiente: 'orange',
  entregado: 'green',
  cancelado: 'red',
};

const toDate = (value) => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const sameDayOrAfter = (value, min) => !value || !min || value.isAfter(min, 'day') || value.isSame(min, 'day');
const sameDayOrBefore = (value, max) => !value || !max || value.isBefore(max, 'day') || value.isSame(max, 'day');

function RemesaHistoryPage() {
  const token = localStorage.getItem('authToken');
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [filterForm] = Form.useForm();

  const isHistoryEndpointRole = useMemo(
    () => ['Super_Administrador', 'Administrador_Remesas'].includes(userData.rol),
    [userData.rol]
  );

  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const mapRows = (data) => {
    if (isHistoryEndpointRole) {
      return (Array.isArray(data) ? data : []).map((item) => ({
        id: item.remesa,
        destinatario: item.destinatario || '-',
        telefono_destinatario: item.telefono_destinatario || '-',
        monto: item.monto || '-',
        monto_entrega: item.monto_entrega || '-',
        estado: item.estado_final,
        fecha_entrega: item.fecha_entrega || item.fecha || null,
        nota: item.nota || '-',
        motivo_cancelacion: item.motivo_cancelacion || '-',
        creador_nombre: item.creador_nombre || '-',
        creador_username: item.creador_username || '-',
        creador_rol: item.creador_rol || '-',
      }));
    }

    return (Array.isArray(data) ? data : []).map((item) => ({
      id: item.id,
      destinatario: item.destinatario || '-',
      telefono_destinatario: item.telefono_destinatario || '-',
      monto: item.monto || '-',
      monto_entrega: item.monto_entrega || '-',
      estado: item.estado || 'pendiente',
      fecha_entrega: item.fecha_entrega || null,
      nota: item.nota || '-',
      motivo_cancelacion: item.motivo_cancelacion || '-',
      creador_nombre: item.creador_nombre || '-',
      creador_username: item.creador_username || '-',
      creador_rol: item.creador_rol || '-',
    }));
  };

  const applyFilters = (values) => {
    const [startDate, endDate] = values.fecha || [];

    const filtered = [...rows].filter((row) => {
      const fecha = toDate(row.fecha_entrega);
      const matchesDestinatario = values.destinatario
        ? (row.destinatario || '').toLowerCase().includes(values.destinatario.toLowerCase())
        : true;
      const matchesTelefono = values.telefono
        ? (row.telefono_destinatario || '').toLowerCase().includes(values.telefono.toLowerCase())
        : true;
      const matchesEstado = values.estado ? row.estado === values.estado : true;
      const matchesMotivo = values.motivo
        ? (row.motivo_cancelacion || '').toLowerCase().includes(values.motivo.toLowerCase())
        : true;
      const matchesMes = values.mes ? (fecha ? fecha.month() + 1 === values.mes : false) : true;
      const matchesRange = sameDayOrAfter(fecha, startDate) && sameDayOrBefore(fecha, endDate);

      return matchesDestinatario && matchesTelefono && matchesEstado && matchesMotivo && matchesMes && matchesRange;
    });

    setFilteredRows(filtered);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const url = isHistoryEndpointRole
        ? `${API_BASE_URL}/api/remesa/historial/`
        : `${API_BASE_URL}/api/remesa/listar/`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'No se pudo cargar historial de remesas');
      }

      const mapped = mapRows(data).sort((a, b) => b.id - a.id);
      setRows(mapped);
      setFilteredRows(mapped);
    } catch (error) {
      message.error(error.message || 'Error cargando historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHistoryEndpointRole]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 90,
    },
    {
      title: 'Cliente',
      key: 'cliente',
      width: 250,
      render: (_, record) => (
        <div>
          <div><strong>Nombre:</strong> {record.destinatario || '-'}</div>
          <div><strong>Telefono:</strong> {record.telefono_destinatario || '-'}</div>
          <div><strong>Creador:</strong> {record.creador_nombre || '-'}</div>
          <div><strong>Usuario:</strong> {record.creador_username || '-'}</div>
          <div><strong>Rol:</strong> {record.creador_rol || '-'}</div>
        </div>
      ),
    },
    {
      title: 'Fecha Entrega',
      dataIndex: 'fecha_entrega',
      key: 'fecha_entrega',
      width: 210,
      render: (value) => (value ? new Date(value).toLocaleString() : '-'),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 130,
      render: (value) => <Tag color={estadoTagColor[value] || 'default'}>{value || '-'}</Tag>,
    },
    {
      title: 'Monto Depositado',
      dataIndex: 'monto',
      key: 'monto',
      width: 120,
      render: (value) => <strong>{value || '-'}</strong>,
    },
    {
      title: 'Monto Entregado',
      dataIndex: 'monto_entrega',
      key: 'monto_entrega',
      width: 140,
      render: (value) => <strong>{value || '-'}</strong>,
    },
    {
      title: 'Nota',
      dataIndex: 'nota',
      key: 'nota',
      width: 220,
    },
    {
      title: 'Motivo Cancelacion',
      dataIndex: 'motivo_cancelacion',
      key: 'motivo_cancelacion',
      width: 240,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5ed] p-2 md:p-4">
      <div className="max-w-full mx-auto">
        <Card
          className="mb-4"
          style={{ borderRadius: 20, borderColor: '#e5e7eb', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)' }}
        >
          <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
            Historial de Remesas
          </Typography.Title>
          <Typography.Text type="secondary">
            Esta tabla es solo lectura. La gestion de estado y mensajero se hace en Gestionar Remesas.
          </Typography.Text>

          <Form form={filterForm} layout="vertical" onFinish={applyFilters} style={{ marginTop: 20 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item name="destinatario" label="Cliente">
                  <Input placeholder="Nombre cliente" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item name="telefono" label="Telefono Cliente">
                  <Input placeholder="Numero de telefono" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item name="estado" label="Estado">
                  <Select allowClear placeholder="Estado">
                    <Select.Option value="pendiente">Pendiente</Select.Option>
                    <Select.Option value="entregado">Entregado</Select.Option>
                    <Select.Option value="cancelado">Cancelado</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item name="motivo" label="Motivo Cancelacion">
                  <Input placeholder="Motivo" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item name="mes" label="Mes">
                  <Select allowClear placeholder="Seleccione mes">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <Select.Option key={month} value={month}>
                        {dayjs().month(month - 1).format('MMMM')}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={16} lg={8}>
                <Form.Item name="fecha" label="Rango de fechas">
                  <RangePicker className="w-full" />
                </Form.Item>
              </Col>
            </Row>
            <Row justify="end" gutter={10}>
              <Col>
                <Button
                  onClick={() => {
                    filterForm.resetFields();
                    setFilteredRows(rows);
                  }}
                  style={{ borderRadius: 14 }}
                >
                  Limpiar
                </Button>
              </Col>
              <Col>
                <Button
                  htmlType="submit"
                  type="primary"
                  style={{ backgroundColor: '#000', borderColor: '#000', borderRadius: 14 }}
                >
                  Filtrar
                </Button>
              </Col>
              <Col>
                <Button onClick={loadData} style={{ borderRadius: 14 }}>
                  Recargar
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)' }}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={filteredRows}
            columns={columns}
            scroll={{ x: 1350 }}
            bordered
            pagination={{ showSizeChanger: true }}
          />
        </div>
      </div>
    </div>
  );
}

export default RemesaHistoryPage;
