import httpClient from './httpClient';

export async function fetchAssets() {
  const response = await httpClient.get('/assets');
  return response.data;
}