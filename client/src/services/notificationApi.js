import httpClient from './httpClient';

export async function fetchNotifications() {
  const response = await httpClient.get('/notifications');
  return response.data;
}

export async function markNotificationRead(notificationId) {
  const response = await httpClient.put(`/notifications/read/${notificationId}`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await httpClient.put('/notifications/read-all');
  return response.data;
}
