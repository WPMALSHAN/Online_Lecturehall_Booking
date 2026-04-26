import httpClient from './httpClient';

export async function fetchAssets() {
  const response = await httpClient.get('/assets');
  return response.data;
}

export async function updateAsset(assetId, payload) {
  const response = await httpClient.put(`/assets/${assetId}`, payload);
  return response.data;
}

export async function deleteAsset(assetId) {
  const response = await httpClient.delete(`/assets/${assetId}`);
  return response.data;
}