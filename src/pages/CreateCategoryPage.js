import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, CircularProgress, Alert, Snackbar, Box } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const CreateCategoryPage = () => {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!name || !image) {
      setError('Nombre e imagen son requeridos');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No estás autenticado');
      }

      const formData = new FormData();
      formData.append('nombre', name);
      formData.append('imagen', image);

      const response = await fetch('https://videojuegoshabana.com/api/crear_categoria/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear categoría');
      }

      // Éxito - resetear formulario
      setName('');
      setImage(null);
      setPreview('');
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setName('');
    setImage(null);
    setPreview('');
  };

  const handleCloseAlert = () => {
    setError('');
    setSuccess(false);
  };

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-orange-400">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Crear Categoría
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona las categorías de tu tienda
              </p>
            </div>
            <Button
              onClick={() => navigate('/admin-categoria')}
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
                label="Nombre de la categoría"
                variant="outlined"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                placeholder="Ingresa el nombre de la categoría"
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

            {/* Campo Imagen */}
            <div>
              <Box className="space-y-4">
                <div>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="category-image"
                    type="file"
                    onChange={handleImageChange}
                    disabled={loading}
                  />
                  <label htmlFor="category-image">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      disabled={loading}
                      sx={{
                        backgroundColor: '#f97316',
                        color: '#ffffff',
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '14px',
                        padding: '10px 20px',
                        '&:hover': {
                          backgroundColor: '#ea580c'
                        },
                        '&:disabled': {
                          backgroundColor: '#9ca3af',
                          color: '#ffffff'
                        }
                      }}
                    >
                      Seleccionar Imagen
                    </Button>
                  </label>
                </div>
                
                {preview && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-sm text-gray-600 mb-3 font-medium">Vista previa:</p>
                    <div className="flex justify-center">
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="max-h-48 rounded-lg border-2 border-orange-300 shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </Box>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !name || !image}
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
                {loading ? (
                  <>
                    <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                    Creando...
                  </>
                ) : (
                  'CREAR CATEGORÍA'
                )}
              </Button>

              <Button
                type="button"
                onClick={handleClear}
                disabled={loading}
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
          ¡Categoría creada exitosamente!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CreateCategoryPage;