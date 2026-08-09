import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Snackbar, Alert } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { API_URL } from '../config/apiConfig';
const InfoManagerPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('divisas');
  const [divisas, setDivisas] = useState([]);
  const [domicilios, setDomicilios] = useState([]);
  const [loading, setLoading] = useState({
    divisas: true,
    domicilios: true,
  });
  const [error, setError] = useState(null);

  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  const handleFetchError = (err) => {
    setError(err.message);
  };

  const fetchDivisas = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading((prev) => ({ ...prev, divisas: true }));
    try {
      const response = await fetch(`${API_URL}/listar_moneda/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al obtener las divisas');
      }

      const data = await response.json();
      setDivisas(Array.isArray(data) ? data : []);
    } catch (err) {
      handleFetchError(err);
    } finally {
      setLoading((prev) => ({ ...prev, divisas: false }));
    }
  };

  const fetchDomicilios = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading((prev) => ({ ...prev, domicilios: true }));
    try {
      const response = await fetch(`${API_URL}/listar_domicilio/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al obtener los domicilios');
      }

      const data = await response.json();
      setDomicilios(Array.isArray(data) ? data : []);
    } catch (err) {
      handleFetchError(err);
    } finally {
      setLoading((prev) => ({ ...prev, domicilios: false }));
    }
  };

  useEffect(() => {
    fetchDivisas();
    fetchDomicilios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatNumber = (value) => {
    if (value === undefined || value === null || value === '') {
      return '0.00';
    }
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) {
      return value;
    }
    return numberValue.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleCloseAlert = (_, reason) => {
    if (reason === 'clickaway') return;
    setError(null);
  };

  const isLoading = activeTab === 'divisas' ? loading.divisas : loading.domicilios;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900">Informacion para Gestores</h1>
          <p className="text-gray-600 mt-2">
            Consulta rápidamente las divisas disponibles y las opciones de domicilio vigentes.
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setActiveTab('divisas')}
                className={`px-5 py-2 rounded-xl font-medium transition-colors ${
                  activeTab === 'divisas'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Divisas
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('domicilios')}
                className={`px-5 py-2 rounded-xl font-medium transition-colors ${
                  activeTab === 'domicilios'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Domicilios
              </button>
            </div>

            <button
              type="button"
              onClick={activeTab === 'divisas' ? fetchDivisas : fetchDomicilios}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Actualizar informacion
            </button>
          </div>

          <div className="px-6 py-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium">Cargando informacion...</p>
              </div>
            ) : activeTab === 'divisas' ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {divisas.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No hay divisas disponibles.
                  </div>
                ) : (
                  divisas.map((moneda) => (
                    <div
                      key={moneda.id || moneda.nombre}
                      className="p-5 bg-gradient-to-r from-blue-50 via-white to-white border border-blue-100 rounded-2xl shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          <AccountBalanceWalletIcon sx={{ fontSize: 18 }} />
                          <span>{moneda.nombre || 'Divisa'}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          {moneda.fecha_actualizacion
                            ? new Date(moneda.fecha_actualizacion).toLocaleDateString('es-ES')
                            : 'Sin fecha'}
                        </span>
                      </div>
                      <p className="text-4xl font-semibold text-gray-900">
                        {formatNumber(moneda.cambio)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Tipo de cambio</p>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {domicilios.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No hay domicilios registrados.
                  </div>
                ) : (
                  domicilios.map((domicilio) => (
                    <div
                      key={domicilio.id || domicilio.ubicacion}
                      className="p-5 bg-gradient-to-r from-emerald-50 via-white to-white border border-emerald-100 rounded-2xl shadow-sm"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <LocationOnIcon className="text-emerald-600" sx={{ fontSize: 22 }} />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {domicilio.ubicacion || 'Ubicacion no especificada'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Identificador: {domicilio.id || 'N/D'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-semibold text-gray-900">
                          {formatNumber(domicilio.precio)}
                        </span>
                        <span className="text-sm text-gray-500">Costo de entrega</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default InfoManagerPage;
