import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@stores/auth.store';
import { vehiclesService, jobsService, maintenanceService } from '@api/services';
import { Truck, Briefcase, Wrench, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  pendingJobs: number;
  inProgressJobs: number;
  overdueMaintenances: number;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    pendingJobs: 0,
    inProgressJobs: 0,
    overdueMaintenances: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.organization?.id) return;

      try {
        const [vehiclesRes, jobsRes, maintenanceRes] = await Promise.all([
          vehiclesService.getStats(user.organization.id),
          jobsService.getByStatus(user.organization.id, 'pending,in_progress'),
          maintenanceService.getStats(user.organization.id),
        ]);

        setStats({
          totalVehicles: vehiclesRes.data.total,
          activeVehicles: vehiclesRes.data.active,
          maintenanceVehicles: vehiclesRes.data.maintenance,
          pendingJobs: vehiclesRes.data.total, // Simplified for demo
          inProgressJobs: vehiclesRes.data.active,
          overdueMaintenances: maintenanceRes.data.overdue || 0,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.organization?.id]);

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Vehicles"
          value={stats.totalVehicles}
          icon={<Truck className="w-6 h-6 text-primary-600" />}
          color="bg-primary-100"
        />
        <StatCard
          title="Active Vehicles"
          value={stats.activeVehicles}
          icon={<Truck className="w-6 h-6 text-success-600" />}
          color="bg-success-100"
        />
        <StatCard
          title="In Maintenance"
          value={stats.maintenanceVehicles}
          icon={<Wrench className="w-6 h-6 text-warning-600" />}
          color="bg-warning-100"
        />
        <StatCard
          title="Pending Jobs"
          value={stats.pendingJobs}
          icon={<Briefcase className="w-6 h-6 text-primary-600" />}
          color="bg-primary-100"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgressJobs}
          icon={<Briefcase className="w-6 h-6 text-primary-600" />}
          color="bg-primary-100"
        />
        <StatCard
          title="Overdue Maintenance"
          value={stats.overdueMaintenances}
          icon={<AlertTriangle className="w-6 h-6 text-error-600" />}
          color="bg-error-100"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/fleet/vehicles" className="card hover:shadow-lg transition cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Fleet Management</h3>
              <p className="text-sm text-gray-600 mt-1">View and manage your vehicles</p>
            </div>
            <Truck className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link href="/operations/dispatch" className="card hover:shadow-lg transition cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Dispatch Board</h3>
              <p className="text-sm text-gray-600 mt-1">Manage jobs and assignments</p>
            </div>
            <Briefcase className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link href="/operations/maintenance" className="card hover:shadow-lg transition cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Maintenance</h3>
              <p className="text-sm text-gray-600 mt-1">Schedule and track maintenance</p>
            </div>
            <Wrench className="w-5 h-5 text-gray-400" />
          </div>
        </Link>
      </div>
    </div>
  );
}
