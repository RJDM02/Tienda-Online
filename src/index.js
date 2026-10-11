import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ensureAccess } from './auth/session';

// Identificador de la build: al cambiarlo cambia el nombre del bundle, lo que evita
// que una CDN siga sirviendo una copia vieja o incompleta del archivo anterior.
window.__VJH_BUILD__ = process.env.REACT_APP_BUILD_ID || 'dev';

const root = ReactDOM.createRoot(document.getElementById('root'));
// Restore an expired access token before components inspect localStorage.
ensureAccess().catch(() => { /* Keep credentials on temporary outages; API calls retry. */ }).finally(() => root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
