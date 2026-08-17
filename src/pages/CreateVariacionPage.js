import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  InputAdornment
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import NewVariationAlert from '../components/NewVariationAlert';

import { API_BASE_URL, API_URL } from '../config/apiConfig';
const CreateVariacionPage = () => {
  const { itemId } = useParams();
  const [formData, setFormData] = useState({
    color: '',
    precio: '',
    modelo: '',
    ubicacion: '',
    punto_venta: '',
    costo: '',
    cantidad: '',
    imagen: null,
    garantia: '',
    regalo: [],
    condicion: '',
    comision: ''
  });
  const [garantias, setGarantias] = useState([]);
  const [regalos, setRegalos] = useState([]);
  const [condiciones, setCondiciones] = useState([]);
  const [puntosVenta, setPuntosVenta] = useState([]);
  const [previewImage, setPreviewImage] = useState('');
  const [loading, setLoading] = useState({
    form: false,
    initialData: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No estás autenticado');
        }

        // Obtener garantías
        const garantiaResponse = await fetch(`${API_URL}/listar_garantia/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Obtener regalos
        const regaloResponse = await fetch(`${API_URL}/listar_regalo/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Obtener condiciones
        const condicionResponse = await fetch(`${API_URL}/listar_condicion/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Obtener puntos de venta
        const puntoVentaResponse = await fetch(`${API_URL}/listar_punto_venta/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!garantiaResponse.ok || !regaloResponse.ok || !condicionResponse.ok) {
          throw new Error('Error al obtener datos iniciales');
        }

        const garantiaData = await garantiaResponse.json();
        const regaloData = await regaloResponse.json();
        const condicionData = await condicionResponse.json();

        setGarantias(garantiaData);
        setRegalos(regaloData);
        setCondiciones(condicionData);
        if (puntoVentaResponse.ok) {
          setPuntosVenta(await puntoVentaResponse.json());
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(prev => ({...prev, initialData: false}));
      }
    };

    fetchInitialData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'regalo' ? value : value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        imagen: file
      }));
      
      // Crear URL de vista previa
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(prev => ({...prev, form: true}));
      setError('');
      setSuccess(false);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No estás autenticado');
      }

      // Validaciones
      if (!formData.color || !formData.precio || !formData.modelo || !formData.cantidad || !formData.condicion) {
        throw new Error('Todos los campos requeridos deben ser completados');
      }

      if (parseFloat(formData.precio) <= 0 || parseInt(formData.cantidad) < 0 || parseFloat(formData.comision) < 0) {
        throw new Error('Los valores numéricos deben ser positivos');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('item', itemId);
      formDataToSend.append('color', formData.color);
      formDataToSend.append('precio', formData.precio);
      formDataToSend.append('modelo', formData.modelo);
      formDataToSend.append('ubicacion', formData.ubicacion);
      if (formData.punto_venta) {
        formDataToSend.append('punto_venta', formData.punto_venta);
      }
      formDataToSend.append('costo', formData.costo);
      formDataToSend.append('cantidad', formData.cantidad);
      formDataToSend.append('condicion', formData.condicion);
      formDataToSend.append('comision', formData.comision || '0.00');
      
      // Agregar garantía y regalo solo si tienen valor
      if (formData.garantia) {
        formDataToSend.append('garantia', formData.garantia);
      }
      
      if (formData.regalo && formData.regalo.length) {
        formData.regalo.forEach((id) => formDataToSend.append('regalo', id));
      }
      
      if (formData.imagen) {
        formDataToSend.append('imagen', formData.imagen);
      }

      const response = await fetch(`${API_URL}/crear_variacion_item/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la variación');
      }
      await NewVariationAlert.sendNewVariationNotification({
        color: formData.color,
        modelo: formData.modelo,
        precio: formData.precio,
        comision: formData.comision,
        url: `${API_BASE_URL}/product/${itemId}`
      });
      setSuccess(true);
      
      // Resetear formulario
      setFormData({
        color: '',
        precio: '',
        modelo: '',
        ubicacion: '',
        punto_venta: '',
        costo: '',
        cantidad: '',
        imagen: null,
        garantia: '',
        regalo: [],
        condicion: '',
        comision: ''
      });
      setPreviewImage('');
      
      setTimeout(() => {
        navigate(`/admin-variacion/${itemId}`);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, form: false}));
    }
  };

  const handleClear = () => {
    setFormData({
      color: '',
      precio: '',
      modelo: '',
      ubicacion: '',
      punto_venta: '',
      costo: '',
      cantidad: '',
      imagen: null,
      garantia: '',
      regalo: [],
      condicion: '',
      comision: ''
    });
    setPreviewImage('');
  };

  const handleCloseAlert = () => {
    setError('');
    setSuccess(false);
  };

  const textFieldStyles = {
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
  };

  const selectStyles = {
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
  };

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-orange-400">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Crear Nueva Variación
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona las variaciones de tu producto
              </p>
            </div>
            <Button
              onClick={() => navigate(`/admin-variacion/${itemId}`)}
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
              ← Volver
            </Button>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-400">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Información de la Variación
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Color"
                  variant="outlined"
                  fullWidth
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  required
                  disabled={loading.form || loading.initialData}
                  placeholder="Ingresa el color"
                  sx={textFieldStyles}
                />
                
                <TextField
                  label="Modelo"
                  variant="outlined"
                  fullWidth
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  required
                  disabled={loading.form || loading.initialData}
                  placeholder="Ingresa el modelo"
                  sx={textFieldStyles}
                />

                <TextField
                  label="Ubicacion"
                  variant="outlined"
                  fullWidth
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  disabled={loading.form || loading.initialData}
                  placeholder="Ej: Rojo, vitrina 1, caja A"
                  sx={textFieldStyles}
                />

                <TextField
                  select
                  label="Punto de Venta (opcional)"
                  variant="outlined"
                  fullWidth
                  name="punto_venta"
                  value={formData.punto_venta}
                  onChange={handleChange}
                  disabled={loading.form || loading.initialData}
                  helperText="Si no se asigna, la variación se considera en la Sede Principal"
                  sx={textFieldStyles}
                >
                  <MenuItem value="">Sede Principal</MenuItem>
                  {puntosVenta.map((pv) => (
                    <MenuItem key={pv.id} value={pv.id}>{pv.nombre}</MenuItem>
                  ))}
                </TextField>
              </div>
            </div>

            {/* Información de Precios y Stock */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Precios y Stock
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextField
                  label="Precio"
                  variant="outlined"
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: "0.01" }}
                  required
                  disabled={loading.form || loading.initialData}
                  sx={textFieldStyles}
                />
                
                <TextField
                  label="Cantidad en Stock"
                  variant="outlined"
                  type="number"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                  required
                  disabled={loading.form || loading.initialData}
                  sx={textFieldStyles}
                />
                
                <TextField
                  label="Costo"
                  variant="outlined"
                  type="number"
                  name="costo"
                  value={formData.costo}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: "0.01" }}
                  disabled={loading.form || loading.initialData}
                  sx={textFieldStyles}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Comisión"
                  variant="outlined"
                  type="number"
                  name="comision"
                  value={formData.comision}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: "0.01" }}
                  disabled={loading.form || loading.initialData}
                  sx={textFieldStyles}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  placeholder="0.00"
                />

                <FormControl fullWidth>
                  <InputLabel sx={{ fontSize: '14px', color: '#6b7280', '&.Mui-focused': { color: '#f97316' } }}>
                    Condición *
                  </InputLabel>
                  <Select
                    name="condicion"
                    value={formData.condicion}
                    onChange={handleChange}
                    required
                    disabled={loading.form || loading.initialData}
                    sx={selectStyles}
                  >
                    {condiciones.map(condicion => (
                      <MenuItem key={condicion.id} value={condicion.id}>
                        {condicion.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* Garantía y Regalo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Garantía y Regalo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormControl fullWidth>
                  <InputLabel sx={{ fontSize: '14px', color: '#6b7280', '&.Mui-focused': { color: '#f97316' } }}>
                    Garantía
                  </InputLabel>
                  <Select
                    name="garantia"
                    value={formData.garantia}
                    onChange={handleChange}
                    disabled={loading.form || loading.initialData}
                    sx={selectStyles}
                  >
                    <MenuItem value="">
                      <em>Ninguna</em>
                    </MenuItem>
                    {garantias.map(garantia => (
                      <MenuItem key={garantia.id} value={garantia.id}>
                        {garantia.tiempo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel sx={{ fontSize: '14px', color: '#6b7280', '&.Mui-focused': { color: '#f97316' } }}>
                    Regalo
                  </InputLabel>
                  <Select
                    name="regalo"
                    multiple
                    value={formData.regalo}
                    onChange={handleChange}
                    disabled={loading.form || loading.initialData}
                    renderValue={(selected) => selected.map((id) => regalos.find(r => r.id === id)?.nombre || id).join(', ')}
                    sx={selectStyles}
                  >
                    {regalos.map(regalo => (
                      <MenuItem key={regalo.id} value={regalo.id}>
                        {regalo.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* Imagen de la Variación */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Imagen de la Variación
              </h3>
              
              <Box className="space-y-4">
                <div>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="variation-image"
                    type="file"
                    onChange={handleImageChange}
                    disabled={loading.form || loading.initialData}
                  />
                  <label htmlFor="variation-image">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      disabled={loading.form || loading.initialData}
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
                
                {previewImage && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-sm text-gray-600 mb-3 font-medium">Vista previa:</p>
                    <div className="flex justify-center">
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="max-h-48 rounded-lg border-2 border-orange-300 shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </Box>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-6">
              <Button
                type="submit"
                disabled={loading.form || loading.initialData || !formData.color || !formData.modelo || !formData.precio || !formData.cantidad || !formData.condicion}
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
                {loading.form ? (
                  <>
                    <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                    Creando...
                  </>
                ) : (
                  'CREAR VARIACIÓN'
                )}
              </Button>

              <Button
                type="button"
                onClick={handleClear}
                disabled={loading.form || loading.initialData}
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
          ¡Variación creada exitosamente!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CreateVariacionPage;
