import httpClient from './httpClient';

export async function loginUser(credentials) {
  
  const response = await httpClient.post('/auth/login', credentials);
  return response.data;
}

export async function registerUser(userData) {
  const response = await httpClient.post('/auth/register', userData);
  return response.data;
}

export async function requestPasswordReset(payload) {
  const response = await httpClient.post('/auth/forgot-password', payload);
  return response.data;
}

export async function resetPassword(payload) {
  const response = await httpClient.post('/auth/reset-password', payload);
  return response.data;
}
