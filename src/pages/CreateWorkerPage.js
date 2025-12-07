import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { API_URL } from '../config/apiConfig';
const CreateWorkerPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    password: '',
    username: '',
    rol: '',
    dir: '',
    telefono: '',
    correo: ''
  });

  // Función mejorada para obtener el token
  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/crear_trabajador/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          password: formData.password,
          username: formData.username,
          rol: formData.rol,
          dir: formData.dir,
          telefono: formData.telefono,
          correo: formData.correo || null
        })
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'Error al crear trabajador');
      }

      alert('¡Trabajador creado satisfactoriamente!');
      navigate('/admin-trabajador');
    } catch (error) {
      setError(error.message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all duration-300">
        
        {/* Decoración superior */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-1 bg-gradient-to-r from-[#FF6B00] to-[#ff8533] rounded-full"></div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Registro de Trabajador</h2>
          <p className="text-gray-500">Crea tu cuenta para empezar</p>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo de Nombre */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Nombre
            </label>
            <div className="relative">
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Tu nombre"
                required
              />
            </div>
          </div>

          {/* Campo de Username */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Nombre de usuario
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Tu nombre de usuario"
                required
              />
            </div>
          </div>

          {/* Campo de Contraseña */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Tu contraseña segura"
                required
              />
            </div>
          </div>

          {/* Campo de Rol */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Rol
            </label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              required
            >
              <option value="">Selecciona un rol</option>
              <option value="Super_Administrador">Super Administrador</option>
              <option value="Administrador">Administrador</option>
              <option value="Gestor de Venta">Gestor de Venta</option>
              <option value="Mensajero">Mensajero</option>
            </select>
          </div>

          {/* Campo de Dirección */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Dirección
            </label>
            <div className="relative">
              <input
                type="text"
                name="dir"
                value={formData.dir}
                onChange={handleChange}
                className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Tu dirección"
                required
              />
            </div>
          </div>

          {/* Campo de Teléfono */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Teléfono
            </label>
            <div className="relative">
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Tu número de teléfono"
                required
              />
            </div>
          </div>

          {/* Nuevo campo de Correo electrónico */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Correo electrónico (Opcional)
            </label>
            <div className="relative">
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Tu correo electrónico"
              />
            </div>
          </div>

          {/* Botón de registro */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-8"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Registrando...</span>
              </>
            ) : (
              <span>Registrarse</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkerPage;