import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { Telemetry } from '../telemetry/entities/telemetry.entity';
import { Maintenance } from '../maintenance/entities/maintenance.entity';

interface ForecastData {
  date: Date;
  value: number;
  confidence: number;
}

interface AnomalyDetectionResult {
  timestamp: Date;
  value: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  reason: string;
}

interface CustomDashboard {
  id: string;
  organizationId: string;
  name: string;
  widgets: DashboardWidget[];
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'gauge';
  title: string;
  config: Record<string, any>;
  position: { x: number; y: number; width: number; height: number };
}

@Injectable()
export class AdvancedAnalyticsService {
  constructor(
    @InjectRepository(Job) private jobRepository: Repository<Job>,
    @InjectRepository(Telemetry) private telemetryRepository: Repository<Telemetry>,
    @InjectRepository(Maintenance) private maintenanceRepository: Repository<Maintenance>,
  ) {}

  // Predictive forecasting using simple exponential smoothing
  async forecastJobCompletionTimes(organizationId: string, daysAhead: number = 30): Promise<ForecastData[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalJobs = await this.jobRepository.find({
      where: {
        organizationId,
        completedAt: Between(thirtyDaysAgo, new Date()),
      },
    });

    const completionTimes = historicalJobs.map(job => {
      if (job.completedAt && job.createdAt) {
        return (job.completedAt.getTime() - job.createdAt.getTime()) / (1000 * 60); // minutes
      }
      return 0;
    });

    if (completionTimes.length === 0) {
      return [];
    }

    const forecast: ForecastData[] = [];
    let smoothedValue = completionTimes[0];
    const alpha = 0.3; // smoothing factor

    for (let i = 1; i < daysAhead; i++) {
      smoothedValue = alpha * completionTimes[i % completionTimes.length] + (1 - alpha) * smoothedValue;
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);

      forecast.push({
        date: forecastDate,
        value: Math.round(smoothedValue),
        confidence: 0.85 - (i * 0.02), // confidence decreases over time
      });
    }

