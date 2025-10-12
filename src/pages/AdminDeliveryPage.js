import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const AdminDeliveryPage = () => {
  const navigate = useNavigate();
  const [domicilios, setDomicilios] = useState([]);
  const [loading, setLoading] = useState({
    list: true,
    submitting: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [currentDomicilio, setCurrentDomicilio] = useState(null);
  const [newDomicilio, setNewDomicilio] = useState({ ubicacion: '', precio: '' });

  // Obtener token de autenticación
  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  // Listar todos los domicilios
  const fetchDomicilios = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(prev => ({...prev, list: true}));
    setError(null);

    try {
      const response = await fetch('https://videojuegoshabana.com/api/listar_domicilio/', {
        method: 'GET',
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
        throw new Error('Error al obtener domicilios');
      }

      const data = await response.json();
      setDomicilios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, list: false}));
    }
  };

  // Obtener detalles de un domicilio
  const fetchDomicilioDetails = async (id) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`https://videojuegoshabana.com/api/listar_detalle_domicilio/${id}/`, {
        method: 'GET',
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
        throw new Error('Error al obtener detalles del domicilio');
      }

      const data = await response.json();
      setCurrentDomicilio(data);
      setOpenEditModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // Crear nuevo domicilio
  const handleCreateDomicilio = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    setLoading(prev => ({...prev, submitting: true}));
    setError(null);

    try {
      const response = await fetch('https://videojuegoshabana.com/api/crear_domicilio/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newDomicilio)
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear domicilio');
      }

      setSuccess('Domicilio creado exitosamente');
      setOpenCreateModal(false);
      setNewDomicilio({ ubicacion: '', precio: '' });
      fetchDomicilios();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, submitting: false}));
    }
  };

  // Editar domicilio existente
  const handleEditDomicilio = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token || !currentDomicilio) return;

    setLoading(prev => ({...prev, submitting: true}));
    setError(null);

    try {
      const response = await fetch(`https://videojuegoshabana.com/api/editar_domicilio/${currentDomicilio.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ubicacion: currentDomicilio.ubicacion,
          precio: currentDomicilio.precio
        })
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al editar domicilio');
      }

      setSuccess('Domicilio actualizado exitosamente');
      setOpenEditModal(false);
      fetchDomicilios();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, submitting: false}));
    }
  };

  // Eliminar domicilio
  const handleDeleteDomicilio = async () => {
    const token = getAuthToken();
    if (!token || !currentDomicilio) return;

    try {
      const response = await fetch(`https://videojuegoshabana.com/api/eliminar_domicilio/${currentDomicilio.id}/`, {
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
        throw new Error('Error al eliminar domicilio');
      }

      setSuccess('Domicilio eliminado exitosamente');
      setOpenDeleteModal(false);
      fetchDomicilios();
    } catch (err) {
      setError(err.message);
    }
  };

  // Cargar domicilios al montar el componente
  useEffect(() => {
    fetchDomicilios();
  }, []);

  // Cerrar notificaciones
  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  // Formatear precio como moneda
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Administración de Domicilios</h1>
              <p className="text-gray-600">Gestiona las zonas de entrega y sus precios</p>
            </div>
            <button 
              onClick={() => setOpenCreateModal(true)}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <AddIcon className="text-white" />
              <span>Nuevo Domicilio</span>
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        {loading.list ? (
          <div className="bg-white rounded-2xl shadow-lg p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Cargando domicilios...</p>
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
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {domicilios.map((domicilio, index) => (
                    <tr key={domicilio.id} className={`hover:bg-orange-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">#{domicilio.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                              <LocationOnIcon className="text-orange-600" sx={{ fontSize: 20 }} />
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{domicilio.ubicacion}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
                          {formatPrice(domicilio.precio)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => fetchDomicilioDetails(domicilio.id)}
                            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => {
                              setCurrentDomicilio(domicilio);
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
            
            {domicilios.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <LocationOnIcon sx={{ fontSize: 64 }} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay domicilios configurados</h3>
                <p className="text-gray-500 mb-6">Configura tu primera zona de entrega para comenzar</p>
                <button 
                  onClick={() => setOpenCreateModal(true)}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  Crear Domicilio
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal para crear domicilio */}
        <Dialog 
          open={openCreateModal} 
          onClose={() => setOpenCreateModal(false)} 
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
            <h2 className="text-2xl font-bold text-gray-900">Crear Nuevo Domicilio</h2>
            <p className="text-gray-500 text-sm mt-1">Configura una nueva zona de entrega</p>
          </DialogTitle>
          
          <form onSubmit={handleCreateDomicilio}>
            <DialogContent className="space-y-4">
              <TextField
                label="Ubicación"
                variant="outlined"
                fullWidth
                value={newDomicilio.ubicacion}
                onChange={(e) => setNewDomicilio({ ...newDomicilio, ubicacion: e.target.value })}
                required
                margin="normal"
                placeholder="Ej: Centro, Norte, Sur..."
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
                label="Precio"
                variant="outlined"
                type="number"
                fullWidth
                value={newDomicilio.precio}
                onChange={(e) => setNewDomicilio({ ...newDomicilio, precio: e.target.value })}
                required
                margin="normal"
                placeholder="Ej: 5000"
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
                  <span>Crear Domicilio</span>
                )}
              </button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Modal para editar domicilio */}
        <Dialog 
          open={openEditModal} 
          onClose={() => setOpenEditModal(false)} 
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
            <h2 className="text-2xl font-bold text-gray-900">Editar Domicilio</h2>
            <p className="text-gray-500 text-sm mt-1">Actualiza la información del domicilio</p>
          </DialogTitle>
          
          <form onSubmit={handleEditDomicilio}>
            <DialogContent className="space-y-4">
              {currentDomicilio && (
                <>
                  <TextField
                    label="Ubicación"
                    variant="outlined"
                    fullWidth
                    value={currentDomicilio.ubicacion}
                    onChange={(e) => setCurrentDomicilio({ ...currentDomicilio, ubicacion: e.target.value })}
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
                    label="Precio"
                    variant="outlined"
                    type="number"
                    fullWidth
                    value={currentDomicilio.precio}
                    onChange={(e) => setCurrentDomicilio({ ...currentDomicilio, precio: e.target.value })}
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
                </>
              )}
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

        {/* Modal para eliminar domicilio */}
        <Dialog 
          open={openDeleteModal} 
          onClose={() => setOpenDeleteModal(false)} 
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
            <h2 className="text-2xl font-bold text-red-600">Confirmar Eliminación</h2>
            <p className="text-gray-500 text-sm mt-1">Esta acción no se puede deshacer</p>
          </DialogTitle>
          
          <DialogContent className="text-center py-6">
            {currentDomicilio && (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <DeleteIcon className="text-red-600" sx={{ fontSize: 32 }} />
                </div>
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas eliminar el domicilio en <strong>{currentDomicilio.ubicacion}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-700 text-sm">
                    Precio actual: {formatPrice(currentDomicilio.precio)}
                  </p>
                </div>
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
              onClick={handleDeleteDomicilio}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-all duration-200 flex items-center space-x-2"
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
              <span>Eliminar</span>
            </button>
          </DialogActions>
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

export default AdminDeliveryPage;