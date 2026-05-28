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
import { jobsService, Job } from '@api/services';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function JobsScreen() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    if (!user?.organization?.id) return;

    try {
      const response = await jobsService.list(user.organization.id);
      setJobs(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user?.organization?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#6B7280',
      assigned: '#3b82f6',
      in_progress: '#f59e0b',
      completed: '#10b981',
      cancelled: '#ef4444',
      paused: '#f59e0b',
    };
    return colors[status] || '#gray';
  };

  const getPriorityIcon = (priority: string) => {
    const icons: Record<string, string> = {
      low: 'arrow-down',
      medium: 'minus',
      high: 'arrow-up',
      urgent: 'alert-circle',
    };
    return icons[priority] || 'help';
  };

  const renderJobItem = ({ item }: { item: Job }) => (
    <TouchableOpacity style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobNumber}>{item.jobNumber}</Text>
          <Text style={styles.jobTitle}>{item.title}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status.replace(/_/g, ' ')}</Text>
        </View>
      </View>

      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons
              name={getPriorityIcon(item.priority)}
              size={14}
              color="#0ea5e9"
            />
            <Text style={styles.detailText}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </Text>
          </View>

          {item.scheduledDate && (
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={14} color="#0ea5e9" />
              <Text style={styles.detailText}>
                {new Date(item.scheduledDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No jobs found</Text>
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
  jobCard: {
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
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
  },
  jobNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
  jobDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
