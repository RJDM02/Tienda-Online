import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Snackbar,
  Alert,
  Modal,
  Box,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Divider,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import EmailIcon from '@mui/icons-material/Email';
import CakeIcon from '@mui/icons-material/Cake';
import GroupIcon from '@mui/icons-material/Group';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const DataClientePage = () => {
  const [clientData, setClientData] = useState({
    username: '',
    telefono: '',
    imagen: '',
    correo: '',
    cumple: null,
    cupon: [],
    pedidos_pendientes: [],
    historial_venta: [],
    pedidos_referidos_historial: [],
    puntos: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [openPendientesModal, setOpenPendientesModal] = useState(false);
  const [openHistorialModal, setOpenHistorialModal] = useState(false);
  const [openReferidosModal, setOpenReferidosModal] = useState(false);
  const [tabValue, setTabValue] = useState(0); // Para tabs dentro del modal de referidos
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`
        };

        const [clientResponse, pointsResponse] = await Promise.all([
          fetch('https://videojuegoshabana.com/api/listar_datos_cliente/', { headers }),
          fetch('https://videojuegoshabana.com/api/obtener_puntos/', { headers })
        ]);

        if (!clientResponse.ok) {
          throw new Error('Error al obtener los datos del cliente');
        }

        if (!pointsResponse.ok) {
          throw new Error('Error al obtener los puntos del cliente');
        }

        const data = await clientResponse.json();
        const pointsData = await pointsResponse.json();
        const puntos = Number(pointsData?.puntos ?? 0);
        // Aseguramos que los arrays siempre tengan valor y agregamos los puntos del cliente
        setClientData({
          ...data,
          cupon: data.cupon || [],
          pedidos_pendientes: data.pedidos_pendientes || [],
          historial_venta: data.historial_venta || [],
          pedidos_referidos_historial: data.pedidos_referidos_historial || [],
          puntos: Number.isFinite(puntos) ? puntos : 0
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClientData();
  }, [navigate]);

  const getStatusConfig = (estado) => {
    switch (estado) {
      case 'procesado':
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: CheckCircleIcon,
          text: 'Procesado'
        };
      case 'cancelado':
        return { 
          color: 'bg-red-100 text-red-800 border-red-200', 
          icon: CancelIcon,
          text: 'Cancelado'
        };
      default: // pendiente
        return { 
          color: 'bg-orange-100 text-orange-800 border-orange-200', 
          icon: PendingIcon,
          text: 'Pendiente'
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificado';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleOpenPendientesModal = () => setOpenPendientesModal(true);
  const handleClosePendientesModal = () => setOpenPendientesModal(false);
  const handleOpenHistorialModal = () => setOpenHistorialModal(true);
  const handleCloseHistorialModal = () => setOpenHistorialModal(false);
  const handleOpenReferidosModal = () => setOpenReferidosModal(true);
  const handleCloseReferidosModal = () => setOpenReferidosModal(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Calcular ganancia total de referidos
  const calcularGananciaTotalReferidos = () => {
    return clientData.pedidos_referidos_historial.reduce((total, referido) => {
      return total + (parseFloat(referido.ganancia_por_compra_referido) || 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Información</h1>
            <div className="flex justify-center mt-4">
              <div className="bg-gray-100 rounded-full p-1 inline-flex">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'info' ? 'bg-white shadow-md text-orange-600' : 'text-gray-600'}`}
                >
                  Información Personal
                </button>
                <button
                  onClick={() => setActiveTab('cupones')}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'cupones' ? 'bg-white shadow-md text-orange-600' : 'text-gray-600'}`}
                >
                  Mis Cupones
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Cargando datos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <CancelIcon className="text-red-500 mb-4" sx={{ fontSize: 48 }} />
              <h3 className="text-lg font-medium text-red-700 mb-2">Error al cargar datos</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'info' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Información personal */}
                  <div className="md:w-1/3">
                    <div className="flex flex-col items-center mb-6">
                      <Avatar 
                        alt={clientData.username} 
                        src={clientData.imagen ? require(`../assets/${clientData.imagen}.png`) : null}
                        sx={{ width: 120, height: 120, marginBottom: '0.75rem' }}
                      />
                      <Typography variant="h5" className="font-bold">{clientData.username}</Typography>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center">
                        <PhoneIcon className="text-gray-500 mr-2" />
                        <Typography>{clientData.telefono || 'No especificado'}</Typography>
                      </div>
                      <div className="flex items-center">
                        <EmailIcon className="text-gray-500 mr-2" />
                        <Typography>{clientData.correo || 'No especificado'}</Typography>
                      </div>
                      <div className="flex items-center">
                        <CakeIcon className="text-gray-500 mr-2" />
                        <Typography>{clientData.cumple ? new Date(clientData.cumple).toLocaleDateString() : 'No especificado'}</Typography>
                      </div>
                    </div>

                    <Divider className="my-6" />

                    <div className="bg-blue-50 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <LoyaltyIcon className="text-blue-600 mr-2" />
                          <Typography variant="subtitle2" className="font-bold text-blue-800">
                            Mis Puntos
                          </Typography>
                        </div>
                        <Typography variant="h4" className="font-bold text-blue-700">
                          {Number(clientData.puntos ?? 0).toLocaleString('es-ES')}
                        </Typography>
                      </div>
                      <Typography variant="body2" className="text-blue-600 mt-1">
                        Puntos disponibles para canjear
                      </Typography>
                    </div>

                    {/* Estadísticas de referidos */}
                    {clientData.pedidos_referidos_historial && clientData.pedidos_referidos_historial.length > 0 && (
                      <div className="bg-purple-50 rounded-xl p-4 mb-4">
                        <div className="flex items-center mb-2">
                          <TrendingUpIcon className="text-purple-600 mr-2" />
                          <Typography variant="subtitle2" className="font-bold text-purple-800">
                            Programa de Referidos
                          </Typography>
                        </div>
                        <div className="space-y-1">
                          <Typography variant="body2">
                            Clientes referidos: <strong>{clientData.pedidos_referidos_historial.length}</strong>
                          </Typography>
                          <Typography variant="body2">
                            Ganancia total: <strong>${calcularGananciaTotalReferidos().toFixed(2)}</strong>
                          </Typography>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col space-y-4">
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        startIcon={<PendingIcon />}
                        onClick={handleOpenPendientesModal}
                      >
                        Ver Pedidos Pendientes
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="secondary" 
                        startIcon={<HistoryIcon />}
                        onClick={handleOpenHistorialModal}
                      >
                        Ver Historial de Compras
                      </Button>
                      {clientData.pedidos_referidos_historial && clientData.pedidos_referidos_historial.length > 0 && (
                        <Button 
                          variant="outlined" 
                          color="success" 
                          startIcon={<GroupIcon />}
                          onClick={handleOpenReferidosModal}
                        >
                          Ver Mis Referidos
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Cupones destacados */}
                  <div className="md:w-2/3">
                    <Typography variant="h6" className="font-bold mb-4 flex items-center">
                      <LoyaltyIcon className="mr-2 text-orange-500" />
                      Mis Cupones Destacados
                    </Typography>

                    {clientData.cupon?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clientData.cupon.slice(0, 4).map((cupon) => (
                          <div key={cupon.id} className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <Typography variant="subtitle1" className="font-bold">{cupon.nombre}</Typography>
                                <Typography variant="body2" className="text-gray-600">Descuento: {cupon.cifra}%</Typography>
                              </div>
                              <Chip label="Disponible" color="success" size="small" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-6 text-center">
                        <Typography className="text-gray-500">No tienes cupones disponibles</Typography>
                      </div>
                    )}

                    <Divider className="my-6" />

                    <Typography variant="h6" className="font-bold mb-4 flex items-center">
                      <CardGiftcardIcon className="mr-2 text-green-500" />
                      Beneficios del Cliente
                    </Typography>
                    <div className="bg-green-50 rounded-xl p-4">
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Descuentos exclusivos en productos seleccionados</li>
                        <li>Acceso prioritario a nuevas llegadas</li>
                        <li>Soporte personalizado</li>
                        <li>Regalos en compras superiores 200$</li>
                        <li>Acceso a cupones de regalos</li>
                        {clientData.pedidos_referidos_historial && clientData.pedidos_referidos_historial.length > 0 && (
                          <li>Programa de referidos con ganancias por cada compra</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cupones' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <Typography variant="h5" className="font-bold mb-6 flex items-center">
                  <LoyaltyIcon className="mr-2 text-orange-500" />
                  Mis Cupones de Descuento
                </Typography>

                {clientData.cupon?.length > 0 ? (
                  <div className="space-y-4">
                    {clientData.cupon.map((cupon) => (
                      <Accordion key={cupon.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          className="bg-orange-50 hover:bg-orange-100"
                        >
                          <div className="flex items-center w-full">
                            <div className="flex-grow">
                              <Typography className="font-bold">{cupon.nombre}</Typography>
                              <Typography variant="body2" className="text-gray-600">Descuento: {cupon.cifra}%</Typography>
                            </div>
                            <Chip label="Activo" color="success" />
                          </div>
                        </AccordionSummary>
                        <AccordionDetails className="bg-white">
                          <div className="space-y-2">
                            <Typography><strong>ID:</strong> {cupon.id}</Typography>
                            <Typography><strong>Descuento:</strong> {cupon.cifra}% en productos aplicables</Typography>
                            <Typography><strong>Válido para:</strong> Todos los productos con descuento habilitado</Typography>
                            <Typography><strong>Uso:</strong> Se aplica automáticamente al finalizar la compra</Typography>
                          </div>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <LoyaltyIcon className="text-gray-400 mb-4" sx={{ fontSize: 64 }} />
                    <Typography variant="h6" className="text-gray-600 mb-2">No tienes cupones disponibles</Typography>
                    <Typography className="text-gray-500">Tus cupones aparecerán aquí cuando los obtengas</Typography>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal de Pedidos Pendientes */}
        <Modal
          open={openPendientesModal}
          onClose={handleClosePendientesModal}
          aria-labelledby="pendientes-modal-title"
          aria-describedby="pendientes-modal-description"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: '16px',
            p: 4,
            overflowY: 'auto'
          }}>
            <Typography id="pendientes-modal-title" variant="h5" component="h2" className="font-bold mb-4 flex items-center">
              <PendingIcon className="mr-2 text-orange-500" />
              Mis Pedidos Pendientes
            </Typography>
            
            {clientData.pedidos_pendientes?.length === 0 ? (
              <div className="text-center p-8">
                <CheckCircleIcon className="text-gray-400 mb-4" sx={{ fontSize: 64 }} />
                <Typography variant="h6" className="text-gray-600 mb-2">No tienes pedidos pendientes</Typography>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {clientData.pedidos_pendientes?.map((pedido) => {
                  const statusConfig = getStatusConfig(pedido.estado);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div key={pedido.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">Pedido #{pedido.id}</h3>
                            <p className="text-sm text-gray-600">{pedido.producto?.nombre || 'Producto no especificado'}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-lg border text-sm font-medium flex items-center space-x-2 ${statusConfig.color}`}>
                            <StatusIcon sx={{ fontSize: 16 }} />
                            <span>{statusConfig.text}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        {/* Información del producto */}
                        <div className="bg-orange-50 rounded-xl p-4">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                            <LocalShippingIcon className="text-orange-600" sx={{ fontSize: 20 }} />
                            <span>Producto</span>
                          </h4>
                          <div className="space-y-2">
                            <p className="text-gray-800 font-medium">{pedido.producto?.nombre}</p>
                            <div className="flex flex-wrap gap-2">
                              {pedido.producto?.garantia && (
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-lg text-xs font-medium flex items-center space-x-1">
                                  <VerifiedUserIcon sx={{ fontSize: 12 }} />
                                  <span>Garantía: {pedido.producto.garantia.tiempo}</span>
                                </span>
                              )}
                              {pedido.producto?.regalo && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium flex items-center space-x-1">
                                  <CardGiftcardIcon sx={{ fontSize: 12 }} />
                                  <span>Regalo: {pedido.producto.regalo.nombre}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Información de entrega */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                              <HomeIcon className="text-blue-600" sx={{ fontSize: 20 }} />
                              <span>Entrega</span>
                            </h4>
                            <div className="space-y-1">
                              <p className="text-gray-800">{pedido.domicilio?.ubicacion}</p>
                              <p className="text-gray-600 text-sm">Precio: {pedido.domicilio?.precio} {pedido.moneda?.nombre}</p>
                              <p className="text-gray-600 text-sm">Horario: {formatDate(pedido.horario_deseado_entrega)}</p>
                            </div>
                          </div>

                          <div className="bg-green-50 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                              <AttachMoneyIcon className="text-green-600" sx={{ fontSize: 20 }} />
                              <span>Pago</span>
                            </h4>
                            <div className="space-y-1">
                              <p className="text-gray-600 text-sm">Moneda: {pedido.moneda?.nombre} (Cambio: {pedido.moneda?.cambio})</p>
                              <p className="text-gray-800 font-bold">Total: {pedido.costo_post_descuento}</p>
                            </div>
                          </div>
                        </div>

                        {/* Información adicional */}
                        {pedido.mensajero && (
                          <div className="bg-gray-50 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                              <PersonIcon className="text-gray-600" sx={{ fontSize: 20 }} />
                              <span>Mensajero</span>
                            </h4>
                            <p className="text-gray-800">{pedido.mensajero.nombre}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleClosePendientesModal} variant="contained">
                Cerrar
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Modal de Historial de Compras */}
        <Modal
          open={openHistorialModal}
          onClose={handleCloseHistorialModal}
          aria-labelledby="historial-modal-title"
          aria-describedby="historial-modal-description"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: '16px',
            p: 4,
            overflowY: 'auto'
          }}>
            <Typography id="historial-modal-title" variant="h5" component="h2" className="font-bold mb-4 flex items-center">
              <HistoryIcon className="mr-2 text-blue-500" />
              Mi Historial de Compras
            </Typography>
            
            {clientData.historial_venta?.length === 0 ? (
              <div className="text-center p-8">
                <HistoryIcon className="text-gray-400 mb-4" sx={{ fontSize: 64 }} />
                <Typography variant="h6" className="text-gray-600 mb-2">No tienes compras en tu historial</Typography>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {clientData.historial_venta?.map((venta) => {
                  const statusConfig = getStatusConfig(venta.estado);
                  const StatusIcon = statusConfig.icon;
                  const productoNombre = venta.producto?.nombre || venta.variacion?.producto_padre?.nombre || 'Producto no especificado';
                  
                  return (
                    <div key={venta.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">Compra #{venta.id}</h3>
                            <p className="text-sm text-gray-600">{productoNombre}</p>
                            <p className="text-xs text-gray-500 mt-1">Fecha: {venta.fecha}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-lg border text-sm font-medium flex items-center space-x-2 ${statusConfig.color}`}>
                            <StatusIcon sx={{ fontSize: 16 }} />
                            <span>{statusConfig.text}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        {/* Información del producto */}
                        <div className="bg-blue-50 rounded-xl p-4">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                            <LocalShippingIcon className="text-blue-600" sx={{ fontSize: 20 }} />
                            <span>Producto</span>
                          </h4>
                          <div className="space-y-2">
                            <p className="text-gray-800 font-medium">{productoNombre}</p>
                            <div className="flex flex-wrap gap-2">
                              {venta.producto?.garantia && (
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-lg text-xs font-medium flex items-center space-x-1">
                                  <VerifiedUserIcon sx={{ fontSize: 12 }} />
                                  <span>Garantía: {venta.producto.garantia.tiempo}</span>
                                </span>
                              )}
                              {venta.producto?.regalo && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium flex items-center space-x-1">
                                  <CardGiftcardIcon sx={{ fontSize: 12 }} />
                                  <span>Regalo: {venta.producto.regalo.nombre}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Información de entrega */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-indigo-50 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                              <HomeIcon className="text-indigo-600" sx={{ fontSize: 20 }} />
                              <span>Entrega</span>
                            </h4>
                            <div className="space-y-1">
                              <p className="text-gray-800">{venta.domicilio?.ubicacion}</p>
                              <p className="text-gray-600 text-sm">Precio: {venta.domicilio?.precio} {venta.moneda?.nombre}</p>
                              <p className="text-gray-600 text-sm">Horario: {formatDate(venta.horario_deseado_entrega)}</p>
                            </div>
                          </div>

                          <div className="bg-green-50 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                              <AttachMoneyIcon className="text-green-600" sx={{ fontSize: 20 }} />
                              <span>Pago</span>
                            </h4>
                            <div className="space-y-1">
                              <p className="text-gray-600 text-sm">Moneda: {venta.moneda?.nombre} (Cambio: {venta.moneda?.cambio})</p>
                              <p className="text-gray-800 font-bold">Total: {venta.costo_post_descuento}</p>
                            </div>
                          </div>
                        </div>

                        {/* Información adicional */}
                        {venta.mensajero && (
                          <div className="bg-gray-50 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                              <PersonIcon className="text-gray-600" sx={{ fontSize: 20 }} />
                              <span>Mensajero</span>
                            </h4>
                            <p className="text-gray-800">{venta.mensajero.nombre}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleCloseHistorialModal} variant="contained">
                Cerrar
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Modal de Historial de Referidos */}
        <Modal
          open={openReferidosModal}
          onClose={handleCloseReferidosModal}
          aria-labelledby="referidos-modal-title"
          aria-describedby="referidos-modal-description"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: '16px',
            p: 4,
            overflowY: 'auto'
          }}>
            <Typography id="referidos-modal-title" variant="h5" component="h2" className="font-bold mb-4 flex items-center">
              <GroupIcon className="mr-2 text-purple-500" />
              Mis Clientes Referidos
            </Typography>

            {/* Resumen de referidos */}
            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Typography variant="h4" className="font-bold text-purple-700">
                    {clientData.pedidos_referidos_historial.length}
                  </Typography>
                  <Typography variant="body2" className="text-purple-600">
                    Clientes Referidos
                  </Typography>
                </div>
                <div className="text-center">
                  <Typography variant="h4" className="font-bold text-green-700">
                    ${calcularGananciaTotalReferidos().toFixed(2)}
                  </Typography>
                  <Typography variant="body2" className="text-green-600">
                    Ganancia Total
                  </Typography>
                </div>
                <div className="text-center">
                  <Typography variant="h4" className="font-bold text-blue-700">
                    ${(calcularGananciaTotalReferidos() / clientData.pedidos_referidos_historial.length).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" className="text-blue-600">
                    Promedio por Cliente
                  </Typography>
                </div>
              </div>
            </div>

            {/* Lista de referidos */}
            <div className="space-y-4">
              {clientData.pedidos_referidos_historial.map((referido, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{referido.nomre_cliente}</h3>
                        <p className="text-sm text-gray-600">Teléfono: {referido.telefono_cliente}</p>
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-green-100 text-green-800 border border-green-200 text-sm font-medium">
                        Ganancia: ${parseFloat(referido.ganancia_por_compra_referido).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Información del producto comprado */}
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                        <LocalShippingIcon className="text-blue-600" sx={{ fontSize: 20 }} />
                        <span>Producto Comprado</span>
                      </h4>
                      <div className="space-y-2">
                        <p className="text-gray-800 font-medium">{referido.producto}</p>
                        {referido.variacion && (
                          <p className="text-gray-600 text-sm">Variación: {referido.variacion}</p>
                        )}
                      </div>
                    </div>

                    {/* Información adicional del cliente referido */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-indigo-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                          <PersonIcon className="text-indigo-600" sx={{ fontSize: 20 }} />
                          <span>Cliente Referido</span>
                        </h4>
                        <div className="space-y-1">
                          <p className="text-gray-800">{referido.nomre_cliente}</p>
                          <p className="text-gray-600 text-sm">Teléfono: {referido.telefono_cliente}</p>
                          {referido.username && (
                            <p className="text-gray-600 text-sm">Usuario: {referido.username}</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                          <AttachMoneyIcon className="text-green-600" sx={{ fontSize: 20 }} />
                          <span>Ganancia Obtenida</span>
                        </h4>
                        <div className="space-y-1">
                          <p className="text-gray-800 font-bold text-xl">${parseFloat(referido.ganancia_por_compra_referido).toFixed(2)}</p>
                          <p className="text-gray-600 text-sm">Por esta compra de referido</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleCloseReferidosModal} variant="contained">
                Cerrar
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Notificaciones */}
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

export default DataClientePage;
