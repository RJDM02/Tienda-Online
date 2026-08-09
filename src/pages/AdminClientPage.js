import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Alert, 
  Snackbar, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import icon1 from '../assets/icon1.png';
import icon2 from '../assets/icon2.png';
import icon3 from '../assets/icon3.png';
import icon4 from '../assets/icon4.png';

import { API_URL } from '../config/apiConfig';
const AdminClientPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState({
    list: true,
    submitting: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  
  // Iconos disponibles para los clientes
  const icons = [
    { name: 'icon1', src: icon1 },
    { name: 'icon2', src: icon2 },
    { name: 'icon3', src: icon3 },
    { name: 'icon4', src: icon4 }
  ];

  // Formulario de edición
  const [editForm, setEditForm] = useState({
    username: '',
    telefono: '',
    correo: '',
    cumple: '',
    imagen: ''
  });

  // Obtener token de autenticación
  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  // Fetch todos los clientes
  const fetchClients = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(prev => ({...prev, list: true}));
    setError(null);

    try {
      const response = await fetch(`${API_URL}/listar_cliente_all/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al cargar clientes');
      }

      const data = await response.json();
      setClients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, list: false}));
    }
  };

  // Fetch detalles de un cliente específico
  const fetchClientDetails = async (id) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/listar_cliente_detalle/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al cargar detalles del cliente');
      }

      const data = await response.json();
      setCurrentClient(data);
      setEditForm({
        username: data.username,
        telefono: data.telefono,
        correo: data.correo || '',
        cumple: data.cumple || '',
        imagen: data.imagen || 'icon1'
      });
      setEditModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // Desactivar/Activar cliente
  const handleToggleStatus = async (id) => {
    const token = getAuthToken();
    if (!token) return;

    if (!window.confirm('¿Estás seguro de cambiar el estado de este cliente?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/desactivar_cliente/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al cambiar estado del cliente');
      }

      setSuccess('Estado del cliente actualizado correctamente');
      fetchClients();
    } catch (err) {
      setError(err.message);
    }
  };

  // Actualizar cliente
  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token || !currentClient) return;

    setLoading(prev => ({...prev, submitting: true}));
    setError(null);

    try {
      const payload = {
        username: editForm.username,
        telefono: editForm.telefono,
        correo: editForm.correo || null,
        cumple: editForm.cumple || null,
        imagen: editForm.imagen
      };

      const response = await fetch(`${API_URL}/editar_cliente/${currentClient.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar cliente');
      }

      setSuccess('Cliente actualizado correctamente');
      setEditModalOpen(false);
      fetchClients();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, submitting: false}));
    }
  };

  // Cargar clientes al montar el componente
  useEffect(() => {
    fetchClients();
  }, []);

  // Cerrar notificaciones
  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  // Obtener la imagen del cliente
  const getClientImage = (imagenName) => {
    const icon = icons.find(icon => icon.name === imagenName);
    return icon ? icon.src : icon1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Administración de Clientes</h1>
              <p className="text-gray-600">Gestiona los clientes de tu tienda</p>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        {loading.list ? (
          <div className="bg-white rounded-2xl shadow-lg p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Cargando clientes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Tabla responsive */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Imagen
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Correo
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clients.map((client, index) => (
                    <tr key={client.id} className={`hover:bg-orange-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{client.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-sm">
                            <img 
                              src={getClientImage(client.imagen)} 
                              alt={client.username} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{client.telefono}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{client.correo || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {client.is_active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <CancelIcon className="h-3 w-3 mr-1" />
                              Inactivo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => fetchClientDetails(client.id)}
                            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(client.id)}
                            className={`${client.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg`}
                          >
                            <span>{client.is_active ? 'Desactivar' : 'Activar'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {clients.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <AddIcon sx={{ fontSize: 64 }} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
                <p className="text-gray-500 mb-6">Crea tu primer cliente para comenzar</p>
                <button 
                  onClick={() => navigate('/crear-cliente')}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  Crear Cliente
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal de edición estilizado */}
        <Dialog 
          open={editModalOpen} 
          onClose={() => setEditModalOpen(false)} 
          fullWidth 
          maxWidth="sm"
          PaperProps={{
            style: {
              borderRadius: '16px',
              padding: '8px'
            }
          }}
        >
          <DialogTitle className="text-center pb-2">
            <h2 className="text-2xl font-bold text-gray-900">Editar Cliente</h2>
            <p className="text-gray-500 text-sm mt-1">Actualiza la información del cliente</p>
          </DialogTitle>
          
          <form onSubmit={handleUpdate}>
            <DialogContent className="space-y-4">
              <TextField
                label="Nombre de usuario"
                variant="outlined"
                fullWidth
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                required
                margin="normal"
                sx={{
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
                }}
              />
              
              <TextField
                label="Teléfono"
                variant="outlined"
                fullWidth
                value={editForm.telefono}
                onChange={(e) => setEditForm({...editForm, telefono: e.target.value})}
                required
                margin="normal"
                sx={{
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
                }}
              />

              <TextField
                label="Correo electrónico"
                variant="outlined"
                fullWidth
                value={editForm.correo}
                onChange={(e) => setEditForm({...editForm, correo: e.target.value})}
                margin="normal"
                sx={{
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
                }}
              />

              <TextField
                label="Fecha de nacimiento"
                type="date"
                variant="outlined"
                fullWidth
                value={editForm.cumple}
                onChange={(e) => setEditForm({...editForm, cumple: e.target.value})}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
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
                }}
              />

              {/* Selección de ícono */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700 block">
                  Selecciona el ícono de perfil
                </label>
                <div className="flex justify-center gap-4">
                  {icons.map((icon) => (
                    <button
                      key={icon.name}
                      type="button"
                      onClick={() => setEditForm({...editForm, imagen: icon.name})}
                      className={`p-4 rounded-full border-2 transition-all duration-200 hover:scale-105 ${
                        editForm.imagen === icon.name 
                          ? 'border-[#FF6B00] bg-orange-50 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <img 
                        src={icon.src} 
                        alt={icon.name}
                        className="w-8 h-8 object-contain"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Estado del cliente (solo lectura) */}
              {currentClient && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Estado del cliente
                  </label>
                  <div className="flex items-center">
                    {currentClient.is_active ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <CancelIcon className="h-4 w-4 mr-1" />
                        Inactivo
                      </span>
                    )}
                    <span className="ml-2 text-sm text-gray-500">
                      (El estado solo puede cambiarse desde la lista principal)
                    </span>
                  </div>
                </div>
              )}
            </DialogContent>
            
            <DialogActions className="p-6 pt-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
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

        {/* Notificaciones estilizadas */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseAlert} 
            severity="error" 
            sx={{ 
              width: '100%',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
          >
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseAlert} 
            severity="success" 
            sx={{ 
              width: '100%',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
          >
            {success}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default AdminClientPage;