import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import FilterListIcon from '@mui/icons-material/FilterList';

import { API_URL } from '../config/apiConfig';
const SalesManagerPage = () => {
  const [managerData, setManagerData] = useState({
    nombre: '',
    pedidos_pendientes: [],
    historial_venta: []
  });
  const [filteredHistorial, setFilteredHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('pendientes');
  const [monthFilter, setMonthFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_URL}/listar_datos_gestor/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener los datos del gestor');
        }
        
        const data = await response.json();

        // Ordenar pedidos pendientes de más reciente a más antiguo
        const sortedPedidosPendientes = (data.pedidos_pendientes || []).sort((a, b) => {
          return new Date(b.fecha || b.horario_deseado_entrega) - new Date(a.fecha || a.horario_deseado_entrega);
        });
        
        // Ordenar historial de ventas de más reciente a más antiguo
        const sortedHistorialVenta = (data.historial_venta || []).sort((a, b) => {
          return new Date(b.fecha) - new Date(a.fecha);
        });

        setManagerData({
          nombre: data.nombre || 'Gestor',
          pedidos_pendientes: data.pedidos_pendientes || [],
          historial_venta: data.historial_venta || []
        });
        setFilteredHistorial(data.historial_venta || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchManagerData();
  }, [navigate]);

  // Función para filtrar el historial por mes
  const filterByMonth = (month) => {
    if (month === 'all') {
      setFilteredHistorial(managerData.historial_venta);
      return;
    }
    
    const filtered = managerData.historial_venta.filter(venta => {
      if (!venta.fecha) return false;
      const saleDate = new Date(venta.fecha);
      return saleDate.getMonth() === parseInt(month);
    });
    
    const sortedFiltered = filtered.sort((a, b) => {
      return new Date(b.fecha) - new Date(a.fecha);
    });

    setFilteredHistorial(filtered);
  };

  useEffect(() => {
    filterByMonth(monthFilter);
  }, [monthFilter, managerData.historial_venta]);

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
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString; // Si no se puede parsear, devolver el string original
    }
  };

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Función para calcular la ganancia total de un pedido/venta
  const calcularGananciaTotal = (pedido) => {
    const comision = pedido.producto 
      ? (pedido.producto.producto_comision || pedido.producto.comision || 0)
      : (pedido.variacion?.comision || 0);
    
    const precioPostDescuento = parseFloat(
      pedido.producto 
        ? (pedido.producto.precio_post_descuento || 0)
        : (pedido.variacion?.precio_post_descuento || 0)
    );
    
    const precioGestor = parseFloat(pedido.precio_gestor || 0);
    
    return comision + (precioGestor - precioPostDescuento);
  };

  // Función para calcular la ganancia total histórica
  const calcularGananciaHistorica = () => {
    return filteredHistorial.reduce((total, venta) => {
      return total + calcularGananciaTotal(venta);
    }, 0);
  };

  const renderProductInfo = (producto) => {
    if (!producto) return null;
    
    return (
      <>
        <p className="text-gray-800 font-medium">{producto.nombre || 'Producto no especificado'}</p>
        <p className="text-gray-600 text-sm">{producto.descripcion?.split('\r\n')[0]}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {producto.garantia && (
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-1">
              <VerifiedUserIcon sx={{ fontSize: 14 }} />
              <span>Con garantía: {producto.garantia.tiempo}</span>
            </span>
          )}
          {producto.regalo && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-1">
              <CardGiftcardIcon sx={{ fontSize: 14 }} />
              <span>Regalo: {producto.regalo.nombre}</span>
            </span>
          )}
        </div>
      </>
    );
  };

  // FUNCIÓN CORREGIDA: Mostrar precios correctamente
  const renderPriceInfo = (pedido) => {
    const comision = pedido.producto 
      ? (pedido.producto.producto_comision || pedido.producto.comision || 0)
      : (pedido.variacion?.comision || 0);
    
    const precioPostDescuento = parseFloat(
      pedido.producto 
        ? (pedido.producto.precio_post_descuento || 0)
        : (pedido.variacion?.precio_post_descuento || 0)
    );
    
    const precioGestor = parseFloat(pedido.precio_gestor || 0);
    const gananciaTotal = calcularGananciaTotal(pedido);

    return (
      <>
        {/* Precio base corregido */}
        <p className="text-gray-600 text-sm">Precio base: {precioPostDescuento.toFixed(2)} {`Venta realizada en: ${pedido.moneda?.nombre ?? ''}`}</p>
        
        {/* Precio gestor corregido */}
        <p className="text-gray-600 text-sm">Precio gestor: {precioGestor.toFixed(2)}</p>
        
        <p className="text-gray-600 text-sm">Comisión: {comision} {'Dolares (USD)'}</p>
        <p className="text-gray-800 font-bold text-lg">Total: {pedido.costo_post_descuento}</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
          <p className="text-yellow-800 font-bold flex items-center">
            <MonetizationOnIcon sx={{ fontSize: 16, marginRight: '4px' }} />
            Ganancia total: {gananciaTotal.toFixed(2)} {'Dolares (USD)'}
          </p>
        </div>
      </>
    );
  };

  // Obtener meses únicos del historial para el filtro
  const getUniqueMonths = () => {
    const months = {};
    managerData.historial_venta.forEach(venta => {
      if (venta.fecha) {
        const date = new Date(venta.fecha);
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${month}-${year}`;
        months[key] = {
          month,
          year,
          name: date.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
        };
      }
    });
    
    return Object.values(months);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Ventas</h1>
            <p className="text-gray-600">Bienvenido, {managerData.nombre}</p>
            <div className="flex justify-center mt-4">
              <div className="bg-gray-100 rounded-full p-1 inline-flex">
                <button
                  onClick={() => setActiveTab('pendientes')}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'pendientes' ? 'bg-white shadow-md text-orange-600' : 'text-gray-600'}`}
                >
                  Pedidos Pendientes
                </button>
                <button
                  onClick={() => setActiveTab('historial')}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'historial' ? 'bg-white shadow-md text-orange-600' : 'text-gray-600'}`}
                >
                  Historial de Ventas
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
            {activeTab === 'pendientes' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <PendingIcon className="mr-2 text-orange-500" />
                  Pedidos Pendientes
                </h2>
                
                {managerData.pedidos_pendientes.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg p-16">
                    <div className="text-center">
                      <div className="text-gray-400 mb-4">
                        <CheckCircleIcon sx={{ fontSize: 64 }} />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos pendientes</h3>
                      <p className="text-gray-500 mb-6">Todos los pedidos están procesados</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {managerData.pedidos_pendientes.map((pedido) => {
                      const statusConfig = getStatusConfig(pedido.estado);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <div key={pedido.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                          {/* Header de la tarjeta */}
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">Pedido #{pedido.id}</h3>
                                <p className="text-sm text-gray-600">{pedido.producto?.nombre || pedido.variacion?.producto_padre?.nombre || 'Producto no especificado'}</p>
                              </div>
                              <div className={`px-3 py-1 rounded-lg border text-sm font-medium flex items-center space-x-2 ${statusConfig.color}`}>
                                <StatusIcon sx={{ fontSize: 16 }} />
                                <span>{statusConfig.text}</span>
                              </div>
                            </div>
                          </div>

                          {/* Contenido de la tarjeta */}
                          <div className="p-6 space-y-6">
                            {/* Información del cliente */}
                            <div className="bg-purple-50 rounded-xl p-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                <PersonPinIcon className="text-purple-600" sx={{ fontSize: 20 }} />
                                <span>Información del Cliente</span>
                              </h4>
                              <div className="space-y-2">
                                <p className="text-gray-800 font-medium">{pedido.nombre_cliente || 'Nombre no especificado'}</p>
                                <p className="text-gray-600 font-medium flex items-center">
                                  <PhoneIcon sx={{ fontSize: 16, marginRight: '4px' }} />
                                  {pedido.telefono_cliente || 'Teléfono no especificado'}
                                </p>
                              </div>
                            </div>

                            {/* Información del producto */}
                            <div className="bg-orange-50 rounded-xl p-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                <LocalShippingIcon className="text-orange-600" sx={{ fontSize: 20 }} />
                                <span>Producto</span>
                              </h4>
                              <div className="space-y-2">
                                {pedido.producto ? renderProductInfo(pedido.producto) : renderProductInfo(pedido.variacion)}
                              </div>
                            </div>

                            {/* Información del mensajero */}
                            <div className="bg-gray-50 rounded-xl p-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                <PersonIcon className="text-gray-600" sx={{ fontSize: 20 }} />
                                <span>Mensajero Asignado</span>
                              </h4>
                              <div className="space-y-1">
                                <p className="text-gray-800 font-medium">{pedido.mensajero?.nombre || 'No asignado'}</p>
                                {pedido.mensajero?.telefono && (
                                  <p className="text-gray-600 text-sm flex items-center">
                                    <PhoneIcon sx={{ fontSize: 16, marginRight: '4px' }} />
                                    {pedido.mensajero.telefono}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Información financiera */}
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="bg-blue-50 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                  <AttachMoneyIcon className="text-blue-600" sx={{ fontSize: 20 }} />
                                  <span>Precios</span>
                                </h4>
                                <div className="space-y-1">
                                  {renderPriceInfo(pedido)}
                                </div>
                              </div>

                              <div className="bg-indigo-50 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                  <ScheduleIcon className="text-indigo-600" sx={{ fontSize: 20 }} />
                                  <span>Entrega</span>
                                </h4>
                                <div className="space-y-1">
                                  <p className="text-gray-600 text-sm">Domicilio: {pedido.domicilio?.precio || '0'}</p>
                                  <p className="text-gray-800">Horario: {formatDate(pedido.horario_deseado_entrega)}</p>
                                </div>
                              </div>
                            </div>

                            {/* Información de entrega */}
                            <div className="bg-green-50 rounded-xl p-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                <HomeIcon className="text-green-600" sx={{ fontSize: 20 }} />
                                <span>Dirección de Entrega</span>
                              </h4>
                              <div className="space-y-2">
                                <p className="text-gray-800">{pedido.domicilio?.ubicacion || 'No especificada'}</p>
                                {pedido.punto_referencia && (
                                  <p className="text-gray-600 text-sm">
                                    <span className="font-medium">Referencia:</span> {pedido.punto_referencia}
                                  </p>
                                )}
                                {pedido.nota && (
                                  <p className="text-gray-600 text-sm">
                                    <span className="font-medium">Nota:</span> {pedido.nota}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === 'historial' && (
              <>
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0 flex items-center">
                      <HistoryIcon className="mr-2 text-blue-500" />
                      Historial de Ventas
                    </h2>
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                      <div className="bg-yellow-100 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center space-x-2">
                          <MonetizationOnIcon className="text-yellow-700" />
                          <span className="text-yellow-800 font-bold">
                            Ganancia total histórica: {calcularGananciaHistorica().toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                      
                      {/* Filtro por mes agregado */}
                      <FormControl sx={{ minWidth: 180 }} size="small">
                        <InputLabel id="month-filter-label">
                          <div className="flex items-center">
                            <FilterListIcon sx={{ fontSize: 18, mr: 1 }} />
                            Filtrar por mes
                          </div>
                        </InputLabel>
                        <Select
                          labelId="month-filter-label"
                          value={monthFilter}
                          label="Filtrar por mes"
                          onChange={(e) => setMonthFilter(e.target.value)}
                          sx={{ borderRadius: '12px' }}
                        >
                          <MenuItem value="all">Todos los meses</MenuItem>
                          {getUniqueMonths().map((monthObj, index) => (
                            <MenuItem key={index} value={monthObj.month}>
                              {monthObj.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                  </div>
                </div>
                
                {filteredHistorial.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg p-16">
                    <div className="text-center">
                      <div className="text-gray-400 mb-4">
                        <HistoryIcon sx={{ fontSize: 64 }} />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {monthFilter === 'all' 
                          ? 'No hay ventas en tu historial' 
                          : 'No hay ventas para el mes seleccionado'}
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {monthFilter === 'all' 
                          ? 'Tus ventas procesadas aparecerán aquí' 
                          : 'Intenta seleccionar otro mes o ver todos los meses'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {filteredHistorial.map((venta) => {
                      const statusConfig = getStatusConfig(venta.estado);
                      const StatusIcon = statusConfig.icon;
                      const productoNombre = venta.producto?.nombre || venta.variacion?.producto_padre?.nombre || 'Producto no especificado';
                      
                      return (
                        <div key={venta.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                          {/* Header de la tarjeta */}
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">Venta #{venta.id}</h3>
                                <p className="text-sm text-gray-600">{productoNombre}</p>
                                <p className="text-xs text-gray-500 mt-1">Fecha: {venta.fecha}</p>
                              </div>
                              <div className={`px-3 py-1 rounded-lg border text-sm font-medium flex items-center space-x-2 ${statusConfig.color}`}>
                                <StatusIcon sx={{ fontSize: 16 }} />
                                <span>{statusConfig.text}</span>
                              </div>
                            </div>
                          </div>

                          {/* Contenido de la tarjeta */}
                          <div className="p-6 space-y-6">
                            {/* Información del cliente */}
                            <div className="bg-purple-50 rounded-xl p-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                <PersonPinIcon className="text-purple-600" sx={{ fontSize: 20 }} />
                                <span>Información del Cliente</span>
                              </h4>
                              <div className="space-y-2">
                                <p className="text-gray-800 font-medium">{venta.nombre_cliente || 'Nombre no especificado'}</p>
                                <p className="text-gray-600 font-medium flex items-center">
                                  <PhoneIcon sx={{ fontSize: 16, marginRight: '4px' }} />
                                  {venta.telefono_cliente || 'Teléfono no especificado'}
                                </p>
                              </div>
                            </div>

                            {/* Información del producto */}
                            <div className="bg-blue-50 rounded-xl p-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                <LocalShippingIcon className="text-blue-600" sx={{ fontSize: 20 }} />
                                <span>Producto Vendido</span>
                              </h4>
                              <div className="space-y-2">
                                {venta.producto ? renderProductInfo(venta.producto) : renderProductInfo(venta.variacion)}
                              </div>
                            </div>

                            {/* Información del mensajero */}
                            <div className="bg-gray-50 rounded-xl p-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                <PersonIcon className="text-gray-600" sx={{ fontSize: 20 }} />
                                <span>Mensajero</span>
                              </h4>
                              <div className="space-y-1">
                                <p className="text-gray-800 font-medium">{venta.mensajero?.nombre || 'No especificado'}</p>
                                {venta.mensajero?.telefono && (
                                  <p className="text-gray-600 text-sm flex items-center">
                                    <PhoneIcon sx={{ fontSize: 16, marginRight: '4px' }} />
                                    {venta.mensajero.telefono}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Información financiera */}
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="bg-green-50 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                  <AttachMoneyIcon className="text-green-600" sx={{ fontSize: 20 }} />
                                  <span>Precios</span>
                                </h4>
                                <div className="space-y-1">
                                  {renderPriceInfo(venta)}
                                </div>
                              </div>

                              <div className="bg-indigo-50 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                  <ScheduleIcon className="text-indigo-600" sx={{ fontSize: 20 }} />
                                  <span>Entrega</span>
                                </h4>
                                <div className="space-y-1">
                                  <p className="text-gray-600 text-sm">Domicilio: {venta.domicilio?.precio || '0'}</p>
                                  <p className="text-gray-800">Horario: {formatDate(venta.horario_deseado_entrega)}</p>
                                </div>
                              </div>
                            </div>

                            {/* Información adicional */}
                            <div className="bg-orange-50 rounded-xl p-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                <HomeIcon className="text-orange-600" sx={{ fontSize: 20 }} />
                                <span>Detalles Adicionales</span>
                              </h4>
                              <div className="space-y-2">
                                <p className="text-gray-800">{venta.domicilio?.ubicacion || 'Dirección no especificada'}</p>
                                {venta.punto_referencia && (
                                  <p className="text-gray-600 text-sm">
                                    <span className="font-medium">Referencia:</span> {venta.punto_referencia}
                                  </p>
                                )}
                                {venta.nota && (
                                  <p className="text-gray-600 text-sm">
                                    <span className="font-medium">Nota:</span> {venta.nota}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

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

export default SalesManagerPage;