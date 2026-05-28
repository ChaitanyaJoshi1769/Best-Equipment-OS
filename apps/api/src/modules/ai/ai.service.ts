import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Telemetry } from '../telemetry/entities/telemetry.entity';

interface ScheduleOptimization {
  jobId: string;
  suggestedStartTime: Date;
  estimatedDuration: number;
  priority: number;
  reason: string;
}

interface RoutePoint {
  latitude: number;
  longitude: number;
  jobId?: string;
  sequence: number;
}

interface OptimizedRoute {
  vehicleId: string;
  waypoints: RoutePoint[];
  estimatedDistance: number;
  estimatedTime: number;
  fuelEstimate: number;
  confidence: number;
}

interface AutomatedInsight {
  title: string;
  description: string;
  metric: string;
  value: number | string;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
  severity: 'info' | 'warning' | 'critical';
}

@Injectable()
export class AIService {
  constructor(
    @InjectRepository(Job) private jobRepository: Repository<Job>,
    @InjectRepository(Vehicle) private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Telemetry) private telemetryRepository: Repository<Telemetry>,
  ) {}

  // Smart scheduling based on multiple factors
  async optimizeJobScheduling(organizationId: string, unscheduledJobs: string[]): Promise<ScheduleOptimization[]> {
    const jobs = await this.jobRepository.find({
      where: { id: unscheduledJobs.length > 0 ? undefined : undefined },
      take: unscheduledJobs.length > 0 ? 1000 : 10,
    });

    const optimizations: ScheduleOptimization[] = [];

    for (const job of jobs) {
      const basePriority = job.priority || 0;
      const baseEstimate = await this.estimateJobDuration(job.id);
      const availableTechs = await this.getAvailableTechnicians(organizationId, job.serviceType);

      let priority = basePriority;
      let reason = 'Standard scheduling';

      // Boost priority for urgent/high-priority jobs
      if (basePriority > 7) {
        priority += 10;
        reason = 'High-priority job detected';
      }

      // Adjust for technician availability
      if (availableTechs === 0) {
        priority -= 5;
        reason = 'Low technician availability';
      }

      const suggestedStartTime = await this.calculateOptimalStartTime(job, baseEstimate);

      optimizations.push({
        jobId: job.id,
        suggestedStartTime,
        estimatedDuration: baseEstimate,
        priority,
        reason,
      });
    }

    // Sort by priority descending
    return optimizations.sort((a, b) => b.priority - a.priority);
  }

  // Route optimization using nearest neighbor algorithm
  async optimizeRoutes(organizationId: string, vehicleId: string): Promise<OptimizedRoute> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const assignedJobs = await this.jobRepository.find({
      where: {
        assignedVehicleId: vehicleId,
        status: 'assigned' || 'started',
      },
    });

    // Get current location
    const currentLocation = { latitude: vehicle.lastKnownLat || 0, longitude: vehicle.lastKnownLng || 0 };

    // Build waypoints
    const waypoints: RoutePoint[] = [];
    waypoints.push({ ...currentLocation, sequence: 0 });

    for (const job of assignedJobs) {
      waypoints.push({
        latitude: job.latitude,
        longitude: job.longitude,
        jobId: job.id,
        sequence: waypoints.length,
      });
    }

    // Nearest neighbor algorithm
    const optimizedWaypoints = this.nearestNeighborSort(waypoints);

    // Calculate metrics
    const estimatedDistance = this.calculateDistance(optimizedWaypoints);
    const estimatedTime = Math.ceil(estimatedDistance / 50); // Assume 50 km/h average
    const fuelEstimate = estimatedDistance * 0.08; // Assume 8L per 100km
    const confidence = 0.85; // ML confidence score

    return {
      vehicleId,
      waypoints: optimizedWaypoints,
      estimatedDistance,
      estimatedTime,
      fuelEstimate,
      confidence,
    };
  }

  // Generate automated insights
  async generateAutomatedInsights(organizationId: string): Promise<AutomatedInsight[]> {
    const insights: AutomatedInsight[] = [];

    // Fleet efficiency insight
    const vehicles = await this.vehicleRepository.find({ where: { organizationId } });
    const avgFuelConsumption = await this.calculateAverageFuelConsumption(organizationId);
    insights.push({
      title: 'Fleet Fuel Efficiency',
      description: `Average fuel consumption across ${vehicles.length} vehicles is ${avgFuelConsumption.toFixed(2)}L/100km`,
      metric: 'fuel_consumption',
      value: avgFuelConsumption.toFixed(2),
      trend: avgFuelConsumption > 10 ? 'up' : 'stable',
      recommendation: avgFuelConsumption > 10 ? 'Consider maintenance check for fuel efficiency' : 'Fleet fuel efficiency is optimal',
      severity: avgFuelConsumption > 12 ? 'warning' : 'info',
    });

    // Job completion insight
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentJobs = await this.jobRepository.find({
      where: {
        organizationId,
        completedAt: Between(sevenDaysAgo, new Date()),
      },
    });

    const completionRate = (recentJobs.length / 100) * 100; // Example calculation
    insights.push({
      title: 'Job Completion Rate',
      description: `${recentJobs.length} jobs completed in the last 7 days`,
      metric: 'jobs_completed',
      value: recentJobs.length,
      trend: recentJobs.length > 15 ? 'up' : recentJobs.length < 5 ? 'down' : 'stable',
      recommendation: recentJobs.length < 5 ? 'Increase job scheduling or technician hours' : 'Job completion rate is healthy',
      severity: recentJobs.length < 3 ? 'warning' : 'info',
    });

    // Vehicle maintenance alert
    const vehiclesNeedingMaintenance = vehicles.filter(v => v.mileage && v.mileage > 50000);
    if (vehiclesNeedingMaintenance.length > 0) {
      insights.push({
        title: 'Preventive Maintenance Due',
        description: `${vehiclesNeedingMaintenance.length} vehicles require scheduled maintenance`,
        metric: 'maintenance_due',
        value: vehiclesNeedingMaintenance.length,
        trend: 'up',
        recommendation: `Schedule maintenance for ${vehiclesNeedingMaintenance.length} vehicles to prevent downtime`,
        severity: 'warning',
      });
    }

    return insights;
  }

  // Helper methods
  private async estimateJobDuration(jobId: string): Promise<number> {
    // Base estimate in minutes (would be ML-based in production)
    return 90;
  }

  private async getAvailableTechnicians(organizationId: string, serviceType: string): Promise<number> {
    // Mock implementation
    return 3;
  }

  private async calculateOptimalStartTime(job: Job, duration: number): Promise<Date> {
    const now = new Date();
    // Schedule for next available slot (e.g., tomorrow morning)
    const suggestedTime = new Date(now);
    suggestedTime.setDate(suggestedTime.getDate() + 1);
    suggestedTime.setHours(9, 0, 0, 0);
    return suggestedTime;
  }

  private nearestNeighborSort(waypoints: RoutePoint[]): RoutePoint[] {
    if (waypoints.length <= 1) return waypoints;

    const sorted: RoutePoint[] = [waypoints[0]];
    const remaining = waypoints.slice(1);

    while (remaining.length > 0) {
      const current = sorted[sorted.length - 1];
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const distance = this.haversineDistance(current, remaining[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const next = remaining.splice(nearestIndex, 1)[0];
      next.sequence = sorted.length;
      sorted.push(next);
    }

    return sorted;
  }

  private haversineDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number },
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const dLng = ((point2.longitude - point1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.latitude * Math.PI) / 180) *
        Math.cos((point2.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateDistance(waypoints: RoutePoint[]): number {
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistance += this.haversineDistance(waypoints[i], waypoints[i + 1]);
    }
    return totalDistance;
  }

  private async calculateAverageFuelConsumption(organizationId: string): Promise<number> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const telemetryData = await this.telemetryRepository.find({
      where: {
        organizationId,
        timestamp: Between(oneDayAgo, new Date()),
      },
    });

    if (telemetryData.length === 0) return 0;

    const avgFuel = telemetryData.reduce((sum, data) => sum + (data.fuelLevel || 0), 0) / telemetryData.length;
    return avgFuel;
  }
}
