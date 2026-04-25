import httpClient from './httpClient';

export async function loginUser(credentials) {
  const response = await httpClient.post('/auth/login', credentials);
  return response.data;
}

export async function registerUser(userData) {
  const response = await httpClient.post('/auth/register', userData);
  return response.data;
}
