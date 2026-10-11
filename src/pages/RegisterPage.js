import { apiFetch as fetch } from '../auth/session';
import { useState } from 'react';
import { User, Phone, Mail, Lock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import icon1 from '../assets/icon1.png';
import icon2 from '../assets/icon2.png';
import icon3 from '../assets/icon3.png';
import icon4 from '../assets/icon4.png';

import { API_URL } from '../config/apiConfig';
import '../styles/vjh-theme.css';
import '../styles/vjh-auth.css';
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
    { name: 'icon1', src: icon1, label: 'Hombre' },
    { name: 'icon2', src: icon2, label: 'Mujer' },
    { name: 'icon3', src: icon3, label: 'Chico' },
    { name: 'icon4', src: icon4, label: 'Chica' }
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
      <div className="vj-auth-error">
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

  const fields = [
    { name: 'username', label: 'Nombre de usuario', type: 'text', placeholder: 'Tu nombre de usuario', icon: <User size={18} />, autoComplete: 'username' },
    { name: 'telefono', label: 'Teléfono', type: 'tel', placeholder: 'Tu número de teléfono', icon: <Phone size={18} />, autoComplete: 'tel' },
    { name: 'correo', label: 'Correo electrónico', type: 'email', placeholder: 'tu@email.com', icon: <Mail size={18} />, autoComplete: 'email' },
    { name: 'password', label: 'Contraseña', type: 'password', placeholder: 'Tu contraseña segura', icon: <Lock size={18} />, autoComplete: 'new-password' },
  ];

  return (
    <div className="vj-auth-page vj-scope">
      <div className="vj-auth-card vj-auth-card--register">
        <button type="button" onClick={() => navigate('/')} className="vj-auth-close" aria-label="Cerrar">
          <X size={16} />
        </button>

        {/* Header */}
        <div className="vj-auth-header">
          <h2>Registro de Cliente</h2>
          <p>Crea tu cuenta para empezar</p>
        </div>

        {/* Mensajes de error generales */}
        {errors.non_field_errors && (
          <div className="vj-auth-alert">
            {errors.non_field_errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="vj-auth-form">
          <div className="vj-auth-fields">
            {fields.map((field) => (
              <div className="vj-auth-field" key={field.name}>
                <label htmlFor={`register-${field.name}`}>{field.label}</label>
                <div className={`vj-auth-input ${errors[field.name] ? 'has-error' : ''}`}>
                  {field.icon}
                  <input
                    id={`register-${field.name}`}
                    type={field.type}
                    name={field.name}
                    autoComplete={field.autoComplete}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required
                  />
                </div>
                {renderFieldErrors(field.name)}
              </div>
            ))}
          </div>

          {/* Selección de ícono */}
          <div className="vj-auth-avatars">
            <span className="vj-auth-label">Selecciona tu ícono de perfil</span>
            {errors.imagen && (
              <div className="vj-auth-error">
                {errors.imagen.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
            <div className="vj-auth-avatars__list">
              {icons.map((icon) => (
                <button
                  key={icon.name}
                  type="button"
                  aria-pressed={formData.imagen === icon.name}
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
                  className={`vj-auth-avatar ${formData.imagen === icon.name ? 'is-selected' : ''}`}
                >
                  <span>
                    <img src={icon.src} alt="" />
                  </span>
                  {icon.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botón de registro */}
          <button type="submit" disabled={loading || !formData.imagen} className="vj-btn vj-btn--dark vj-auth-submit">
            {loading ? (
              <>
                <div className="vj-spinner"></div>
                <span>Registrando...</span>
              </>
            ) : (
              <span>Registrarse</span>
            )}
          </button>
        </form>

        <div className="vj-auth-divider">o</div>

        {/* Enlace de login */}
        <p className="vj-auth-footer">
          ¿Ya tienes cuenta?{' '}
          <button type="button" onClick={handleLoginClick}>
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
