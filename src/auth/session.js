import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../config/apiConfig';

const MARKER = 'vjhAuthSession';
let refreshInFlight;

async function authRequest(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    return await window.fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function decode(token) {
  try { return jwtDecode(token); } catch { return null; }
}

export function isAuthSession() {
  return localStorage.getItem(MARKER) === '1' ||
    Boolean(decode(localStorage.getItem('authToken'))?.auth_session);
}

export function clearSession() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  localStorage.removeItem(MARKER);
  window.dispatchEvent(new Event('vjh-session-changed'));
}

export function clearSessionFor(token) {
  const current = localStorage.getItem('authToken');
  if (current === token || (decode(token)?.auth_session &&
      decode(current)?.auth_session === decode(token).auth_session)) clearSession();
}

export function assertSessionOwner(original, current) {
  if (decode(original)?.user_id !== decode(current)?.user_id) {
    throw new Error('La cuenta cambió durante la petición. Vuelve a intentarlo.');
  }
}

export function saveSession(data) {
  const payload = decode(data.access);
  if (!payload) throw new Error('El servidor devolvió un token inválido.');
  localStorage.setItem('authToken', data.access);
  localStorage.setItem('userData', JSON.stringify(payload));
  if (data.refresh_enabled && payload.auth_session) localStorage.setItem(MARKER, '1');
  else localStorage.removeItem(MARKER);
  window.dispatchEvent(new Event('vjh-session-changed'));
}

async function csrfHeaders() {
  const response = await authRequest(`${API_URL}/auth/csrf/`, {
    credentials: 'include', cache: 'no-store',
  });
  if (!response.ok) throw new Error('No se pudo preparar la sesión segura.');
  const data = await response.json();
  return { 'X-CSRFToken': data.csrfToken };
}

export async function loginRequest(username, password) {
  return withSessionLock(async () => {
    const headers = await csrfHeaders();
    const response = await authRequest(`${API_URL}/login/`, {
      method: 'POST', credentials: 'include', cache: 'no-store',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (response.ok) saveSession(await response.clone().json());
    return response;
  });
}

function nearExpiry(token) {
  const data = decode(token);
  return !data || data.exp <= Date.now() / 1000 + 300;
}

async function withSessionLock(action) {
  // Web Locks serialize refresh/logout across tabs sharing the cookie jar.
  if (navigator.locks) return navigator.locks.request('vjh-refresh-session', action);
  // Older browsers are supported for a single tab; in-tab refreshes are coalesced below.
  return action();
}

export async function ensureAccess({ rejectedToken } = {}) {
  if (!isAuthSession()) return localStorage.getItem('authToken');
  if (!refreshInFlight) {
    refreshInFlight = withSessionLock(async () => {
      // Another tab may have renewed or logged out while we waited for the lock.
      if (!isAuthSession()) return localStorage.getItem('authToken');
      const current = localStorage.getItem('authToken');
      if (!nearExpiry(current) && (!rejectedToken || current !== rejectedToken)) return current;
      const response = await authRequest(`${API_URL}/auth/refresh/`, {
        method: 'POST', credentials: 'include', cache: 'no-store',
        headers: await csrfHeaders(),
      });
      if (response.status === 401) {
        clearSession();
        throw new Error('La sesión expiró o fue revocada. Inicia sesión nuevamente.');
      }
      if (!response.ok) {
        // Network, CSRF, throttling and server failures do not erase the session.
        throw new Error('No se pudo renovar la sesión. Se reintentará en la próxima consulta.');
      }
      const data = await response.json();
      saveSession(data);
      return data.access;
    }).finally(() => { refreshInFlight = undefined; });
  }
  return refreshInFlight;
}

export function isApiUrl(input) {
  const value = input instanceof URL ? input.href : (typeof input === 'string' ? input : input.url);
  const base = new URL(`${API_URL}/`, window.location.href);
  const url = new URL(value, window.location.href);
  return url.origin === base.origin && url.pathname.startsWith(base.pathname);
}

export async function apiFetch(input, init = {}) {
  const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
  if (!isApiUrl(input) || !headers.has('Authorization') || !isAuthSession()) {
    return window.fetch(input, init);
  }
  let token = await ensureAccess();
  if (!token) throw new Error('La sesión terminó.');
  const originalToken = headers.get('Authorization').replace(/^Bearer\s+/i, '');
  assertSessionOwner(originalToken, token);
  headers.set('Authorization', `Bearer ${token}`);
  const options = { ...init, headers };
  // Clone a Request body before it is consumed, so one auth retry is safe.
  const retryInput = typeof input.clone === 'function' ? input.clone() : input;
  let response = await window.fetch(input, options);
  if (response.status !== 401) return response;
  const error = await response.clone().json().catch(() => ({}));
  if (error.code === 'session_revoked') { clearSessionFor(token); return response; }
  // Business permission errors also use 401 in this API. Never retry those.
  if (error.code !== 'token_not_valid') return response;
  token = await ensureAccess({ rejectedToken: token });
  if (!token) throw new Error('La sesión terminó.');
  assertSessionOwner(originalToken, token);
  headers.set('Authorization', `Bearer ${token}`);
  response = await window.fetch(retryInput, options);
  return response;
}

export async function logoutAuthSession() {
  await withSessionLock(async () => {
    const response = await authRequest(`${API_URL}/auth/logout/`, {
      method: 'POST', credentials: 'include', cache: 'no-store', headers: await csrfHeaders(),
    });
    if (!response.ok) throw new Error('No se pudo cerrar la sesión en el servidor. Inténtalo nuevamente.');
    clearSession();
  });
}
