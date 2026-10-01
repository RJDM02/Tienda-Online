import 'whatwg-fetch';
// CRA/Jest does not transform Axios' ESM entry in node_modules.
jest.mock('axios', () => jest.requireActual('axios/dist/node/axios.cjs'));
jest.mock('../config/apiConfig', () => ({ API_URL: 'https://api.example.test/api' }));

import apiClient from './apiClient';
import { saveSession } from './session';

function token(seconds) {
  return `e30.${btoa(JSON.stringify({ user_id: 12, auth_session: 's1', exp: Date.now() / 1000 + seconds }))}.sig`;
}
function json(data) {
  return new Response(JSON.stringify(data), { status: 200 });
}

beforeEach(() => {
  localStorage.clear();
  window.fetch = jest.fn();
});

test('Axios requests refresh an expired access before sending the API request', async () => {
  const old = token(-10);
  const fresh = token(3600);
  saveSession({ access: old, refresh_enabled: true });
  window.fetch.mockResolvedValueOnce(json({ csrfToken: 'csrf-test' }))
    .mockResolvedValueOnce(json({ access: fresh, refresh_enabled: true }));
  const adapter = jest.fn(async config => ({ status: 200, data: {}, headers: {}, config }));
  await apiClient.get('https://api.example.test/api/items/', { headers: { Authorization: `Bearer ${old}` }, adapter });
  expect(adapter).toHaveBeenCalledTimes(1);
  expect(adapter.mock.calls[0][0].headers.Authorization).toBe(`Bearer ${fresh}`);
});

test('Axios retries an authentication error once, using the rotated access', async () => {
  const old = token(3600);
  const fresh = token(4000);
  saveSession({ access: old, refresh_enabled: true });
  window.fetch.mockResolvedValueOnce(json({ csrfToken: 'csrf-test' }))
    .mockResolvedValueOnce(json({ access: fresh, refresh_enabled: true }));
  const adapter = jest.fn(async config => {
    if (!config.authRetried) throw Object.assign(new Error('expired'), {
      config, response: { status: 401, data: { code: 'token_not_valid' } },
    });
    return { status: 200, data: {}, headers: {}, config };
  });
  await apiClient.get('https://api.example.test/api/items/', { headers: { Authorization: `Bearer ${old}` }, adapter });
  expect(adapter).toHaveBeenCalledTimes(2);
  expect(adapter.mock.calls[1][0].headers.Authorization).toBe(`Bearer ${fresh}`);
});

test('Axios does not refresh on business permission errors', async () => {
  const access = token(3600);
  saveSession({ access, refresh_enabled: true });
  const adapter = jest.fn(async config => {
    throw Object.assign(new Error('permission'), { config, response: { status: 401, data: { error: 'No permiso' } } });
  });
  await expect(apiClient.get('https://api.example.test/api/items/', {
    headers: { Authorization: `Bearer ${access}` }, adapter,
  })).rejects.toThrow('permission');
  expect(adapter).toHaveBeenCalledTimes(1);
  expect(window.fetch).not.toHaveBeenCalled();
});
