import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ModalEditCliente = ({ open, onClose, userData, onEditSuccess, isLoading, apiBaseUrl }) => {
  const [formData, setFormData] = useState({
    username: userData?.username || '',
    correo: userData?.correo || '',
    telefono: userData?.telefono || '',
    cumple: userData?.cumple || '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (userData) {
      setFormData({
        username: userData.username || '',
        correo: userData.correo || '',
        telefono: userData.telefono || '',
        cumple: userData.cumple || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validar que las contraseñas coincidan si se cambian
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const payload = {
        username: formData.username,
        ...(formData.correo && { correo: formData.correo }),
        ...(formData.telefono && { telefono: formData.telefono }),
        ...(formData.cumple && { cumple: formData.cumple }),
        ...(formData.password && { password: formData.password })
      };

      const response = await fetch(`${apiBaseUrl}/api/editar_cliente/${userData.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('authToken')
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Error al editar el perfil');
      }

      const data = await response.json();
      onEditSuccess(data);
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col transform transition-all duration-300 scale-100">
        {/* Header fijo */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-100">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Editar Perfil</h2>
            <p className="text-gray-500 text-sm">Actualiza tus datos de perfil</p>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">
                Nombre de usuario
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">
                Correo electrónico
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                name="cumple"
                value={formData.cumple}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">
                Nueva contraseña
              </label>
              <p className="text-xs text-gray-500 mb-1">Dejar vacío para no cambiar</p>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
              />
            </div>
          </form>
        </div>

        {/* Footer fijo con botón */}
        <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-100">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-black text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar Cambios</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditCliente;