// API Helper Module
const API = (() => {
  const BASE_URL = '';

  function getToken() {
    return localStorage.getItem('token');
  }

  function getHeaders(includeAuth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (includeAuth) {
      const token = getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async function request(method, path, body = null, auth = false) {
    const options = {
      method,
      headers: getHeaders(auth),
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error del servidor');
    }

    return data;
  }

  return {
    // Auth
    login: (email, password) => request('POST', '/api/auth/login', { email, password }),
    register: (email, password) => request('POST', '/api/auth/register', { email, password }),

    // Barbershops (public)
    getBarbershops: () => request('GET', '/api/barbershops'),
    getBarbershop: (id) => request('GET', `/api/barbershops/${id}`),
    getAvailability: (id, date) => request('GET', `/api/barbershops/${id}/availability?date=${date}`),

    // Barbershops (auth)
    getMyProfile: () => request('GET', '/api/barbershops/me/profile', null, true),
    updateMyProfile: (data) => request('POST', '/api/barbershops/me/profile', data, true),

    // Services (auth)
    getMyServices: () => request('GET', '/api/services/my', null, true),
    createService: (data) => request('POST', '/api/services', data, true),
    updateService: (id, data) => request('PUT', `/api/services/${id}`, data, true),
    deleteService: (id) => request('DELETE', `/api/services/${id}`, null, true),

    // Reservations (public)
    initiateReservation: (data) => request('POST', '/api/reservations/initiate', data),
    payReservation: (id, data) => request('POST', `/api/reservations/${id}/pay`, data),
    trackReservation: (code) => request('GET', `/api/reservations/track/${code}`),

    // Reservations (auth barbershop)
    getMyReservations: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request('GET', `/api/reservations/barbershop/mine?${query}`, null, true);
    },
    getMyIncomeStats: () => request('GET', '/api/reservations/barbershop/stats', null, true),
    completeReservation: (id) => request('PATCH', `/api/reservations/${id}/complete`, null, true),

    // Admin
    getAdminStats: () => request('GET', '/api/admin/stats', null, true),
    getAdminBarbershops: () => request('GET', '/api/admin/barbershops', null, true),
    createBarbershopAccount: (data) => request('POST', '/api/admin/barbershops/create-account', data, true),
    updateCommission: (id, commission_percent) => request('PATCH', `/api/admin/barbershops/${id}/commission`, { commission_percent }, true),
    toggleBarbershop: (id) => request('PATCH', `/api/admin/barbershops/${id}/toggle`, null, true),
    deleteBarbershop: (id) => request('DELETE', `/api/admin/barbershops/${id}`, null, true),
    getAdminReservations: () => request('GET', '/api/admin/reservations', null, true),
  };
})();
