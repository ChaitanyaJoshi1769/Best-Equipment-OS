-- Best Equipment OS - PostgreSQL Initialization Script
-- This script sets up the initial schema and configurations

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "hstore";

-- Create audit log table early for triggers
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  user_id UUID,
  entity_type VARCHAR(255) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  changes JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_org (organization_id),
  INDEX idx_audit_logs_entity (entity_type, entity_id),
  INDEX idx_audit_logs_created_at (created_at)
);

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  settings JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX idx_org_status (status),
  INDEX idx_org_slug (slug)
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  phone_number VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  last_login_at TIMESTAMP,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(organization_id, email),
  INDEX idx_user_org (organization_id),
  INDEX idx_user_email (email),
  INDEX idx_user_status (status)
);

-- Create roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  status VARCHAR(50) DEFAULT 'active',
  is_system BOOLEAN DEFAULT FALSE,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, name),
  INDEX idx_role_org (organization_id)
);

-- Create user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id),
  INDEX idx_user_role_user (user_id),
  INDEX idx_user_role_role (role_id)
);

-- Create vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  asset_id VARCHAR(100) NOT NULL,
  vin VARCHAR(17),
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  license_plate VARCHAR(20),
  vehicle_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  location GEOGRAPHY(POINT, 4326),
  current_fuel DECIMAL(10, 2),
  engine_hours DECIMAL(10, 2),
  odometer_reading DECIMAL(10, 2),
  purchase_date DATE,
  last_service_date DATE,
  next_service_date DATE,
  assigned_technician_id UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX idx_vehicle_org (organization_id),
  INDEX idx_vehicle_status (status),
  INDEX idx_vehicle_location (location),
  INDEX idx_vehicle_asset_id (asset_id)
);

-- Create telemetry_events table
CREATE TABLE telemetry_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
  INDEX idx_telemetry_vehicle (vehicle_id),
  INDEX idx_telemetry_org (organization_id),
  INDEX idx_telemetry_event_type (event_type),
  INDEX idx_telemetry_received_at (received_at),
  INDEX idx_telemetry_timestamp (event_timestamp)
);

-- Create jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  vehicle_id UUID REFERENCES vehicles(id),
  customer_id UUID,
  assigned_technician_id UUID REFERENCES users(id),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_date DATE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  location GEOGRAPHY(POINT, 4326),
  job_type VARCHAR(50),
  sla_deadline TIMESTAMP,
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX idx_job_org (organization_id),
  INDEX idx_job_status (status),
  INDEX idx_job_vehicle (vehicle_id),
  INDEX idx_job_technician (assigned_technician_id),
  INDEX idx_job_scheduled_date (scheduled_date),
  INDEX idx_job_created_at (created_at)
);

-- Create service_logs table
CREATE TABLE service_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES users(id),
  service_type VARCHAR(50),
  description TEXT,
  parts_used JSONB DEFAULT '[]',
  labor_hours DECIMAL(5, 2),
  cost DECIMAL(10, 2),
  completion_signature TEXT,
  completion_images JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_service_job (job_id),
  INDEX idx_service_org (organization_id),
  INDEX idx_service_technician (technician_id)
);

-- Create maintenance_schedules table
CREATE TABLE maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(100) NOT NULL,
  frequency_type VARCHAR(50),
  frequency_value INTEGER,
  last_completed_at TIMESTAMP,
  next_due_date DATE,
  next_due_engine_hours DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_maintenance_org (organization_id),
  INDEX idx_maintenance_vehicle (vehicle_id),
  INDEX idx_maintenance_next_due (next_due_date)
);

-- Create parts table
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  part_number VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  unit_cost DECIMAL(10, 2),
  reorder_level INTEGER,
  supplier_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_part_org (organization_id),
  INDEX idx_part_number (part_number)
);

-- Create inventory table
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  warehouse_location VARCHAR(255),
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  last_counted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, part_id, warehouse_location),
  INDEX idx_inventory_org (organization_id),
  INDEX idx_inventory_part (part_id)
);

-- Create KPI snapshots for analytics
CREATE TABLE kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_name VARCHAR(255) NOT NULL,
  metric_value DECIMAL(15, 4),
  metric_date DATE,
  period VARCHAR(50),
  dimensions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kpi_org (organization_id),
  INDEX idx_kpi_metric (metric_name),
  INDEX idx_kpi_date (metric_date)
);

-- Create indexes for common queries
CREATE INDEX idx_jobs_dispatch ON jobs(organization_id, scheduled_date, status);
CREATE INDEX idx_telemetry_timeseries ON telemetry_events(vehicle_id, event_timestamp DESC);
CREATE INDEX idx_audit_timeline ON audit_logs(organization_id, created_at DESC);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    organization_id,
    user_id,
    entity_type,
    entity_id,
    action,
    changes,
    created_at
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    current_setting('app.user_id')::UUID,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    ),
    CURRENT_TIMESTAMP
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant default permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT CREATE ON SCHEMA public TO postgres;
