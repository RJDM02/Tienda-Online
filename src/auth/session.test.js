import 'whatwg-fetch';
import { apiFetch, ensureAccess, isAuthSession, loginRequest, logoutAuthSession, saveSession } from './session';

jest.mock('../config/apiConfig', () => ({ API_URL: 'https://api.example.test/api' }));

const BASE = 'https://api.example.test/api';
const token = (seconds = 3600, extra = {}) => `e30.${btoa(JSON.stringify({
  user_id: 530, rol: 'Administrador', auth_session: 'session-1',
  exp: Math.floor(Date.now() / 1000) + seconds, ...extra,
}))}.signature`;
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' },
});
const store = access => saveSession({ access, refresh_enabled: true });

beforeEach(() => {
  localStorage.clear();
  window.fetch = jest.fn();
  Object.defineProperty(navigator, 'locks', { configurable: true, value: {
    request: jest.fn((name, action) => action()),
  } });
});

test('login sends cookies and CSRF without persisting the password', async () => {
  window.fetch.mockResolvedValueOnce(json({ csrfToken: 'csrf-test' })).mockResolvedValueOnce(json({ access: token() }));
  await loginRequest('user', 'test-password');
  expect(window.fetch).toHaveBeenLastCalledWith(`${BASE}/login/`, expect.objectContaining({
    credentials: 'include', headers: { 'X-CSRFToken': 'csrf-test', 'Content-Type': 'application/json' },
  }));
  expect(Object.values(localStorage).join(' ')).not.toContain('test-password');
});

test('concurrent requests perform one refresh and use the new access', async () => {
  const old = token(-5);
  const fresh = token();
  store(old);
  window.fetch.mockImplementation(async url => {
    if (url.endsWith('/csrf/')) return json({ csrfToken: 'csrf-test' });
    if (url.endsWith('/refresh/')) return json({ access: fresh, refresh_enabled: true });
    return json({ ok: true });
  });
  await Promise.all(Array.from({ length: 5 }, () => apiFetch(`${BASE}/items/`, {
    headers: { Authorization: `Bearer ${old}` },
  })));
  expect(window.fetch.mock.calls.filter(([url]) => url.endsWith('/refresh/'))).toHaveLength(1);
  for (const [url, options] of window.fetch.mock.calls) {
    if (url.endsWith('/items/')) expect(options.headers.get('Authorization')).toBe(`Bearer ${fresh}`);
  }
  expect(localStorage.getItem('authToken')).toBe(fresh);
  expect(localStorage.getItem('refreshToken')).toBeNull();
});

test('a fresh access is reused without background refresh', async () => {
  const fresh = token();
  store(fresh);
  expect(await ensureAccess()).toBe(fresh);
  expect(window.fetch).not.toHaveBeenCalled();
});

test('a tab rechecks storage after another tab refreshed while it waited', async () => {
  store(token(-1));
  let release;
  navigator.locks.request.mockImplementation((name, action) => new Promise(resolve => {
    release = () => resolve(action());
  }));
  const waiting = ensureAccess();
  const fresh = token();
  store(fresh);
  release();
  expect(await waiting).toBe(fresh);
  expect(window.fetch).not.toHaveBeenCalled();
});

test('temporary refresh failure preserves credentials and the next request recovers', async () => {
  const old = token(-1);
  store(old);
  window.fetch.mockResolvedValueOnce(json({ csrfToken: 'csrf-test' })).mockResolvedValueOnce(json({}, 503));
  await expect(ensureAccess()).rejects.toThrow('No se pudo renovar');
  expect(localStorage.getItem('authToken')).toBe(old);
  expect(isAuthSession()).toBe(true);
  const fresh = token();
  window.fetch.mockResolvedValueOnce(json({ csrfToken: 'csrf-test' })).mockResolvedValueOnce(json({ access: fresh, refresh_enabled: true }));
  expect(await ensureAccess()).toBe(fresh);
});

test('expired or revoked refresh clears the local session', async () => {
  store(token(-1));
  window.fetch.mockResolvedValueOnce(json({ csrfToken: 'csrf-test' })).mockResolvedValueOnce(json({ code: 'refresh_invalid' }, 401));
  await expect(ensureAccess()).rejects.toThrow('revocada');
  expect(isAuthSession()).toBe(false);
  expect(localStorage.getItem('userData')).toBeNull();
});

test('401 permission errors do not cause refresh or replay a business request', async () => {
  const access = token();
  store(access);
  window.fetch.mockResolvedValue(json({ error: 'No tiene permiso' }, 401));
  const response = await apiFetch(`${BASE}/items/`, { method: 'POST', headers: { Authorization: `Bearer ${access}` } });
  expect(response.status).toBe(401);
  expect(window.fetch).toHaveBeenCalledTimes(1);
});

test('an authentication rejection is retried only once', async () => {
  const access = token();
  const fresh = token(4000);
  store(access);
  window.fetch.mockResolvedValueOnce(json({ code: 'token_not_valid' }, 401))
    .mockResolvedValueOnce(json({ csrfToken: 'csrf-test' }))
    .mockResolvedValueOnce(json({ access: fresh, refresh_enabled: true }))
    .mockResolvedValueOnce(json({ code: 'token_not_valid' }, 401));
  const response = await apiFetch(`${BASE}/items/`, { headers: { Authorization: `Bearer ${access}` } });
  expect(response.status).toBe(401);
  expect(window.fetch).toHaveBeenCalledTimes(4);
});

test('external and public requests are passed through without injecting credentials', async () => {
  store(token(-1));
  window.fetch.mockResolvedValue(json({}));
  await apiFetch('https://images.example.test/image.jpg');
  await apiFetch(`${BASE}/public/`);
  expect(window.fetch).toHaveBeenCalledTimes(2);
  expect(window.fetch).toHaveBeenNthCalledWith(1, 'https://images.example.test/image.jpg', {});
});

test('logout only clears the session after server revocation succeeds', async () => {
  const access = token();
  store(access);
  window.fetch.mockResolvedValueOnce(json({ csrfToken: 'csrf-test' })).mockResolvedValueOnce(json({}, 503));
  await expect(logoutAuthSession()).rejects.toThrow('No se pudo cerrar');
  expect(localStorage.getItem('authToken')).toBe(access);
  window.fetch.mockResolvedValueOnce(json({ csrfToken: 'csrf-test' })).mockResolvedValueOnce(new Response(null, { status: 204 }));
  await logoutAuthSession();
  expect(isAuthSession()).toBe(false);
  expect(localStorage.getItem('authToken')).toBeNull();
});

test('legacy access does not attempt cookie refresh', async () => {
  const legacy = token(3600, { auth_session: undefined });
  saveSession({ access: legacy });
  expect(await ensureAccess()).toBe(legacy);
  expect(window.fetch).not.toHaveBeenCalled();
});

test('a stale request cannot be sent under a different account', async () => {
  const oldAccount = token(3600, { user_id: 12 });
  store(token(3600, { user_id: 25 }));
  await expect(apiFetch(`${BASE}/items/`, {
    method: 'POST', headers: { Authorization: `Bearer ${oldAccount}` },
  })).rejects.toThrow('La cuenta cambió');
  expect(window.fetch).not.toHaveBeenCalled();
});
