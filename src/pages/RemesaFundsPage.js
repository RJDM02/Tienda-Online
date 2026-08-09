import React, { useEffect, useState } from 'react';
import { Button, Card, Col, InputNumber, Row, Statistic, Table, Typography, message } from 'antd';
import { API_BASE_URL } from '../config/apiConfig';

function RemesaFundsPage() {
  const token = localStorage.getItem('authToken');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fondo, setFondo] = useState(null);
  const [monto, setMonto] = useState(null);

  const loadFondo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/remesa/fondo/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'No se pudo obtener el fondo');
      }

      setFondo(data);
    } catch (error) {
      message.error(error.message || 'Error cargando fondo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFondo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const depositar = async () => {
    if (!monto || Number(monto) <= 0) {
      message.warning('Ingrese un monto valido para depositar');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/remesa/fondo/depositar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ monto }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || JSON.stringify(data) || 'No se pudo depositar');
      }

      message.success(data?.mensaje || 'Deposito aplicado');
      setMonto(null);
      await loadFondo();
    } catch (error) {
      message.error(error.message || 'Error depositando fondo');
    } finally {
      setSaving(false);
    }
  };

  const depositColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: 'Monto Depositado',
      dataIndex: 'monto',
      key: 'monto',
      width: 150,
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (value) => (value ? new Date(value).toLocaleString() : '-'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5ed] p-2 md:p-4">
      <div className="max-w-full mx-auto">
        <Card
          className="mb-4"
          style={{ borderRadius: 20, borderColor: '#e5e7eb', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)' }}
          loading={loading}
        >
          <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
            Fondo de Remesas
          </Typography.Title>
          <Typography.Text type="secondary">
            Gestiona el saldo y deposita nuevo fondo con la misma linea visual del panel.
          </Typography.Text>

          <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
            <Col xs={24} md={10} lg={8}>
              <Card style={{ borderRadius: 14, background: '#fafafa', borderColor: '#e5e7eb' }}>
                <Statistic title="Saldo Actual" value={Number(fondo?.monto || 0)} precision={2} />
                <Typography.Text type="secondary">
                  Ultima renovacion: {fondo?.ultima_renovacion ? new Date(fondo.ultima_renovacion).toLocaleString() : '-'}
                </Typography.Text>
              </Card>
            </Col>

            <Col xs={24} md={14} lg={16}>
              <Card style={{ borderRadius: 14, borderColor: '#e5e7eb' }}>
                <Typography.Text style={{ display: 'block', marginBottom: 10 }}>
                  Monto Depositado
                </Typography.Text>
                <Row gutter={10}>
                  <Col xs={24} sm={14} md={12} lg={10}>
                    <InputNumber
                      className="w-full"
                      min={0}
                      step={0.01}
                      value={monto}
                      onChange={(value) => setMonto(value)}
                      placeholder="0.00"
                    />
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      loading={saving}
                      onClick={depositar}
                      style={{ backgroundColor: '#000', borderColor: '#000', borderRadius: 14 }}
                    >
                      Depositar
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Card>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)' }}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={Array.isArray(fondo?.depositos) ? fondo.depositos : []}
            columns={depositColumns}
            bordered
            pagination={{ showSizeChanger: true }}
            title={() => 'Historial de Depositos'}
          />
        </div>
      </div>
    </div>
  );
}

export default RemesaFundsPage;
