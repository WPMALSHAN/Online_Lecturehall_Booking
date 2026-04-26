import httpClient from './httpClient';
import { requestJson } from './apiClient';

function getAuthHeaders(hasJsonBody = true) {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  if (hasJsonBody) headers['Content-Type'] = 'application/json';
  return headers;
}

// Public: fetch all facilities
export async function fetchFacilities() {
  const response = await httpClient.get('/facilities');
  return response.data;
}

// Admin: create a new facility
export async function adminCreateFacility(data) {
  return requestJson('/api/facilities', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

// Admin: update an existing facility
export async function adminUpdateFacility(id, data) {
  return requestJson(`/api/facilities/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

// Admin: delete a facility
export async function adminDeleteFacility(id) {
  return requestJson(`/api/facilities/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(false),
  });
}

// Admin: get all facilities (same as fetchFacilities but with auth)
export async function adminGetAllFacilities() {
  return requestJson('/api/facilities', {
    headers: getAuthHeaders(false),
  });
}