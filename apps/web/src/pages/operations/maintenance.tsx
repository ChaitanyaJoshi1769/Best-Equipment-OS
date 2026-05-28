import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@stores/auth.store';
import { maintenanceService, MaintenanceSchedule } from '@api/services';
import { format } from 'date-fns';
import { AlertTriangle, Wrench, Clock } from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'badge-info',
  completed: 'badge-success',
  inactive: 'badge-error',
};

export default function MaintenancePage() {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'due' | 'upcoming'>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.organization?.id) return;

      try {
        const [allRes, dueRes, upcomingRes, statsRes] = await Promise.all([
          maintenanceService.list(user.organization.id),
          maintenanceService.getDue(user.organization.id),
          maintenanceService.getUpcoming(user.organization.id),
          maintenanceService.getStats(user.organization.id),
        ]);

        if (filter === 'all') {
          setSchedules(allRes.data);
        } else if (filter === 'due') {
          setSchedules(dueRes.data);
        } else if (filter === 'upcoming') {
          setSchedules(upcomingRes.data);
        }

        setStats(statsRes.data);
      } catch (error) {
        console.error('Failed to fetch maintenance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.organization?.id, filter]);

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Management</h1>
          <p className="text-gray-600 mt-2">Track and schedule maintenance activities</p>
        </div>
        <button className="btn btn-primary">Schedule Maintenance</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Schedules"
            value={stats.total}
            icon={<Wrench className="w-6 h-6 text-primary-600" />}
            color="bg-primary-100"
          />
          <StatCard
            title="Active"
            value={stats.active}
            icon={<Clock className="w-6 h-6 text-success-600" />}
            color="bg-success-100"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<Wrench className="w-6 h-6 text-success-600" />}
            color="bg-success-100"
          />
          <StatCard
            title="Overdue"
            value={stats.overdue}
            icon={<AlertTriangle className="w-6 h-6 text-error-600" />}
            color="bg-error-100"
          />
          <StatCard
            title="Upcoming (30 days)"
            value={stats.upcomingIn30Days}
            icon={<Clock className="w-6 h-6 text-warning-600" />}
            color="bg-warning-100"
          />
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'due', 'upcoming'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            {f === 'all' && 'All Schedules'}
            {f === 'due' && 'Overdue'}
            {f === 'upcoming' && 'Upcoming'}
          </button>
        ))}
      </div>

      {/* Schedules Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading maintenance schedules...</div>
      ) : schedules.length === 0 ? (
        <div className="card text-center py-8 text-gray-500">
          No maintenance schedules found.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Next Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {schedule.maintenanceType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {schedule.frequencyValue} {schedule.frequencyType}(s)
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {schedule.nextDueDate
                        ? format(new Date(schedule.nextDueDate), 'MMM d, yyyy')
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${statusColors[schedule.status]}`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-primary-600 hover:text-primary-700 font-medium">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
