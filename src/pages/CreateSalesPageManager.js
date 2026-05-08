import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useCart } from '../context/CartContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styles, LoadingState, ErrorState, SectionTitle } from './CreateSalesPageStyles';
import AdminNotifier2 from '../components/AdminNotifier2';

import { API_URL } from '../config/apiConfig';

const parseErrorMessage = (error) => {
  const status = error.response?.status;
  if (status === 500) return `Error ${status}`;
  const prod = error.response?.data?.producto;
  const vari = error.response?.data?.variacion;
  const disponible = error.response?.data?.disponible;
  const solicitada = error.response?.data?.solicitada;
  if (prod || vari) {
    return `${error.response?.data?.error || 'Error'} (${prod || vari} - disponible ${disponible ?? '0'}, solicitada ${solicitada ?? '1'})`;
  }
  return (
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    'Error al procesar la venta. Intente nuevamente.'
  );
};
const CreateSalesPageManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const [currencies, setCurrencies] = useState([]);
  const [deliveryPoints, setDeliveryPoints] = useState([]);
  const [warranties, setWarranties] = useState([]); // Nuevo estado para garantías
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [processedItems, setProcessedItems] = useState(0);
  
  // Obtener los items del carrito
  const cartItems = location.state?.cartItems || [];
  
  // Estado para los precios personalizados de cada producto
  const [productPrices, setProductPrices] = useState({});
  
  const [formData, setFormData] = useState({
    deliveryDateTime: new Date(),
    referencePoint: '',
    note: '',
    currencyId: '',
    deliveryPointId: '',
    clientName: '',
    clientPhone: '',
    warrantyId: '', // Nuevo campo para la garantía
  });
  
  const [currentUser, setCurrentUser] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
        
        // Verificar que el usuario es realmente un Gestor de Venta
        if (decoded.rol !== 'Gestor de Venta') {
          navigate('/unauthorized');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('authToken');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }

    // Inicializar precios con el precio final que llega desde el carrito
    const initialPrices = {};
    cartItems.forEach(item => {
      initialPrices[item.id] = item.price;
    });
    setProductPrices(initialPrices);

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const config = token ? {
          headers: { 'Authorization': `Bearer ${token}` }
        } : {};
        
        const [currenciesResponse, deliveryPointsResponse, warrantiesResponse] = await Promise.all([
          axios.get(`${API_URL}/listar_moneda/`),
          axios.get(`${API_URL}/listar_domicilio/`),
          axios.get(`${API_URL}/listar_garantia/`, config) // Nueva llamada para garantías
        ]);
        
        setCurrencies(currenciesResponse.data);
        setDeliveryPoints(deliveryPointsResponse.data);
        setWarranties(warrantiesResponse.data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los datos. Intente nuevamente.');
        setLoading(false);
      }
    };

    fetchData();
  }, [cartItems, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setProcessedItems(0);

    try {
      const token = localStorage.getItem('authToken');
      const config = token ? {
        headers: { 'Authorization': `Bearer ${token}` }
      } : {};

      // Obtener información adicional
      const selectedCurrency = currencies.find(c => c.id === parseInt(formData.currencyId));
      const selectedDeliveryPoint = deliveryPoints.find(d => d.id === parseInt(formData.deliveryPointId));

      // Procesar cada item del carrito
      const requests = cartItems.map((item) => {
        const salesData = {
          moneda_id: formData.currencyId,
          domicilio_id: formData.deliveryPointId,
          horario_deseado_entrega: formData.deliveryDateTime.toISOString(),
          punto_referencia: formData.referencePoint,
          nota: formData.note,
          cantidad: 1,
          gestor_id: currentUser.user_id,
          precio_gestor: parseFloat(productPrices[item.id]) || 0,
          nombre_cliente: formData.clientName,
          telefono_cliente: formData.clientPhone,
          garantia_gestor: formData.warrantyId || null, // Nuevo campo garantía
        };

        if (item.isVariation) {
          salesData.variacion_id = item.variationId;
        } else {
          salesData.producto_id = item.id;
        }

        return axios.post(`${API_URL}/crear_venta/`, salesData, config)
          .then(() => {
            setProcessedItems(prev => prev + 1);
          });
      });

      await Promise.all(requests);
      
      // Éxito: vaciar carrito y mostrar mensaje
      clearCart();
      setSuccess(true);
      setOpenSnackbar(true);
      
      // Preparar datos para la notificación (SIMPLIFICADO)
      const notificationData = {
        cartItems: cartItems,
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        managerPrice: productPrices,
        currencyName: selectedCurrency ? selectedCurrency.nombre : 'No especificada',
        currencyRate: selectedCurrency ? selectedCurrency.cambio : 'N/A',
        deliveryLocation: selectedDeliveryPoint ? selectedDeliveryPoint.ubicacion : 'No especificado',
        deliveryPrice: selectedDeliveryPoint ? selectedDeliveryPoint.precio : 'N/A',
        deliveryDateTime: formData.deliveryDateTime,
        referencePoint: formData.referencePoint,
        note: formData.note,
        warranty: formData.warrantyId ? warranties.find(w => w.id === parseInt(formData.warrantyId))?.tiempo : 'Ninguna' // Incluir garantía en notificación
      };

      // Enviar notificación
      try {
        await AdminNotifier2.sendNewSaleNotification(notificationData, 'gestor');
      } catch (emailError) {
        console.error('Error al enviar notificaciones:', emailError);
      }
      
      setTimeout(() => {
        navigate('/shop', { state: { success: true } });
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      setError(parseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'clientPhone') {
      const digitsOnly = /^[0-9]*$/;
      setPhoneError(digitsOnly.test(value) ? '' : 'Usted es más cubano que el café hola quita el +53 ese anda');
      setFormData(prev => ({ ...prev, clientPhone: value }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (itemId, newPrice) => {
    setProductPrices(prev => ({
      ...prev,
      [itemId]: newPrice
    }));
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    const goShop = () => navigate('/shop');
    return <ErrorState error={error} onGoShop={goShop} onReload={handleReload} />;
  }

  return (
    <Box sx={styles.container}>
      <Box sx={styles.contentContainer}>
        {/* Header */}
        <Box sx={styles.header}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <IconButton onClick={() => navigate('/shop')} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h1" sx={styles.headerTitle}>
                  Venta Gestor
                </Typography>
                <Typography sx={styles.headerSubtitle}>
                  Complete los datos y establezca precios para cada producto.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Formulario */}
        <Box sx={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            {/* Datos del Cliente */}
            <Box sx={{ mb: 3 }}>
              <SectionTitle>Datos del Cliente</SectionTitle>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre Completo"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    required
                    sx={styles.textField}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleChange}
                    required
                    type="tel"
                    error={Boolean(phoneError)}
                    helperText={phoneError || ' '}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    sx={styles.textField}
                  />
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
            </Box>

            {/* Productos con precios personalizados */}
            <Box sx={{ mb: 3 }}>
              <SectionTitle>Productos y Precios</SectionTitle>
              <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                Establezca el precio para cada producto:
              </Typography>

              {cartItems.map((item, index) => (
                <Card key={item.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" gutterBottom>
                          {item.productData?.nombre || 'Producto'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Precio final sugerido: ${item.price}
                          {item.color && ` | Color: ${item.color}`}
                          {item.model && ` | Modelo: ${item.model}`}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Precio del Gestor"
                          type="number"
                          inputProps={{ 
                            step: "0.01",
                            min: "0"
                          }}
                          value={productPrices[item.id] || ''}
                          onChange={(e) => handlePriceChange(item.id, e.target.value)}
                          required
                          sx={styles.textField}
                          helperText="Precio acordado con el cliente"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
              <Divider sx={{ my: 2 }} />
            </Box>

            {/* Datos de la Compra */}
            <Box>
              <SectionTitle>Datos de Entrega</SectionTitle>

              <FormControl fullWidth sx={{ mb: 3 }} required>
                <InputLabel sx={styles.selectLabel}>Moneda</InputLabel>
                <Select
                  name="currencyId"
                  value={formData.currencyId}
                  label="Moneda"
                  onChange={handleChange}
                  required
                  sx={styles.select}
                >
                  {currencies
                    .filter(currency => currency.cambio > 0) // ← FILTRO AQUÍ
                    .map(currency => (
                      <MenuItem key={currency.id} value={currency.id}>
                        {currency.nombre} (Cambio: {currency.cambio})
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>

              {/* Punto de entrega (domicilio) */}
              <FormControl fullWidth sx={{ mb: 3 }} required>
                <InputLabel sx={styles.selectLabel}>Punto de Entrega</InputLabel>
                <Select
                  name="deliveryPointId"
                  value={formData.deliveryPointId}
                  label="Punto de Entrega"
                  onChange={handleChange}
                  required
                  sx={styles.select}
                >
                  {deliveryPoints.map(deliveryPoint => (
                    <MenuItem key={deliveryPoint.id} value={deliveryPoint.id}>
                      {deliveryPoint.ubicacion} - {deliveryPoint.precio}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Nuevo selector de garantía */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={styles.selectLabel}>Garantía (opcional)</InputLabel>
                <Select
                  name="warrantyId"
                  value={formData.warrantyId}
                  label="Garantía (opcional)"
                  onChange={handleChange}
                  sx={styles.select}
                >
                  <MenuItem value="">
                    <em>Ninguna</em>
                  </MenuItem>
                  {warranties.map(warranty => (
                    <MenuItem key={warranty.id} value={warranty.id}>
                      {warranty.tiempo} días
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Fecha de entrega"
                      value={formData.deliveryDateTime}
                      onChange={(newValue) => 
                        setFormData(prev => ({ ...prev, deliveryDateTime: newValue }))
                      }
                      minDate={new Date()}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          fullWidth 
                          required 
                          sx={styles.textField}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TimePicker
                      label="Hora de entrega"
                      value={formData.deliveryDateTime}
                      onChange={(newValue) => 
                        setFormData(prev => ({ ...prev, deliveryDateTime: newValue }))
                      }
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          fullWidth 
                          required 
                          sx={styles.textField}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </LocalizationProvider>

              {/* Punto de referencia (dirección + referencia) */}
              <TextField
                fullWidth
                label="Punto de referencia (Dirección exacta y referencias)"
                name="referencePoint"
                value={formData.referencePoint}
                onChange={handleChange}
                required
                multiline
                rows={4}
                sx={styles.textField}
                helperText="Por favor indique la dirección exacta y puntos de referencia para la entrega"
              />

              <TextField
                fullWidth
                label="Notas adicionales (opcional)"
                name="note"
                value={formData.note}
                onChange={handleChange}
                multiline
                rows={4}
                sx={styles.textField}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={submitting || success}
                sx={styles.submitButton}
              >
                {submitting ? (
                  <Box display="flex" alignItems="center">
                    <CircularProgress size={24} color="inherit" />
                    <Typography sx={{ ml: 1 }}>
                      Procesando {processedItems}/{cartItems.length}...
                    </Typography>
                  </Box>
                ) : (
                  success ? 'Venta Exitosa!' : 'Confirmar Venta'
                )}
              </Button>

              {submitting && (
                <Box sx={styles.progressContainer}>
                  <Typography variant="body2" color="text.secondary">
                    Progreso: {processedItems} de {cartItems.length} productos procesados
                  </Typography>
                </Box>
              )}
            </Box>
          </form>
        </Box>
      </Box>

      {/* Notificaciones */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          ¡Venta realizada con éxito! Redirigiendo...
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateSalesPageManager;
