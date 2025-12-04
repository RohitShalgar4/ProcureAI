import axios from 'axios';

// API base URL from environment variable or default to localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Error handler utility
 * Extracts user-friendly error messages from API responses
 */
export const handleApiError = (error) => {
  console.error('API Error:', error);

  // Network error (no response from server)
  if (!error.response) {
    return {
      message: 'Network error. Please check your connection and try again.',
      code: 'NETWORK_ERROR',
      details: null,
    };
  }

  // Server responded with error
  const { data, status } = error.response;
  
  // Extract error information from response
  const errorData = data?.error || {};
  
  return {
    message: errorData.message || 'An unexpected error occurred',
    code: errorData.code || 'UNKNOWN_ERROR',
    details: errorData.details || null,
    status,
  };
};

/**
 * Request interceptor for logging
 */
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for consistent error handling
 */
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const errorInfo = handleApiError(error);
    console.error('Response Error:', errorInfo);
    
    // Attach formatted error info to the error object
    error.formattedError = errorInfo;
    
    return Promise.reject(error);
  }
);

// Vendor API functions
export const vendorAPI = {
  getAll: async () => {
    const response = await api.get('/vendors');
    return response.data;
  },

  create: async (vendorData) => {
    const response = await api.post('/vendors', vendorData);
    return response.data;
  },

  update: async (id, vendorData) => {
    const response = await api.put(`/vendors/${id}`, vendorData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/vendors/${id}`);
    return response.data;
  },
};

// RFP API functions
export const rfpAPI = {
  create: async (rfpData) => {
    const response = await api.post('/rfps', rfpData);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/rfps');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/rfps/${id}`);
    return response.data;
  },

  send: async (id, vendorIds) => {
    const response = await api.post(`/rfps/${id}/send`, vendorIds);
    return response.data;
  },
};

// Proposal API functions
export const proposalAPI = {
  getByRFP: async (rfpId) => {
    const response = await api.get(`/rfps/${rfpId}/proposals`);
    return response.data;
  },

  getComparison: async (rfpId) => {
    const response = await api.get(`/rfps/${rfpId}/comparison`);
    return response.data;
  },
};

export default api;
