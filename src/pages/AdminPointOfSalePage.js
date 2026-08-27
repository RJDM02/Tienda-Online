import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Chip,
  Checkbox,
  ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import StorefrontIcon from '@mui/icons-material/Storefront';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import { API_URL } from '../config/apiConfig';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    '&:hover fieldset': {
      borderColor: '#FF6B00',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#FF6B00',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#FF6B00',
  },
};

const emptyForm = { nombre: '', localizacion: '', encargados: [], activo: true };
const emptyTransferForm = {
  tipo: 'producto',
  producto: '',
  variacion: '',
  origen_punto_venta: '',
  destino_punto_venta: '',
  cantidad: 1,
  nota: '',
};

const AdminPointOfSalePage = () => {
  const navigate = useNavigate();
  const [puntosVenta, setPuntosVenta] = useState([]);
  const [encargadosDisponibles, setEncargadosDisponibles] = useState([]);
  const [loading, setLoading] = useState({ list: true, submitting: false });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [currentPuntoVenta, setCurrentPuntoVenta] = useState(null);
  const [newPuntoVenta, setNewPuntoVenta] = useState(emptyForm);
  const [editPuntoVenta, setEditPuntoVenta] = useState(emptyForm);
  const [inventario, setInventario] = useState([]);
  const [transferencias, setTransferencias] = useState([]);
  const [transferForm, setTransferForm] = useState(emptyTransferForm);

  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  const fetchPuntosVenta = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(prev => ({ ...prev, list: true }));
    setError(null);

    try {
      const response = await fetch(`${API_URL}/listar_punto_venta/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al obtener los puntos de venta');
      }

      const data = await response.json();
      setPuntosVenta(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, list: false }));
    }
  };

  const fetchEncargadosDisponibles = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/listar_trabajador_encargado_punto_venta/?todos=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      setEncargadosDisponibles(data);
    } catch (err) {
      // La lista de encargados es informativa; si falla no bloquea la pantalla
      console.error('Error al obtener encargados de punto de venta:', err);
    }
  };

  useEffect(() => {
    fetchPuntosVenta();
    fetchEncargadosDisponibles();
    fetchInventario();
    fetchTransferencias();
  }, []);

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  const buildPayload = (form) => ({
    nombre: form.nombre,
    localizacion: form.localizacion,
    encargados: form.encargados || [],
    activo: form.activo,
  });

  const fetchInventario = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/listar_inventario_ubicacion/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      setInventario(data);
    } catch (err) {
      console.error('Error al obtener inventario por ubicacion:', err);
    }
  };

  const fetchTransferencias = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/listar_transferencias_inventario/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      setTransferencias(data);
    } catch (err) {
      console.error('Error al obtener transferencias:', err);
    }
  };

  const handleCreatePuntoVenta = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    setLoading(prev => ({ ...prev, submitting: true }));
    setError(null);

    try {
      const response = await fetch(`${API_URL}/crear_punto_venta/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildPayload(newPuntoVenta))
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || 'Error al crear el punto de venta');
      }

      setSuccess('Punto de venta creado exitosamente');
      setOpenCreateModal(false);
      setNewPuntoVenta(emptyForm);
      fetchPuntosVenta();
      fetchEncargadosDisponibles();
      fetchInventario();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleEditPuntoVenta = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token || !editPuntoVenta.id) return;

    setLoading(prev => ({ ...prev, submitting: true }));
    setError(null);

    try {
      const response = await fetch(`${API_URL}/editar_punto_venta/${editPuntoVenta.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildPayload(editPuntoVenta))
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || 'Error al editar el punto de venta');
      }

      setSuccess('Punto de venta actualizado exitosamente');
      setOpenEditModal(false);
      fetchPuntosVenta();
      fetchEncargadosDisponibles();
      fetchInventario();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleDeletePuntoVenta = async () => {
    const token = getAuthToken();
    if (!token || !currentPuntoVenta) return;

    try {
      const response = await fetch(`${API_URL}/eliminar_punto_venta/${currentPuntoVenta.id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al eliminar el punto de venta');
      }

      setSuccess('Punto de venta eliminado exitosamente');
      setOpenDeleteModal(false);
      fetchPuntosVenta();
      fetchEncargadosDisponibles();
      fetchInventario();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTransferInventario = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    const payload = {
      origen_punto_venta: transferForm.origen_punto_venta || null,
      destino_punto_venta: transferForm.destino_punto_venta || null,
      cantidad: Number(transferForm.cantidad),
      nota: transferForm.nota || null,
    };

    if (transferForm.tipo === 'producto') {
      payload.producto = transferForm.producto;
    } else {
      payload.variacion = transferForm.variacion;
    }

    setLoading(prev => ({ ...prev, submitting: true }));
    setError(null);

    try {
      const response = await fetch(`${API_URL}/transferir_inventario/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || errorData.detail || errorData.cantidad || errorData.producto || 'Error al transferir inventario';
        throw new Error(Array.isArray(message) ? message.join(', ') : message);
      }

      setSuccess('Inventario transferido correctamente');
      setOpenTransferModal(false);
      setTransferForm(emptyTransferForm);
      fetchInventario();
      fetchTransferencias();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  // Al editar, los encargados actuales del punto de venta deben seguir apareciendo en el selector
  const opcionesEncargado = (encargadosActuales = []) => {
    const opciones = [...encargadosDisponibles];
    const actuales = Array.isArray(encargadosActuales) ? encargadosActuales : [];
    actuales.forEach((encargadoId) => {
      if (!opciones.some(t => String(t.id) === String(encargadoId))) {
        const actual = puntosVenta
          .flatMap(pv => pv.encargados_detalle || [])
          .find(t => String(t.id) === String(encargadoId));
        if (actual) opciones.push({ id: actual.id, nombre: actual.nombre, telefono: actual.telefono });
      }
    });
    return opciones;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Administración de Puntos de Venta</h1>
              <p className="text-gray-600">Gestiona puntos, encargados, inventario y transferencias</p>
            </div>
            <button
              onClick={() => setOpenCreateModal(true)}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <AddIcon className="text-white" />
              <span>Nuevo Punto de Venta</span>
            </button>
            <button
              onClick={() => setOpenTransferModal(true)}
              className="bg-[#FF6B00] hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <SwapHorizIcon className="text-white" />
              <span>Transferir Inventario</span>
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        {loading.list ? (
          <div className="bg-white rounded-2xl shadow-lg p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Cargando puntos de venta...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Localización</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Encargados</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {puntosVenta.map((pv, index) => (
                    <tr key={pv.id} className={`hover:bg-orange-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">#{pv.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <StorefrontIcon className="text-orange-600" sx={{ fontSize: 20 }} />
                          </div>
                          <div className="text-sm font-medium text-gray-900">{pv.nombre}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">{pv.localizacion}</div>
                      </td>
                      <td className="px-6 py-4">
                        {pv.encargados_detalle?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {pv.encargados_detalle.map((encargado) => (
                              <Chip
                                key={encargado.id}
                                label={`${encargado.nombre}${encargado.telefono ? ` (${encargado.telefono})` : ''}`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Sin encargados asignados</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Chip
                          label={pv.activo ? 'Activo' : 'Inactivo'}
                          color={pv.activo ? 'success' : 'default'}
                          size="small"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => {
                              setEditPuntoVenta({
                                id: pv.id,
                                nombre: pv.nombre,
                                localizacion: pv.localizacion,
                                encargados: pv.encargados || [],
                                activo: pv.activo,
                              });
                              setOpenEditModal(true);
                            }}
                            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => {
                              setCurrentPuntoVenta(pv);
                              setOpenDeleteModal(true);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {puntosVenta.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <StorefrontIcon sx={{ fontSize: 64 }} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay puntos de venta configurados</h3>
                <p className="text-gray-500 mb-6">Los productos sin punto de venta asignado se consideran en la Sede Principal</p>
                <button
                  onClick={() => setOpenCreateModal(true)}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  Crear Punto de Venta
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Inventory2Icon className="text-orange-600" sx={{ fontSize: 20 }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Inventario por ubicacion</h2>
                  <p className="text-sm text-gray-500">Stock separado entre sede principal y puntos de venta</p>
                </div>
              </div>
              <button
                onClick={fetchInventario}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Actualizar
              </button>
            </div>
            <div className="overflow-x-auto max-h-[520px]">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Producto / Variacion</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ubicacion</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventario.map((row) => (
                    <tr key={row.id} className="hover:bg-orange-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {row.producto_nombre || row.variacion_modelo}
                        </div>
                        <div className="text-xs text-gray-500">
                          {row.producto ? `Producto #${row.producto}` : `Variacion #${row.variacion}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{row.punto_venta_nombre}</td>
                      <td className="px-6 py-4 text-right">
                        <Chip label={row.cantidad} color={row.cantidad > 0 ? 'success' : 'default'} size="small" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {inventario.length === 0 && (
                <div className="p-10 text-center text-gray-500">No hay inventario por ubicacion registrado</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Ultimas transferencias</h2>
              <p className="text-sm text-gray-500">Movimientos entre sede y puntos de venta</p>
            </div>
            <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
              {transferencias.slice(0, 12).map((transferencia) => (
                <div key={transferencia.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {transferencia.producto_nombre || transferencia.variacion_modelo}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transferencia.origen_nombre} -> {transferencia.destino_nombre}
                      </div>
                      {transferencia.creado_por_nombre && (
                        <div className="text-xs text-gray-400 mt-1">Por {transferencia.creado_por_nombre}</div>
                      )}
                    </div>
                    <Chip label={transferencia.cantidad} color="primary" size="small" />
                  </div>
                </div>
              ))}
              {transferencias.length === 0 && (
                <div className="p-10 text-center text-gray-500">No hay transferencias registradas</div>
              )}
            </div>
          </div>
        </div>

        {/* Modal para crear punto de venta */}
        <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} fullWidth maxWidth="sm" PaperProps={{ style: { borderRadius: '16px', padding: '8px' } }}>
          <DialogTitle className="text-center pb-2">
            <h2 className="text-2xl font-bold text-gray-900">Crear Punto de Venta</h2>
            <p className="text-gray-500 text-sm mt-1">Nombre, localización y encargado del punto de venta</p>
          </DialogTitle>
          <form onSubmit={handleCreatePuntoVenta}>
            <DialogContent className="space-y-4">
              <TextField
                label="Nombre"
                variant="outlined"
                fullWidth
                value={newPuntoVenta.nombre}
                onChange={(e) => setNewPuntoVenta({ ...newPuntoVenta, nombre: e.target.value })}
                required
                margin="normal"
                placeholder="Ej: Punto de venta Vedado"
                sx={inputSx}
              />
              <TextField
                label="Localización"
                variant="outlined"
                fullWidth
                value={newPuntoVenta.localizacion}
                onChange={(e) => setNewPuntoVenta({ ...newPuntoVenta, localizacion: e.target.value })}
                required
                margin="normal"
                placeholder="Dirección o zona del punto de venta"
                sx={inputSx}
              />
              <TextField
                select
                label="Encargados (opcional)"
                variant="outlined"
                fullWidth
                value={newPuntoVenta.encargados}
                onChange={(e) => setNewPuntoVenta({ ...newPuntoVenta, encargados: e.target.value })}
                margin="normal"
                helperText="Puedes seleccionar varios trabajadores con rol Encargado de Punto de Venta"
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) => selected
                    .map((id) => opcionesEncargado(newPuntoVenta.encargados).find(t => String(t.id) === String(id))?.nombre)
                    .filter(Boolean)
                    .join(', ')
                }}
                sx={inputSx}
              >
                {opcionesEncargado(newPuntoVenta.encargados).map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    <Checkbox checked={newPuntoVenta.encargados.map(String).includes(String(t.id))} />
                    <ListItemText primary={t.nombre} secondary={t.telefono} />
                  </MenuItem>
                ))}
              </TextField>
            </DialogContent>
            <DialogActions className="p-6 pt-2">
              <button
                type="button"
                onClick={() => setOpenCreateModal(false)}
                disabled={loading.submitting}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading.submitting}
                className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading.submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creando...</span>
                  </>
                ) : (
                  <span>Crear Punto de Venta</span>
                )}
              </button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Modal para editar punto de venta */}
        <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} fullWidth maxWidth="sm" PaperProps={{ style: { borderRadius: '16px', padding: '8px' } }}>
          <DialogTitle className="text-center pb-2">
            <h2 className="text-2xl font-bold text-gray-900">Editar Punto de Venta</h2>
          </DialogTitle>
          <form onSubmit={handleEditPuntoVenta}>
            <DialogContent className="space-y-4">
              <TextField
                label="Nombre"
                variant="outlined"
                fullWidth
                value={editPuntoVenta.nombre}
                onChange={(e) => setEditPuntoVenta({ ...editPuntoVenta, nombre: e.target.value })}
                required
                margin="normal"
                sx={inputSx}
              />
              <TextField
                label="Localización"
                variant="outlined"
                fullWidth
                value={editPuntoVenta.localizacion}
                onChange={(e) => setEditPuntoVenta({ ...editPuntoVenta, localizacion: e.target.value })}
                required
                margin="normal"
                sx={inputSx}
              />
              <TextField
                select
                label="Encargados (opcional)"
                variant="outlined"
                fullWidth
                value={editPuntoVenta.encargados}
                onChange={(e) => setEditPuntoVenta({ ...editPuntoVenta, encargados: e.target.value })}
                margin="normal"
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) => selected
                    .map((id) => opcionesEncargado(editPuntoVenta.encargados).find(t => String(t.id) === String(id))?.nombre)
                    .filter(Boolean)
                    .join(', ')
                }}
                sx={inputSx}
              >
                {opcionesEncargado(editPuntoVenta.encargados).map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    <Checkbox checked={editPuntoVenta.encargados.map(String).includes(String(t.id))} />
                    <ListItemText primary={t.nombre} secondary={t.telefono} />
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Estado"
                variant="outlined"
                fullWidth
                value={editPuntoVenta.activo ? '1' : '0'}
                onChange={(e) => setEditPuntoVenta({ ...editPuntoVenta, activo: e.target.value === '1' })}
                margin="normal"
                sx={inputSx}
              >
                <MenuItem value="1">Activo</MenuItem>
                <MenuItem value="0">Inactivo</MenuItem>
              </TextField>
            </DialogContent>
            <DialogActions className="p-6 pt-2">
              <button
                type="button"
                onClick={() => setOpenEditModal(false)}
                disabled={loading.submitting}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading.submitting}
                className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading.submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Cambios</span>
                )}
              </button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Modal para transferir inventario */}
        <Dialog open={openTransferModal} onClose={() => setOpenTransferModal(false)} fullWidth maxWidth="sm" PaperProps={{ style: { borderRadius: '16px', padding: '8px' } }}>
          <DialogTitle className="text-center pb-2">
            <h2 className="text-2xl font-bold text-gray-900">Transferir Inventario</h2>
            <p className="text-gray-500 text-sm mt-1">Mueve unidades entre sede principal y puntos de venta</p>
          </DialogTitle>
          <form onSubmit={handleTransferInventario}>
            <DialogContent className="space-y-4">
              <TextField
                select
                label="Tipo"
                variant="outlined"
                fullWidth
                value={transferForm.tipo}
                onChange={(e) => setTransferForm({ ...transferForm, tipo: e.target.value, producto: '', variacion: '' })}
                margin="normal"
                sx={inputSx}
              >
                <MenuItem value="producto">Producto</MenuItem>
                <MenuItem value="variacion">Variacion</MenuItem>
              </TextField>

              {transferForm.tipo === 'producto' ? (
                <TextField
                  label="ID del producto"
                  variant="outlined"
                  fullWidth
                  value={transferForm.producto}
                  onChange={(e) => setTransferForm({ ...transferForm, producto: e.target.value })}
                  required
                  margin="normal"
                  sx={inputSx}
                />
              ) : (
                <TextField
                  label="ID de la variacion"
                  variant="outlined"
                  fullWidth
                  value={transferForm.variacion}
                  onChange={(e) => setTransferForm({ ...transferForm, variacion: e.target.value })}
                  required
                  margin="normal"
                  sx={inputSx}
                />
              )}

              <TextField
                select
                label="Origen"
                variant="outlined"
                fullWidth
                value={transferForm.origen_punto_venta}
                onChange={(e) => setTransferForm({ ...transferForm, origen_punto_venta: e.target.value })}
                margin="normal"
                sx={inputSx}
              >
                <MenuItem value="">Sede Principal</MenuItem>
                {puntosVenta.map((pv) => (
                  <MenuItem key={pv.id} value={pv.id}>{pv.nombre}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Destino"
                variant="outlined"
                fullWidth
                value={transferForm.destino_punto_venta}
                onChange={(e) => setTransferForm({ ...transferForm, destino_punto_venta: e.target.value })}
                margin="normal"
                sx={inputSx}
              >
                <MenuItem value="">Sede Principal</MenuItem>
                {puntosVenta.map((pv) => (
                  <MenuItem key={pv.id} value={pv.id}>{pv.nombre}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="Cantidad"
                type="number"
                variant="outlined"
                fullWidth
                value={transferForm.cantidad}
                onChange={(e) => setTransferForm({ ...transferForm, cantidad: e.target.value })}
                inputProps={{ min: 1 }}
                required
                margin="normal"
                sx={inputSx}
              />

              <TextField
                label="Nota"
                variant="outlined"
                fullWidth
                multiline
                minRows={2}
                value={transferForm.nota}
                onChange={(e) => setTransferForm({ ...transferForm, nota: e.target.value })}
                margin="normal"
                sx={inputSx}
              />
            </DialogContent>
            <DialogActions className="p-6 pt-2">
              <button
                type="button"
                onClick={() => setOpenTransferModal(false)}
                disabled={loading.submitting}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading.submitting}
                className="bg-[#FF6B00] text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading.submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Transfiriendo...</span>
                  </>
                ) : (
                  <span>Transferir</span>
                )}
              </button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Modal para eliminar punto de venta */}
        <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} fullWidth maxWidth="sm" PaperProps={{ style: { borderRadius: '16px', padding: '8px' } }}>
          <DialogTitle className="text-center pb-2">
            <h2 className="text-2xl font-bold text-red-600">Confirmar Eliminación</h2>
            <p className="text-gray-500 text-sm mt-1">Los productos asignados quedarán sin punto de venta (Sede Principal)</p>
          </DialogTitle>
          <DialogContent className="text-center py-6">
            {currentPuntoVenta && (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <DeleteIcon className="text-red-600" sx={{ fontSize: 32 }} />
                </div>
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas eliminar el punto de venta <strong>{currentPuntoVenta.nombre}</strong>?
                </p>
              </div>
            )}
          </DialogContent>
          <DialogActions className="p-6 pt-2">
            <button
              type="button"
              onClick={() => setOpenDeleteModal(false)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeletePuntoVenta}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-all duration-200 flex items-center space-x-2"
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
              <span>Eliminar</span>
            </button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseAlert} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar open={!!success} autoHideDuration={3000} onClose={handleCloseAlert} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            {success}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default AdminPointOfSalePage;
