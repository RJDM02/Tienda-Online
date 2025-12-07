import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  CircularProgress, 
  Alert, 
  Snackbar, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import { API_URL } from '../config/apiConfig';
const normalizeOrdenValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
};

const compareNullableNumbers = (a, b) => {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
};

const AdminSubcategoriesPage = () => {
  const navigate = useNavigate();
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState({
    list: true,
    submitting: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentSubcategory, setCurrentSubcategory] = useState(null);
  
  // Formulario de edición
  const [editForm, setEditForm] = useState({
    nombre: '',
    categoria: '',
    orden: ''
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

  // Fetch todas las subcategorías y categorías
  const fetchData = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(prev => ({...prev, list: true}));
    setError(null);

    try {
      // Obtener categorías
      const categoriesResponse = await fetch(`${API_URL}/listar_categoria/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (categoriesResponse.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!categoriesResponse.ok) {
        throw new Error('Error al cargar categorías');
      }

      const categoriesData = await categoriesResponse.json();
      const sortedCategories = [...categoriesData].sort((a, b) =>
        compareNullableNumbers(normalizeOrdenValue(a.orden), normalizeOrdenValue(b.orden))
      );
      setCategories(sortedCategories);

      // Obtener subcategorías
      const subcategoriesResponse = await fetch(`${API_URL}/listar_subcategoria/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (subcategoriesResponse.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!subcategoriesResponse.ok) {
        throw new Error('Error al cargar subcategorías');
      }

      const subcategoriesData = await subcategoriesResponse.json();
      const sortedSubcategories = [...subcategoriesData].sort((a, b) => {
        const aCategoryOrden = normalizeOrdenValue(a.categoria?.orden);
        const bCategoryOrden = normalizeOrdenValue(b.categoria?.orden);
        const categoryOrderComparison = compareNullableNumbers(aCategoryOrden, bCategoryOrden);
        if (categoryOrderComparison !== 0) {
          return categoryOrderComparison;
        }

        const categoryNameComparison = (a.categoria?.nombre || '').localeCompare(
          b.categoria?.nombre || '',
          undefined,
          { sensitivity: 'base' }
        );
        if (categoryNameComparison !== 0) {
          return categoryNameComparison;
        }

        const aOrden = normalizeOrdenValue(a.orden);
        const bOrden = normalizeOrdenValue(b.orden);
        const subcategoryOrderComparison = compareNullableNumbers(aOrden, bOrden);
        if (subcategoryOrderComparison !== 0) {
          return subcategoryOrderComparison;
        }

        const nameComparison = (a.nombre || '').localeCompare(b.nombre || '', undefined, { sensitivity: 'base' });
        if (nameComparison !== 0) {
          return nameComparison;
        }

        return (a.id || 0) - (b.id || 0);
      });
      setSubcategories(sortedSubcategories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, list: false}));
    }
  };

  // Fetch detalles de una subcategoría específica
  const fetchSubcategoryDetails = async (id) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/listar_detalle_subcategoria/${id}/`, {
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
        throw new Error('Error al cargar detalles de la subcategoría');
      }

      const data = await response.json();
      setCurrentSubcategory(data);
      const ordenValue = normalizeOrdenValue(data.orden);
      setEditForm({
        nombre: data.nombre,
        categoria: data.categoria.id,
        orden: ordenValue === null ? '' : ordenValue
      });
      setEditModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // Eliminar subcategoría
  const handleDelete = async (id) => {
    const token = getAuthToken();
    if (!token) return;

    if (!window.confirm('¿Estás seguro de eliminar esta subcategoría?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/eliminar_subcategoria/${id}/`, {
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
        throw new Error('Error al eliminar subcategoría');
      }

      setSuccess('Subcategoría eliminada correctamente');
      fetchData(); // Refrescar la lista
    } catch (err) {
      setError(err.message);
    }
  };

  // Actualizar subcategoría
  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token || !currentSubcategory) return;

    setLoading(prev => ({...prev, submitting: true}));
    setError(null);

    try {
      const ordenPayload = editForm.orden === '' ? null : Number(editForm.orden);
      const response = await fetch(`${API_URL}/editar_subcategoria/${currentSubcategory.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: editForm.nombre,
          categoria: editForm.categoria,
          orden: Number.isNaN(ordenPayload) ? null : ordenPayload
        })
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar subcategoría');
      }

      setSuccess('Subcategoría actualizada correctamente');
      setEditModalOpen(false);
      fetchData(); // Refrescar la lista
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, submitting: false}));
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Administración de Subcategorías</h1>
              <p className="text-gray-600">Gestiona las subcategorías de tu tienda</p>
            </div>
            <button 
              onClick={() => navigate('/crear-subcategoria')}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <AddIcon className="text-white" />
              <span>Crear Nueva Subcategoría</span>
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        {loading.list ? (
          <div className="bg-white rounded-2xl shadow-lg p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Cargando subcategorías...</p>
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
                      Categoría
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subcategories.map((subcategory, index) => (
                    <tr key={subcategory.id} className={`hover:bg-orange-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{subcategory.nombre}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FF6B00] bg-opacity-10 text-[#FF6B00] border border-[#FF6B00] border-opacity-20">
                          {subcategory.categoria.nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => fetchSubcategoryDetails(subcategory.id)}
                            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDelete(subcategory.id)}
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
            
            {subcategories.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <AddIcon sx={{ fontSize: 64 }} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay subcategorías</h3>
                <p className="text-gray-500 mb-6">Crea tu primera subcategoría para comenzar</p>
                <button 
                  onClick={() => navigate('/crear-subcategoria')}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  Crear Subcategoría
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
            <h2 className="text-2xl font-bold text-gray-900">Editar Subcategoría</h2>
            <p className="text-gray-500 text-sm mt-1">Actualiza la información de la subcategoría</p>
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
              <TextField
                label="Orden"
                variant="outlined"
                fullWidth
                type="number"
                value={editForm.orden === '' ? '' : editForm.orden}
                onChange={(e) => {
                  const { value } = e.target;
                  if (value === '') {
                    setEditForm(prev => ({ ...prev, orden: '' }));
                    return;
                  }

                  const numericValue = Number(value);
                  if (!Number.isNaN(numericValue)) {
                    setEditForm(prev => ({ ...prev, orden: numericValue }));
                  }
                }}
                margin="normal"
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                helperText="Solo numeros; deja vacio para enviar la subcategoria al final."
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
              
              <FormControl fullWidth margin="normal">
                <InputLabel 
                  id="categoria-label"
                  sx={{
                    '&.Mui-focused': {
                      color: '#FF6B00',
                    },
                  }}
                >
                  Categoría
                </InputLabel>
                <Select
                  labelId="categoria-label"
                  value={editForm.categoria}
                  label="Categoría"
                  onChange={(e) => setEditForm({...editForm, categoria: e.target.value})}
                  required
                  sx={{
                    borderRadius: '12px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FF6B00',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FF6B00',
                    },
                  }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

export default AdminSubcategoriesPage;
