import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import logo from '@/assets/logo.png';
import '../styles/vjh-theme.css';
import '../styles/vjh-auth.css';

import { loginRequest } from '../auth/session';
const LoginModal = ({ open, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await loginRequest(username, password);

      const data = await response.json();

      if (!response.ok) {
        if (typeof data === 'object' && data !== null) {
          setErrors(data.detail ? { non_field_errors: [String(data.detail)] } : data);
        } else {
          setErrors({ non_field_errors: [data.detail || 'Error en el login'] });
        }
        return;
      }

      if (!data.access) {
        setErrors({ non_field_errors: ['No se recibió token de acceso'] });
        return;
      }


      onClose();
      window.location.reload();

    } catch (error) {
      setErrors({ non_field_errors: ['Error de conexión con el servidor'] });
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = () => {
    onClose();
    window.location.href = '/registro';
  };

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

  if (!open) return null;

  return (
    <div className="vj-auth-overlay vj-scope" onClick={onClose}>
      <div className="vj-auth-overlay__brand">
        <img src={logo} alt="" />
        <span>VIDEOJUEGOS <b>HABANA</b></span>
      </div>

      <div className="vj-auth-card" role="dialog" aria-modal="true" aria-labelledby="login-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="vj-auth-close" aria-label="Cerrar">
          <X size={16} />
        </button>

        <div className="vj-auth-header">
          <h2 id="login-title">Iniciar sesión</h2>
          <p>Accede a tu cuenta para continuar</p>
        </div>

        {errors.non_field_errors && (
          <div className="vj-auth-alert">
            {errors.non_field_errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleLogin} className="vj-auth-form">
          <div className="vj-auth-fields">
            <div className="vj-auth-field">
              <label htmlFor="login-username">Nombre de usuario</label>
              <div className={`vj-auth-input ${errors.username ? 'has-error' : ''}`}>
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  required
                />
              </div>
              {renderFieldErrors('username')}
            </div>

            <div className="vj-auth-field">
              <label htmlFor="login-password">Contraseña</label>
              <div className={`vj-auth-input ${errors.password ? 'has-error' : ''}`}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {renderFieldErrors('password')}
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="vj-btn vj-btn--dark vj-auth-submit">
            {isLoading ? (
              <>
                <div className="vj-spinner"></div>
                <span>Cargando...</span>
              </>
            ) : (
              <span>Iniciar sesión</span>
            )}
          </button>
        </form>

        <div className="vj-auth-divider">o</div>

        <p className="vj-auth-footer">
          ¿No tienes cuenta?{' '}
          <button type="button" onClick={handleRegisterClick}>
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
