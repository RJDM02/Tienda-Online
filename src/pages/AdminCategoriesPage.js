import { useState, useEffect, useCallback  } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, 
  Snackbar, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const AdminCategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState({
    list: true,
    submitting: false,
    uploading: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // Formulario de edición
  const [editForm, setEditForm] = useState({
    nombre: '',
    imagen: null
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

  // Fetch todas las categorías
  const fetchCategories = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(prev => ({...prev, list: true}));
    setError(null);

    try {
      const response = await fetch('https://videojuegoshabana.com/api/listar_categoria/', {
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
        throw new Error('Error al cargar categorías');
      }

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, list: false}));
    }
  }, [navigate]);

  // Fetch detalles de una categoría específica
  const fetchCategoryDetails = async (id) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`https://videojuegoshabana.com/api/listar_detalle_categoria/${id}/`, {
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
        throw new Error('Error al cargar detalles de la categoría');
      }

      const data = await response.json();
      setCurrentCategory(data);
      setEditForm({
        nombre: data.nombre,
        imagen: null
      });
      setImagePreview(data.imagen);
      setImageFile(null);
      setEditModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // Manejar selección de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setEditForm(prev => ({...prev, imagen: file}));
      
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Eliminar categoría
  const handleDelete = async (id) => {
    const token = getAuthToken();
    if (!token) return;

    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      return;
    }

    try {
      const response = await fetch(`https://videojuegoshabana.com/api/eliminar_categoria/${id}/`, {
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
        throw new Error('Error al eliminar categoría');
      }

      setSuccess('Categoría eliminada correctamente');
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  // Actualizar categoría
  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token || !currentCategory) return;

    setLoading(prev => ({...prev, submitting: true}));
    setError(null);

    try {
      const formData = new FormData();
      formData.append('nombre', editForm.nombre);
      
      if (editForm.imagen) {
        formData.append('imagen', editForm.imagen);
      }

      const response = await fetch(`https://videojuegoshabana.com/api/editar_categoria/${currentCategory.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar categoría');
      }

      setSuccess('Categoría actualizada correctamente');
      setEditModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, submitting: false}));
    }
  };

  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Cerrar notificaciones
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Administración de Categorías</h1>
              <p className="text-gray-600">Gestiona las categorías de tu tienda</p>
            </div>
            <button 
              onClick={() => navigate('/crear-categoria')}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <AddIcon className="text-white" />
              <span>Crear Nueva Categoría</span>
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        {loading.list ? (
          <div className="bg-white rounded-2xl shadow-lg p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Cargando categorías...</p>
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
                      Nombre
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Imagen
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((category, index) => (
                    <tr key={category.id} className={`hover:bg-orange-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{category.nombre}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-sm">
                            <img 
                              src={category.imagen} 
                              alt={category.nombre} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/150';
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => fetchCategoryDetails(category.id)}
                            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
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
            
            {categories.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <AddIcon sx={{ fontSize: 64 }} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
                <p className="text-gray-500 mb-6">Crea tu primera categoría para comenzar</p>
                <button 
                  onClick={() => navigate('/crear-categoria')}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  Crear Categoría
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
            <h2 className="text-2xl font-bold text-gray-900">Editar Categoría</h2>
            <p className="text-gray-500 text-sm mt-1">Actualiza la información de la categoría</p>
          </DialogTitle>
          
          <form onSubmit={handleUpdate}>
            <DialogContent className="space-y-4">
              <TextField
                label="Nombre"
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
              
              <Box sx={{ mt: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="edit-category-image"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="edit-category-image">
                  <button
                    type="button"
                    onClick={() => document.getElementById('edit-category-image').click()}
                    className="w-full border-2 border-dashed border-gray-300 hover:border-[#FF6B00] rounded-xl p-6 text-center transition-all duration-200 hover:bg-orange-50"
                  >
                    <CloudUploadIcon className="text-gray-400 mb-2" sx={{ fontSize: 32 }} />
                    <p className="text-gray-600 font-medium">
                      {imageFile ? 'Cambiar imagen' : 'Seleccionar nueva imagen'}
                    </p>
                    {imageFile && (
                      <p className="text-sm text-gray-500 mt-1">
                        {imageFile.name}
                      </p>
                    )}
                  </button>
                </label>
              </Box>

              {(imagePreview || currentCategory?.imagen) && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <p className="text-sm font-medium text-gray-700 mb-3">Vista previa:</p>
                  <div className="inline-block rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
                    <img 
                      src={imagePreview || currentCategory?.imagen} 
                      alt="Preview" 
                      className="h-32 w-32 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150';
                      }}
                    />
                  </div>
                </Box>
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

export default AdminCategoriesPage;