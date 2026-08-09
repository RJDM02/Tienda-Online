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
import { formatLocalDateTime, mergeDatePart, mergeTimePart } from '../utils/localDateTime';

import { API_URL } from '../config/apiConfig';
const POINTS_THRESHOLD = 500;

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
  const [availablePoints, setAvailablePoints] = useState(0);
  
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
    puntos: 0,
    cupon: '',
    vuelto: '',
    referidoId: referralCodeFromCart // ← USAR EL CÓDIGO DEL CARRITO
  });
  
  const [currentUser, setCurrentUser] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    const fetchUserPoints = async (authToken) => {
      try {
        const response = await axios.get(`${API_URL}/obtener_puntos/`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const fetchedPoints = Number(response.data?.puntos ?? 0);
        const safePoints = Number.isFinite(fetchedPoints) ? fetchedPoints : 0;
        const usablePoints = safePoints >= POINTS_THRESHOLD ? safePoints : 0;

        setAvailablePoints(safePoints);
        setFormData(prev => {
          const prevPoints = parseInt(prev.puntos, 10);
          const normalizedPrev = Number.isNaN(prevPoints) ? 0 : prevPoints;
          return {
            ...prev,
            puntos: usablePoints > 0 ? Math.min(normalizedPrev, usablePoints) : 0
          };
        });
      } catch (pointsError) {
        console.error('Error al obtener puntos del usuario:', pointsError);
        setAvailablePoints(0);
        setFormData(prev => ({
          ...prev,
          puntos: 0
        }));
      }
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
        setIsManager(decoded.rol === 'Gestor de Venta');
        fetchUserPoints(token);
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('authToken');
        setAvailablePoints(0);
        setFormData(prev => ({
          ...prev,
          puntos: 0
        }));
      }
    } else {
      setAvailablePoints(0);
      setFormData(prev => ({
        ...prev,
        puntos: 0
      }));
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
          axios.get(`${API_URL}/listar_moneda/`),
          axios.get(`${API_URL}/listar_domicilio/`)
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

      if (isManager || !currentUser) {
        const phoneValue = formData.clientPhone.trim();
        if (!/^[0-9]+$/.test(phoneValue)) {
          setPhoneError('El telefono solo permite numeros');
          setSubmitting(false);
          return;
        }
        setPhoneError('');
      }

      const selectedCurrency = currencies.find(c => c.id === parseInt(formData.currencyId));
      const selectedDeliveryPoint = deliveryPoints.find(d => d.id === parseInt(formData.deliveryPointId));

      const rawPoints = parseInt(formData.puntos, 10);
      let puntosRedimidos = Number.isNaN(rawPoints) ? 0 : rawPoints;

      if (puntosRedimidos < 0) {
        setError('Los puntos a utilizar no pueden ser negativos.');
        setSubmitting(false);
        return;
      }

      const maxUsablePoints = availablePoints >= POINTS_THRESHOLD ? availablePoints : 0;
      if (maxUsablePoints === 0) {
        puntosRedimidos = 0;
      } else if (puntosRedimidos > maxUsablePoints) {
        setError(`No puedes usar mas de ${maxUsablePoints} puntos en esta compra.`);
        setSubmitting(false);
        return;
      }

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
        puntos: puntosRedimidos,
        referidoId: formData.referidoId, // Incluir código de referido en la notificación
        currentUser: currentUser
      };

      // Procesar cada item del carrito
      const requests = cartItems.map((item, index) => {
        const salesData = {
          moneda_id: formData.currencyId,
          domicilio_id: formData.deliveryPointId,
          horario_deseado_entrega: formatLocalDateTime(formData.deliveryDateTime),
          punto_referencia: formData.referencePoint,
          nota: formData.note,
          vuelto: index === 0 ? (parseFloat(formData.vuelto) || 0) : 0,
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

        salesData.puntos = index === 0 ? puntosRedimidos : 0;
        if (index === 0 && formData.cupon && formData.cupon.trim() !== '') {
          salesData.cupon = formData.cupon.trim();
        }

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
      
      // Éxito: vaciar carrito, mostrar mensaje y limpiar códigos de referido
      clearCart();
      const remainingPoints = Math.max(0, availablePoints - puntosRedimidos);
      setAvailablePoints(remainingPoints);
      setFormData(prev => ({
        ...prev,
        puntos: 0,
        cupon: ''
      }));
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
      setError(parseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'puntos') {
      const maxUsablePoints = availablePoints >= POINTS_THRESHOLD ? availablePoints : 0;

      if (maxUsablePoints === 0) {
        setFormData(prev => ({ ...prev, puntos: 0 }));
        return;
      }

      if (value === '') {
        setFormData(prev => ({ ...prev, puntos: '' }));
        return;
      }

      const parsed = parseInt(value, 10);
      const sanitized = Number.isNaN(parsed)
        ? 0
        : Math.max(0, Math.min(parsed, maxUsablePoints));

      setFormData(prev => ({ ...prev, puntos: sanitized }));
      return;
    }

    if (name === 'clientPhone') {
      const digitsOnly = /^[0-9]*$/;
      setPhoneError(digitsOnly.test(value) ? '' : 'El telefono solo permite numeros');
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
                      label="Telefono"
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

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Puntos disponibles
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {currentUser
                    ? (availablePoints >= POINTS_THRESHOLD
                      ? `Tienes ${availablePoints.toLocaleString('es-ES')} puntos disponibles para usar.`
                      : `Tienes ${availablePoints.toLocaleString('es-ES')} puntos disponibles. Necesitas al menos ${POINTS_THRESHOLD.toLocaleString('es-ES')} puntos para canjear.`)
                    : 'Inicia sesion para acumular y canjear puntos.'}
                </Typography>
                <TextField
                  fullWidth
                  label="Puntos a utilizar"
                  name="puntos"
                  value={formData.puntos}
                  onChange={handleChange}
                  type="number"
                  inputProps={{ min: 0, max: availablePoints >= POINTS_THRESHOLD ? availablePoints : 0, step: 1 }}
                  disabled={!currentUser || availablePoints < POINTS_THRESHOLD}
                  sx={styles.textField}
                  helperText={
                    !currentUser
                      ? 'Este campo se habilita al iniciar sesion.'
                      : availablePoints < POINTS_THRESHOLD
                        ? `Necesitas al menos ${POINTS_THRESHOLD.toLocaleString('es-ES')} puntos para canjear.`
                        : `Puedes usar hasta ${availablePoints.toLocaleString('es-ES')} puntos en esta compra.`
                  }
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Nota: 100 puntos equivalen a 1 USD de descuento (convertido segun la moneda seleccionada). Minimo para canjear: {POINTS_THRESHOLD.toLocaleString('es-ES')} puntos.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Cupón
                </Typography>
                <TextField
                  fullWidth
                  label="Código de cupón"
                  name="cupon"
                  value={formData.cupon}
                  onChange={handleChange}
                  placeholder="Ej: CUPON2026"
                  disabled={!currentUser || isManager}
                  sx={styles.textField}
                  helperText={
                    !currentUser
                      ? 'Inicia sesion para usar tus cupones.'
                      : isManager
                        ? 'Los cupones se aplican solo en compras de cliente.'
                        : 'Opcional. Si tienes un cupon, escríbelo aquí.'
                  }
                />
              </Box>

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Fecha de entrega"
                      value={formData.deliveryDateTime}
                      onChange={(newValue) => 
                        setFormData(prev => ({ ...prev, deliveryDateTime: mergeDatePart(prev.deliveryDateTime, newValue) }))
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
                        setFormData(prev => ({ ...prev, deliveryDateTime: mergeTimePart(prev.deliveryDateTime, newValue) }))
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

              <TextField
                fullWidth
                label="Vuelto a entregar (opcional)"
                name="vuelto"
                value={formData.vuelto}
                onChange={handleChange}
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
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
