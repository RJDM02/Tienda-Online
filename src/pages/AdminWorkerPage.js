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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FilterListIcon from '@mui/icons-material/FilterList';

import { API_URL } from '../config/apiConfig';
const AdminWorkerPage = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [loading, setLoading] = useState({
    list: true,
    submitting: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentWorker, setCurrentWorker] = useState(null);
  const [nameSortDirection, setNameSortDirection] = useState('asc');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const [editForm, setEditForm] = useState({
    nombre: '',
    username: '',
    rol: '',
    dir: '',
    ubicacion: '',
    telefono: '',
    password: '',
    correo: ''
  });

  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  const fetchWorkers = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(prev => ({...prev, list: true}));
    setError(null);

    try {
      const response = await fetch(`${API_URL}/listar_trabajador/`, {
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
        throw new Error('Error al cargar trabajadores');
      }

      const data = await response.json();
      setWorkers(data);
      setFilteredWorkers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, list: false}));
    }
  };

  const fetchWorkerDetails = async (id) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/listar_detalle_trabajador/${id}/`, {
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
        throw new Error('Error al cargar detalles del trabajador');
      }

      const data = await response.json();
      setCurrentWorker(data);
      setEditForm({
        nombre: data.nombre,
        username: data.username,
        rol: data.rol,
        dir: data.dir,
        ubicacion: data.ubicacion || '',
        telefono: data.telefono,
        correo: data.correo || '',
        password: ''
      });
      setEditModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    const token = getAuthToken();
    if (!token) return;

    if (!window.confirm('¿Estás seguro de eliminar este trabajador?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/eliminar_trabajador/${id}/`, {
        method: 'DELETE',
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
        throw new Error('Error al eliminar trabajador');
      }

      setSuccess('Trabajador eliminado correctamente');
      fetchWorkers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token || !currentWorker) return;

    setLoading(prev => ({...prev, submitting: true}));
    setError(null);

    try {
      const payload = {
        nombre: editForm.nombre,
        username: editForm.username,
        rol: editForm.rol,
        dir: editForm.dir,
        ubicacion: editForm.ubicacion,
        telefono: editForm.telefono,
        correo: editForm.correo || null,
        ...(editForm.password && { password: editForm.password })
      };

      const response = await fetch(`${API_URL}/editar_trabajador/${currentWorker.id}/`, {
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
        throw new Error(errorData.message || 'Error al actualizar trabajador');
      }

      setSuccess('Trabajador actualizado correctamente');
      setEditModalOpen(false);
      fetchWorkers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, submitting: false}));
    }
  };

  const sortByName = () => {
    const direction = nameSortDirection === 'asc' ? 'desc' : 'asc';
    setNameSortDirection(direction);
    
    const sorted = [...filteredWorkers].sort((a, b) => {
      if (a.nombre < b.nombre) return direction === 'asc' ? -1 : 1;
      if (a.nombre > b.nombre) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredWorkers(sorted);
  };

  const filterByRole = (role) => {
    setRoleFilter(role);
    if (role === 'all') {
      setFilteredWorkers(workers);
    } else {
      const filtered = workers.filter(worker => worker.rol === role);
      setFilteredWorkers(filtered);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Administración de Trabajadores</h1>
              <p className="text-gray-600">Gestiona los trabajadores de tu tienda</p>
            </div>
            <div className="flex space-x-4">
              <IconButton 
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-100 hover:bg-gray-200"
                title="Filtrar trabajadores"
              >
                <FilterListIcon />
              </IconButton>
              <button 
                onClick={() => navigate('/crear-trabajador')}
                className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <AddIcon className="text-white" />
                <span>Crear Nuevo Trabajador</span>
              </button>
            </div>
          </div>

          {/* Filtros */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap items-center gap-4">
                <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Filtrar por rol</InputLabel>
                  <Select
                    value={roleFilter}
                    onChange={(e) => filterByRole(e.target.value)}
                    label="Filtrar por rol"
                  >
                    <MenuItem value="all">Todos los roles</MenuItem>
                    <MenuItem value="Administrador">Administrador</MenuItem>
                    <MenuItem value="Gestor de Venta">Gestor de Venta</MenuItem>
                    <MenuItem value="Mensajero">Mensajero</MenuItem>
                    <MenuItem value="Super_Administrador">Super Administrador</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
          )}
        </div>

        {/* Contenido principal */}
        {loading.list ? (
          <div className="bg-white rounded-2xl shadow-lg p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Cargando trabajadores...</p>
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
                      <div className="flex items-center justify-start cursor-pointer" onClick={sortByName}>
                        <span>Nombre</span>
                        {nameSortDirection === 'asc' ? (
                          <ArrowUpwardIcon fontSize="small" className="ml-1" />
                        ) : (
                          <ArrowDownwardIcon fontSize="small" className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Ubicacion
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Correo electrónico
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredWorkers.map((worker, index) => (
                    <tr key={worker.id} className={`hover:bg-orange-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 text-left">{worker.nombre}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 text-left">{worker.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 text-left capitalize">{worker.rol.toLowerCase().replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 text-left">{worker.ubicacion || 'No especificada'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 text-left">{worker.telefono}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 text-left">
                          {worker.correo || 'No especificado'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => fetchWorkerDetails(worker.id)}
                            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDelete(worker.id)}
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
            
            {filteredWorkers.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <AddIcon sx={{ fontSize: 64 }} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay trabajadores</h3>
                <p className="text-gray-500 mb-6">
                  {roleFilter === 'all' 
                    ? 'Crea tu primer trabajador para comenzar' 
                    : 'No hay trabajadores con este rol'}
                </p>
                <button 
                  onClick={() => navigate('/crear-trabajador')}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  Crear Trabajador
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
            <h2 className="text-2xl font-bold text-gray-900">Editar Trabajador</h2>
            <p className="text-gray-500 text-sm mt-1">Actualiza la información del trabajador</p>
          </DialogTitle>
          
          <form onSubmit={handleUpdate}>
            <DialogContent className="space-y-4">
              <TextField
                label="Nombre completo"
                variant="outlined"
                fullWidth
                value={editForm.nombre}
                onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
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

              <FormControl fullWidth margin="normal" sx={{
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
              }}>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={editForm.rol}
                  onChange={(e) => setEditForm({...editForm, rol: e.target.value})}
                  label="Rol"
                  required
                >
                  <MenuItem value="Administrador">Administrador</MenuItem>
                  <MenuItem value="Gestor de Venta">Gestor de Venta</MenuItem>
                  <MenuItem value="Mensajero">Mensajero</MenuItem>
                  <MenuItem value="Super_Administrador">Super Administrador</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Dirección"
                variant="outlined"
                fullWidth
                value={editForm.dir}
                onChange={(e) => setEditForm({...editForm, dir: e.target.value})}
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
                label="Ubicacion"
                variant="outlined"
                fullWidth
                value={editForm.ubicacion}
                onChange={(e) => setEditForm({...editForm, ubicacion: e.target.value})}
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
                label="Telefono"
                variant="outlined"
                fullWidth
                value={editForm.telefono}
                onChange={(e) => setEditForm({...editForm, telefono: e.target.value})}
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
                type="email"
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
                label="Nueva contraseña (dejar vacío para no cambiar)"
                type="password"
                variant="outlined"
                fullWidth
                value={editForm.password}
                onChange={(e) => setEditForm({...editForm, password: e.target.value})}
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

export default AdminWorkerPage;
