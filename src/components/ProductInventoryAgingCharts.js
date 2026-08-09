import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';

const formatDate = (dateString) => {
  if (!dateString) return 'No especificada';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString();
};

const getUrgency = (point) => {
  if (point.x_dias_en_inventario >= 60 && point.y_ventas_totales <= 2) {
    return 'alta';
  }
  if (point.x_dias_en_inventario >= 30 && point.y_ventas_totales <= 5) {
    return 'media';
  }
  return 'baja';
};

const getUrgencyColor = (point) => {
  const urgency = getUrgency(point);
  if (urgency === 'alta') return '#dc2626';
  if (urgency === 'media') return '#d97706';
  return '#059669';
};

const BarTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3 text-sm">
      <p className="font-semibold text-gray-900">{data.producto}</p>
      <p className="text-gray-700">Días en inventario: <strong>{data.dias_en_inventario}</strong></p>
    </div>
  );
};

const ScatterTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3 text-sm">
      <p className="font-semibold text-gray-900">{data.producto}</p>
      <p className="text-gray-700">Días en inventario: <strong>{data.x_dias_en_inventario}</strong></p>
      <p className="text-gray-700">Ventas totales: <strong>{data.y_ventas_totales}</strong></p>
      <p className="text-gray-700">Stock: <strong>{data.bubble_size_stock}</strong></p>
      <p className="text-gray-700 capitalize">Prioridad: <strong>{getUrgency(data)}</strong></p>
    </div>
  );
};

const ProductInventoryAgingCharts = ({
  barData = [],
  scatterData = [],
  products = []
}) => {
  const hasData = barData.length > 0;
  const urgentProducts = [...products]
    .filter((product) => product.dias_en_inventario >= 30 && product.ventas_totales <= 5)
    .sort((a, b) => b.dias_en_inventario - a.dias_en_inventario);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Productos más antiguos</h2>
          <p className="text-sm text-gray-600 mb-4">Eje X: Días en inventario. Eje Y: Producto.</p>

          {hasData ? (
            <div style={{ height: Math.max(320, barData.length * 32) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="dias_en_inventario" />
                  <YAxis
                    type="category"
                    dataKey="producto"
                    width={180}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="dias_en_inventario" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-600">
              No hay datos para mostrar.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Antigüedad vs ventas</h2>
          <p className="text-sm text-gray-600 mb-4">Burbuja: stock. Eje X: días en inventario. Eje Y: ventas.</p>

          {hasData ? (
            <div style={{ height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 25, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x_dias_en_inventario"
                    name="Días en inventario"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y_ventas_totales"
                    name="Ventas totales"
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ZAxis
                    type="number"
                    dataKey="bubble_size_stock"
                    name="Stock"
                    range={[80, 900]}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ScatterTooltip />} />
                  <Scatter name="Productos" data={scatterData}>
                    {scatterData.map((point) => (
                      <Cell
                        key={`scatter-cell-${point.producto_id}`}
                        fill={getUrgencyColor(point)}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-600">
              No hay datos para mostrar.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Acción inmediata</h2>
        <p className="text-sm text-gray-600 mb-4">
          Productos con 30+ días en inventario y hasta 5 ventas totales.
        </p>

        {urgentProducts.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
            No hay productos en zona de alerta con los filtros actuales.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Días</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ventas</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {urgentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{product.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{product.dias_en_inventario}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{product.ventas_totales}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{product.stock}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(product.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductInventoryAgingCharts;

