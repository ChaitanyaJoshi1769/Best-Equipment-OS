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

export interface TelemetryEvent {
  id: string;
  vehicleId: string;
  eventType: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  fuelLevel?: number;
  engineHours?: number;
  receivedAt: string;
}

export interface MaintenanceSchedule {
  id: string;
  vehicleId: string;
  maintenanceType: string;
  frequencyType?: 'days' | 'months' | 'hours' | 'miles';
  frequencyValue?: number;
  nextDueDate?: string;
  status: 'active' | 'inactive' | 'completed';
}

export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    apiClient.setToken(response.data.access_token);
    return response.data;
  },

  register: async (email: string, password: string, organizationName: string) => {
    return apiClient.post('/auth/register', { email, password, organizationName });
  },

  logout: () => {
    apiClient.clearToken();
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

  create: async (vehicleData: Partial<Vehicle>) => {
    return apiClient.post('/vehicles', vehicleData);
  },

  update: async (id: string, vehicleData: Partial<Vehicle>) => {
    return apiClient.patch(`/vehicles/${id}`, vehicleData);
  },

  updateLocation: async (id: string, latitude: number, longitude: number) => {
    return apiClient.patch(`/vehicles/${id}/location`, { latitude, longitude });
  },

  getStats: async (organizationId: string) => {
    return apiClient.get('/vehicles/stats', {
      params: { organizationId },
    });
  },

  delete: async (id: string) => {
    return apiClient.delete(`/vehicles/${id}`);
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

  create: async (jobData: Partial<Job>) => {
    return apiClient.post('/jobs', jobData);
  },

  update: async (id: string, jobData: Partial<Job>) => {
    return apiClient.patch(`/jobs/${id}`, jobData);
  },

  getByStatus: async (organizationId: string, status: string) => {
    return apiClient.get('/jobs/by-status', {
      params: { organizationId, status },
    });
  },

  getDispatchBoard: async (organizationId: string, date: string) => {
    return apiClient.get('/jobs/dispatch-board', {
      params: { organizationId, date },
    });
  },

  assign: async (jobId: string, technicianId: string) => {
    return apiClient.post(`/jobs/${jobId}/assign`, { technicianId });
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

  cancel: async (jobId: string, reason?: string) => {
    return apiClient.post(`/jobs/${jobId}/cancel`, { reason });
  },

  checkSLA: async (jobId: string) => {
    return apiClient.get(`/jobs/${jobId}/sla`);
  },

  delete: async (jobId: string) => {
    return apiClient.delete(`/jobs/${jobId}`);
  },
};

export const telemetryService = {
  getLatest: async (vehicleId: string) => {
    return apiClient.get(`/telemetry/vehicle/${vehicleId}/latest`);
  },

  getHistory: async (
    vehicleId: string,
    startDate: string,
    endDate: string,
  ) => {
    return apiClient.get(`/telemetry/vehicle/${vehicleId}/history`, {
      params: { startDate, endDate },
    });
  },

  getSpeedMetrics: async (
    vehicleId: string,
    startDate: string,
    endDate: string,
  ) => {
    return apiClient.get(`/telemetry/vehicle/${vehicleId}/speed-metrics`, {
      params: { startDate, endDate },
    });
  },

  getFuelTrend: async (
    vehicleId: string,
    startDate: string,
    endDate: string,
  ) => {
    return apiClient.get(`/telemetry/vehicle/${vehicleId}/fuel-trend`, {
      params: { startDate, endDate },
    });
  },

  bulkCreate: async (events: Partial<TelemetryEvent>[]) => {
    return apiClient.post('/telemetry/bulk', { events });
  },
};

export const maintenanceService = {
  list: async (organizationId: string) => {
    return apiClient.get(`/maintenance/organization/${organizationId}/all`);
  },

  getById: async (id: string) => {
    return apiClient.get(`/maintenance/${id}`);
  },

  create: async (scheduleData: Partial<MaintenanceSchedule>) => {
    return apiClient.post('/maintenance', scheduleData);
  },

  update: async (id: string, scheduleData: Partial<MaintenanceSchedule>) => {
    return apiClient.patch(`/maintenance/${id}`, scheduleData);
  },

  getDue: async (organizationId: string) => {
    return apiClient.get(`/maintenance/organization/${organizationId}/due`);
  },

  getUpcoming: async (organizationId: string, days = 30) => {
    return apiClient.get(`/maintenance/organization/${organizationId}/upcoming`, {
      params: { days },
    });
  },

  getStats: async (organizationId: string) => {
    return apiClient.get(`/maintenance/organization/${organizationId}/stats`);
  },

  markCompleted: async (id: string, completedDate?: string) => {
    return apiClient.post(`/maintenance/${id}/mark-completed`, { completedDate });
  },

  reschedule: async (
    id: string,
    frequencyType: string,
    frequencyValue: number,
  ) => {
    return apiClient.post(`/maintenance/${id}/reschedule`, {
      frequencyType,
      frequencyValue,
    });
  },

  delete: async (id: string) => {
    return apiClient.delete(`/maintenance/${id}`);
  },
};