    return forecast;
  }

  // Predictive maintenance forecasting
  async forecastMaintenanceNeeds(organizationId: string, daysAhead: number = 60): Promise<ForecastData[]> {
    const nintyDaysAgo = new Date();
    nintyDaysAgo.setDate(nintyDaysAgo.getDate() - 90);

    const historicalMaintenance = await this.maintenanceRepository.find({
      where: {
        organizationId,
        scheduledDate: Between(nintyDaysAgo, new Date()),
      },
    });

    const maintenanceFrequency = historicalMaintenance.length / 3; // per month

    const forecast: ForecastData[] = [];
    for (let i = 1; i <= daysAhead; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      const expectedCount = (maintenanceFrequency / 30) * i;

      forecast.push({
        date: forecastDate,
        value: Math.round(expectedCount),
        confidence: 0.80,
      });
    }

    return forecast;
  }

  // Anomaly detection for telemetry data
  async detectAnomalies(organizationId: string, metric: 'fuel' | 'speed' | 'temperature'): Promise<AnomalyDetectionResult[]> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentData = await this.telemetryRepository.find({
      where: {
        organizationId,
        timestamp: Between(oneDayAgo, new Date()),
      },
      order: { timestamp: 'DESC' },
      take: 1000,
    });

    if (recentData.length < 10) {
      return [];
    }

    const anomalies: AnomalyDetectionResult[] = [];
    const values = recentData.map(d => d[metric] as number).filter(v => typeof v === 'number');

    // Calculate mean and standard deviation
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Flag values > 2.5 standard deviations from mean as anomalies
    for (const data of recentData) {
      const value = data[metric] as number;
      if (typeof value !== 'number') continue;

      const zScore = Math.abs((value - mean) / stdDev);

      if (zScore > 2.5) {
        let severity: 'low' | 'medium' | 'high' = 'low';
        let reason = '';

        if (metric === 'fuel') {
          if (zScore > 3.5) {
            severity = 'high';
            reason = 'Unexpected fuel consumption spike detected';
          } else {
            severity = 'medium';
            reason = 'Unusual fuel consumption pattern';
          }
        } else if (metric === 'temperature') {
          severity = 'high';
          reason = 'Critical temperature anomaly detected';
        } else if (metric === 'speed') {
          if (zScore > 3.5) {
            severity = 'high';
            reason = 'Excessive speed detected';
          } else {
            severity = 'medium';
            reason = 'Unusual speed pattern';
          }
        }

        anomalies.push({
          timestamp: data.timestamp,
          value,
          isAnomaly: true,
          severity,
          reason,
        });
      }
    }

    return anomalies.slice(0, 50); // Return top 50 anomalies
  }

  // Generate custom dashboard template
  createDashboardTemplate(organizationId: string, name: string): CustomDashboard {
    const dashboard: CustomDashboard = {
      id: `dashboard-${Date.now()}`,
      organizationId,
      name,
      widgets: [
        {
          id: `widget-${Date.now()}-1`,
          type: 'metric',
          title: 'Active Vehicles',
          config: { metric: 'active_vehicles', format: 'number' },
          position: { x: 0, y: 0, width: 3, height: 2 },
        },
        {
          id: `widget-${Date.now()}-2`,
          type: 'metric',
          title: 'Pending Jobs',
          config: { metric: 'pending_jobs', format: 'number' },
          position: { x: 3, y: 0, width: 3, height: 2 },
        },
        {
          id: `widget-${Date.now()}-3`,
          type: 'chart',
          title: 'Job Completion Forecast',
          config: { chartType: 'line', metric: 'job_forecast' },
          position: { x: 0, y: 2, width: 6, height: 3 },
        },
        {
          id: `widget-${Date.now()}-4`,
          type: 'gauge',
          title: 'Fleet Health Score',
          config: { metric: 'health_score', min: 0, max: 100 },
          position: { x: 6, y: 0, width: 3, height: 2 },
        },
        {
          id: `widget-${Date.now()}-5`,
          type: 'table',
          title: 'Maintenance Schedule',
          config: { metric: 'maintenance_schedule', limit: 10 },
          position: { x: 6, y: 2, width: 3, height: 3 },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return dashboard;
  }

  // Update dashboard widget
  updateDashboardWidget(dashboard: CustomDashboard, widgetId: string, config: DashboardWidget): CustomDashboard {
    dashboard.widgets = dashboard.widgets.map(w =>
      w.id === widgetId ? { ...w, ...config } : w,
    );
    dashboard.updatedAt = new Date();
    return dashboard;
  }

  // Add widget to dashboard
  addWidgetToDashboard(dashboard: CustomDashboard, widget: DashboardWidget): CustomDashboard {
    dashboard.widgets.push(widget);
    dashboard.updatedAt = new Date();
    return dashboard;
  }

  // Remove widget from dashboard
  removeWidgetFromDashboard(dashboard: CustomDashboard, widgetId: string): CustomDashboard {
    dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
    dashboard.updatedAt = new Date();
    return dashboard;
  }

  // Generate insights from historical data
  async generateInsights(organizationId: string): Promise<string[]> {
    const insights: string[] = [];

    // Job completion time insight
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentJobs = await this.jobRepository.find({
      where: {
        organizationId,
        completedAt: Between(thirtyDaysAgo, new Date()),
      },
    });

    if (recentJobs.length > 0) {
      const avgCompletionTime = recentJobs.reduce((sum, job) => {
        if (job.completedAt && job.createdAt) {
          return sum + (job.completedAt.getTime() - job.createdAt.getTime()) / (1000 * 60);
        }
        return sum;
      }, 0) / recentJobs.length;

      insights.push(`Average job completion time: ${Math.round(avgCompletionTime)} minutes`);
    }

    // Maintenance insight
    const pendingMaintenance = await this.maintenanceRepository.find({
      where: {
        organizationId,
        scheduledDate: Between(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      },
    });

    if (pendingMaintenance.length > 0) {
      insights.push(`${pendingMaintenance.length} maintenance tasks scheduled for next 7 days`);
    }

    return insights;
  }
}
