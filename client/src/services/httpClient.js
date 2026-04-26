import axios from 'axios';

const AUTH_STORAGE_KEY = 'smart-campus-auth';
const TOKEN_STORAGE_KEY = 'token';

function resolveApiBaseUrl() {
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  return rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;
}

function getStoredToken() {
  const directToken = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (directToken) {
    return directToken;
  }

  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed?.token ?? null;
  } catch {
    return null;
  }
}

const httpClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getApiErrorMessage(error, fallbackMessage = 'Request failed. Please try again.') {
  const payload = error?.response?.data;

  if (!payload) {
    return error?.message || fallbackMessage;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (payload.message) {
    return payload.message;
  }

  return fallbackMessage;
}

export default httpClient;
