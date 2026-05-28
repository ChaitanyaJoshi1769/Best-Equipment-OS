# Database Architecture - Best Equipment OS

## Overview

Best Equipment OS uses **PostgreSQL** as the primary relational database with **Redis** for caching and sessions.

## Design Principles

1. **Multi-tenancy**: All tables include `organization_id` for tenant isolation
2. **Immutability**: Audit logs capture all changes
3. **Scalability**: Strategic indexing for high-volume queries
4. **Security**: Encrypted sensitive data, row-level security ready
5. **Temporal Data**: Timestamp tracking for analytics

## Core Schema

### Identity & Access Management

#### organizations
Represents tenant/customer accounts
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'active',
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ...
);
```

#### users
Organization members
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  ...
);
```

#### roles & user_roles
Role-based access control
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  permissions JSONB DEFAULT '[]',
  ...
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL,
  role_id UUID NOT NULL,
  UNIQUE(user_id, role_id)
);
```

### Fleet Management

#### vehicles
Equipment/vehicle registry
```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  asset_id VARCHAR(100) NOT NULL,
  vin VARCHAR(17),
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  license_plate VARCHAR(20),
  vehicle_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  location GEOGRAPHY(POINT, 4326),  -- PostGIS for geospatial
  current_fuel DECIMAL(10, 2),
  engine_hours DECIMAL(10, 2),
  odometer_reading DECIMAL(10, 2),
  assigned_technician_id UUID REFERENCES users(id),
  ...
);

-- Indexes
CREATE INDEX idx_vehicle_org ON vehicles(organization_id);
CREATE INDEX idx_vehicle_status ON vehicles(status);
CREATE INDEX idx_vehicle_location ON vehicles(location);
CREATE INDEX idx_vehicle_asset_id ON vehicles(asset_id);
```

#### telemetry_events
Real-time vehicle telemetry data
```sql
CREATE TABLE telemetry_events (
  id UUID PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  organization_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  speed DECIMAL(5, 2),
  fuel_level DECIMAL(5, 2),
  engine_hours DECIMAL(10, 2),
  odometer DECIMAL(10, 2),
  engine_temp DECIMAL(5, 2),
  battery_voltage DECIMAL(5, 2),
  data JSONB DEFAULT '{}',
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  event_timestamp TIMESTAMP,
  ...
);

-- High-volume, time-series indexes
CREATE INDEX idx_telemetry_vehicle ON telemetry_events(vehicle_id);
CREATE INDEX idx_telemetry_received_at ON telemetry_events(received_at);
CREATE INDEX idx_telemetry_timestamp ON telemetry_events(event_timestamp);
CREATE INDEX idx_telemetry_timeseries ON telemetry_events(vehicle_id, event_timestamp DESC);
```

### Service Operations

#### jobs
Service requests/work orders
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  job_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),
  assigned_technician_id UUID REFERENCES users(id),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_date DATE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  sla_deadline TIMESTAMP,
  location GEOGRAPHY(POINT, 4326),
  ...
);

-- Common dispatch queries
CREATE INDEX idx_jobs_dispatch ON jobs(
  organization_id, 
  scheduled_date, 
  status
);
CREATE INDEX idx_job_technician ON jobs(assigned_technician_id);
```

#### service_logs
Service completion records
```sql
CREATE TABLE service_logs (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id),
  technician_id UUID NOT NULL REFERENCES users(id),
  service_type VARCHAR(50),
  parts_used JSONB DEFAULT '[]',
  labor_hours DECIMAL(5, 2),
  cost DECIMAL(10, 2),
  completion_signature TEXT,  -- Base64 encoded
  completion_images JSONB DEFAULT '[]',
  ...
);
```

#### maintenance_schedules
Preventive maintenance planning
```sql
CREATE TABLE maintenance_schedules (
  id UUID PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  maintenance_type VARCHAR(100) NOT NULL,
  frequency_type VARCHAR(50),  -- 'days', 'hours', 'miles'
  frequency_value INTEGER,
  last_completed_at TIMESTAMP,
  next_due_date DATE,
  next_due_engine_hours DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'active',
  ...
);
```

### Inventory Management

