import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Statistic, Table, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../config/apiConfig';

const { RangePicker } = DatePicker;

function RemesaAccountingPage() {
  const token = localStorage.getItem('authToken');
  const [filterForm] = Form.useForm();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.destinatario) params.append('destinatario', filters.destinatario.trim());
      if (filters.creador) params.append('creador', filters.creador.trim());
      if (filters.rol) params.append('rol', filters.rol);
      if (filters.fecha && filters.fecha.length === 2) {
        params.append('fecha_desde', filters.fecha[0].format('YYYY-MM-DD'));
        params.append('fecha_hasta', filters.fecha[1].format('YYYY-MM-DD'));
      }

      const response = await fetch(`${API_BASE_URL}/api/remesa/contabilidad/?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || 'No se pudo cargar la contabilidad de remesas');
      }

      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error(error.message || 'Error cargando contabilidad de remesas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.monto += Number(row.monto || 0);
        acc.montoEntrega += Number(row.monto_entrega || 0);
        acc.ganancia += Number(row.ganancia || 0);
        acc.gestor += Number(row.ganancia_gestor || 0);
        acc.admin += Number(row.ganancia_admin_remesas || 0);
        acc.super += Number(row.ganancia_super_admin || 0);
        return acc;
      },
      { monto: 0, montoEntrega: 0, ganancia: 0, gestor: 0, admin: 0, super: 0 }
    );
  }, [rows]);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: 'Remesa',
      key: 'remesa',
      width: 220,
      render: (_, record) => (
        <div>
          <div><strong>Destinatario:</strong> {record.destinatario}</div>
          <div><strong>Fecha:</strong> {record.fecha_entrega ? new Date(record.fecha_entrega).toLocaleString() : '-'}</div>
        </div>
      ),
    },
    {
      title: 'Creador',
      key: 'creador',
      width: 220,
      render: (_, record) => (
        <div>
          <div><strong>Nombre:</strong> {record.creador_nombre}</div>
          <div><strong>Usuario:</strong> {record.creador_username}</div>
          <div><strong>Rol:</strong> {record.creador_rol}</div>
        </div>
      ),
    },
    { title: 'Monto Depositado', dataIndex: 'monto', key: 'monto', width: 140 },
    { title: 'Monto Entregado', dataIndex: 'monto_entrega', key: 'monto_entrega', width: 140 },
    { title: 'Ganancia', dataIndex: 'ganancia', key: 'ganancia', width: 130 },
    { title: 'Ganancia Gestor', dataIndex: 'ganancia_gestor', key: 'ganancia_gestor', width: 150 },
    { title: 'Ganancia Admin Remesas', dataIndex: 'ganancia_admin_remesas', key: 'ganancia_admin_remesas', width: 190 },
    { title: 'Ganancia Super Admin', dataIndex: 'ganancia_super_admin', key: 'ganancia_super_admin', width: 180 },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5ed] p-2 md:p-4">
      <div className="max-w-full mx-auto">
        <Card className="mb-4" style={{ borderRadius: 20, borderColor: '#e5e7eb', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)' }}>
          <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
            Contabilidad Remesas
          </Typography.Title>
          <Typography.Text type="secondary">
            Solo incluye remesas en estado entregado.
          </Typography.Text>

          <Form form={filterForm} layout="vertical" onFinish={loadData} style={{ marginTop: 20 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item name="destinatario" label="Destinatario">
                  <Input placeholder="Nombre destinatario" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item name="creador" label="Creador">
                  <Input placeholder="Nombre o usuario" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item name="rol" label="Rol Creador">
                  <Select allowClear placeholder="Seleccione rol">
                    <Select.Option value="Gestor de Venta">Gestor de Venta</Select.Option>
                    <Select.Option value="Administrador_Remesas">Administrador_Remesas</Select.Option>
                    <Select.Option value="Super_Administrador">Super_Administrador</Select.Option>
                    <Select.Option value="Administrador">Administrador</Select.Option>
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
                    loadData();
                  }}
                  style={{ borderRadius: 14 }}
                >
                  Limpiar
                </Button>
              </Col>
              <Col>
                <Button htmlType="submit" type="primary" style={{ backgroundColor: '#000', borderColor: '#000', borderRadius: 14 }}>
                  Filtrar
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        <Row gutter={[12, 12]} className="mb-4">
          <Col xs={24} sm={12} md={8} lg={4}><Card><Statistic title="Monto Depositado" value={totals.monto} precision={2} /></Card></Col>
          <Col xs={24} sm={12} md={8} lg={4}><Card><Statistic title="Monto Entregado" value={totals.montoEntrega} precision={2} /></Card></Col>
          <Col xs={24} sm={12} md={8} lg={4}><Card><Statistic title="Ganancia" value={totals.ganancia} precision={2} /></Card></Col>
          <Col xs={24} sm={12} md={8} lg={4}><Card><Statistic title="Ganancia Gestor" value={totals.gestor} precision={2} /></Card></Col>
          <Col xs={24} sm={12} md={8} lg={4}><Card><Statistic title="Ganancia Admin Remesas" value={totals.admin} precision={2} /></Card></Col>
          <Col xs={24} sm={12} md={8} lg={4}><Card><Statistic title="Ganancia Super Admin" value={totals.super} precision={2} /></Card></Col>
        </Row>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)' }}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={rows}
            columns={columns}
            scroll={{ x: 1600 }}
            bordered
            pagination={{ showSizeChanger: true }}
          />
        </div>
      </div>
    </div>
  );
}

export default RemesaAccountingPage;
