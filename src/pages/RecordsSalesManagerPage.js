import React, { useState, useEffect } from 'react';
import { Table, Spin, Alert, Select, Tag } from 'antd';
import { 
  UserOutlined, 
  ShoppingCartOutlined, 
  DollarOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import axios from 'axios';

import { API_URL } from '../config/apiConfig';
const { Option } = Select;

const RecordsSalesManagerPage = () => {
  const [salesData, setSalesData] = useState([]);
  const [groupedData, setGroupedData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
          `${API_URL}/listar_contabilidad_gestores/`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setSalesData(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error al cargar los datos de gestores');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const groupByManager = () => {
      const filteredData = selectedMonth === 'all' 
        ? salesData 
        : salesData.filter(item => {
            const date = new Date(item.fecha);
            return date.getMonth() + 1 === parseInt(selectedMonth);
          });

      const grouped = filteredData.reduce((acc, item) => {
        if (!acc[item.gestor_id]) {
          acc[item.gestor_id] = {
            gestor_nombre: item.gestor_nombre,
            productCount: 0,
            totalComision: 0
          };
        }
        acc[item.gestor_id].productCount += 1;
        acc[item.gestor_id].totalComision += item.comision;
        return acc;
      }, {});

      setGroupedData(grouped);
    };

    groupByManager();
  }, [salesData, selectedMonth]);

  const months = [
    { value: 'all', label: 'Todos los meses' },
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  // Convertir los datos agrupados a array para la tabla
  const tableData = Object.keys(groupedData).map((gestorId, index) => ({
    key: gestorId,
    id: index + 1,
    gestor_nombre: groupedData[gestorId].gestor_nombre,
    productCount: groupedData[gestorId].productCount,
    totalComision: groupedData[gestorId].totalComision
  }));

  // Definir columnas de la tabla
  const columns = [
    {
      title: 'Gestor',
      dataIndex: 'gestor_nombre',
      key: 'gestor_nombre',
      sorter: (a, b) => a.gestor_nombre.localeCompare(b.gestor_nombre),
      render: (nombre) => (
        <div className="flex items-center space-x-2">
          <UserOutlined className="text-blue-600" />
          <span className="font-medium">{nombre}</span>
        </div>
      ),
    },
    {
      title: 'Productos Vendidos',
      dataIndex: 'productCount',
      key: 'productCount',
      align: 'center',
      sorter: (a, b) => a.productCount - b.productCount,
      render: (count) => (
        <div className="flex items-center justify-center space-x-2">
          <ShoppingCartOutlined className="text-green-600" />
          <Tag color="blue" className="font-medium text-lg px-3 py-1">
            {count}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Ingresos por Venta',
      dataIndex: 'totalComision',
      key: 'totalComision',
      align: 'right',
      sorter: (a, b) => a.totalComision - b.totalComision,
      render: (comision) => (
        <div className="flex items-center justify-end space-x-2">
          <DollarOutlined className="text-green-600" />
          <span className="font-bold text-lg text-green-700">
            ${comision.toFixed(2)}
          </span>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex justify-center items-center">
        <Spin size="large" className="text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className="max-w-full mx-auto">
          <Alert 
            message="Error" 
            description={error} 
            type="error" 
            showIcon 
            className="rounded-2xl"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro de Ventas por Gestores</h1>
          <p className="text-gray-600">Resumen de rendimiento y comisiones por gestor</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <CalendarOutlined className="text-orange-600 text-xl" />
            <label className="text-lg font-medium text-gray-700">Filtrar por mes:</label>
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              className="min-w-[200px]"
              size="large"
            >
              {months.map(month => (
                <Option key={month.value} value={month.value}>
                  {month.label}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <Table 
            columns={columns} 
            dataSource={tableData} 
            rowKey="key"
            bordered
            pagination={{ 
              pageSize: 10,
              className: 'px-6 py-4 bg-white rounded-b-2xl',
              showSizeChanger: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} gestores`
            }}
            scroll={{ x: true }}
            className="rounded-2xl"
            rowClassName="hover:bg-orange-50 transition-colors duration-200"
            size="large"
          />
        </div>

        {/* Resumen */}
        {tableData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Resumen General</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <UserOutlined className="text-3xl text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-700">
                  {tableData.length}
                </div>
                <div className="text-blue-600">Gestores Activos</div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 text-center">
                <ShoppingCartOutlined className="text-3xl text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-700">
                  {tableData.reduce((sum, item) => sum + item.productCount, 0)}
                </div>
                <div className="text-green-600">Productos Vendidos</div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 text-center">
                <DollarOutlined className="text-3xl text-orange-600 mb-2" />
                <div className="text-2xl font-bold text-orange-700">
                  ${tableData.reduce((sum, item) => sum + item.totalComision, 0).toFixed(2)}
                </div>
                <div className="text-orange-600">Total Comisiones</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordsSalesManagerPage;