import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

interface MapLocation {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  type: 'vehicle' | 'job' | 'maintenance';
  color?: string;
  timestamp?: Date;
}

interface AdvancedMapProps {
  locations: MapLocation[];
  selectedLocationId?: string;
  onLocationPress?: (location: MapLocation) => void;
  showRoute?: boolean;
  routePoints?: Array<{ latitude: number; longitude: number }>;
  zoom?: boolean;
  heatmapEnabled?: boolean;
}

const AdvancedMap: React.FC<AdvancedMapProps> = ({
  locations,
  selectedLocationId,
  onLocationPress,
  showRoute = false,
  routePoints = [],
  zoom = true,
  heatmapEnabled = false,
}) => {
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7128,
    longitude: -74.006,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [followUser, setFollowUser] = useState(false);

  useEffect(() => {
    if (locations.length > 0 && zoom) {
      calculateRegion();
    }
  }, [locations]);

  const calculateRegion = () => {
    if (locations.length === 0) return;

    let minLat = locations[0].latitude;
    let maxLat = locations[0].latitude;
    let minLng = locations[0].longitude;
    let maxLng = locations[0].longitude;

    locations.forEach(loc => {
      minLat = Math.min(minLat, loc.latitude);
      maxLat = Math.max(maxLat, loc.latitude);
      minLng = Math.min(minLng, loc.longitude);
      maxLng = Math.max(maxLng, loc.longitude);
    });

    const latitudeDelta = (maxLat - minLat) * 1.2;
    const longitudeDelta = (maxLng - minLng) * 1.2;

    setMapRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latitudeDelta, 0.01),
      longitudeDelta: Math.max(longitudeDelta, 0.01),
    });
  };

  const getMarkerColor = (location: MapLocation): string => {
    if (selectedLocationId === location.id) return '#FF6B6B';
    if (location.color) return location.color;

    switch (location.type) {
      case 'vehicle':
        return '#4A90E2';
      case 'job':
        return '#50E3C2';
      case 'maintenance':
        return '#F5A623';
      default:
        return '#999999';
    }
  };

  const getMarkerIcon = (location: MapLocation): string => {
    switch (location.type) {
      case 'vehicle':
        return 'car';
      case 'job':
        return 'briefcase';
      case 'maintenance':
        return 'hammer';
      default:
        return 'location';
    }
  };

  const handleMarkerPress = (location: MapLocation) => {
    if (onLocationPress) {
      onLocationPress(location);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        onRegionChange={setMapRegion}
        followsUserLocation={followUser}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Route polyline */}
        {showRoute && routePoints.length > 1 && (
          <Polyline
            coordinates={routePoints}
            strokeColor="#007AFF"
            strokeWidth={3}
            lineDashPattern={[10]}
          />
        )}

        {/* Heatmap circles for density visualization */}
        {heatmapEnabled &&
          locations.map((location, index) => (
            <Circle
              key={`heat-${location.id}`}
              center={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              radius={500 + index * 200}
              fillColor={`${getMarkerColor(location)}33`}
              strokeColor={`${getMarkerColor(location)}66`}
              strokeWidth={2}
            />
          ))}

        {/* Location markers */}
        {locations.map(location => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.title}
            description={location.description}
            onPress={() => handleMarkerPress(location)}
            pinColor={getMarkerColor(location)}
          >
            <View
              style={[
                styles.customMarker,
                { backgroundColor: getMarkerColor(location) },
                selectedLocationId === location.id && styles.selectedMarker,
              ]}
            >
              <Ionicons
                name={getMarkerIcon(location) as any}
                size={16}
                color="white"
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Control buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setFollowUser(!followUser)}
        >
          <Ionicons
            name={followUser ? 'navigate' : 'navigate-outline'}
            size={24}
            color={followUser ? '#007AFF' : '#666'}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={calculateRegion}>
          <Ionicons name="expand" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Location info panel */}
      {selectedLocationId && (
        <View style={styles.infoPanel}>
          {locations
            .filter(loc => loc.id === selectedLocationId)
            .map(location => (
              <View key={location.id}>
                <Text style={styles.infoPanelTitle}>{location.title}</Text>
                {location.description && (
                  <Text style={styles.infoPanelDescription}>{location.description}</Text>
                )}
                <Text style={styles.infoPanelMeta}>
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Text>
              </View>
            ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  selectedMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
  },
  controls: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 12,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  infoPanelTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoPanelDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  infoPanelMeta: {
    fontSize: 12,
    color: '#999',
  },
});

export default AdvancedMap;
