import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: 'job' | 'vehicle' | 'maintenance' | 'telemetry';
  data: any;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
}

class OfflineSyncService {
  private readonly SYNC_QUEUE_KEY = 'offline_sync_queue';
  private readonly CACHED_DATA_KEY = 'offline_cached_data';
  private isSyncing = false;

  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'status'>) {
    const syncOp: SyncOperation = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
      ...operation,
    };

    const queue = await this.getQueue();
    queue.push(syncOp);
    await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));

    return syncOp;
  }

  async getQueue(): Promise<SyncOperation[]> {
    const queue = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  }

  async cacheData(key: string, data: any) {
    const cache = await this.getCachedData();
    cache[key] = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(this.CACHED_DATA_KEY, JSON.stringify(cache));
  }

  async getCachedData(): Promise<Record<string, any>> {
    const cache = await AsyncStorage.getItem(this.CACHED_DATA_KEY);
    return cache ? JSON.parse(cache) : {};
  }

  async getCachedValue(key: string) {
    const cache = await this.getCachedData();
    return cache[key]?.data || null;
  }

  async syncQueue(isOnline: boolean): Promise<{ synced: number; failed: number }> {
    if (!isOnline || this.isSyncing) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const queue = await this.getQueue();
      const pendingOps = queue.filter(op => op.status === 'pending');

      for (const operation of pendingOps) {
        try {
          await this.executeSyncOperation(operation);
          operation.status = 'synced';
          synced++;
        } catch (error) {
          operation.status = 'failed';
          failed++;
        }
      }

      // Update queue
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed };
  }

  private async executeSyncOperation(operation: SyncOperation) {
    const baseUrl = '/api/v1';

    switch (operation.resource) {
      case 'job':
        if (operation.type === 'CREATE') {
          await apiClient.post(`${baseUrl}/jobs`, operation.data);
        } else if (operation.type === 'UPDATE') {
          await apiClient.patch(`${baseUrl}/jobs/${operation.data.id}`, operation.data);
        } else if (operation.type === 'DELETE') {
          await apiClient.delete(`${baseUrl}/jobs/${operation.data.id}`);
        }
        break;

      case 'vehicle':
        if (operation.type === 'UPDATE') {
          await apiClient.patch(`${baseUrl}/vehicles/${operation.data.id}`, operation.data);
        }
        break;

      case 'telemetry':
        if (operation.type === 'CREATE') {
          await apiClient.post(`${baseUrl}/telemetry/bulk`, operation.data);
        }
        break;

      case 'maintenance':
        if (operation.type === 'CREATE') {
          await apiClient.post(`${baseUrl}/maintenance`, operation.data);
        } else if (operation.type === 'UPDATE') {
          await apiClient.patch(`${baseUrl}/maintenance/${operation.data.id}`, operation.data);
        }
        break;
    }
  }

  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.filter(op => op.status === 'pending').length;
  }

  async clearSyncedOperations() {
    const queue = await this.getQueue();
    const filtered = queue.filter(op => op.status !== 'synced');
    await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(filtered));
  }
}

export const offlineSyncService = new OfflineSyncService();
