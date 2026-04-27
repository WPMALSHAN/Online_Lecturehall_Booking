import httpClient from './httpClient';

export const feedbackApi = {
  // Admin: submit feedback for a resolved incident
  submitFeedback: (incidentId, rating, comment) =>
    httpClient
      .post(`/feedback/incident/${incidentId}`, { rating, comment })
      .then((r) => r.data),

  // Admin: check if feedback already submitted for incident
  checkExists: (incidentId) =>
    httpClient
      .get(`/feedback/incident/${incidentId}/exists`)
      .then((r) => r.data.exists),

  // Admin: get all feedback for a specific technician
  getByTechnician: (technicianId) =>
    httpClient.get(`/feedback/technician/${technicianId}`).then((r) => r.data),

  // Technician: get own feedback list
  getMyFeedback: () => httpClient.get('/feedback/my').then((r) => r.data),

  // Technician: get own summary (avg rating + count)
  getMySummary: () => httpClient.get('/feedback/my/summary').then((r) => r.data),
};
