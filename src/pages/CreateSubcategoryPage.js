import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Select, MenuItem, InputLabel, FormControl, CircularProgress, Alert, Snackbar } from '@mui/material';

import { API_URL } from '../config/apiConfig';
const CreateSubcategoryPage = () => {
  const navigate = useNavigate();
  // Estados
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState({
    categories: true,
    submitting: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Obtener token de forma segura
  const getAuthToken = useCallback(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  }, [navigate]); 
  
  // Fetch categorías con manejo de errores mejorado
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/listar_categoria/`, {
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
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, categories: false }));
      }
    };

    fetchCategories();
  }, [navigate, getAuthToken]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar envío del formulario con mejor manejo de errores
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = getAuthToken();
    if (!token) return;

    setLoading(prev => ({ ...prev, submitting: true }));
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${API_URL}/crear_subcategoria/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          categoria: formData.categoria
        })
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear subcategoría');
      }

      // Éxito - resetear formulario
      setFormData({ nombre: '', categoria: '' });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error desconocido al crear subcategoría');
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  // Cerrar notificaciones
  const handleCloseAlert = () => {
    setError(null);
    setSuccess(false);
  };

  if (loading.categories) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-orange-400">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Crear Subcategoría
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona las subcategorías de tu tienda
              </p>
            </div>
            <Button
              onClick={() => navigate('/admin-subcategoria')}
              sx={{
                backgroundColor: '#000000',
                color: '#ffffff',
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '14px',
                padding: '8px 16px',
                '&:hover': {
                  backgroundColor: '#1f2937'
                }
              }}
            >
              + Volver
            </Button>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-400">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Nombre */}
            <div>
              <TextField
                name="nombre"
                label="Nombre de la subcategoría"
                variant="outlined"
                fullWidth
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={loading.submitting}
                placeholder="Ingresa el nombre de la subcategoría"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: '#fef7ed',
                    '& fieldset': {
                      borderColor: '#e5e7eb'
                    },
                    '&:hover fieldset': {
                      borderColor: '#fb923c'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f97316',
                      borderWidth: '2px'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '14px',
                    color: '#6b7280',
                    '&.Mui-focused': {
                      color: '#f97316'
                    }
                  }
                }}
              />
            </div>

            {/* Campo Categoría */}
            <div>
              <FormControl fullWidth>
                <InputLabel 
                  id="categoria-label"
                  sx={{
                    fontSize: '14px',
                    color: '#6b7280',
                    '&.Mui-focused': {
                      color: '#f97316'
                    }
                  }}
                >
                  Categoría asociada
                </InputLabel>
                <Select
                  name="categoria"
                  labelId="categoria-label"
                  value={formData.categoria}
                  label="Categoría asociada"
                  onChange={handleChange}
                  required
                  disabled={loading.submitting}
                  sx={{
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: '#fef7ed',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e5e7eb'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#fb923c'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#f97316',
                      borderWidth: '2px'
                    }
                  }}
                >
                  <MenuItem value="" disabled>
                    Seleccione una categoría
                  </MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 rounded-full bg-orange-400 mr-3"></span>
                        {category.nombre}
                      </div>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={loading.submitting || !formData.nombre || !formData.categoria}
                sx={{
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  borderRadius: '6px',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '14px',
                  padding: '10px 20px',
                  minWidth: '140px',
                  '&:hover': {
                    backgroundColor: '#1f2937'
                  },
                  '&:disabled': {
                    backgroundColor: '#9ca3af',
                    color: '#ffffff'
                  }
                }}
              >
                {loading.submitting ? (
                  <>
                    <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                    Creando...
                  </>
                ) : (
                  'CREAR SUBCATEGORÍA'
                )}
              </Button>

              <Button
                type="button"
                onClick={() => setFormData({ nombre: '', categoria: '' })}
                disabled={loading.submitting}
                sx={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '6px',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '14px',
                  padding: '10px 20px',
                  '&:hover': {
                    backgroundColor: '#dc2626'
                  },
                  '&:disabled': {
                    backgroundColor: '#9ca3af',
                    color: '#ffffff'
                  }
                }}
              >
                Limpiar
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Notificaciones */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
          ¡Subcategoría creada exitosamente!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CreateSubcategoryPage;