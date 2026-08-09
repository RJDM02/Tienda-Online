import { useState } from 'react';
import { User, Phone, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import icon1 from '../assets/icon1.png';
import icon2 from '../assets/icon2.png';
import icon3 from '../assets/icon3.png';
import icon4 from '../assets/icon4.png';

import { API_URL } from '../config/apiConfig';
const RegisterPage = ({ onShowLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    telefono: '',
    correo: '',
    password: '',
    imagen: ''
  });
  const [errors, setErrors] = useState({}); // Estado para manejar errores

  const icons = [
    { name: 'icon1', src: icon1 },
    { name: 'icon2', src: icon2 },
    { name: 'icon3', src: icon3 },
    { name: 'icon4', src: icon4 }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpiar errores al cambiar el campo
    if (errors[e.target.name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
  };

  // Función para renderizar errores de un campo
  const renderFieldErrors = (fieldName) => {
    if (!errors[fieldName]) return null;
    
    return (
      <div className="mt-1 text-sm text-red-600">
        {errors[fieldName].map((error, index) => (
          <p key={index}>{error}</p>
        ))}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({}); // Limpiar errores previos

    try {
      const response = await fetch(`${API_URL}/crear_cliente/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          telefono: formData.telefono,
          correo: formData.correo,
          imagen: formData.imagen
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('¡Registro exitoso!');
        navigate('/');
      } else {
        // Mostrar los errores exactamente como vienen del backend
        if (typeof data === 'object' && data !== null) {
          setErrors(data);
        } else {
          setErrors({ non_field_errors: [data.detail || 'Error en el registro'] });
        }
      }
    } catch (error) {
      setErrors({ non_field_errors: ['Error de conexión con el servidor'] });
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    if (onShowLogin) {
      onShowLogin();
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Registro de Cliente</h2>
          <p className="text-gray-500">Crea tu cuenta para empezar</p>
        </div>

        {/* Mensajes de error generales */}
        {errors.non_field_errors && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {errors.non_field_errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo de Usuario */}
          <div>
            <label className="text-sm font-medium text-gray-700 block">
              Nombre de usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 ${
                  errors.username ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                }`}
                placeholder="Tu nombre de usuario"
                required
              />
            </div>
            {renderFieldErrors('username')}
          </div>

          {/* Campo de Teléfono */}
          <div>
            <label className="text-sm font-medium text-gray-700 block">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 ${
                  errors.telefono ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                }`}
                placeholder="Tu número de teléfono"
                required
              />
            </div>
            {renderFieldErrors('telefono')}
          </div>

          {/* Campo de Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 block">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 ${
                  errors.correo ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                }`}
                placeholder="tu@email.com"
                required
              />
            </div>
            {renderFieldErrors('correo')}
          </div>

          {/* Campo de Contraseña */}
          <div>
            <label className="text-sm font-medium text-gray-700 block">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 ${
                  errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                }`}
                placeholder="Tu contraseña segura"
                required
              />
            </div>
            {renderFieldErrors('password')}
          </div>

          {/* Selección de ícono */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700 block">
              Selecciona tu ícono de perfil
            </label>
            {errors.imagen && (
              <div className="text-sm text-red-600">
                {errors.imagen.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
            <div className="flex justify-center gap-4">
              {icons.map((icon) => (
                <button
                  key={icon.name}
                  type="button"
                  onClick={() => {
                    setFormData({...formData, imagen: icon.name});
                    if (errors.imagen) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.imagen;
                        return newErrors;
                      });
                    }
                  }}
                  className={`p-4 rounded-full border-2 transition-all duration-200 hover:scale-105 ${
                    formData.imagen === icon.name 
                      ? 'border-[#FF6B00] bg-orange-50 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <img 
                    src={icon.src} 
                    alt={icon.name}
                    className="w-8 h-8 object-contain"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Botón de registro */}
          <button
            type="submit"
            disabled={loading || !formData.imagen}
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

        {/* Separador */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">o</span>
          </div>
        </div>

        {/* Enlace de login */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={handleLoginClick}
              className="text-[#FF6B00] hover:text-[#e55a00] font-medium transition-colors duration-200 hover:underline"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;