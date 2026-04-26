import httpClient from './httpClient';

export async function fetchFacilities() {
  const response = await httpClient.get('/facilities');
  return response.data;
}