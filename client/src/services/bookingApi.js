import { requestJson } from './apiClient';

function authHeaders(token, hasJsonBody = true) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (hasJsonBody) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export const bookingApi = {
    // User endpoints
    createBooking: async (token, bookingData) => {
        return requestJson('/api/bookings', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify(bookingData)
        });
    },
    
    getUserBookings: async (token) => {
        return requestJson('/api/bookings/my-bookings', {
            headers: authHeaders(token, false)
        });
    },
    
    cancelBooking: async (token, id) => {
        return requestJson(`/api/bookings/${id}/cancel`, {
            method: 'PUT',
            headers: authHeaders(token, false)
        });
    },

    // Admin endpoints
    getAllBookings: async (token) => {
        return requestJson('/api/bookings', {
            headers: authHeaders(token, false)
        });
    },
    
    approveBooking: async (token, id) => {
        return requestJson(`/api/bookings/${id}/approve`, {
            method: 'PUT',
            headers: authHeaders(token, false)
        });
    },
    
    rejectBooking: async (token, id, reason) => {
        return requestJson(`/api/bookings/${id}/reject`, {
            method: 'PUT',
            headers: authHeaders(token),
            body: JSON.stringify({ reason })
        });
    }
};
