import express from 'express';
import 'express-async-errors';
import { generateFleetReport, generateJobAnalytics, generateMaintenanceReport } from './reports';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'analytics' });
});

app.get('/api/reports/fleet', async (req, res) => {
  const { organizationId, startDate, endDate, format = 'json' } = req.query;

  const report = await generateFleetReport({
    organizationId: organizationId as string,
    startDate: new Date(startDate as string),
    endDate: new Date(endDate as string),
  });

  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="fleet-report.pdf"');
    const pdfStream = report.toPDF();
    pdfStream.pipe(res);
  } else {
    res.json(report);
  }
});

app.get('/api/reports/jobs', async (req, res) => {
  const { organizationId, startDate, endDate, status } = req.query;

  const report = await generateJobAnalytics({
    organizationId: organizationId as string,
    startDate: new Date(startDate as string),
    endDate: new Date(endDate as string),
    status: status as string,
  });

  res.json(report);
});

app.get('/api/reports/maintenance', async (req, res) => {
  const { organizationId, startDate, endDate } = req.query;

  const report = await generateMaintenanceReport({
    organizationId: organizationId as string,
    startDate: new Date(startDate as string),
    endDate: new Date(endDate as string),
  });

  res.json(report);
});

app.get('/api/analytics/kpi', async (req, res) => {
  const { organizationId } = req.query;

  const kpis = {
    fleetUtilization: 85.5,
    avgJobCompletionTime: 4.2,
    maintenanceCostPerVehicle: 1250,
    unplannedDowntimePercentage: 2.3,
    fuelEfficiency: 8.5,
    safetyIncidentRate: 0.1,
  };

  res.json(kpis);
});

app.get('/api/analytics/trends', async (req, res) => {
  const { organizationId, metric, days = 30 } = req.query;

  const trends = {
    metric,
    period: days,
    data: Array.from({ length: Number(days) }).map((_, i) => ({
      date: new Date(Date.now() - (Number(days) - i) * 86400000),
      value: Math.random() * 100,
    })),
  };

  res.json(trends);
});

app.post('/api/reports/export', async (req, res) => {
  const { reportType, format, organizationId, startDate, endDate } = req.body;

  let report;
  switch (reportType) {
    case 'fleet':
      report = await generateFleetReport({
        organizationId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      break;
    case 'jobs':
      report = await generateJobAnalytics({
        organizationId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      break;
    case 'maintenance':
      report = await generateMaintenanceReport({
        organizationId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      break;
    default:
      return res.status(400).json({ error: 'Unknown report type' });
  }

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.csv"`);
    // Convert report to CSV
    const csv = JSON.stringify(report);
    res.send(csv);
  } else if (format === 'xlsx') {
    res.setHeader('Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.xlsx"`);
    res.json(report);
  } else {
    res.json(report);
  }
});

app.get('/api/analytics/dashboard', async (req, res) => {
  const { organizationId } = req.query;

  const dashboardData = {
    summary: {
      totalVehicles: 150,
      activeVehicles: 142,
      maintenanceVehicles: 8,
      totalJobs: 1250,
      completedJobs: 1100,
      pendingJobs: 150,
    },
    charts: {
      jobStatus: [
        { status: 'completed', count: 1100 },
        { status: 'in_progress', count: 75 },
        { status: 'pending', count: 75 },
      ],
      vehicleStatus: [
        { status: 'active', count: 142 },
        { status: 'maintenance', count: 8 },
      ],
      costTrend: Array.from({ length: 12 }).map((_, i) => ({
        month: i + 1,
        cost: Math.random() * 50000 + 10000,
      })),
    },
  };

  res.json(dashboardData);
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Analytics service listening on port ${PORT}`);
});
