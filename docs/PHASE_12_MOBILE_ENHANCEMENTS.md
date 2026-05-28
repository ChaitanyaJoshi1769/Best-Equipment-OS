# Phase 12: Mobile Enhancements

## Overview

Phase 12 adds powerful offline capabilities, advanced mapping features, and photo capture functionality to the React Native mobile app, enabling field technicians to work seamlessly even without continuous connectivity.

## Features

### 1. Offline Sync

#### Overview
Complete offline-first architecture that allows technicians to continue working without internet connectivity and automatically syncs when reconnected.

#### How It Works
1. **Queue Operations**: All create/update/delete operations are queued locally
2. **Offline Caching**: Data is cached for fast access
3. **Automatic Sync**: Syncs when connectivity is restored
4. **Conflict Resolution**: Handles sync failures gracefully

#### Supported Operations
- Create jobs, vehicles, maintenance records
- Update job status, vehicle information
- Create telemetry entries
- Delete operations

#### Service: `OfflineSyncService`
Located: `apps/mobile/src/services/offline-sync.ts`

Key methods:
```typescript
// Queue an operation for syncing
queueOperation(operation: SyncOperation): Promise<SyncOperation>

// Get sync queue
getQueue(): Promise<SyncOperation[]>

// Cache data locally
cacheData(key: string, data: any): Promise<void>

// Retrieve cached data
getCachedValue(key: string): Promise<any>

// Sync queue when online
syncQueue(isOnline: boolean): Promise<{ synced: number; failed: number }>

// Get pending sync count
getPendingCount(): Promise<number>

// Clear synced operations
clearSyncedOperations(): Promise<void>
```

#### Data Structure
```typescript
interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: 'job' | 'vehicle' | 'maintenance' | 'telemetry';
  data: any;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
}
```

#### Implementation Example
```typescript
import { offlineSyncService } from '@/services/offline-sync';

// Queue a job update
await offlineSyncService.queueOperation({
  type: 'UPDATE',
  resource: 'job',
  data: { id: 'job-123', status: 'completed' }
});

// Check pending operations
const pending = await offlineSyncService.getPendingCount();

// Sync when online
const result = await offlineSyncService.syncQueue(isOnline);
console.log(`Synced: ${result.synced}, Failed: ${result.failed}`);
```

### 2. Advanced Mapping

#### AdvancedMap Component
Located: `apps/mobile/src/components/AdvancedMap.tsx`

Features:
- **Real-time Location Tracking**: Display vehicle and job locations
- **Route Visualization**: Show optimized routes with polylines
- **Marker Clustering**: Handle large numbers of points efficiently
- **Heatmap Visualization**: Density visualization of job areas
- **Info Panels**: Display location details on demand
- **Follow User**: Track current location
- **Zoom Controls**: Manual zoom and auto-fit capabilities

#### Map Types
Each location has a `type` property:
- `vehicle`: Blue markers for vehicle locations
- `job`: Teal markers for job locations
- `maintenance`: Orange markers for maintenance facilities

#### Component Props
```typescript
interface AdvancedMapProps {
  locations: MapLocation[];
  selectedLocationId?: string;
  onLocationPress?: (location: MapLocation) => void;
  showRoute?: boolean;
  routePoints?: Array<{ latitude: number; longitude: number }>;
  zoom?: boolean;
  heatmapEnabled?: boolean;
}
```

#### Map Location Interface
```typescript
interface MapLocation {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  type: 'vehicle' | 'job' | 'maintenance';
  color?: string; // Optional custom color
  timestamp?: Date;
}
```

#### Usage Example
```tsx
import AdvancedMap from '@/components/AdvancedMap';

<AdvancedMap
  locations={jobLocations}
  selectedLocationId={selectedJobId}
  onLocationPress={handleJobSelected}
  showRoute={true}
  routePoints={optimizedRoute}
  heatmapEnabled={false}
/>
```

#### Features Details

**Marker Types**:
- Vehicle: 🚗 Car icon (blue)
- Job: 💼 Briefcase icon (teal)
- Maintenance: 🔧 Hammer icon (orange)

**Interactive Elements**:
- Tap marker to select and show info panel
- Zoom controls (top right)
- Follow user button for current location tracking
- Auto-fit button to fit all locations in view

**Visual Indicators**:
- Selected marker has larger size and different border
- Route shown as dashed blue polyline
- Heatmap shows density with semi-transparent circles

