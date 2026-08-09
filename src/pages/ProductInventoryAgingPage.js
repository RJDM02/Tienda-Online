import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Snackbar } from '@mui/material';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import ProductInventoryAgingCharts from '../components/ProductInventoryAgingCharts';
import { API_URL } from '../config/apiConfig';

const ProductInventoryAgingPage = () => {
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState('30');

  const fetchAnalyticsData = useCallback(async (selectedLimit) => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const query = selectedLimit === 'all' ? '' : `?limite=${selectedLimit}`;
      const response = await fetch(`${API_URL}/listar_analitica_antiguedad_productos/${query}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener la analítica de antigüedad de productos');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la analítica');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAnalyticsData(limit);
  }, [fetchAnalyticsData, limit]);

  const products = analyticsData?.productos || [];

  const barData = useMemo(() => {
    const fallback = products.map((product) => ({
      producto_id: product.id,
      producto: product.nombre,
      dias_en_inventario: product.dias_en_inventario
    }));
    return analyticsData?.graficas?.barras_productos_antiguos || fallback;
  }, [analyticsData, products]);

  const scatterData = useMemo(() => {
    const fallback = products.map((product) => ({
      producto_id: product.id,
      producto: product.nombre,
      x_dias_en_inventario: product.dias_en_inventario,
      y_ventas_totales: product.ventas_totales,
      bubble_size_stock: product.stock
    }));
    return analyticsData?.graficas?.scatter_antiguedad_vs_ventas || fallback;
  }, [analyticsData, products]);

  const handleCloseAlert = () => setError('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <BubbleChartIcon fontSize="large" className="text-blue-600" />
                Antigüedad de Inventario
              </h1>
              <p className="text-gray-600 mt-2">
                Productos activos ordenados por días en inventario y desempeño de ventas.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700" htmlFor="limit">
                Mostrar:
              </label>
              <select
                id="limit"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
              >
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
                <option value="30">Top 30</option>
                <option value="50">Top 50</option>
                <option value="all">Todos</option>
              </select>
              <button
                onClick={() => fetchAnalyticsData(limit)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                type="button"
              >
                <RefreshIcon fontSize="small" />
                Actualizar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-700">Productos activos</p>
              <p className="text-2xl font-bold text-blue-900">
                {analyticsData?.total_productos_activos ?? 0}
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <p className="text-sm text-orange-700">Promedio días inventario</p>
              <p className="text-2xl font-bold text-orange-900">
                {products.length
                  ? Math.round(products.reduce((acc, item) => acc + item.dias_en_inventario, 0) / products.length)
                  : 0}
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-sm text-emerald-700">Ventas totales (listado)</p>
              <p className="text-2xl font-bold text-emerald-900">
                {products.reduce((acc, item) => acc + item.ventas_totales, 0)}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-16">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600">Cargando analítica...</p>
            </div>
          </div>
        ) : (
          <ProductInventoryAgingCharts
            barData={barData}
            scatterData={scatterData}
            products={products}
          />
        )}
      </div>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={handleCloseAlert} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ProductInventoryAgingPage;

