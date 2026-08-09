import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AutoComplete, Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../config/apiConfig';

function RemesaCreatePage() {
  const token = localStorage.getItem('authToken');
  const [form] = Form.useForm();

  const [mensajeros, setMensajeros] = useState([]);
  const [loadingMensajeros, setLoadingMensajeros] = useState(false);
  const [saving, setSaving] = useState(false);
  const [destinatarioOptions, setDestinatarioOptions] = useState([]);
  const [telefonoOptions, setTelefonoOptions] = useState([]);
  const [destinatarioValue, setDestinatarioValue] = useState('');
  const [telefonoValue, setTelefonoValue] = useState('');
  const [searchingDestinatario, setSearchingDestinatario] = useState(false);
  const [searchingTelefono, setSearchingTelefono] = useState(false);
  const [destinatarioFocused, setDestinatarioFocused] = useState(false);
  const [telefonoFocused, setTelefonoFocused] = useState(false);
  const destinatarioTimeoutRef = useRef(null);
  const telefonoTimeoutRef = useRef(null);

  const canPickMensajero = useMemo(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    return ['Super_Administrador', 'Administrador_Remesas'].includes(userData.rol);
  }, []);

  useEffect(() => {
    if (!canPickMensajero) return;

    let mounted = true;

    const loadMensajeros = async () => {
      setLoadingMensajeros(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/listar_mensajero/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.detail || 'No se pudieron cargar los mensajeros');
        }

        if (mounted) {
          setMensajeros(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (mounted) {
          message.error(error.message || 'Error cargando mensajeros');
        }
      } finally {
        if (mounted) {
          setLoadingMensajeros(false);
        }
      }
    };

    loadMensajeros();

    return () => {
      mounted = false;
    };
  }, [canPickMensajero, token]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        destinatario: values.destinatario?.trim(),
        telefono_destinatario: values.telefono_destinatario?.trim(),
        dni: values.dni?.trim(),
        fecha_entrega: values.fecha_entrega ? values.fecha_entrega.toISOString() : null,
        direccion: values.direccion?.trim(),
        monto: values.monto,
        monto_entrega: values.monto_entrega,
        nota: values.nota ? values.nota.trim() : null,
      };

      if (values.mensajero) {
        payload.mensajero = values.mensajero;
      }

      const response = await fetch(`${API_BASE_URL}/api/remesa/crear/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || JSON.stringify(data) || 'No se pudo crear la remesa');
      }

      message.success(`Remesa #${data.id} creada correctamente`);
      form.resetFields();
      setDestinatarioValue('');
      setTelefonoValue('');
      setDestinatarioOptions([]);
      setTelefonoOptions([]);
    } catch (error) {
      message.error(error.message || 'Error al crear remesa');
    } finally {
      setSaving(false);
    }
  };

  const fetchClientes = async ({ destinatario = '', telefono = '' }) => {
    const params = new URLSearchParams();
    if (destinatario) params.append('destinatario', destinatario);
    if (telefono) params.append('telefono', telefono);

    const response = await fetch(`${API_BASE_URL}/api/remesa/clientes/buscar/?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || data?.error || 'No se pudo buscar clientes');
    }
    return Array.isArray(data) ? data : [];
  };

  const buildOptions = (clientes) =>
    clientes.map((cliente) => ({
      value: cliente.username || '',
      label: `${cliente.username || '-'} | ${cliente.telefono || '-'} | ${cliente.dni || '-'} | ${cliente.direccion || '-'}`,
      cliente,
    }));
  const buildPhoneOptions = (clientes) =>
    clientes.map((cliente) => ({
      value: cliente.telefono || '',
      label: `${cliente.telefono || '-'} | ${cliente.username || '-'} | ${cliente.dni || '-'} | ${cliente.direccion || '-'}`,
      cliente,
    }));

  const onSearchDestinatario = (value) => {
    if (destinatarioTimeoutRef.current) clearTimeout(destinatarioTimeoutRef.current);
    setDestinatarioValue(value || '');
    if (!value || value.trim().length < 2) {
      setDestinatarioOptions([]);
      return;
    }
    destinatarioTimeoutRef.current = setTimeout(async () => {
      try {
        setSearchingDestinatario(true);
        const clientes = await fetchClientes({ destinatario: value.trim() });
        setDestinatarioOptions(buildOptions(clientes));
      } catch (error) {
        message.error(error.message || 'Error buscando clientes');
      } finally {
        setSearchingDestinatario(false);
      }
    }, 300);
  };

  const onSearchTelefono = (value) => {
    if (telefonoTimeoutRef.current) clearTimeout(telefonoTimeoutRef.current);
    setTelefonoValue(value || '');
    if (!value || value.trim().length < 2) {
      setTelefonoOptions([]);
      return;
    }
    telefonoTimeoutRef.current = setTimeout(async () => {
      try {
        setSearchingTelefono(true);
        const clientes = await fetchClientes({ telefono: value.trim() });
        setTelefonoOptions(buildPhoneOptions(clientes));
      } catch (error) {
        message.error(error.message || 'Error buscando clientes');
      } finally {
        setSearchingTelefono(false);
      }
    }, 300);
  };

  const fillClienteFields = (cliente) => {
    if (!cliente) return;
    form.setFieldsValue({
      destinatario: cliente.username || '',
      telefono_destinatario: cliente.telefono || '',
      dni: cliente.dni || '',
      direccion: cliente.direccion || '',
    });
    setDestinatarioValue(cliente.username || '');
    setTelefonoValue(cliente.telefono || '');
    setDestinatarioOptions([]);
    setTelefonoOptions([]);
    setDestinatarioFocused(false);
    setTelefonoFocused(false);
  };

  const tryAutoFillOnBlur = async (fieldName) => {
    const destinatario = (form.getFieldValue('destinatario') || '').trim();
    const telefono = (form.getFieldValue('telefono_destinatario') || '').trim();
    const queryValue = fieldName === 'destinatario' ? destinatario : telefono;
    if (queryValue.length < 2) return;

    try {
      const clientes = await fetchClientes(
        fieldName === 'destinatario' ? { destinatario: queryValue } : { telefono: queryValue }
      );
      if (!clientes.length) return;

      const exact = clientes.find((cliente) =>
        fieldName === 'destinatario'
          ? (cliente.username || '').toLowerCase() === queryValue.toLowerCase()
          : (cliente.telefono || '') === queryValue
      );

      if (exact) {
        fillClienteFields(exact);
        return;
      }

      if (clientes.length === 1) {
        fillClienteFields(clientes[0]);
      }
    } catch (error) {
      message.error(error.message || 'Error autocompletando cliente');
    }
  };

  useEffect(() => {
    return () => {
      if (destinatarioTimeoutRef.current) clearTimeout(destinatarioTimeoutRef.current);
      if (telefonoTimeoutRef.current) clearTimeout(telefonoTimeoutRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f5ed] p-2 md:p-4">
      <div className="max-w-full mx-auto">
        <Card
          className="mb-4"
          style={{ borderRadius: 20, borderColor: '#e5e7eb', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)' }}
        >
          <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
            Crear Remesa
          </Typography.Title>
          <Typography.Text type="secondary">
            Registra una nueva remesa con el estilo de formularios del panel principal.
          </Typography.Text>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              fecha_entrega: dayjs(),
            }}
            style={{ marginTop: 20 }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="destinatario" label="Destinatario" rules={[{ required: true, message: 'Ingrese el destinatario' }]}>
                  <AutoComplete
                    options={
                      destinatarioValue.trim().length < 2
                        ? []
                        : searchingDestinatario
                        ? [{ value: '__loading_dest__', label: 'Buscando...', disabled: true }]
                        : destinatarioOptions.length
                        ? destinatarioOptions
                        : [{ value: '__empty_dest__', label: 'Sin coincidencias', disabled: true }]
                    }
                    onSearch={onSearchDestinatario}
                    onSelect={(_, option) => fillClienteFields(option?.cliente)}
                    filterOption={false}
                    placement="topLeft"
                    dropdownStyle={{ borderRadius: 12 }}
                    open={destinatarioFocused && destinatarioValue.trim().length >= 2}
                    onChange={(value) => setDestinatarioValue(value || '')}
                  >
                    <Input
                      placeholder="Nombre del destinatario"
                      onFocus={() => setDestinatarioFocused(true)}
                      onBlur={() => {
                        setTimeout(() => setDestinatarioFocused(false), 120);
                        tryAutoFillOnBlur('destinatario');
                      }}
                    />
                  </AutoComplete>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item
                  name="telefono_destinatario"
                  label="Telefono Destinatario"
                  rules={[{ required: true, message: 'Ingrese el telefono' }]}
                >
                  <AutoComplete
                    options={
                      telefonoValue.trim().length < 2
                        ? []
                        : searchingTelefono
                        ? [{ value: '__loading_tel__', label: 'Buscando...', disabled: true }]
                        : telefonoOptions.length
                        ? telefonoOptions
                        : [{ value: '__empty_tel__', label: 'Sin coincidencias', disabled: true }]
                    }
                    onSearch={onSearchTelefono}
                    onSelect={(_, option) => fillClienteFields(option?.cliente)}
                    filterOption={false}
                    placement="topLeft"
                    dropdownStyle={{ borderRadius: 12 }}
                    open={telefonoFocused && telefonoValue.trim().length >= 2}
                    onChange={(value) => setTelefonoValue(value || '')}
                  >
                    <Input
                      placeholder="Numero de telefono"
                      onFocus={() => setTelefonoFocused(true)}
                      onBlur={() => {
                        setTimeout(() => setTelefonoFocused(false), 120);
                        tryAutoFillOnBlur('telefono_destinatario');
                      }}
                    />
                  </AutoComplete>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="dni" label="DNI/Cedula" rules={[{ required: true, message: 'Ingrese DNI o cedula' }]}>
                  <Input placeholder="Documento" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item
                  name="fecha_entrega"
                  label="Fecha y Hora"
                  rules={[{ required: true, message: 'Seleccione fecha y hora' }]}
                >
                  <DatePicker showTime className="w-full" format="YYYY-MM-DD HH:mm:ss" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="direccion" label="Domicilio" rules={[{ required: true, message: 'Ingrese direccion' }]}>
                  <Input placeholder="Ubicacion" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="monto" label="Monto Depositado" rules={[{ required: true, message: 'Ingrese el monto depositado' }]}>
                  <InputNumber className="w-full" min={0} step={0.01} placeholder="0.00" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item
                  name="monto_entrega"
                  label="Monto Entregado"
                  rules={[{ required: true, message: 'Ingrese el monto entregado' }]}
                >
                  <InputNumber className="w-full" min={0} step={0.01} placeholder="0.00" />
                </Form.Item>
              </Col>

              {canPickMensajero && (
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="mensajero" label="Mensajero (opcional)">
                    <Select allowClear loading={loadingMensajeros} placeholder="Sin asignar">
                      {mensajeros.map((mensajero) => (
                        <Select.Option key={mensajero.id} value={mensajero.id}>
                          {mensajero.nombre || mensajero.username}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              )}

              <Col xs={24} sm={24} md={16} lg={12}>
                <Form.Item name="nota" label="Nota (opcional)">
                  <Input.TextArea rows={2} placeholder="Escriba una nota" />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="end" gutter={10}>
              <Col>
                <Button
                  onClick={() => {
                    form.resetFields();
                    setDestinatarioValue('');
                    setTelefonoValue('');
                    setDestinatarioOptions([]);
                    setTelefonoOptions([]);
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
                  loading={saving}
                  style={{ backgroundColor: '#000', borderColor: '#000', borderRadius: 14 }}
                >
                  Crear Remesa
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default RemesaCreatePage;
