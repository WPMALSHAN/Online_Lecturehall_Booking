import { requestJson } from './apiClient';

function sendAuthRequest(path, body) {
  return requestJson(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export function loginUser(credentials) {
  return sendAuthRequest('/api/auth/login', credentials);
}

export function registerUser(userData) {
  return sendAuthRequest('/api/auth/register', userData);
}
