import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Snackbar,
  Alert,
  TextField,
  MenuItem,
  Button,
  InputAdornment,
  Chip,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import DirectionsIcon from '@mui/icons-material/Directions';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TodayIcon from '@mui/icons-material/Today';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import ViewListIcon from '@mui/icons-material/ViewList';
import SearchIcon from '@mui/icons-material/Search';

import { API_URL } from '../config/apiConfig';
const MessengerListPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [groupedDeliveries, setGroupedDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const navigate = useNavigate();

  const groupDeliveries = useCallback((deliveries) => {
    const groups = {};
    
    deliveries.forEach(delivery => {
      const groupKey = `${delivery.cliente.telefono}_${delivery.domicilio.ubicacion}_${delivery.fecha}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          ids: [delivery.id],
          cliente: delivery.cliente,
          domicilio: delivery.domicilio,
          referencia: delivery.referencia,
          horario: delivery.horario,
          fecha: delivery.fecha,
          fechaObj: delivery.fechaObj,
          moneda: delivery.moneda,
          nota: delivery.nota,

          productos: [{
            id: delivery.id,
            nombre: delivery.producto.nombre,
            variacion: delivery.variacion,
            precio: delivery.precio,
            garantia: delivery.producto.garantia,
            regalo: delivery.producto.regalo,
            regalo_nombre: delivery.producto.regalo_nombre,
            estado: delivery.estado
          }],
          estado: delivery.estado
        };
      } else {
        groups[groupKey].ids.push(delivery.id);
        groups[groupKey].productos.push({
          id: delivery.id,
          nombre: delivery.producto.nombre,
          variacion: delivery.variacion,
          precio: delivery.precio,
          garantia: delivery.producto.garantia,
          regalo: delivery.producto.regalo,
          regalo_nombre: delivery.producto.regalo_nombre,
          estado: delivery.estado
        });
        if (!groups[groupKey].nota && delivery.nota) {
          groups[groupKey].nota = delivery.nota;
        }
      }
    });
    
    return Object.values(groups);
  }, []);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return false;
      }

      const response = await fetch(`${API_URL}/listar_venta_mensajero/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener las entregas');
      }

      const data = await response.json();
      
      const formattedData = data.map(item => ({
        key: item.id,
        id: item.id,
        cliente: {
          nombre: item.nombre_cliente || 'No especificado',
          telefono: item.telefono_cliente || 'No especificado',
          username: item.cliente?.username || 'No especificado',
          phone: item.cliente?.telefono || 'No especificado',
        },
        producto: {
          nombre: item.producto?.nombre || 'Producto no especificado',
          garantia: item.producto?.garantia || false,
          regalo: item.producto?.regalo || false,
          regalo_nombre: item.producto?.regalo_nombre || null
        },
        variacion: item.variacion ? {
          nombre: item.variacion.item_info?.nombre || 'Sin variaci�n',
          color: item.variacion.item_info?.color || 'Sin color',
          modelo: item.variacion.item_info?.modelo || 'Sin modelo'
        } : null,
        precio: item.costo_post_descuento || '0.00',
        moneda: item.moneda?.nombre || 'No especificada',
        domicilio: {
          ubicacion: item.domicilio?.ubicacion || 'Ubicaci�n no especificada',
          precio: item.domicilio?.precio || '0.00'
        },
        nota: item.nota || '',
        referencia: item.punto_referencia || 'Sin referencia',
        horario: item.horario_deseado_entrega ? new Date(item.horario_deseado_entrega).toLocaleString() : 'No especificado',
        fecha: item.horario_deseado_entrega ? new Date(item.horario_deseado_entrega).toLocaleDateString() : 'No especificado',
        fechaObj: item.horario_deseado_entrega ? new Date(item.horario_deseado_entrega) : null,
        estado: 'pendiente'
      }));

      setDeliveries(formattedData);
      
      // Agrupar entregas
      const grouped = groupDeliveries(formattedData);
      setGroupedDeliveries(grouped);
      setFilteredDeliveries(grouped);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [navigate, groupDeliveries]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  useEffect(() => {
    applyFilters();
  }, [filter, selectedDate, groupedDeliveries]);


  const applyFilters = () => {
    let filtered = [...groupedDeliveries];

    if (filter === 'today') {
      const today = new Date().toLocaleDateString();
      filtered = filtered.filter(delivery => delivery.fecha === today);
    } else if (filter === 'date' && selectedDate) {
      const selectedDateFormatted = new Date(selectedDate).toLocaleDateString();
      filtered = filtered.filter(delivery => delivery.fecha === selectedDateFormatted);
    }

    setFilteredDeliveries(filtered);
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
    if (event.target.value !== 'date') {
      setSelectedDate('');
    }
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setFilter('date');
  };

  const clearFilters = () => {
    setFilter('all');
    setSelectedDate('');
  };

  const getStatusConfig = (estado) => {
    switch (estado) {
      case 'entregado':
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: CheckCircleIcon,
          text: 'Entregado'
        };
      case 'cancelado':
        return { 
          color: 'bg-red-100 text-red-800 border-red-200', 
          icon: CancelIcon,
          text: 'Cancelado'
        };
      case 'en_camino':
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          icon: DirectionsIcon,
          text: 'En Camino'
        };
      default: // pendiente
        return { 
          color: 'bg-orange-100 text-orange-800 border-orange-200', 
          icon: PendingIcon,
          text: 'Pendiente'
        };
    }
  };

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  const handlePerformDelivery = async (deliveryId) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Debes iniciar sesiA3n nuevamente.');
      navigate('/login');
      return;
    }

    try {
      setActionLoadingId(deliveryId);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_URL}/realizar_mensajeria/${deliveryId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let message = 'No se pudo actualizar la mensajerA-a.';
        try {
          const errorData = await response.json();
          if (typeof errorData === 'string') {
            message = errorData;
          } else if (errorData?.detail) {
            message = errorData.detail;
          } else if (errorData?.message) {
            message = errorData.message;
          }
        } catch (parseError) {
          // Ignorar errores de parseo y usar el mensaje genA3rico
        }
        throw new Error(message);
      }

      let successMessage = 'Entrega actualizada correctamente.';
      try {
        const result = await response.json();
        if (typeof result === 'string') {
          successMessage = result;
        } else if (result?.message) {
          successMessage = result.message;
        }
      } catch (parseError) {
        // Ignorar errores de parseo cuando no hay contenido
      }

      setSuccess(successMessage);
      const refreshed = await fetchDeliveries();
      if (!refreshed) {
        setSuccess(null);
      }
    } catch (err) {
      setError(err.message || 'OcurriA3 un error al actualizar la mensajerA-a.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const getFilterDisplayText = () => {
    if (filter === 'today') return 'Entregas para hoy';
    if (filter === 'date' && selectedDate) return `Entregas para el ${new Date(selectedDate).toLocaleDateString()}`;
    return 'Todas las entregas';
  };
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl mb-4">
              <LocalShippingIcon className="text-white" sx={{ fontSize: 32 }} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Entregas</h1>
            <p className="text-gray-600">Gestiona tus entregas asignadas como mensajero</p>
          </div>
          
          {/* Panel de Filtros Mejorado */}
          <div className="bg-gradient-to-r from-gray-50 to-orange-50 rounded-2xl p-6 border border-orange-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-xl">
                <FilterAltIcon className="text-orange-600" sx={{ fontSize: 20 }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filtrar Entregas</h3>
                <p className="text-sm text-gray-600">Encuentra rápidamente las entregas que necesitas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
              {/* Selector de filtro principal */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Tipo de filtro</label>
                <TextField
                  select
                  value={filter}
                  onChange={handleFilterChange}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#FF6B00',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#FF6B00',
                        borderWidth: '2px',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ViewListIcon sx={{ color: '#FF6B00', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="all">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span>Todas las entregas</span>
                    </div>
                  </MenuItem>
                  <MenuItem value="today">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                      <span>Solo hoy</span>
                    </div>
                  </MenuItem>
                  <MenuItem value="date">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span>Fecha específica</span>
                    </div>
                  </MenuItem>
                </TextField>
              </div>
              
              {/* Selector de fecha (aparece cuando se selecciona 'date') */}
              {filter === 'date' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Seleccionar fecha</label>
                  <TextField
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: 'white',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FF6B00',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FF6B00',
                          borderWidth: '2px',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonthIcon sx={{ color: '#FF6B00', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>
              )}
              
              {/* Botón para limpiar filtros */}
              <div className="flex space-x-3">
                {(filter !== 'all' || selectedDate) && (
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    startIcon={<ClearIcon />}
                    sx={{
                      borderRadius: '12px',
                      borderColor: '#DC2626',
                      color: '#DC2626',
                      backgroundColor: 'white',
                      fontWeight: 600,
                      padding: '8px 20px',
                      '&:hover': {
                        backgroundColor: '#FEF2F2',
                        borderColor: '#B91C1C',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    Limpiar
                  </Button>
                )}
                
                <Button
                  variant="contained"
                  onClick={handleRefresh}
                  startIcon={<SearchIcon />}
                  sx={{
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #FF6B00 0%, #FF8500 100%)',
                    fontWeight: 600,
                    padding: '8px 20px',
                    boxShadow: '0 4px 12px rgba(255, 107, 0, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #E55A00 0%, #E57000 100%)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 16px rgba(255, 107, 0, 0.4)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  Actualizar
                </Button>
              </div>
            </div>

            {/* Chips de filtros activos */}
            {(filter !== 'all' || selectedDate) && (
              <div className="mt-4 pt-4 border-t border-orange-200">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Filtros activos:</span>
                  <div className="flex flex-wrap gap-2">
                    {filter === 'today' && (
                      <Chip
                        label="Entregas de hoy"
                        icon={<TodayIcon />}
                        variant="filled"
                        size="small"
                        sx={{
                          backgroundColor: '#FED7AA',
                          color: '#EA580C',
                          fontWeight: 600,
                          borderRadius: '8px',
                        }}
                      />
                    )}
                    {filter === 'date' && selectedDate && (
                      <Chip
                        label={`Fecha: ${new Date(selectedDate).toLocaleDateString()}`}
                        icon={<CalendarMonthIcon />}
                        variant="filled"
                        size="small"
                        sx={{
                          backgroundColor: '#DBEAFE',
                          color: '#1D4ED8',
                          fontWeight: 600,
                          borderRadius: '8px',
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Cargando entregas...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <CancelIcon className="text-red-500 mb-4" sx={{ fontSize: 48 }} />
              <h3 className="text-lg font-medium text-red-700 mb-2">Error al cargar entregas</h3>
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
            {filteredDeliveries.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-16">
                <div className="text-center">
                  <div className="text-gray-400 mb-4">
                    <LocalShippingIcon sx={{ fontSize: 64 }} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {filter === 'today' ? 'No tienes entregas para hoy' : 
                     filter === 'date' ? 'No tienes entregas para la fecha seleccionada' : 
                     'No tienes entregas asignadas'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {filter === 'all' ? 'Cuando se te asignen entregas, aparecerán aquí' : 
                     'Prueba con otra fecha o elimina los filtros'}
                  </p>
                  {(filter !== 'all') && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={clearFilters}
                      startIcon={<ClearIcon />}
                    >
                      Ver todas las entregas
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl">
                        <TodayIcon className="text-white" sx={{ fontSize: 20 }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{getFilterDisplayText()}</h3>
                        <p className="text-sm text-gray-600">Resultados de búsqueda</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 px-4 py-2 rounded-xl border border-orange-200">
                      <span className="font-bold text-lg">{filteredDeliveries.length}</span>
                      <span className="text-sm ml-1">{filteredDeliveries.length === 1 ? 'entrega' : 'entregas'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                  {filteredDeliveries.map((group, index) => {
                    const statusConfig = getStatusConfig(group.estado);
                    const StatusIcon = statusConfig.icon;
                    const primaryDeliveryId = group.ids[0];
                    
                    return (
                      <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                        {/* Header de la tarjeta */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">Entrega #{group.ids.join(' y ')}</h3>
                              <p className="text-sm text-gray-600">{group.productos.length} producto{group.productos.length > 1 ? 's' : ''}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {primaryDeliveryId && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handlePerformDelivery(primaryDeliveryId)}
                                  disabled={actionLoadingId === primaryDeliveryId}
                                  sx={{
                                    borderRadius: '9999px',
                                    background: 'linear-gradient(135deg, #FF6B00 0%, #FF8500 100%)',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    padding: '6px 16px',
                                    boxShadow: '0 4px 12px rgba(255, 107, 0, 0.3)',
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #E55A00 0%, #E57000 100%)',
                                      transform: 'translateY(-1px)',
                                      boxShadow: '0 6px 16px rgba(255, 107, 0, 0.4)',
                                    },
                                    '&.Mui-disabled': {
                                      background: 'rgba(255, 107, 0, 0.4)',
                                      color: '#fff',
                                      boxShadow: 'none',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                  }}
                                >
                                  {actionLoadingId === primaryDeliveryId ? 'Procesando...' : 'Realizar mensajeria'}
                                </Button>
                              )}
                              <div className={`px-3 py-1 rounded-lg border text-sm font-medium flex items-center space-x-2 ${statusConfig.color}`}>
                                <StatusIcon sx={{ fontSize: 16 }} />
                                <span>{statusConfig.text}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Contenido de la tarjeta */}
                        <div className="p-6 space-y-6">
                          {/* Lista de productos */}
                          <div className="space-y-4">
                            {group.productos.map((producto, pIndex) => (
                              <div key={pIndex} className="bg-orange-50 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                  <LocalShippingIcon className="text-orange-600" sx={{ fontSize: 20 }} />
                                  <span>Producto {group.productos.length > 1 ? pIndex + 1 : ''}</span>
                                </h4>
                                <div className="space-y-2">
                                  <p className="text-gray-800 font-medium">{producto.nombre}</p>
                                  
                                  {producto.variacion && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {producto.variacion.nombre && producto.variacion.nombre !== 'Sin variación' && (
                                        <span className="bg-white px-3 py-1 rounded-lg text-sm border border-orange-200">
                                          {producto.variacion.nombre}
                                        </span>
                                      )}
                                      {producto.variacion.color && producto.variacion.color !== 'Sin color' && (
                                        <span className="bg-white px-3 py-1 rounded-lg text-sm border border-orange-200">
                                          {producto.variacion.color}
                                        </span>
                                      )}
                                      {producto.variacion.modelo && producto.variacion.modelo !== 'Sin modelo' && (
                                        <span className="bg-white px-3 py-1 rounded-lg text-sm border border-orange-200">
                                          {producto.variacion.modelo}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {producto.regalo && producto.regalo_nombre && (
                                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-1">
                                        <CardGiftcardIcon sx={{ fontSize: 14 }} />
                                        <span>Regalo: {producto.regalo_nombre}</span>
                                      </span>
                                    )}
                                    {producto.garantia && (
                                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-1">
                                        <VerifiedUserIcon sx={{ fontSize: 14 }} />
                                        <span>Con garantía</span>
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="mt-2 flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">Precio:</span>
                                    <span className="text-gray-800 font-bold">{producto.precio} {group.moneda}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Información del cliente */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                <PhoneIcon className="text-gray-600" sx={{ fontSize: 20 }} />
                                <span>Cliente</span>
                              </h4>
                              <div className="space-y-1">
                                <p className="text-gray-800 font-medium">{group.cliente.nombre === "No especificado" ? group.cliente.username : group.cliente.nombre}</p>
                                <p className="text-gray-600 text-sm">{group.cliente.telefono === "No especificado" ? group.cliente.phone : group.cliente.telefono}</p>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                <AttachMoneyIcon className="text-gray-600" sx={{ fontSize: 20 }} />
                                <span>Domicilio</span>
                              </h4>
                              <div className="space-y-1">
                                <p className="text-gray-800 font-bold text-lg">{group.domicilio.precio} Moneda Nacional</p>
                                <p className="text-gray-600 text-sm">Total productos: {group.productos.reduce((sum, p) => sum + parseFloat(p.precio), 0).toFixed(2)} {group.moneda}</p>
                              </div>
                            </div>
                          </div>

                          {/* Información de entrega */}
                          <div className="bg-blue-50 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                              <HomeIcon className="text-blue-600" sx={{ fontSize: 20 }} />
                              <span>Dirección de Entrega</span>
                            </h4>
                            <div className="space-y-2">
                              <p className="text-gray-800">{group.domicilio.ubicacion}</p>
                              {group.referencia && group.referencia !== 'Sin referencia' && (
                                <p className="text-gray-600 text-sm">
                                  <span className="font-medium">Referencia:</span> {group.referencia}
                                </p>
                              )}
                              {group.nota && group.nota.trim() !== '' && (
                                <p className="text-gray-600 text-sm">
                                  <span className="font-medium">Nota:</span> {group.nota}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 text-gray-600 text-sm mt-3">
                                <ScheduleIcon sx={{ fontSize: 16 }} />
                                <span><span className="font-medium">Horario deseado:</span> {group.horario}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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

export default MessengerListPage;