#### parts
Parts catalog
```sql
CREATE TABLE parts (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  part_number VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  unit_cost DECIMAL(10, 2),
  reorder_level INTEGER,
  ...
);
```

#### inventory
Stock levels
```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY,
  part_id UUID NOT NULL REFERENCES parts(id),
  organization_id UUID NOT NULL,
  warehouse_location VARCHAR(255),
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_available INT GENERATED ALWAYS AS 
    (quantity_on_hand - quantity_reserved) STORED,
  ...
);
```

### Analytics

#### kpi_snapshots
Point-in-time KPI snapshots
```sql
CREATE TABLE kpi_snapshots (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_value DECIMAL(15, 4),
  metric_date DATE,
  period VARCHAR(50),  -- 'daily', 'weekly', 'monthly'
  dimensions JSONB DEFAULT '{}',  -- Breakdown dimensions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ...
);

CREATE INDEX idx_kpi_metric ON kpi_snapshots(metric_name, metric_date DESC);
```

### Audit & Compliance

#### audit_logs
Immutable audit trail
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID,
  entity_type VARCHAR(255) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
  changes JSONB NOT NULL,  -- {old, new} structure
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ...
);

CREATE INDEX idx_audit_timeline ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
```

## Indexing Strategy

### Primary Indexes
```sql
-- Tenant isolation
CREATE INDEX idx_org_primary ON table_name(organization_id);

-- Common lookups
CREATE INDEX idx_user_email ON users(organization_id, email);
CREATE INDEX idx_vehicle_asset ON vehicles(organization_id, asset_id);

-- Sorting/filtering
CREATE INDEX idx_job_status ON jobs(status, created_at DESC);

-- Geospatial
CREATE INDEX idx_gist_location ON vehicles USING GIST(location);
```

### Query Performance

```sql
-- High-volume telemetry queries benefit from clustering
CLUSTER telemetry_events USING idx_telemetry_vehicle;

-- Partial indexes for active records
CREATE INDEX idx_active_jobs ON jobs(assigned_technician_id) 
WHERE status IN ('pending', 'in_progress');

-- Expression indexes for common filters
CREATE INDEX idx_job_dispatch ON jobs(organization_id, scheduled_date)
WHERE status != 'completed';
```

## Partitioning Strategy

For telemetry_events (high volume, time-series):
```sql
-- Partition by month for better query performance
CREATE TABLE telemetry_events_2024_01 PARTITION OF telemetry_events
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Multi-tenancy Implementation

```sql
-- Row-Level Security Policy
CREATE POLICY org_isolation ON vehicles
  USING (organization_id = current_setting('app.org_id')::UUID);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Set context for each request
SET app.org_id = 'organization-uuid-here';
```

## Backup & Recovery

- **Transaction Log Archiving**: WAL files stored in S3
- **Point-in-Time Recovery**: 30-day retention window
- **Automated Backups**: Daily snapshots in RDS
- **Cross-Region Backup**: Replicated to secondary region

## Performance Targets

| Query Type | Target P95 | Notes |
|-----------|-----------|-------|
| User login | < 100ms | Indexed email lookups |
| Job dispatch | < 200ms | Composite org/date/status index |
| Vehicle tracking | < 50ms | Redis-cached queries |
| Telemetry ingestion | < 10ms | Async batch processing |
| Analytics KPI | < 500ms | Pre-aggregated snapshots |

## Data Retention

| Table | Retention | Archive |
|-------|-----------|---------|
| telemetry_events | 180 days | S3 Glacier |
| service_logs | 7 years | Compliance requirement |
| audit_logs | Indefinite | Immutable |
| kpi_snapshots | 3 years | For historical analysis |

## Schema Evolution

- Use migration files (numbered: 001_init.sql, 002_add_x.sql)
- Backward compatibility for 2 releases
- Test migrations in staging first
- Plan for zero-downtime deployments

## Connection Pooling

```
PgBouncer Configuration:
- Pool mode: transaction
- Max connections: 200
- Reserve pool: 10
- Timeout: 25 seconds
```

## Monitoring

```sql
-- Monitor slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Monitor table sizes
SELECT schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```
