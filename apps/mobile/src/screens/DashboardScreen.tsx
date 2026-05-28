import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAuthStore } from '@stores/auth.store';
import { vehiclesService, jobsService } from '@api/services';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Stats {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  pendingJobs: number;
  inProgressJobs: number;
}

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    totalVehicles: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    pendingJobs: 0,
    inProgressJobs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    if (!user?.organization?.id) return;

    try {
      const [vehiclesRes, jobsRes] = await Promise.all([
        vehiclesService.getStats(user.organization.id),
        jobsService.list(user.organization.id),
      ]);

      setStats({
        totalVehicles: vehiclesRes.data.total,
        activeVehicles: vehiclesRes.data.active,
        maintenanceVehicles: vehiclesRes.data.maintenance,
        pendingJobs: jobsRes.data.data?.filter((j: any) => j.status === 'pending').length || 0,
        inProgressJobs: jobsRes.data.data?.filter((j: any) => j.status === 'in_progress').length || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.organization?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: number;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <View style={styles.statIconContainer}>
        <Ionicons name={icon as any} size={24} color="#fff" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back!</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statWrapper}>
            <StatCard
              title="Total Vehicles"
              value={stats.totalVehicles}
              icon="car"
              color="#3b82f6"
            />
          </View>
          <View style={styles.statWrapper}>
            <StatCard
              title="Active"
              value={stats.activeVehicles}
              icon="checkmark-circle"
              color="#10b981"
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statWrapper}>
            <StatCard
              title="In Maintenance"
              value={stats.maintenanceVehicles}
              icon="wrench"
              color="#f59e0b"
            />
          </View>
          <View style={styles.statWrapper}>
            <StatCard
              title="Pending Jobs"
              value={stats.pendingJobs}
              icon="briefcase"
              color="#8b5cf6"
            />
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.actionsTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="map" size={20} color="#0ea5e9" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Fleet Tracking</Text>
            <Text style={styles.actionSubtitle}>View vehicle locations</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="list" size={20} color="#0ea5e9" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>View Jobs</Text>
            <Text style={styles.actionSubtitle}>Manage service jobs</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="build" size={20} color="#0ea5e9" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Maintenance</Text>
            <Text style={styles.actionSubtitle}>Schedule maintenance</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userEmail: {
    fontSize: 14,
    color: '#e0f2fe',
    marginTop: 4,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statWrapper: {
    flex: 1,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
