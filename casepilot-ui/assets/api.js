/* CasePilot API Client
   Client-side API wrapper for CasePilot backend services
   Handles authentication, request/response formatting, and error handling
*/

(function (global) {
  'use strict';

  // Configuration
  const API_BASE_URL = '/api/v1';
  const API_TIMEOUT = 30000; // 30 seconds

  // Storage helper
  const storage = {
    get(key, fallback = null) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error('Storage error:', e);
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Storage error:', e);
      }
    }
  };

  // HTTP client
  class APIClient {
    constructor(baseURL = API_BASE_URL) {
      this.baseURL = baseURL;
      this.timeout = API_TIMEOUT;
    }

    // Get auth token
    getAuthToken() {
      const user = storage.get('cp.auth.user');
      return user?.token || null;
    }

    // Build headers
    buildHeaders(customHeaders = {}) {
      const headers = {
        'Content-Type': 'application/json',
        ...customHeaders
      };

      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return headers;
    }

    // Make request
    async request(method, endpoint, options = {}) {
      const url = `${this.baseURL}${endpoint}`;
      const { body, headers, timeout = this.timeout } = options;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method,
          headers: this.buildHeaders(headers),
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          throw {
            status: response.status,
            message: data.message || 'Request failed',
            data
          };
        }

        return data;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          throw { status: 408, message: 'Request timeout' };
        }

        throw error;
      }
    }

    // HTTP methods
    get(endpoint, options) {
      return this.request('GET', endpoint, options);
    }

    post(endpoint, body, options = {}) {
      return this.request('POST', endpoint, { ...options, body });
    }

    put(endpoint, body, options = {}) {
      return this.request('PUT', endpoint, { ...options, body });
    }

    patch(endpoint, body, options = {}) {
      return this.request('PATCH', endpoint, { ...options, body });
    }

    delete(endpoint, options) {
      return this.request('DELETE', endpoint, options);
    }
  }

  // API Modules
  const api = {
    client: new APIClient(),

    // Auth
    auth: {
      login(email, password) {
        return api.client.post('/auth/login', { email, password });
      },

      register(data) {
        return api.client.post('/auth/register', data);
      },

      logout() {
        return api.client.post('/auth/logout');
      },

      getProfile() {
        return api.client.get('/auth/profile');
      },

      updateProfile(data) {
        return api.client.patch('/auth/profile', data);
      }
    },

    // Solutions
    solutions: {
      list(params = {}) {
        const query = new URLSearchParams(params).toString();
        return api.client.get(`/solutions${query ? '?' + query : ''}`);
      },

      get(id) {
        return api.client.get(`/solutions/${id}`);
      },

      create(data) {
        return api.client.post('/solutions', data);
      },

      update(id, data) {
        return api.client.put(`/solutions/${id}`, data);
      },

      delete(id) {
        return api.client.delete(`/solutions/${id}`);
      },

      generate(data) {
        return api.client.post('/solutions/generate', data);
      },

      export(id, format = 'pdf') {
        return api.client.get(`/solutions/${id}/export?format=${format}`);
      }
    },

    // Cases
    cases: {
      list(params = {}) {
        const query = new URLSearchParams(params).toString();
        return api.client.get(`/cases${query ? '?' + query : ''}`);
      },

      get(id) {
        return api.client.get(`/cases/${id}`);
      },

      search(query) {
        return api.client.post('/cases/search', { query });
      }
    },

    // Experts
    experts: {
      list(params = {}) {
        const query = new URLSearchParams(params).toString();
        return api.client.get(`/experts${query ? '?' + query : ''}`);
      },

      get(id) {
        return api.client.get(`/experts/${id}`);
      },

      requestCollaboration(solutionId, expertId, message) {
        return api.client.post('/experts/collaborate', {
          solutionId,
          expertId,
          message
        });
      }
    },

    // Orders
    orders: {
      list(params = {}) {
        const query = new URLSearchParams(params).toString();
        return api.client.get(`/orders${query ? '?' + query : ''}`);
      },

      get(id) {
        return api.client.get(`/orders/${id}`);
      },

      create(data) {
        return api.client.post('/orders', data);
      },

      cancel(id) {
        return api.client.post(`/orders/${id}/cancel`);
      }
    },

    // Invoices
    invoices: {
      list(params = {}) {
        const query = new URLSearchParams(params).toString();
        return api.client.get(`/invoices${query ? '?' + query : ''}`);
      },

      get(id) {
        return api.client.get(`/invoices/${id}`);
      },

      create(data) {
        return api.client.post('/invoices', data);
      },

      download(id) {
        return api.client.get(`/invoices/${id}/download`);
      }
    },

    // Admin
    admin: {
      stats() {
        return api.client.get('/admin/stats');
      },

      users(params = {}) {
        const query = new URLSearchParams(params).toString();
        return api.client.get(`/admin/users${query ? '?' + query : ''}`);
      },

      systemStatus() {
        return api.client.get('/admin/system/status');
      }
    }
  };

  // Error handler helper
  api.handleError = function (error) {
    console.error('API Error:', error);

    // Handle specific error codes
    if (error.status === 401) {
      // Unauthorized - redirect to login
      storage.remove('cp.auth.user');
      window.location.href = '/P-LOGIN_REGISTER.html';
      return;
    }

    if (error.status === 403) {
      // Forbidden
      alert('您没有权限执行此操作');
      return;
    }

    if (error.status === 404) {
      // Not found
      alert('请求的资源不存在');
      return;
    }

    if (error.status === 500) {
      // Server error
      alert('服务器错误，请稍后重试');
      return;
    }

    // Generic error
    alert(error.message || '请求失败，请检查网络连接');
  };

  // Export to global
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.CasePilotAPI = api;
  }

})(typeof window !== 'undefined' ? window : this);
