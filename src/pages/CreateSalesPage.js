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
  Chip
} from '@mui/material';
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useCart } from '../context/CartContext';
import AdminNotifier from '../components/AdminNotifier';
import { styles, LoadingState, ErrorState, SectionTitle } from './CreateSalesPageStyles';

const CreateSalesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const [currencies, setCurrencies] = useState([]);
  const [deliveryPoints, setDeliveryPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [processedItems, setProcessedItems] = useState(0);
  
  // Obtener los items del carrito y el código de referido
  const cartItems = location.state?.cartItems || [];
  const referralCodeFromCart = location.state?.referralCode || '';

  const [formData, setFormData] = useState({
    deliveryDateTime: new Date(),
    referencePoint: '',
    note: '',
    currencyId: '',
    deliveryPointId: '',
    clientName: '',
    clientPhone: '',
    managerPrice: '',
    referidoId: referralCodeFromCart // ← USAR EL CÓDIGO DEL CARRITO
  });
  
  const [currentUser, setCurrentUser] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
        setIsManager(decoded.rol === 'Gestor de Venta');
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('authToken');
      }
    }

    // También verificar si hay código de referido en la URL por si acaso
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    
    // Priorizar el código de la URL sobre el del carrito
    if (refParam && !formData.referidoId) {
      setFormData(prev => ({
        ...prev,
        referidoId: refParam
      }));
    }

    const fetchData = async () => {
      try {
        const [currenciesResponse, deliveryPointsResponse] = await Promise.all([
          axios.get('https://videojuegoshabana.com/api/listar_moneda/'),
          axios.get('https://videojuegoshabana.com/api/listar_domicilio/')
        ]);
        
        setCurrencies(currenciesResponse.data);
        setDeliveryPoints(deliveryPointsResponse.data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los datos. Intente nuevamente.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

      // Obtener información adicional para la notificación
      const selectedCurrency = currencies.find(c => c.id === parseInt(formData.currencyId));
      const selectedDeliveryPoint = deliveryPoints.find(d => d.id === parseInt(formData.deliveryPointId));
      
      // Preparar datos para la notificación
      const notificationData = {
        cartItems: cartItems,
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        currencyName: selectedCurrency ? selectedCurrency.nombre : 'No especificada',
        currencyRate: selectedCurrency ? selectedCurrency.cambio : 'N/A',
        deliveryLocation: selectedDeliveryPoint ? selectedDeliveryPoint.ubicacion : 'No especificado',
        deliveryPrice: selectedDeliveryPoint ? selectedDeliveryPoint.precio : 'N/A',
        deliveryDateTime: formData.deliveryDateTime,
        referencePoint: formData.referencePoint,
        note: formData.note,
        referidoId: formData.referidoId, // Incluir código de referido en la notificación
        currentUser: currentUser
      };

      // Procesar cada item del carrito
      const requests = cartItems.map((item) => {
        const salesData = {
          moneda_id: formData.currencyId,
          domicilio_id: formData.deliveryPointId,
          horario_deseado_entrega: formData.deliveryDateTime.toISOString(),
          punto_referencia: formData.referencePoint,
          nota: formData.note,
          cantidad: 1 // Siempre 1 porque cada item es una unidad
        };

        // Agregar referido_id solo si se proporcionó
        if (formData.referidoId && formData.referidoId.trim() !== '') {
          salesData.referido_id = formData.referidoId.trim();
        }

        if (isManager) {
          salesData.gestor_id = currentUser.user_id;
          salesData.precio_gestor = parseFloat(formData.managerPrice) || 0;
          salesData.nombre_cliente = formData.clientName;
          salesData.telefono_cliente = formData.clientPhone;
        } else if (token) {
          salesData.cliente_id = currentUser.user_id;
        } else {
          salesData.nombre_cliente = formData.clientName;
          salesData.telefono_cliente = formData.clientPhone;
        }

        if (item.isVariation) {
          salesData.variacion_id = item.variationId;
        } else {
          salesData.producto_id = item.id;
        }

        return axios.post('https://videojuegoshabana.com/api/crear_venta/', salesData, config)
          .then(() => {
            setProcessedItems(prev => prev + 1);
          });
      });

      await Promise.all(requests);
      
      // Éxito: vaciar carrito, mostrar mensaje y limpiar códigos de referido
      clearCart();
      localStorage.removeItem('referralCode'); // Limpiar el código después de usarlo
      setSuccess(true);
      setOpenSnackbar(true);
      
      // Enviar notificación a administradores
      try {
        await AdminNotifier.sendNewSaleNotification(notificationData);
      } catch (emailError) {
        console.error('Error al enviar notificaciones:', emailError);
      }
      
      setTimeout(() => {
        navigate('/shop', { state: { success: true } });
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 
              error.message || 
              'Error al procesar la venta. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    return <ErrorState error={error} onReload={handleReload} />;
  }

  return (
    <Box sx={styles.container}>
      <Box sx={styles.contentContainer}>
        {/* Header */}
        <Box sx={styles.header}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h1" sx={styles.headerTitle}>
                Finalizar Compra
              </Typography>
              <Typography sx={styles.headerSubtitle}>
                Por favor, complete los datos para finalizar la compra.
              </Typography>
            </Box>
            <Button
              onClick={() => navigate('/shop')}
              sx={styles.backButton}
            >
              + Volver
            </Button>
          </Box>
        </Box>

        {/* Formulario */}
        <Box sx={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            {/* Datos del Cliente */}
            {(isManager || !currentUser) && (
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
                      sx={styles.textField}
                    />
                  </Grid>
                </Grid>
                {isManager && (
                  <Grid item xs={12} sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label="Precio del Gestor"
                      name="managerPrice"
                      value={formData.managerPrice}
                      onChange={handleChange}
                      required
                      type="number"
                      inputProps={{ step: "0.01" }}
                      helperText="Ingrese el precio acordado con el cliente"
                      sx={styles.textField}
                    />
                  </Grid>
                )}
                <Divider sx={{ my: 2 }} />
              </Box>
            )}

            {/* Código de Referido */}
            <Box sx={{ mb: 3 }}>
              <SectionTitle>Código de Referido</SectionTitle>
              <TextField
                fullWidth
                label="Código de Referido"
                name="referidoId"
                value={formData.referidoId}
                onChange={handleChange}
                placeholder="Ej: H82BDA"
                helperText={formData.referidoId ? 
                  "Código de referido detectado automáticamente" : 
                  "Si alguien te refirió a nuestra tienda, ingresa su código aquí"
                }
                sx={styles.textField}
                inputProps={{
                  maxLength: 6,
                  pattern: "[A-Z0-9]{6}",
                  title: "El código debe tener 6 caracteres alfanuméricos en mayúsculas"
                }}
              />
              {formData.referidoId ? (
                <Chip
                  label="Código detectado automáticamente"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              ) : (
                <Chip
                  label="Este campo es opcional"
                  size="small"
                  color="info"
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
            <Divider sx={{ my: 2 }} />

            {/* Datos de la Compra */}
            <Box>
              <SectionTitle>Datos de la Compra</SectionTitle>
              <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                Estás comprando {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
              </Typography>

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
                  {currencies.map(currency => (
                    <MenuItem key={currency.id} value={currency.id}>
                      {currency.nombre} (Cambio: {currency.cambio})
                    </MenuItem>
                  ))}
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
                  success ? 'Compra Exitosa!' : 'Confirmar Compra'
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
          ¡Compra realizada con éxito! Redirigiendo...
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateSalesPage;