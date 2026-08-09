import React, { useState } from 'react';
import { Button, Card, Col, Form, Input, Row, Typography, message } from 'antd';
import { API_BASE_URL } from '../config/apiConfig';

function RemesaClientCreatePage() {
  const token = localStorage.getItem('authToken');
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        username: values.username?.trim(),
        password: values.password,
        telefono: values.telefono?.trim(),
        direccion: values.direccion?.trim(),
        dni: values.dni?.trim(),
        correo: values.correo ? values.correo.trim() : null,
      };

      const response = await fetch(`${API_BASE_URL}/api/crear_cliente_remesas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || JSON.stringify(data));
      }

      message.success('Cliente de remesas creado correctamente');
      form.resetFields();
    } catch (error) {
      message.error(error.message || 'Error creando cliente de remesas');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5ed] p-2 md:p-4">
      <div className="max-w-full mx-auto">
        <Card
          className="mb-4"
          style={{ borderRadius: 20, borderColor: '#e5e7eb', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)' }}
        >
          <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
            Crear Cliente Remesas
          </Typography.Title>
          <Typography.Text type="secondary">
            Crea clientes de remesas para tenerlos disponibles al crear nuevas remesas.
          </Typography.Text>

          <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="username" label="Usuario/Nombre" rules={[{ required: true, message: 'Ingrese el usuario' }]}>
                  <Input placeholder="Nombre del cliente" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="telefono" label="Telefono" rules={[{ required: true, message: 'Ingrese el telefono' }]}>
                  <Input placeholder="Numero de telefono" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="direccion" label="Direccion" rules={[{ required: true, message: 'Ingrese la direccion' }]}>
                  <Input placeholder="Direccion" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="dni" label="DNI/Cedula" rules={[{ required: true, message: 'Ingrese el DNI' }]}>
                  <Input placeholder="Documento de identidad" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="correo" label="Correo (opcional)">
                  <Input placeholder="correo@dominio.com" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item
                  name="password"
                  label="Contrasena"
                  rules={[
                    { required: true, message: 'Ingrese la contrasena' },
                    { min: 8, message: 'Minimo 8 caracteres' },
                  ]}
                >
                  <Input.Password placeholder="Contrasena" />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="end" gutter={10}>
              <Col>
                <Button onClick={() => form.resetFields()} style={{ borderRadius: 14 }}>
                  Limpiar
                </Button>
              </Col>
              <Col>
                <Button
                  htmlType="submit"
                  type="primary"
                  loading={saving}
                  style={{ backgroundColor: '#000', borderColor: '#000', borderRadius: 14 }}
                >
                  Crear Cliente
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default RemesaClientCreatePage;
