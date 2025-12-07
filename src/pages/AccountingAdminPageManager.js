import React, { useState, useEffect } from 'react';
import { 
  Search,
  Filter,
  Download,
  ShoppingCart,
  DollarSign,
  Truck,
  Calendar,
  Package,
  RefreshCw,
  TrendingUp,
  Eye,
  X,
  CalendarDays,
  ChevronUp,
  ChevronDown,
  User
} from 'lucide-react';
import axios from 'axios';
import moment from 'moment';
import * as XLSX from 'xlsx';

import { API_URL } from '../config/apiConfig';
const AccountingManagerPage = () => {
  const [accountingData, setAccountingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  const [totals, setTotals] = useState({
    precio_post_descuento: 0,
    comision: 0,
    domicilio_costo: 0
  });
  
  const [monthFilter, setMonthFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState(['', '']);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para el ordenamiento
  const [sortConfig, setSortConfig] = useState({
    key: 'fecha',
    direction: 'desc'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
          `${API_URL}/listar_contabilidad_superadministrador/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setAccountingData(response.data);
        setFilteredData(response.data);
        calculateTotals(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        showNotification('Error al cargar los datos', 'error');
      }
    };

    fetchData();
  }, []);

  // Función para ordenar los datos
  const sortData = (data, { key, direction }) => {
    const sortedData = [...data];
    
    sortedData.sort((a, b) => {
      let valueA, valueB;
      
      if (key === 'nombre') {
        valueA = a.tipo === 'producto' 
          ? a.datos_producto?.nombre?.toLowerCase() || '' 
          : a.datos_variacion?.modelo?.toLowerCase() || '';
        valueB = b.tipo === 'producto' 
          ? b.datos_producto?.nombre?.toLowerCase() || '' 
          : b.datos_variacion?.modelo?.toLowerCase() || '';
      } else if (key === 'fecha') {
        valueA = moment(a.fecha).valueOf();
        valueB = moment(b.fecha).valueOf();
      }
      
      if (valueA < valueB) {
        return direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return sortedData;
  };

  useEffect(() => {
    let filtered = [...accountingData];
    
    if (monthFilter) {
      const [year, month] = monthFilter.split('-');
      filtered = filtered.filter(item => {
        const itemDate = moment(item.fecha);
        return itemDate.month() === parseInt(month) - 1 && 
               itemDate.year() === parseInt(year);
      });
    }
    
    if (dateRangeFilter[0] && dateRangeFilter[1]) {
      filtered = filtered.filter(item => {
        const itemDate = moment(item.fecha);
        return itemDate.isBetween(moment(dateRangeFilter[0]), moment(dateRangeFilter[1]), null, '[]');
      });
    }
    
    if (productFilter) {
      const searchTerm = productFilter.toLowerCase();
      filtered = filtered.filter(item => {
        if (item.tipo === 'producto') {
          return item.datos_producto.nombre.toLowerCase().includes(searchTerm);
        } else {
          return item.datos_variacion.modelo.toLowerCase().includes(searchTerm);
        }
      });
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.tipo === typeFilter);
    }
    
    // Aplicar ordenamiento después de filtrar
    const sortedData = sortData(filtered, sortConfig);
    setFilteredData(sortedData);
    calculateTotals(sortedData);
  }, [accountingData, monthFilter, productFilter, dateRangeFilter, typeFilter, sortConfig]);

  // Función para manejar el cambio de ordenamiento
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Función para obtener el icono de ordenamiento
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const calculateTotals = (data) => {
    let precioTotal = 0;
    let comisionTotal = 0;
    let domicilioTotal = 0;

    data.forEach(item => {
      if (item.tipo === 'producto') {
        precioTotal += item.datos_producto.precio_post_descuento || 0;
        
        if (item.gestor !== null) {
          comisionTotal += item.datos_producto.comision || 0;
        }
        
        if (item.datos_producto.precio_post_descuento >= 200) {
          domicilioTotal += item.datos_producto.domicilio_costo || 0;
        }
      } else if (item.tipo === 'variacion') {
        precioTotal += item.datos_variacion.precio_post_descuento || 0;
        
        if (item.gestor !== null) {
          comisionTotal += item.datos_variacion.comision || 0;
        }
        
        if (item.datos_variacion.precio_post_descuento >= 200) {
          domicilioTotal += item.datos_variacion.domicilio_costo || 0;
        }
      }
    });

    setTotals({
      precio_post_descuento: precioTotal,
      comision: comisionTotal,
      domicilio_costo: domicilioTotal
    });
  };

  const clearFilters = () => {
    setMonthFilter('');
    setDateRangeFilter(['', '']);
    setProductFilter('');
    setTypeFilter('all');
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({ show: true, message, type: severity });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const exportDailySalesToExcel = () => {
    try {
      const today = moment().startOf('day');
      const dailySales = accountingData.filter(item => {
        try {
          return moment(item.fecha).isSame(today, 'day');
        } catch (error) {
          console.error('Error procesando fecha:', error);
          return false;
        }
      });

      if (dailySales.length === 0) {
        showNotification('No hay ventas registradas hoy', 'warning');
        return;
      }

      // Calcular totales por moneda
      const totalsByCurrency = {};
      dailySales.forEach(item => {
        const currency = item.moneda_nombre;
        const price = item.tipo === 'producto' 
          ? parseFloat(item.datos_producto?.precio_post_descuento || 0)
          : parseFloat(item.datos_variacion?.precio_post_descuento || 0);
        
        if (!totalsByCurrency[currency]) {
          totalsByCurrency[currency] = 0;
        }
        totalsByCurrency[currency] += price * (item.moneda_cambio || 1);
      });

      const excelData = dailySales.map(item => ({
        'ID': item.id,
        'Fecha': item.fecha,
        'Tipo': item.tipo === 'producto' ? 'Producto' : 'Variación',
        'Nombre/Modelo': item.tipo === 'producto' 
          ? item.datos_producto?.nombre || 'N/A'
          : item.datos_variacion?.modelo || 'N/A',
        'Precio Venta': item.tipo === 'producto' 
          ? parseFloat(item.datos_producto?.precio_post_descuento || 0).toFixed(2)
          : parseFloat(item.datos_variacion?.precio_post_descuento || 0).toFixed(2),
        'Precio Gestor': item.tipo === 'producto' 
          ? (item.precio_gestor !== null 
              ? parseFloat(item.precio_gestor || 0).toFixed(2)
              : 'N/A')
          : (item.precio_gestor !== null 
              ? parseFloat(item.precio_gestor || 0).toFixed(2)
              : 'N/A'),
        'Moneda': `${item.moneda_nombre}(${item.moneda_cambio})`,
        'Comisión': item.gestor 
          ? (item.tipo === 'producto'
              ? parseFloat(item.datos_producto?.comision || 0).toFixed(2)
              : parseFloat(item.datos_variacion?.comision || 0).toFixed(2))
          : 'N/A',
        'Domicilio': (item.tipo === 'producto' 
          ? (item.datos_producto?.precio_post_descuento >= 200 
              ? parseFloat(item.datos_producto?.domicilio_costo || 0).toFixed(2)
              : 'N/A')
          : (item.datos_variacion?.precio_post_descuento >= 200 
              ? parseFloat(item.datos_variacion?.domicilio_costo || 0).toFixed(2)
              : 'N/A'))
      }));

      // Agregar filas vacías y totales
      excelData.push({});
      excelData.push({});
      
      // Agregar totales por moneda
      Object.keys(totalsByCurrency).forEach(currency => {
        excelData.push({
          'Nombre/Modelo': `Total ${currency}:`,
          'Precio Venta': totalsByCurrency[currency].toFixed(2)
        });
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ventas Diarias");
      
      const dateStr = moment().format('YYYY-MM-DD');
      XLSX.writeFile(wb, `Ventas_Diarias_${dateStr}.xlsx`);
      
      showNotification(`Reporte generado con ${dailySales.length} registros`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      showNotification('Error al generar el reporte', 'error');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md w-full">
          <div className="text-red-600 text-center">
            <h3 className="text-lg font-semibold mb-2">Error al cargar los datos</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
        } text-white`}>
          <div className="flex items-center gap-2">
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification({ show: false, message: '', type: 'success' })}
              className="ml-2 hover:bg-white hover:bg-opacity-20 rounded p-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Contabilidad de Ventas (Administrador)
              </h1>
              <p className="text-gray-600">Panel de visualización de ventas, comisiones y domicilios</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  showFilters ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter size={16} />
                Filtros
              </button>
              <button
                onClick={exportDailySalesToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              >
                <Download size={16} />
                Exportar Diario
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarDays size={16} className="inline mr-1" />
                  Mes y Año
                </label>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Producto
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nombre del producto..."
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desde
                </label>
                <input
                  type="date"
                  value={dateRangeFilter[0]}
                  onChange={(e) => setDateRangeFilter([e.target.value, dateRangeFilter[1]])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hasta
                </label>
                <input
                  type="date"
                  value={dateRangeFilter[1]}
                  onChange={(e) => setDateRangeFilter([dateRangeFilter[0], e.target.value])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="producto">Productos</option>
                  <option value="variacion">Variaciones</option>
                </select>
              </div>
            </div>
            
            {/* Active Filters */}
            {(monthFilter || dateRangeFilter.some(Boolean) || productFilter || typeFilter !== 'all') && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Filtros aplicados:</p>
                <div className="flex flex-wrap gap-2">
                  {monthFilter && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Mes: {moment(monthFilter + '-01').format('MMMM YYYY')}
                      <button onClick={() => setMonthFilter('')} className="hover:bg-blue-200 rounded-full p-1">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {dateRangeFilter[0] && dateRangeFilter[1] && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Rango: {moment(dateRangeFilter[0]).format('DD/MM')} - {moment(dateRangeFilter[1]).format('DD/MM')}
                      <button onClick={() => setDateRangeFilter(['', ''])} className="hover:bg-green-200 rounded-full p-1">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {productFilter && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                      Producto: {productFilter}
                      <button onClick={() => setProductFilter('')} className="hover:bg-purple-200 rounded-full p-1">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {typeFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                      Tipo: {typeFilter === 'producto' ? 'Productos' : 'Variaciones'}
                      <button onClick={() => setTypeFilter('all')} className="hover:bg-orange-200 rounded-full p-1">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                <ShoppingCart size={24} />
              </div>
              <TrendingUp size={20} className="opacity-70" />
            </div>
            <h3 className="text-lg font-medium opacity-90">Total Ventas</h3>
            <p className="text-3xl font-bold">{formatCurrency(totals.precio_post_descuento)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                <DollarSign size={24} />
              </div>
              <TrendingUp size={20} className="opacity-70" />
            </div>
            <h3 className="text-lg font-medium opacity-90">Total Comisiones</h3>
            <p className="text-3xl font-bold">{formatCurrency(totals.comision)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                <Truck size={24} />
              </div>
              <TrendingUp size={20} className="opacity-70" />
            </div>
            <h3 className="text-lg font-medium opacity-90">Total Domicilios</h3>
            <p className="text-3xl font-bold">{formatCurrency(totals.domicilio_costo)}</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Eye size={20} />
              Registros de Ventas ({filteredData.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('fecha')}
                  >
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      Fecha
                      {getSortIcon('fecha')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('nombre')}
                  >
                    <div className="flex items-center gap-1">
                      <Package size={14} />
                      Nombre/Modelo
                      {getSortIcon('nombre')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      Precio Venta
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      Precio Gestor
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Moneda
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comisión
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Truck size={14} />
                      Domicilio
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{item.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          item.tipo === 'producto' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.tipo === 'producto' ? 'Producto' : 'Variación'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs">
                          {item.tipo === 'producto' 
                            ? item.datos_producto?.nombre 
                            : `${item.datos_variacion?.modelo} ${item.datos_variacion?.color ? `(${item.datos_variacion.color})` : ''}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(
                          item.tipo === 'producto' 
                            ? item.datos_producto?.precio_post_descuento || 0
                            : item.datos_variacion?.precio_post_descuento || 0
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.tipo === 'producto' 
                          ? (item.precio_gestor !== null 
                              ? formatCurrency(item.precio_gestor || 0)
                              : <span className="text-gray-400">-</span>)
                          : (item.precio_gestor !== null 
                              ? formatCurrency(item.precio_gestor || 0)
                              : <span className="text-gray-400">-</span>)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.moneda_nombre} ({item.moneda_cambio})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.gestor ? 
                          formatCurrency(
                            item.tipo === 'producto' 
                              ? item.datos_producto?.comision || 0
                              : item.datos_variacion?.comision || 0
                          ) : 
                          <span className="text-gray-400">-</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(item.tipo === 'producto' 
                          ? item.datos_producto?.precio_post_descuento >= 200 
                          : item.datos_variacion?.precio_post_descuento >= 200) ?
                          formatCurrency(
                            item.tipo === 'producto' 
                              ? item.datos_producto?.domicilio_costo || 0
                              : item.datos_variacion?.domicilio_costo || 0
                          ) :
                          <span className="text-gray-400">-</span>
                        }
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Package size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No se encontraron registros</p>
                        <p className="text-sm">Ajusta los filtros para ver más resultados</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {filteredData.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-semibold">{filteredData.length}</span> de <span className="font-semibold">{accountingData.length}</span> registros
                </p>
                <div className="text-sm text-gray-500 mt-2 sm:mt-0">
                  Última actualización: {moment().format('DD/MM/YYYY HH:mm')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountingManagerPage;