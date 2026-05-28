import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CapturedPhoto {
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

class PhotoCaptureService {
  private readonly PHOTOS_CACHE_KEY = 'captured_photos';
  private readonly PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;

  async requestPermissions() {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

    return {
      cameraGranted: cameraStatus.granted,
      libraryGranted: libraryStatus.granted,
    };
  }

  async capturePhoto(metadata?: CapturedPhoto['metadata']): Promise<CapturedPhoto | null> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      const photo = await this.createPhoto(asset.uri, metadata);
      await this.savePhotoMetadata(photo);

      return photo;
    } catch (error) {
      console.error('Failed to capture photo:', error);
      return null;
    }
  }

  async pickPhotoFromLibrary(metadata?: CapturedPhoto['metadata']): Promise<CapturedPhoto | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      const photo = await this.createPhoto(asset.uri, metadata);
      await this.savePhotoMetadata(photo);

      return photo;
    } catch (error) {
      console.error('Failed to pick photo:', error);
      return null;
    }
  }

  private async createPhoto(sourceUri: string, metadata?: CapturedPhoto['metadata']): Promise<CapturedPhoto> {
    // Create photos directory if it doesn't exist
    const dirInfo = await FileSystem.getInfoAsync(this.PHOTOS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.PHOTOS_DIR, { intermediates: true });
    }

    const filename = `photo-${Date.now()}.jpg`;
    const targetUri = `${this.PHOTOS_DIR}${filename}`;

    // Copy photo to app directory
    await FileSystem.copyAsync({
      from: sourceUri,
      to: targetUri,
    });

    return {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uri: targetUri,
      filename,
      timestamp: Date.now(),
      metadata,
    };
  }

  async getPhotos(filterId?: string): Promise<CapturedPhoto[]> {
    const photosJson = await AsyncStorage.getItem(this.PHOTOS_CACHE_KEY);
    const photos: CapturedPhoto[] = photosJson ? JSON.parse(photosJson) : [];

    if (filterId) {
      return photos.filter(
        p =>
          p.metadata?.jobId === filterId ||
          p.metadata?.vehicleId === filterId ||
          p.metadata?.maintenanceId === filterId,
      );
    }

    return photos;
  }

  async getPhotosByJob(jobId: string): Promise<CapturedPhoto[]> {
    return this.getPhotos(jobId);
  }

  async updatePhotoMetadata(photoId: string, metadata: Partial<CapturedPhoto['metadata']>) {
    const photos = await this.getPhotos();
    const photoIndex = photos.findIndex(p => p.id === photoId);

    if (photoIndex >= 0) {
      photos[photoIndex].metadata = {
        ...photos[photoIndex].metadata,
        ...metadata,
      };
      await AsyncStorage.setItem(this.PHOTOS_CACHE_KEY, JSON.stringify(photos));
    }
  }

  async deletePhoto(photoId: string) {
    const photos = await this.getPhotos();
    const photoIndex = photos.findIndex(p => p.id === photoId);

    if (photoIndex >= 0) {
      const photo = photos[photoIndex];
      try {
        await FileSystem.deleteAsync(photo.uri, { idempotent: true });
      } catch (error) {
        console.error('Failed to delete photo file:', error);
      }

      photos.splice(photoIndex, 1);
      await AsyncStorage.setItem(this.PHOTOS_CACHE_KEY, JSON.stringify(photos));
    }
  }

  async getPhotoSize(photoId: string): Promise<number | null> {
    const photos = await this.getPhotos();
    const photo = photos.find(p => p.id === photoId);

    if (!photo) return null;

    try {
      const fileInfo = await FileSystem.getInfoAsync(photo.uri);
      return fileInfo.size || null;
    } catch (error) {
      return null;
    }
  }

  async getTotalPhotoSize(): Promise<number> {
    const photos = await this.getPhotos();
    let totalSize = 0;

    for (const photo of photos) {
      const size = await this.getPhotoSize(photo.id);
      if (size) totalSize += size;
    }

    return totalSize;
  }

  private async savePhotoMetadata(photo: CapturedPhoto) {
    const photos = await this.getPhotos();
    photos.push(photo);
    await AsyncStorage.setItem(this.PHOTOS_CACHE_KEY, JSON.stringify(photos));
  }

  async syncPhotosToServer(apiClient: any): Promise<{ synced: number; failed: number }> {
    const photos = await this.getPhotos();
    let synced = 0;
    let failed = 0;

    for (const photo of photos) {
      try {
        const fileData = await FileSystem.readAsStringAsync(photo.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await apiClient.post('/api/v1/photos', {
          filename: photo.filename,
          data: fileData,
          metadata: photo.metadata,
        });

        synced++;
      } catch (error) {
        console.error(`Failed to sync photo ${photo.id}:`, error);
        failed++;
      }
    }

    return { synced, failed };
  }
}

export const photoCaptureService = new PhotoCaptureService();
