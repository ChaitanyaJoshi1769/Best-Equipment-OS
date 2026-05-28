import { apiClient } from './client';

export interface Vehicle {
  id: string;
  name: string;
  assetId: string;
  vin?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  location?: string;
  currentFuel?: number;
  engineHours?: number;
  assignedTechnicianId?: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  title: string;
  vehicleId?: string;
  assignedTechnicianId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  scheduledDate?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  slaDeadline?: string;
}

export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    apiClient.setToken(response.data.access_token);
    return response.data;
  },

  logout: async () => {
    await apiClient.clearToken();
  },

  getMe: async () => {
    return apiClient.get('/auth/me');
  },
};

export const vehiclesService = {
  list: async (organizationId: string, skip = 0, take = 20) => {
    return apiClient.get('/vehicles', {
      params: { organizationId, skip, take },
    });
  },

  getById: async (id: string) => {
    return apiClient.get(`/vehicles/${id}`);
  },

  updateLocation: async (id: string, latitude: number, longitude: number) => {
    return apiClient.patch(`/vehicles/${id}/location`, { latitude, longitude });
  },

  getStats: async (organizationId: string) => {
    return apiClient.get('/vehicles/stats', {
      params: { organizationId },
    });
  },
};

export const jobsService = {
  list: async (organizationId: string, skip = 0, take = 20) => {
    return apiClient.get('/jobs/by-organization', {
      params: { organizationId, skip, take },
    });
  },

  getById: async (id: string) => {
    return apiClient.get(`/jobs/${id}`);
  },

  start: async (jobId: string) => {
    return apiClient.post(`/jobs/${jobId}/start`, {});
  },

  complete: async (jobId: string, completionData?: Partial<Job>) => {
    return apiClient.post(`/jobs/${jobId}/complete`, completionData);
  },

  pause: async (jobId: string) => {
    return apiClient.post(`/jobs/${jobId}/pause`, {});
  },

  resume: async (jobId: string) => {
    return apiClient.post(`/jobs/${jobId}/resume`, {});
  },

  checkSLA: async (jobId: string) => {
    return apiClient.get(`/jobs/${jobId}/sla`);
  },
};

export const telemetryService = {
  getLatest: async (vehicleId: string) => {
    return apiClient.get(`/telemetry/vehicle/${vehicleId}/latest`);
  },

  getHistory: async (vehicleId: string, startDate: string, endDate: string) => {
    return apiClient.get(`/telemetry/vehicle/${vehicleId}/history`, {
      params: { startDate, endDate },
    });
  },

  getSpeedMetrics: async (vehicleId: string, startDate: string, endDate: string) => {
    return apiClient.get(`/telemetry/vehicle/${vehicleId}/speed-metrics`, {
      params: { startDate, endDate },
    });
  },
};
