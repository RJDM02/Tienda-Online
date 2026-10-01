import axios from 'axios';
import { assertSessionOwner, clearSessionFor, ensureAccess, isApiUrl, isAuthSession } from './session';

const apiClient = axios.create();
apiClient.interceptors.request.use(async config => {
  if (isApiUrl(config.url) && config.headers.Authorization && isAuthSession()) {
    const token = await ensureAccess();
    if (!token) throw new Error('La sesión terminó.');
    assertSessionOwner(config.headers.Authorization.replace(/^Bearer\s+/i, ''), token);
    config.headers.Authorization = `Bearer ${token}`;
    config.renewableAuth = true;
  }
  return config;
});
apiClient.interceptors.response.use(response => response, async error => {
  const { config, response } = error;
  if (!config?.renewableAuth || response?.status !== 401) throw error;
  if (response.data?.code === 'session_revoked') {
    clearSessionFor(config.headers.Authorization.slice(7));
    throw error;
  }
  if (config.authRetried || response.data?.code !== 'token_not_valid') throw error;
  config.authRetried = true;
  const token = await ensureAccess({ rejectedToken: config.headers.Authorization.slice(7) });
  if (!token) throw new Error('La sesión terminó.');
  assertSessionOwner(config.headers.Authorization.slice(7), token);
  config.headers.Authorization = `Bearer ${token}`;
  return apiClient(config);
});

export default apiClient;
