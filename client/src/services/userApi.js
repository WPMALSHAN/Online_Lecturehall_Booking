import httpClient from './httpClient';

export const userApi = {
  // GET /api/users - all users
  getAllUsers: () => httpClient.get('/users').then((r) => r.data),

  // GET /api/users/by-role?role=STUDENT
  getUsersByRole: (role) =>
    httpClient.get('/users/by-role', { params: { role } }).then((r) => r.data),

  // PUT /api/users/{id}/role
  updateRole: (id, role) =>
    httpClient.put(`/users/${id}/role`, { role }).then((r) => r.data),

  // PUT /api/users/{id}/block
  blockUser: (id) => httpClient.put(`/users/${id}/block`).then((r) => r.data),

  // PUT /api/users/{id}/unblock
  unblockUser: (id) => httpClient.put(`/users/${id}/unblock`).then((r) => r.data),

  // DELETE /api/users/{id}
  deleteUser: (id) => httpClient.delete(`/users/${id}`).then((r) => r.data),
};
