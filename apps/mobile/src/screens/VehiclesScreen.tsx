import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAuthStore } from '@stores/auth.store';
import { vehiclesService, Vehicle } from '@api/services';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function VehiclesScreen() {
  const { user } = useAuthStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVehicles = async () => {
    if (!user?.organization?.id) return;

    try {
      const response = await vehiclesService.list(user.organization.id);
      setVehicles(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user?.organization?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: '#10b981',
      inactive: '#9CA3AF',
      maintenance: '#f59e0b',
      retired: '#ef4444',
    };
    return colors[status] || '#gray';
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity style={styles.vehicleCard}>
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>{item.name}</Text>
          <Text style={styles.vehicleAssetId}>{item.assetId}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.vehicleDetails}>
        {item.currentFuel !== undefined && (
          <View style={styles.detailItem}>
            <Ionicons name="flash" size={16} color="#0ea5e9" />
            <Text style={styles.detailText}>Fuel: {item.currentFuel}L</Text>
          </View>
        )}

        {item.engineHours !== undefined && (
          <View style={styles.detailItem}>
            <Ionicons name="settings" size={16} color="#0ea5e9" />
            <Text style={styles.detailText}>Hours: {item.engineHours}</Text>
          </View>
        )}

        {item.vin && (
          <View style={styles.detailItem}>
            <Ionicons name="information-circle" size={16} color="#0ea5e9" />
            <Text style={styles.detailText}>VIN: {item.vin.slice(-4)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        renderItem={renderVehicleItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No vehicles found</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  vehicleAssetId: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  vehicleDetails: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
