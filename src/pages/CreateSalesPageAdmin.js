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
  RadioGroup,
  FormControlLabel,
  Radio,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
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

const CreateAdminSalesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [currencies, setCurrencies] = useState([]);
  const [deliveryPoints, setDeliveryPoints] = useState([]);
  const [messengers, setMessengers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [processedItems, setProcessedItems] = useState(0);
  
  // Obtener los items del carrito desde la navegación
  const cartItems = location.state?.cartItems || [];
  
  const [formData, setFormData] = useState({
    deliveryDateTime: new Date(),
    referencePoint: '',
    note: '',
    currencyId: '',
    deliveryPointId: '',
    messengerId: '',
    discount: 0,
    clientType: 'registered', // 'registered' or 'unregistered'
    clientId: '',
    clientName: '',
    clientPhone: ''
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
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('authToken');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const config = token ? {
          headers: { 'Authorization': `Bearer ${token}` }
        } : {};
        
        const [
          currenciesResponse, 
          deliveryPointsResponse, 
          messengersResponse, 
          clientsResponse
        ] = await Promise.all([
          axios.get(`${API_URL}/listar_moneda/`, config),
          axios.get(`${API_URL}/listar_domicilio/`, config),
          axios.get(`${API_URL}/listar_mensajero/`, config),
          axios.get(`${API_URL}/listar_cliente_all/`, config)
        ]);
        
        setCurrencies(currenciesResponse.data);
        setDeliveryPoints(deliveryPointsResponse.data);
        setMessengers(messengersResponse.data);
        
        // Ordenar clientes alfabéticamente por username
        const sortedClients = clientsResponse.data.sort((a, b) => 
          a.username.localeCompare(b.username)
        );
        setClients(sortedClients);
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los datos. Intente nuevamente.');
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

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
    const selectedMessenger = messengers.find(m => m.id === parseInt(formData.messengerId));
    const selectedClient = formData.clientType === 'registered' ? 
      clients.find(c => c.id === parseInt(formData.clientId)) : null;

    // Procesar cada item del carrito
    const requests = cartItems.map((item) => {
      const salesData = {
        mensajero_id: formData.messengerId,
        moneda_id: formData.currencyId,
        domicilio_id: formData.deliveryPointId,
        horario_deseado_entrega: formData.deliveryDateTime.toISOString(),
        descuento: parseFloat(formData.discount) || 0,
        punto_referencia: formData.referencePoint,
        nota: formData.note
      };

      // Agregar datos según el tipo de cliente
      if (formData.clientType === 'registered') {
        salesData.cliente_id = formData.clientId;
      } else {
        salesData.nombre_cliente = formData.clientName;
        salesData.telefono_cliente = formData.clientPhone;
      }

      // Agregar datos del producto
      if (item.isVariation) {
        salesData.variacion_id = item.variationId;
      } else {
        salesData.producto_id = item.id;
      }

      return axios.post(`${API_URL}/crear_venta_admin/`, salesData, config)
        .then(() => {
          setProcessedItems(prev => prev + 1);
        });
    });

    await Promise.all(requests);
    
    setSuccess(true);
    setOpenSnackbar(true);
    
    // Preparar datos para la notificación (SIMPLIFICADO)
    const notificationData = {
      cartItems: cartItems,
      clientType: formData.clientType,
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      clientUsername: selectedClient ? selectedClient.username : null,
      clientTelefono: selectedClient ? selectedClient.telefono : null,
      currencyName: selectedCurrency ? selectedCurrency.nombre : 'No especificada',
      currencyRate: selectedCurrency ? selectedCurrency.cambio : 'N/A',
      deliveryLocation: selectedDeliveryPoint ? selectedDeliveryPoint.ubicacion : 'No especificado',
      deliveryPrice: selectedDeliveryPoint ? selectedDeliveryPoint.precio : 'N/A',
      deliveryDateTime: formData.deliveryDateTime,
      referencePoint: formData.referencePoint,
      note: formData.note,
      discount: formData.discount,
      messengerName: selectedMessenger ? selectedMessenger.nombre : 'No asignado'
    };

    // Enviar notificación
    try {
      await AdminNotifier2.sendNewSaleNotification(notificationData, 'admin');
    } catch (emailError) {
      console.error('Error al enviar notificaciones:', emailError);
    }
    
    setTimeout(() => {
      navigate('/admin-ventas');
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
              <IconButton onClick={() => navigate('/admin/dashboard')} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h1" sx={styles.headerTitle}>
                  Registrar Venta (Admin)
                </Typography>
                <Typography sx={styles.headerSubtitle}>
                  Complete los datos para registrar una nueva venta.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Formulario */}
        <Box sx={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            {/* Resumen de Productos */}
            <Box sx={{ mb: 3 }}>
              <SectionTitle>Productos en el Carrito</SectionTitle>
              <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                Estás vendiendo {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
              </Typography>
              
              {cartItems.map((item, index) => (
                <Card key={index} sx={{ mb: 1 }}>
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="subtitle2">
                      {item.productData?.nombre || 'Producto'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Precio: ${item.price}
                      {item.color && ` | Color: ${item.color}`}
                      {item.model && ` | Modelo: ${item.model}`}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
              <Divider sx={{ my: 2 }} />
            </Box>

            {/* Selección de Tipo de Cliente */}
            <Box sx={{ mb: 3 }}>
              <SectionTitle>Tipo de Cliente</SectionTitle>
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <RadioGroup
                  row
                  name="clientType"
                  value={formData.clientType}
                  onChange={handleChange}
                >
                  <FormControlLabel value="registered" control={<Radio />} label="Cliente Registrado" />
                  <FormControlLabel value="unregistered" control={<Radio />} label="Cliente No Registrado" />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* Datos del Cliente */}
            <Box sx={{ mb: 3 }}>
              <SectionTitle>
                {formData.clientType === 'registered' ? 'Seleccionar Cliente' : 'Datos del Cliente'}
              </SectionTitle>
              
              {formData.clientType === 'registered' ? (
                <FormControl fullWidth sx={{ mb: 3 }} required>
                  <InputLabel sx={styles.selectLabel}>Cliente</InputLabel>
                  <Select
                    name="clientId"
                    value={formData.clientId}
                    label="Cliente"
                    onChange={handleChange}
                    required
                    sx={styles.select}
                  >
                    {clients.map(client => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.username} - {client.telefono}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
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
              )}
              <Divider sx={{ my: 2 }} />
            </Box>

            {/* Datos de la Venta */}
            <Box>
              <SectionTitle>Datos de la Venta</SectionTitle>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
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
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel sx={styles.selectLabel}>Mensajero</InputLabel>
                    <Select
                      name="messengerId"
                      value={formData.messengerId}
                      label="Mensajero"
                      onChange={handleChange}
                      required
                      sx={styles.select}
                    >
                      {messengers.map(messenger => (
                        <MenuItem key={messenger.id} value={messenger.id}>
                          {messenger.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

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

              <TextField
                fullWidth
                label="Descuento"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                sx={{ mb: 3 }}
                helperText="Ingrese el descuento a aplicar (opcional)"
              />

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
                  success ? 'Venta Registrada!' : 'Registrar Venta'
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
          ¡Venta registrada con éxito! Redirigiendo...
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateAdminSalesPage;
