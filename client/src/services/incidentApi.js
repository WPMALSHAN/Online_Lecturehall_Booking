import { requestBlob, requestJson } from './apiClient';

function authHeaders(token, hasJsonBody = true) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (hasJsonBody) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export function getIncidents(token, status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return requestJson(`/api/incidents${query}`, {
    headers: authHeaders(token, false),
  });
}

export function getIncidentById(token, id) {
  return requestJson(`/api/incidents/${id}`, {
    headers: authHeaders(token, false),
  });
}

export function createIncident(token, data, files) {
  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append(
      'data',
      new Blob([JSON.stringify(data)], { type: 'application/json' }),
    );

    files.forEach((file) => {
      formData.append('attachments', file);
    });

    return requestJson('/api/incidents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  }

  return requestJson('/api/incidents', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function resolveIncident(token, incidentId) {
  return requestJson(`/api/incidents/${incidentId}/resolve`, {
    method: 'PUT',
    headers: authHeaders(token, false),
  });
}

export function closeIncident(token, incidentId) {
  return requestJson(`/api/incidents/${incidentId}/close`, {
    method: 'PUT',
    headers: authHeaders(token, false),
  });
}

export function rejectIncident(token, incidentId) {
  return requestJson(`/api/incidents/${incidentId}/reject`, {
    method: 'PUT',
    headers: authHeaders(token, false),
  });
}

export function assignTechnician(token, incidentId, technicianId) {
  return requestJson(`/api/incidents/${incidentId}/assign`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ technicianId }),
  });
}

export function linkIncidentAsset(token, incidentId, assetId) {
  return requestJson(`/api/incidents/${incidentId}/asset`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ assetId }),
  });
}

export function getIncidentComments(token, incidentId) {
  return requestJson(`/api/incidents/${incidentId}/updates`, {
    headers: authHeaders(token, false),
  });
}

export function addIncidentComment(token, incidentId, message) {
  return requestJson(`/api/incidents/${incidentId}/updates`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ updateText: message }),
  });
}

export function deleteIncidentAttachment(token, incidentId, attachmentId) {
  return requestJson(`/api/incidents/${incidentId}/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: authHeaders(token, false),
  });
}

export function getIncidentAttachmentBlob(token, incidentId, attachmentId) {
  return requestBlob(`/api/incidents/${incidentId}/attachments/${attachmentId}`, {
    headers: authHeaders(token, false),
  });
}

export function addIncidentAttachments(token, incidentId, files) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('attachments', file);
  });

  return requestJson(`/api/incidents/${incidentId}/attachments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
}

export function getUsers(token) {
  return requestJson('/api/users', {
    headers: authHeaders(token, false),
  });
}
