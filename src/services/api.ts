// API Base Configuration
const API_BASE_URL = '/api';

// API Client Configuration
const apiClient = {
  baseURL: API_BASE_URL,
  
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  // GET request
  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  // POST request
  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PUT request
  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // DELETE request
  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // PATCH request
  async patch(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
};

// Authentication API
export const auth = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  
  logout: () => apiClient.post('/auth/logout'),
  
  verifyToken: () => apiClient.get('/auth/verify'),
  
  refreshToken: () => apiClient.post('/auth/refresh'),
};

// User Management API
export const users = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, value.toString());
      });
    }
    return apiClient.get(`/users?${searchParams.toString()}`);
  },
  
  getById: (id: number) => apiClient.get(`/users/${id}`),
  
  create: (userData: any) => apiClient.post('/users', userData),
  
  update: (id: number, userData: any) => apiClient.put(`/users/${id}`, userData),
  
  delete: (id: number) => apiClient.delete(`/users/${id}`),
  
  updateStatus: (id: number, status: string) => 
    apiClient.patch(`/users/${id}/status`, { status }),
};

// Roles API
export const roles = {
  getAll: () => apiClient.get('/roles'),
  
  getById: (id: number) => apiClient.get(`/roles/${id}`),
  
  create: (roleData: { name: string; description?: string }) => 
    apiClient.post('/roles', roleData),
  
  update: (id: number, roleData: { name: string; description?: string }) => 
    apiClient.put(`/roles/${id}`, roleData),
  
  delete: (id: number) => apiClient.delete(`/roles/${id}`),
  
  getPermissions: (id: number) => apiClient.get(`/roles/${id}/permissions`),
  
  updatePermissions: (id: number, permissionIds: number[]) => 
    apiClient.post(`/roles/${id}/permissions`, { permissionIds }),
  
  assignToUser: (userId: number, roleId: number) => 
    apiClient.post('/roles/assign', { userId, roleId }),
};

// Permissions API
export const permissions = {
  getAll: () => apiClient.get('/permissions'),
  
  getById: (id: number) => apiClient.get(`/permissions/${id}`),
  
  create: (permissionData: {
    name: string;
    description?: string;
    module: string;
    action: string;
  }) => apiClient.post('/permissions', permissionData),
  
  update: (id: number, permissionData: {
    name: string;
    description?: string;
    module: string;
    action: string;
  }) => apiClient.put(`/permissions/${id}`, permissionData),
  
  delete: (id: number) => apiClient.delete(`/permissions/${id}`),
  
  getModules: () => apiClient.get('/permissions/modules/list'),
  
  getActions: () => apiClient.get('/permissions/actions/list'),
  
  getByModule: (module: string) => apiClient.get(`/permissions/module/${module}`),
};

// Signup API
export const signup = {
  sendOtp: (phone: string) => apiClient.post('/signup/send-otp', { phone }),
  
  verifyOtp: (phone: string, otp: string) => 
    apiClient.post('/signup/verify-otp', { phone, otp }),
  
  register: (userData: any) => apiClient.post('/signup/register', userData),
};

// Dashboard API
export const dashboard = {
  getData: (params?: {
    from?: string;
    to?: string;
    slaveId?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, value.toString());
      });
    }
    return apiClient.get(`/dashboard?${searchParams.toString()}`);
  },
};

// Meter Tree API
export const meterTree = {
  getLocations: (treeType?: string) => {
    const params = treeType ? `?treeType=${treeType}` : '';
    return apiClient.get(`/meter-tree/locations${params}`);
  },
  
  getMeters: (locationId?: number) => {
    const params = locationId ? `?locationId=${locationId}` : '';
    return apiClient.get(`/meter-tree/meters${params}`);
  },
};

// Table Data API
export const tableData = {
  getData: (params?: {
    from?: string;
    to?: string;
    slaveId?: number;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, value.toString());
      });
    }
    return apiClient.get(`/table-data?${searchParams.toString()}`);
  },
};

// Real-time Data API
export const realtimeData = {
  getData: (slaveId?: number) => {
    const params = slaveId ? `?slaveId=${slaveId}` : '';
    return apiClient.get(`/realtime-data${params}`);
  },
};

// Events API
export const events = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, value.toString());
      });
    }
    return apiClient.get(`/events?${searchParams.toString()}`);
  },
  
  getById: (id: number) => apiClient.get(`/events/${id}`),
  
  create: (eventData: any) => apiClient.post('/events', eventData),
  
  update: (id: number, eventData: any) => apiClient.put(`/events/${id}`, eventData),
  
  delete: (id: number) => apiClient.delete(`/events/${id}`),
};

// Holiday API
export const holiday = {
  getAll: () => apiClient.get('/holiday'),
  
  getById: (id: number) => apiClient.get(`/holiday/${id}`),
  
  create: (holidayData: any) => apiClient.post('/holiday', holidayData),
  
  update: (id: number, holidayData: any) => apiClient.put(`/holiday/${id}`, holidayData),
  
  delete: (id: number) => apiClient.delete(`/holiday/${id}`),
};

// Email API
export const email = {
  sendEmail: (emailData: any) => apiClient.post('/email/send', emailData),
  
  getTemplates: () => apiClient.get('/email/templates'),
  
  createTemplate: (templateData: any) => apiClient.post('/email/templates', templateData),
  
  updateTemplate: (id: number, templateData: any) => 
    apiClient.put(`/email/templates/${id}`, templateData),
  
  deleteTemplate: (id: number) => apiClient.delete(`/email/templates/${id}`),
};

// FT Config API
export const ftConfig = {
  getAll: () => apiClient.get('/ft-config'),
  
  getById: (id: number) => apiClient.get(`/ft-config/${id}`),
  
  create: (configData: any) => apiClient.post('/ft-config', configData),
  
  update: (id: number, configData: any) => apiClient.put(`/ft-config/${id}`, configData),
  
  delete: (id: number) => apiClient.delete(`/ft-config/${id}`),
};

// Error handling utility
export const handleApiError = (error: any, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    return error.response.data?.message || `Server error: ${error.response.status}`;
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error: Unable to connect to server';
  } else {
    // Something else happened
    return error.message || defaultMessage;
  }
};

// Type definitions
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  address?: string;
  phone?: string;
  lineId?: string;
  level: string;
  status: 'active' | 'inactive';
  note?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  role_name?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  name: string;
  surname: string;
  address?: string;
  phone?: string;
  lineId?: string;
  level: string;
  status: 'active' | 'inactive';
  note?: string;
}

// Export API client for direct use
export const api = apiClient;
export { apiClient };


