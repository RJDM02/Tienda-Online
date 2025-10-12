import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Snackbar,
  Alert,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import BarChartIcon from '@mui/icons-material/BarChart';
import LineChartIcon from '@mui/icons-material/ShowChart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SellIcon from '@mui/icons-material/Sell';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import CakeIcon from '@mui/icons-material/Cake';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatisticsPage = () => {
  const [statsData, setStatsData] = useState({
    estadistica_cliente: {
      total_clientes: 0,
      clientes: []
    },
    estadistica_producto: {
      productos: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const navigate = useNavigate();

  // Estado para los datos de las gráficas
  const [clientFlowData, setClientFlowData] = useState([]);
  const [productSalesData, setProductSalesData] = useState([]);

  // Función para generar los datos de las gráficas basados en los datos reales
  const generateChartData = (data) => {
    // Obtener el mes y año actual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Determinar los días del mes actual
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Crear intervalos de días
    const firstInterval = Array.from({length: 15}, (_, i) => i + 1);
    const secondInterval = Array.from({length: daysInMonth - 15}, (_, i) => i + 16);
    
    // Procesar datos de clientes (visitas)
    const clientVisitsByDay = {};
    
    data.estadistica_cliente.clientes.forEach(cliente => {
      if (cliente.ultima_visita) {
        const visitDate = new Date(cliente.ultima_visita);
        if (visitDate.getMonth() === currentMonth && visitDate.getFullYear() === currentYear) {
          const day = visitDate.getDate();
          clientVisitsByDay[day] = (clientVisitsByDay[day] || 0) + 1;
        }
      }
    });
    
    // Procesar datos de productos (ventas)
    const productSalesByDay = {};
    
    data.estadistica_producto.productos.forEach(producto => {
      if (producto.ultima_venta) {
        const saleDate = new Date(producto.ultima_venta);
        if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
          const day = saleDate.getDate();
          productSalesByDay[day] = (productSalesByDay[day] || 0) + 1;
        }
      }
    });
    
    // Generar datos para la gráfica de clientes
    const clientData = [
      ...firstInterval.map(day => ({
        name: `Día ${day}`,
        visitas: clientVisitsByDay[day] || 0
      })),
      ...secondInterval.map(day => ({
        name: `Día ${day}`,
        visitas: clientVisitsByDay[day] || 0
      }))
    ];
    
    // Generar datos para la gráfica de productos
    const productData = [
      ...firstInterval.map(day => ({
        name: `Día ${day}`,
        ventas: productSalesByDay[day] || 0
      })),
      ...secondInterval.map(day => ({
        name: `Día ${day}`,
        ventas: productSalesByDay[day] || 0
      }))
    ];
    
    setClientFlowData(clientData);
    setProductSalesData(productData);
  };

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('https://videojuegoshabana.com/api/listar_estadistica/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener las estadísticas');
        }

        const data = await response.json();
        setStatsData(data);
        generateChartData(data);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStatsData();
  }, [navigate]);

  // Resto del componente permanece igual...
  const formatDate = (dateString) => {
    if (!dateString) return 'No especificado';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const handleCloseAlert = () => {
    setError(null);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Estadísticas</h1>
            <p className="text-gray-600">Resumen de actividad de clientes y productos</p>
            <div className="flex justify-center mt-4">
              <div className="bg-gray-100 rounded-full p-1 inline-flex">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'general' ? 'bg-white shadow-md text-blue-600' : 'text-gray-600'}`}
                >
                  <EqualizerIcon className="mr-2" sx={{ fontSize: 20 }} />
                  General
                </button>
                <button
                  onClick={() => setActiveTab('clientes')}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'clientes' ? 'bg-white shadow-md text-blue-600' : 'text-gray-600'}`}
                >
                  <PeopleIcon className="mr-2" sx={{ fontSize: 20 }} />
                  Clientes
                </button>
                <button
                  onClick={() => setActiveTab('productos')}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'productos' ? 'bg-white shadow-md text-blue-600' : 'text-gray-600'}`}
                >
                  <ShoppingCartIcon className="mr-2" sx={{ fontSize: 20 }} />
                  Productos
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Cargando estadísticas...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <CancelIcon className="text-red-500 mb-4" sx={{ fontSize: 48 }} />
              <h3 className="text-lg font-medium text-red-700 mb-2">Error al cargar estadísticas</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'general' && (
              <>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <LineChartIcon className="mr-2 text-blue-500" />
                    Flujo de clientes (últimos 15 días)
                  </h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={clientFlowData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="visitas" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <BarChartIcon className="mr-2 text-blue-500" />
                    Ventas de productos (últimos 15 días)
                  </h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={productSalesData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="ventas" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <PeopleIcon className="mr-2 text-blue-500" />
                      Resumen de Clientes
                    </h2>
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-gray-600">Total de clientes registrados</p>
                        <p className="text-3xl font-bold text-blue-600">{statsData.estadistica_cliente.total_clientes}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-gray-600">Clientes activos</p>
                        <p className="text-3xl font-bold text-green-600">
                          {statsData.estadistica_cliente.clientes.filter(c => c.activo).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <ShoppingCartIcon className="mr-2 text-blue-500" />
                      Resumen de Productos
                    </h2>
                    <div className="space-y-4">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-gray-600">Total de productos</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {statsData.estadistica_producto.productos.length}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-gray-600">Productos vendidos</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {statsData.estadistica_producto.productos.filter(p => p.ventas_producto > 0).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Resto del componente (pestañas de clientes y productos) permanece igual */}
            {activeTab === 'clientes' && (
              <>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <PeopleIcon className="mr-2 text-blue-500" />
                    Estadísticas de Clientes
                  </h2>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600">Total de clientes</p>
                          <p className="text-3xl font-bold text-blue-600">{statsData.estadistica_cliente.total_clientes}</p>
                        </div>
                        <PeopleIcon className="text-blue-400" sx={{ fontSize: 40 }} />
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-6 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600">Clientes activos</p>
                          <p className="text-3xl font-bold text-green-600">
                            {statsData.estadistica_cliente.clientes.filter(c => c.activo).length}
                          </p>
                        </div>
                        <CheckCircleIcon className="text-green-400" sx={{ fontSize: 40 }} />
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-6 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600">Total visitas</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {statsData.estadistica_cliente.clientes.reduce((acc, curr) => acc + curr.cant_visitas, 0)}
                          </p>
                        </div>
                        <VisibilityIcon className="text-purple-400" sx={{ fontSize: 40 }} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cliente
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contacto
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Visitas
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Última visita
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {statsData.estadistica_cliente.clientes.map((cliente) => (
                          <tr key={cliente.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <PersonIcon className="flex-shrink-0 h-10 w-10 text-gray-400" />
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{cliente.username}</div>
                                  {cliente.cumple && (
                                    <div className="text-sm text-gray-500 flex items-center">
                                      <CakeIcon className="mr-1" sx={{ fontSize: 14 }} />
                                      {formatDate(cliente.cumple)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{cliente.correo}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <PhoneIcon className="mr-1" sx={{ fontSize: 14 }} />
                                {cliente.telefono}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {cliente.cant_visitas} visitas
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(cliente.ultima_visita)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {cliente.activo ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Activo
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Inactivo
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'productos' && (
              <>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <ShoppingCartIcon className="mr-2 text-blue-500" />
                    Estadísticas de Productos
                  </h2>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600">Total de productos</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {statsData.estadistica_producto.productos.length}
                          </p>
                        </div>
                        <ShoppingCartIcon className="text-blue-400" sx={{ fontSize: 40 }} />
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-6 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600">Productos vendidos</p>
                          <p className="text-3xl font-bold text-green-600">
                            {statsData.estadistica_producto.productos.filter(p => p.ventas_producto > 0).length}
                          </p>
                        </div>
                        <SellIcon className="text-green-400" sx={{ fontSize: 40 }} />
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-6 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600">Total visitas</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {statsData.estadistica_producto.productos.reduce((acc, curr) => acc + curr.cant_visitas, 0)}
                          </p>
                        </div>
                        <VisibilityIcon className="text-purple-400" sx={{ fontSize: 40 }} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Visitas
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ventas
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Última venta
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tasa conversión
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {statsData.estadistica_producto.productos.map((producto) => (
                          <tr key={producto.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {producto.cant_visitas} visitas
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {producto.ventas_producto > 0 ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {producto.ventas_producto} ventas
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Sin ventas
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {producto.ultima_venta ? formatDate(producto.ultima_venta) : 'Nunca'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {producto.cant_visitas > 0 ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                  {Math.round((producto.ventas_producto / producto.cant_visitas) * 100)}%
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  N/A
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
      </div>
    </div>
  );
};

export default StatisticsPage;