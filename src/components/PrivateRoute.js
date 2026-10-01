import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionSnapshot } from '../auth/useSessionSnapshot';

const PrivateRoute = ({ children, allowedRoles }) => {
  // Obtener datos del usuario del localStorage
  const snapshot = useSessionSnapshot();
  let userData;
  try { userData = JSON.parse(snapshot); } catch { userData = null; }
  const token = localStorage.getItem('authToken');

  // Si no hay token, redirigir a login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Si hay token pero no userData (caso raro), redirigir
  if (!userData) {
    return <Navigate to="/" replace />;
  }

  // Verificar si el usuario tiene alguno de los roles permitidos
  const hasRequiredRole = allowedRoles.includes(userData.rol);

  // Si no tiene el rol requerido, redirigir al inicio
  if (!hasRequiredRole) {
    return <Navigate to="/" replace />;
  }

  // Si todo está bien, renderizar el componente hijo
  return children;
};

export default PrivateRoute;
