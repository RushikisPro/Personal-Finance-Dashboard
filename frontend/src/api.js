const BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = {
  getToken: () => localStorage.getItem('pfd_token'),
  setToken: (token) => localStorage.setItem('pfd_token', token),
  removeToken: () => localStorage.removeItem('pfd_token'),

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Network request failed');
    }
    return data;
  },

  sendOtp: (phone) =>
    api.request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: (phone, code, name) =>
    api.request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code, name }),
    }),

  getDashboard: () => api.request('/api/dashboard'),

  addTransaction: (tx) =>
    api.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(tx),
    }),

  setBudget: (budget) =>
    api.request('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    }),
};
