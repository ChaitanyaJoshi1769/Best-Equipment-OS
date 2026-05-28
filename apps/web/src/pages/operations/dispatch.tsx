import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@stores/auth.store';
import { jobsService, Job } from '@api/services';
import { formatDistanceToNow } from 'date-fns';
import { Badge, Clock, AlertTriangle } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'badge-info',
  assigned: 'badge-info',
  in_progress: 'badge-warning',
  completed: 'badge-success',
  cancelled: 'badge-error',
  paused: 'badge-warning',
};

const priorityColors: Record<string, string> = {
  low: 'text-gray-600',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

export default function DispatchBoard() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user?.organization?.id) return;

      try {
        const response = await jobsService.list(user.organization.id);
        setJobs(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user?.organization?.id]);

  const filteredJobs = jobs.filter(
    (job) => selectedStatus === 'all' || job.status === selectedStatus
  );

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      let updatedJob;
      if (newStatus === 'in_progress') {
        updatedJob = await jobsService.start(jobId);
      } else if (newStatus === 'completed') {
        updatedJob = await jobsService.complete(jobId);
      } else if (newStatus === 'paused') {
        updatedJob = await jobsService.pause(jobId);
      } else if (newStatus === 'cancelled') {
        updatedJob = await jobsService.cancel(jobId, 'Cancelled from dispatch board');
      }

      if (updatedJob) {
        setJobs(jobs.map((j) => (j.id === jobId ? updatedJob.data : j)));
      }
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dispatch Board</h1>
        <p className="text-gray-600 mt-2">Manage and track job assignments</p>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'assigned', 'in_progress', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedStatus === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Jobs Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading jobs...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="card text-center py-8 text-gray-500">
          No jobs found for this status.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Job #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Scheduled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-primary-600">{job.jobNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{job.title}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${priorityColors[job.priority]}`}>
                        {job.priority.charAt(0).toUpperCase() + job.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${statusColors[job.status]}`}>
                        {job.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={job.status}
                        onChange={(e) => handleStatusChange(job.id, e.target.value)}
                        className="px-3 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
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
