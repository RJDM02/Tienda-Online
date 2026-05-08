import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Input, message, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd';
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

const toApiDate = (value) => {
  if (!value) return null;
  return value.toISOString();
};

const sameDayOrAfter = (value, min) => !value || !min || value.isAfter(min, 'day') || value.isSame(min, 'day');
const sameDayOrBefore = (value, max) => !value || !max || value.isBefore(max, 'day') || value.isSame(max, 'day');

function RemesaManagePage() {
  const token = localStorage.getItem('authToken');
  const [filterForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [mensajeros, setMensajeros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [saving, setSaving] = useState(false);

  const applyFilters = (values) => {
    const data = [...rows].filter((row) => {
      const fecha = toDate(row.fecha_entrega);
      const [startDate, endDate] = values.fecha || [];
      const creadorNombre = row.creador_nombre || row.creador_username || '';
      const creadorRol = row.creador_rol || '';

      const matchesDestinatario = values.destinatario
        ? (row.destinatario || '').toLowerCase().includes(values.destinatario.toLowerCase())
        : true;
      const matchesTelefono = values.telefono_destinatario
        ? (row.telefono_destinatario || '').toLowerCase().includes(values.telefono_destinatario.toLowerCase())
        : true;
      const matchesCreador = values.creador
        ? creadorNombre.toLowerCase().includes(values.creador.toLowerCase())
        : true;
      const matchesRol = values.rol
        ? creadorRol.toLowerCase().includes(values.rol.toLowerCase())
        : true;
      const matchesDireccion = values.direccion
        ? (row.direccion || '').toLowerCase().includes(values.direccion.toLowerCase())
        : true;
      const matchesEstado = values.estado ? (row.estado || 'pendiente') === values.estado : true;
      const matchesMes = values.mes ? (fecha ? fecha.month() + 1 === values.mes : false) : true;
      const matchesRange = sameDayOrAfter(fecha, startDate) && sameDayOrBefore(fecha, endDate);

      return (
        matchesDestinatario &&
        matchesTelefono &&
        matchesCreador &&
        matchesRol &&
        matchesDireccion &&
        matchesEstado &&
        matchesMes &&
        matchesRange
      );
    });

    setFilteredRows(data);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [remesasRes, mensajerosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/remesa/listar/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/listar_mensajero/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const remesasData = await remesasRes.json();
      const mensajerosData = await mensajerosRes.json();

      if (!remesasRes.ok) {
        throw new Error(remesasData?.detail || 'No se pudieron cargar las remesas');
      }
      if (!mensajerosRes.ok) {
        throw new Error(mensajerosData?.detail || 'No se pudieron cargar los mensajeros');
      }

      // En Gestionar solo deben verse remesas en proceso (pendientes).
      const list = (Array.isArray(remesasData) ? remesasData : [])
        .filter((remesa) => (remesa.estado || 'pendiente') === 'pendiente')
        .sort((a, b) => b.id - a.id);
      setRows(list);
      setFilteredRows(list);
      setMensajeros(Array.isArray(mensajerosData) ? mensajerosData : []);
    } catch (error) {
      message.error(error.message || 'Error cargando datos de remesas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEditModal = (row) => {
    setEditingRow(row);
    editForm.setFieldsValue({
      estado: row.estado || 'pendiente',
      mensajero_id: row.mensajero || undefined,
      fecha_entrega: toDate(row.fecha_entrega),
      nota: row.nota || '',
      motivo_cancelacion: '',
    });
    setEditOpen(true);
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setEditingRow(null);
    editForm.resetFields();
  };

  const onSave = async () => {
    if (!editingRow) return;

    try {
      const values = await editForm.validateFields();
      setSaving(true);

      const payload = {
        estado: values.estado,
        fecha_entrega: toApiDate(values.fecha_entrega),
        nota: values.nota || null,
      };

      if (values.mensajero_id) payload.mensajero_id = values.mensajero_id;
      if (values.estado === 'cancelado') payload.motivo_cancelacion = values.motivo_cancelacion || '';

      const response = await fetch(`${API_BASE_URL}/api/remesa/actualizar/${editingRow.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'No se pudo actualizar la remesa');
      }

      message.success('Remesa actualizada');
      closeEditModal();
      await loadData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || 'Error actualizando remesa');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 80,
      },
      {
        title: 'Destinatario',
        key: 'destinatario',
        width: 240,
        render: (_, record) => (
          <div>
            <div><strong>Nombre:</strong> {record.destinatario || '-'}</div>
            <div><strong>DNI:</strong> {record.dni || record.dni_cedula || '-'}</div>
            <div><strong>Tel:</strong> {record.telefono_destinatario || '-'}</div>
          </div>
        ),
      },
      {
        title: 'Domicilio',
        dataIndex: 'direccion',
        key: 'direccion',
        width: 220,
      },
      {
        title: 'Horario Entrega',
        dataIndex: 'fecha_entrega',
        key: 'fecha_entrega',
        width: 210,
        render: (value) => (value ? new Date(value).toLocaleString() : '-'),
      },
      {
        title: 'Creador Remesa',
        key: 'cliente',
        width: 260,
        render: (_, record) => (
          <div>
            <div><strong>Nombre:</strong> {record.creador_nombre || '-'}</div>
            <div><strong>Usuario:</strong> {record.creador_username || '-'}</div>
            <div><strong>Rol:</strong> {record.creador_rol || '-'}</div>
          </div>
        ),
      },
      {
        title: 'Estado',
        dataIndex: 'estado',
        key: 'estado',
        width: 130,
        render: (value) => <Tag color={estadoTagColor[value] || 'default'}>{value || 'pendiente'}</Tag>,
      },
      {
        title: 'Monto Depositado',
        key: 'monto',
        dataIndex: 'monto',
        width: 140,
        render: (value) => <strong>{value || 0}</strong>,
      },
      {
        title: 'Monto Entregado',
        key: 'monto_entrega',
        dataIndex: 'monto_entrega',
        width: 150,
        render: (value) => <strong>{value || 0}</strong>,
      },
      {
        title: 'Acciones',
        key: 'acciones',
        width: 150,
        fixed: 'right',
        render: (_, record) => (
          <Button
            type="primary"
            onClick={() => openEditModal(record)}
            style={{ backgroundColor: '#000', borderColor: '#000', borderRadius: 10 }}
          >
            Modificar
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#f7f5ed] p-2 md:p-4">
      <div className="max-w-full mx-auto">
        <Card
          className="mb-4"
          style={{ borderRadius: 20, borderColor: '#e5e7eb', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)' }}
        >
          <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
            Gestionar Remesas
          </Typography.Title>
          <Typography.Text type="secondary">
            Asigna mensajero y cambia estado antes de que la remesa pase al historial.
          </Typography.Text>

          <Form form={filterForm} layout="vertical" onFinish={applyFilters} style={{ marginTop: 20 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item name="destinatario" label="Cliente">
                  <Input placeholder="Nombre o usuario" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item name="telefono_destinatario" label="Telefono Cliente">
                  <Input placeholder="Numero de telefono" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item name="creador" label="Gestor/Creador">
                  <Input placeholder="Nombre o usuario" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item name="rol" label="Rol Creador">
                  <Input placeholder="Rol" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Form.Item name="direccion" label="Domicilio">
                  <Input placeholder="Ubicacion" />
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
            </Row>
          </Form>
        </Card>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)' }}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={filteredRows}
            columns={columns}
            scroll={{ x: 1500 }}
            bordered
            pagination={{ showSizeChanger: true }}
          />
        </div>

        <Modal
          open={editOpen}
          title={editingRow ? `Modificar Remesa #${editingRow.id}` : 'Modificar Remesa'}
          onCancel={closeEditModal}
          onOk={onSave}
          confirmLoading={saving}
          okText="Guardar"
        >
          <Form layout="vertical" form={editForm}>
            <Form.Item name="estado" label="Estado" rules={[{ required: true, message: 'Seleccione un estado' }]}>
              <Select>
                <Select.Option value="pendiente">Pendiente</Select.Option>
                <Select.Option value="entregado">Entregado</Select.Option>
                <Select.Option value="cancelado">Cancelado</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="mensajero_id" label="Mensajero">
              <Select allowClear placeholder="Seleccione un mensajero">
                {mensajeros.map((mensajero) => (
                  <Select.Option key={mensajero.id} value={mensajero.id}>
                    {mensajero.nombre || mensajero.username}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="fecha_entrega" label="Fecha y hora de entrega">
              <DatePicker className="w-full" showTime format="YYYY-MM-DD HH:mm:ss" />
            </Form.Item>

            <Form.Item shouldUpdate noStyle>
              {() =>
                editForm.getFieldValue('estado') === 'cancelado' ? (
                  <Form.Item name="motivo_cancelacion" label="Motivo de cancelacion" rules={[{ required: true, message: 'Indique un motivo' }]}>
                    <Input.TextArea rows={2} />
                  </Form.Item>
                ) : null
              }
            </Form.Item>

            <Form.Item name="nota" label="Nota">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default RemesaManagePage;