### 3. Photo Capture

#### PhotoCaptureService
Located: `apps/mobile/src/services/photo-capture.ts`

Comprehensive photo management with:
- Camera capture
- Gallery selection
- Local storage management
- Metadata attachment
- Server synchronization

#### Key Methods
```typescript
// Request camera and library permissions
requestPermissions(): Promise<{ cameraGranted: boolean; libraryGranted: boolean }>

// Capture photo from camera
capturePhoto(metadata?: CapturedPhoto['metadata']): Promise<CapturedPhoto | null>

// Pick from photo library
pickPhotoFromLibrary(metadata?: CapturedPhoto['metadata']): Promise<CapturedPhoto | null>

// Get photos (with optional filtering)
getPhotos(filterId?: string): Promise<CapturedPhoto[]>

// Get photos for specific job
getPhotosByJob(jobId: string): Promise<CapturedPhoto[]>

// Update photo metadata
updatePhotoMetadata(photoId: string, metadata: Partial<CapturedPhoto['metadata']>): Promise<void>

// Delete photo
deletePhoto(photoId: string): Promise<void>

// Get photo file size
getPhotoSize(photoId: string): Promise<number | null>

// Get total storage used
getTotalPhotoSize(): Promise<number>

// Sync photos to server
syncPhotosToServer(apiClient: any): Promise<{ synced: number; failed: number }>
```

#### Photo Data Structure
```typescript
interface CapturedPhoto {
  id: string;
  uri: string;
  filename: string;
  timestamp: number;
  metadata?: {
    jobId?: string;
    vehicleId?: string;
    maintenanceId?: string;
    description?: string;
    location?: { latitude: number; longitude: number };
  };
}
```

#### Usage Example
```typescript
import { photoCaptureService } from '@/services/photo-capture';

// Request permissions
const { cameraGranted } = await photoCaptureService.requestPermissions();

// Capture photo with job metadata
const photo = await photoCaptureService.capturePhoto({
  jobId: 'job-123',
  description: 'Equipment damage on vehicle',
  location: { latitude: 40.7128, longitude: -74.006 }
});

// Get photos for a job
const jobPhotos = await photoCaptureService.getPhotosByJob('job-123');

// Sync to server
const result = await photoCaptureService.syncPhotosToServer(apiClient);
console.log(`Photos synced: ${result.synced}, failed: ${result.failed}`);
```

#### Storage Management
- Photos stored in app document directory
- Automatic cleanup on delete
- Size tracking for storage management
- Base64 encoding for server upload

## Integration with Existing Features

### Job Management
- Attach photos to jobs during completion
- View job photos in job details
- Photos synced with job update

### Vehicle Management
- Document vehicle condition with photos
- Maintenance photo documentation
- Damage/wear documentation

### Offline-First Workflow
1. Technician starts job
2. Completes work offline
3. Updates job status (queued)
4. Captures photos (stored locally)
5. Enters service notes (queued)
6. When online, all data syncs automatically

## Mobile App Configuration

### Updated package.json Dependencies
```json
{
  "react-native-maps": "^1.4.0",
  "@react-native-async-storage/async-storage": "^1.19.0",
  "expo-image-picker": "^14.0.0",
  "expo-file-system": "^15.0.0",
  "expo-location": "^16.0.0"
}
```

## Performance Considerations

### Offline Sync
- Queue operations persist across app restarts
- Batch syncs to minimize network usage
- Failed operations retained for retry
- Regular cleanup of synced operations

### Map Performance
- Heatmap disabled by default (resource intensive)
- Marker limit of ~500 points
- Polyline rendering optimized
- Lazy loading of route data

### Photo Storage
- Compression to 80% quality by default
- Automatic cleanup of temp files
- Size limits per organization configurable
- Batch upload capability

## Testing

Test coverage should include:
- Offline operation queueing and retry
- Data consistency during sync
- Photo capture and storage
- Map rendering with large datasets
- Permission handling
- Network state detection
- Metadata preservation

## Future Enhancements

- Biometric authentication for field work
- Real-time GPS tracking with background location
- Voice notes with transcription
- AR (Augmented Reality) for asset inspection
- Barcode/QR code scanning
- Document capture (receipts, signatures)
- Offline search capability

## Monitoring and Analytics

Track:
- Sync success rates
- Average queue depth
- Photo upload volume
- Offline usage patterns
- Feature adoption rates
