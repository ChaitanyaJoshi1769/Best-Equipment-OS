# Phase 11: Advanced Analytics

## Overview

Phase 11 introduces advanced analytics capabilities including predictive forecasting, anomaly detection, and custom dashboards to provide deeper insights into fleet and operations performance.

## Features

### 1. Predictive Forecasting

#### Job Completion Time Forecasting
- Uses exponential smoothing algorithm
- Analyzes historical job completion times (30-day window)
- Generates 30-day forecasts with confidence scores
- Endpoint: `GET /advanced-analytics/forecast/jobs/:daysAhead`

```typescript
interface ForecastData {
  date: Date;
  value: number; // minutes
  confidence: number; // 0-1 scale
}
```

#### Maintenance Need Forecasting
- Predicts maintenance requirements based on historical patterns
- 60-day forecast window
- Helps with preventive maintenance planning
- Endpoint: `GET /advanced-analytics/forecast/maintenance/:daysAhead`

### 2. Anomaly Detection

Detects unusual patterns in telemetry data using statistical methods:

- **Fuel Consumption**: Flags excessive fuel usage (>2.5 standard deviations)
- **Speed Patterns**: Identifies unusual speed behaviors
- **Temperature**: Critical temperature anomalies
- **Severity Levels**: Low, Medium, High

Algorithm:
1. Collect last 1000 telemetry points (24-hour window)
2. Calculate mean and standard deviation
3. Flag values >2.5 sigma as anomalies
4. Classify severity based on z-score

Endpoint: `GET /advanced-analytics/anomalies/:metric`

```typescript
interface AnomalyDetectionResult {
  timestamp: Date;
  value: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  reason: string;
}
```

### 3. Custom Dashboards

#### Dashboard Structure
- Fully configurable widget-based system
- Multiple widget types: metric, chart, table, gauge
- Drag-and-drop positioning (x, y, width, height)
- Real-time metric updates

#### Widget Types
- **Metric**: KPI displays with numerical values
- **Chart**: Line, bar, pie charts for trend visualization
- **Table**: Tabular data display (maintenance, job lists)
- **Gauge**: Circular progress indicators (health scores)

#### Built-in Dashboard Templates
Default dashboard includes:
- Active Vehicles metric
- Pending Jobs counter
- Job Completion Forecast chart
- Fleet Health Score gauge
- Maintenance Schedule table

#### Dashboard APIs
```typescript
POST /advanced-analytics/dashboards/create
POST /advanced-analytics/dashboards/:dashboardId/widgets
POST /advanced-analytics/dashboards/:dashboardId/widgets/:widgetId/update
DELETE /advanced-analytics/dashboards/:dashboardId/widgets/:widgetId
```

### 4. Automated Insights

Generates actionable business insights from fleet data:

```typescript
interface AutomatedInsight {
  title: string;
  description: string;
  metric: string;
  value: number | string;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
  severity: 'info' | 'warning' | 'critical';
}
```

#### Insight Categories
1. **Fleet Efficiency**
   - Average fuel consumption monitoring
   - Fuel consumption trends
   - Recommendations for maintenance or driving efficiency

2. **Job Completion**
   - Job completion rates (7-day rolling)
   - Trend analysis
   - Recommendations for capacity adjustments

3. **Preventive Maintenance**
   - Vehicles requiring scheduled maintenance
   - Mileage-based alerts
   - Downtime prevention recommendations

Endpoint: `GET /advanced-analytics/insights`

## Implementation Details

### AdvancedAnalyticsService
Located: `apps/api/src/modules/analytics/advanced-analytics.service.ts`

Key methods:
- `forecastJobCompletionTimes()` - Exponential smoothing forecasting
- `forecastMaintenanceNeeds()` - Maintenance prediction
- `detectAnomalies()` - Statistical anomaly detection
- `generateAutomatedInsights()` - Insight generation
- `createDashboardTemplate()` - Dashboard creation
- `updateDashboardWidget()` - Widget configuration
- `addWidgetToDashboard()` - Add new widgets
- `removeWidgetFromDashboard()` - Remove widgets

### Database Considerations

The service queries:
- `Job` entity for completion time analysis and job metrics
- `Telemetry` entity for anomaly detection and fuel/speed analysis
- `Maintenance` entity for preventive maintenance insights
- `Vehicle` entity for fleet-wide health assessments

### Performance Optimization

1. **Query Efficiency**: Limited date ranges (30/60/90 days) to minimize query load
2. **Caching**: Results can be cached for 15-30 minutes
3. **Batch Processing**: Anomaly detection processes top 50 results
4. **Aggregation**: Dashboard metrics calculated on-demand

## Usage Examples

### Forecast Job Completions
```bash
GET /advanced-analytics/forecast/jobs/30
```

Response:
```json
{
  "data": [
    {
      "date": "2026-06-28T00:00:00Z",
      "value": 95,
      "confidence": 0.83
    }
  ]
}
```

### Detect Anomalies
```bash
GET /advanced-analytics/anomalies/fuel
```

Response:
```json
{
  "data": [
    {
      "timestamp": "2026-05-28T14:32:10Z",
      "value": 45.5,
      "isAnomaly": true,
      "severity": "high",
      "reason": "Unexpected fuel consumption spike detected"
    }
  ]
}
```

### Get Insights
```bash
GET /advanced-analytics/insights
```

Response:
```json
{
  "data": [
    {
      "title": "Fleet Fuel Efficiency",
      "description": "Average fuel consumption across 15 vehicles is 9.23L/100km",
      "metric": "fuel_consumption",
      "value": "9.23",
      "trend": "stable",
      "recommendation": "Fleet fuel efficiency is optimal",
      "severity": "info"
    }
  ]
}
```

## Integration with Frontend

The web dashboard can integrate these endpoints to display:
- Real-time anomaly alerts
- Predictive maintenance charts
- Custom widget dashboards
- Automated insights notifications

## Future Enhancements

- Machine learning models for more accurate forecasting
- Time-series analysis with seasonal decomposition
- Custom alert thresholds per organization
- Advanced visualization components
- Export capabilities for reports
- Integration with business intelligence tools

## Testing

Unit tests should cover:
- Forecast accuracy validation
- Anomaly detection edge cases
- Dashboard CRUD operations
- Insight generation logic
- Performance with large datasets

## Monitoring

Track these metrics:
- Forecast accuracy (actual vs. predicted)
- Anomaly detection false positive rate
- Dashboard query performance
- API response times
- User engagement with insights
