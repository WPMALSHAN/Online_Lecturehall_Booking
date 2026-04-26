export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function joinApiUrl(baseUrl, path) {
  const normalizedBaseUrl = String(baseUrl).replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (normalizedBaseUrl.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${normalizedBaseUrl}${normalizedPath.slice(4)}`;
  }

  return `${normalizedBaseUrl}${normalizedPath}`;
}

export function buildErrorMessage(payload) {
  if (!payload) {
    return 'Request failed. Please try again.';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (payload.message) {
    return payload.message;
  }

  if (typeof payload === 'object') {
    return Object.values(payload).join(' | ');
  }

  return 'Request failed. Please try again.';
}

export async function requestJson(path, options = {}) {
  const response = await fetch(joinApiUrl(API_BASE_URL, path), options);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(buildErrorMessage(payload));
  }

  return payload;
}

export async function requestBlob(path, options = {}) {
  const response = await fetch(joinApiUrl(API_BASE_URL, path), options);

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(buildErrorMessage(payload));
  }

  return response.blob();
}
