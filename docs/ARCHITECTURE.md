# System Architecture - Best Equipment OS

## Architecture Overview

Best Equipment OS is built using a **modular microservices architecture** optimized for scalability, maintainability, and enterprise features.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
├──────────────────┬─────────────────────┬───────────────────┤
│   Web App        │   Mobile App        │   Third-party API │
│  (Next.js)       │  (React Native)     │   Integrations    │
└──────────────────┴─────────────────────┴───────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              API Gateway / Load Balancer                    │
│          (AWS ALB + CloudFront CDN)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer (NestJS)                     │
├────────────┬──────────────┬──────────────┬─────────────────┤
│ Auth Svc   │ Dispatch Svc │ Telematics   │ Maintenance     │
│            │ & Scheduling │ Ingestion    │ Service         │
├────────────┼──────────────┼──────────────┼─────────────────┤
│ Fleet Mgmt │ Inventory    │ Analytics    │ Integration     │
│            │ Management   │ Engine       │ Hub             │
└────────────┴──────────────┴──────────────┴─────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Data Layer                                     │
├───────────────┬──────────────┬──────────┬──────────────────┤
│ PostgreSQL    │ Redis Cache  │  Kafka   │ S3 Object Store  │
│ (Primary DB)  │ (Sessions)   │ (Events) │ (Files/Backups)  │
└───────────────┴──────────────┴──────────┴──────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         Observability Layer                                 │
├──────────────┬──────────────┬──────────┬───────────────────┤
│ OpenTelemetry│ Prometheus   │ Grafana  │ Structured Logs   │
│ (Tracing)    │ (Metrics)    │ (Viz)    │ (ELK/CloudWatch)  │
└──────────────┴──────────────┴──────────┴───────────────────┘
```

## Modular Services

### 1. Authentication & Authorization Service

**Responsibility**: Identity management, RBAC, session management

**Key Components**:
- User authentication (JWT + refresh tokens)
- Multi-tenant user management
- Role-based access control
- OAuth integrations (Salesforce, etc.)
- MFA support (ready)

**Technologies**:
- Passport.js for authentication
- JWT tokens with 24h expiration
- Refresh tokens with 7d expiration
- Role/permission caching in Redis

**API Endpoints**:
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/oauth/:provider
GET    /api/roles
GET    /api/permissions
```

### 2. Dispatch & Scheduling Service

**Responsibility**: Job management, technician dispatch, route optimization

**Key Components**:
- Job/work order lifecycle
- Technician availability tracking
- Automated dispatch optimization
- Route planning (Google Maps/Mapbox integration)
- SLA monitoring
- Calendar synchronization

**Technologies**:
- NestJS with WebSockets for real-time updates
- Bull queue for async job processing
- Route optimization algorithms
- OSRM integration for routing

**Event Publishing**:
- `job.created`
- `job.assigned`
- `job.started`
- `job.completed`
- `sla.breached`

**API Endpoints**:
```
POST   /api/jobs
GET    /api/jobs
PATCH  /api/jobs/:id
POST   /api/jobs/:id/assign
POST   /api/jobs/:id/start
POST   /api/jobs/:id/complete
GET    /api/dispatch/optimized-routes
GET    /api/dispatch/availability
```

### 3. Telematics & Fleet Tracking Service

**Responsibility**: Vehicle location tracking, telemetry ingestion, analytics

**Key Components**:
- Real-time GPS tracking
- Telemetry data ingestion (10k+ events/second)
- Geofencing monitoring
- Fuel/maintenance analytics
- Driver behavior tracking
- Multi-provider integration (Samsara, Geotab, Verizon)

**Technologies**:
- Kafka topic: `vehicle.telemetry`
- Time-series database optimization (PostgreSQL with partitioning)
- Redis for real-time location caching
- PostGIS for geospatial queries

**Data Pipeline**:
```
External Telematics → API Endpoint → Kafka → Stream Processor 
                                    → PostgreSQL (storage)
                                    → Redis (real-time)
                                    → Analytics Engine
```

**Event Publishing**:
- `vehicle.location.updated`
- `vehicle.idle.detected`
- `vehicle.speeding.alert`
- `vehicle.maintenance.due`
- `geofence.entered`
- `geofence.exited`

### 4. Predictive Maintenance Engine

**Responsibility**: Maintenance forecasting, work order generation

**Key Components**:
- Rule-based maintenance prediction
- ML-based failure forecasting
- Parts consumption analysis
- Cost optimization recommendations

**Technologies**:
- Python microservice (lightweight ML models)
- Scikit-learn for predictions
- Time-series forecasting
- Integration with scheduling service

**Predictions**:
- Engine failure risk (0-100%)
- Next maintenance date
- Parts to order
- Downtime probability

### 5. Integration Hub

**Responsibility**: Third-party integrations, OAuth flows, webhooks

**Key Components**:
- Salesforce connector
- ERP integration (M5/Envision)
- Telematics connectors
- CRM synchronization
- Webhook management

**Technologies**:
- Connector abstraction layer
- OAuth2 state management
- Rate limiting per provider
- Retry with exponential backoff

**Supported Integrations**:
```
- Salesforce (CRM)
- M5/Envision (ERP)
- Samsara (Telematics)
- Geotab (Telematics)
- Verizon Connect (Telematics)
- Google Maps/Mapbox (Routing)
- Stripe (Payments)
```

### 6. Analytics & Reporting Engine

**Responsibility**: KPI aggregation, reporting, dashboards

**Key Components**:
- Real-time KPI calculation
- Custom report builder
- Historical analytics
- Drill-down reporting
- Export functionality

**Key Metrics**:
- Fleet utilization
- Technician productivity
- Revenue per vehicle
- MTTR (Mean Time To Repair)
- SLA compliance
- Fuel efficiency
- Maintenance cost trends

**Technologies**:
- Daily KPI snapshots in PostgreSQL
- Pre-aggregated metrics for performance
- Redis for real-time calculations
- Recharts for visualization

## Data Flow Patterns

### Synchronous Request-Response

```
Client Request → API Gateway → Service → Database
           ↓                                   ↓
       Response ← API Gateway ← Service ← Query Result
```

Use for:
- User authentication
- Real-time job updates
- Vehicle location queries
- Report generation

### Asynchronous Event-Driven

```
Service A → Kafka Topic → Stream Processor → Service B
           (event published)                (subscribes)
                    ↓
             PostgreSQL (storage)
             Redis (cache)
             Notifications
```

Use for:
- Telemetry ingestion (high volume)
- Maintenance scheduling
- Notifications/alerts
- Audit logging
- Analytics KPI updates

### Batch Processing

```
Scheduled Job (Cron) → Extract Data → Transform → Load
                  (Daily/Weekly)
                       ↓
                Analytics Tables
                KPI Snapshots
                Reports
```

Use for:
- Daily metric aggregation
- Maintenance schedule updates
- Report generation
- Data cleanup/archival

## Multi-Tenancy Architecture

### Tenant Isolation Strategy

1. **Data Level**: Row-level security
   ```sql
   WHERE organization_id = current_user_org
   ```

2. **API Level**: Tenant context in JWT
   ```
   Header: Authorization: Bearer <jwt>
   JWT includes: { sub, org_id, roles, permissions }
   ```

3. **Service Level**: Middleware validates tenant context
   ```typescript
   @Injectable()
   class TenantMiddleware {
     use(req, res, next) {
       const orgId = req.user.org_id;
       req.tenantContext = { orgId };
       next();
     }
   }
   ```

4. **Database Level**: Tenant-scoped connections
   ```
   SELECT * FROM vehicles 
   WHERE organization_id = $1
   ```

### Tenant Data Segregation

```
Global Databases (Shared)
├── organizations
├── users
├── roles
└── audit_logs (scoped by org)

Tenant-Scoped Databases
├── vehicles
├── jobs
├── service_logs
├── telemetry_events
├── inventory
└── kpi_snapshots
```

## Security Architecture

### Authentication Flow

```
User Credentials
      ↓
Authentication Service
      ↓
Validate → Issue JWT + Refresh Token
      ↓
Client stores JWT in memory, Refresh in secure cookie
      ↓
Subsequent requests use JWT in Authorization header
      ↓
API validates JWT signature & claims
      ↓
Grant access if valid
```

### Token Management

```
Access Token (JWT)
├── Duration: 24 hours
├── Contains: sub, org_id, roles, permissions
├── Stored: Memory (client)
└── Transmitted: Authorization header

Refresh Token
├── Duration: 7 days
├── Contains: sub, type='refresh'
├── Stored: Secure cookie (httpOnly, secure)
├── Rotation: New token issued on refresh
└── Revocation: Blacklist in Redis
```

### API Authorization

```
Route Handler
    ↓
    @UseGuards(JwtAuthGuard)
    @Roles('admin', 'manager')
    @Permissions('dispatch:write')
    ↓
Extract JWT → Validate signature → Check roles → Check permissions
    ↓
Grant/Deny Access
```

## Caching Strategy

### Cache Layers

```
1. Client Cache (Browser)
   - React Query cache
   - LocalStorage for preferences
   - TTL: 5-30 minutes

2. Redis Cache (Server)
   - Session store
   - Real-time vehicle locations
   - User permissions
   - TTL: 1-24 hours

3. Database Query Cache (PostgreSQL)
   - Query result caching
   - Index optimization
   - Connection pooling
```

### Cache Invalidation

```
On Data Change:
  1. Update database
  2. Publish cache.invalidate event
  3. Services subscribe and clear relevant cache
  4. Send WebSocket notification to clients
  
TTL-based expiration:
  - Vehicle location: 30 seconds
  - User permissions: 1 hour
  - KPI metrics: 5 minutes
```

## Error Handling & Resilience

### Circuit Breaker Pattern

```
Service A → [Circuit Breaker] → Service B
                    ↓
            Monitor health
            
CLOSED → failure threshold → OPEN
                    ↓
            Wait timeout → HALF_OPEN
                    ↓
            Success → CLOSED
            Failure → OPEN (backoff)
```

### Retry Logic

```
Request
  ↓
Try (attempt 1)
  ↓
Fail? → Wait 100ms → Try (attempt 2)
  ↓
Fail? → Wait 500ms → Try (attempt 3)
  ↓
Fail? → Return error to client
```

### Graceful Degradation

```
Service unavailable:
  - Return cached data if available
  - Show degraded UI
  - Queue for retry
  - Alert operations team

Database connection lost:
  - Switch to read-only mode
  - Serve from cache
  - Queue writes for retry
```

## Scalability Considerations

### Horizontal Scaling

```
Load Balancer
├── API Instance 1
├── API Instance 2
├── API Instance 3
└── API Instance N

Each instance:
- Stateless (shared Redis for sessions)
- Auto-scaling based on CPU/memory
- Health checks every 30 seconds
```

### Database Scaling

```
PostgreSQL Primary
├── Read Replicas (3x)
└── Backup Standby

Read/Write Distribution:
- Writes → Primary only
- Reads → Primary + Replicas
- Analytical queries → Read replicas
```

### Telemetry Scaling

```
10,000+ vehicles → 1M+ events/day

Kafka Partitioning:
- Partition by vehicle_id (for ordering)
- 100 partitions (allow scaling)
- Replication factor: 3

Stream Processing:
- Kafka Streams consumer group
- Parallel processing per partition
- Batch insert to PostgreSQL (1000 records/batch)
```

## Deployment Architecture

### Infrastructure Layers

```
AWS Region (Primary)
├── VPC
│   ├── Public Subnets (ALB, NAT)
│   ├── Private Subnets (EKS, RDS, ElastiCache)
│   └── Database Subnets (RDS multi-AZ)
├── EKS Cluster
│   ├── API pods (horizontal auto-scaling)
│   ├── Worker pods (KJob queues)
│   └── Ingress (Application Load Balancer)
├── RDS PostgreSQL
│   ├── Primary + Read replicas
│   └── Automated backups
├── ElastiCache Redis
│   ├── Multi-AZ for HA
│   └── Cluster mode for scaling
├── MSK (Managed Streaming for Kafka)
│   ├── Multi-broker for HA
│   └── Default 3 partitions/topic
└── S3
    ├── Application uploads
    └── Database backups
```

### CI/CD Pipeline

```
Code Push
   ↓
GitHub Actions
   ├── Lint & Type Check
   ├── Run Tests
   ├── Build Docker Images
   ├── Push to ECR
   └── Deploy to EKS
   
Deployment Stages:
- Dev (continuous)
- Staging (on PR merge to develop)
- Production (on tag or main merge)
```

## Observability

### Instrumentation

```
Application
├── OpenTelemetry SDK
│   ├── Traces (request paths)
│   ├── Metrics (latency, errors)
│   ├── Logs (structured JSON)
│   └── Events (significant actions)
└── Exported to:
    ├── Jaeger (traces)
    ├── Prometheus (metrics)
    ├── ELK Stack (logs)
    └── CloudWatch (AWS metrics)
```

### Dashboards

```
Real-time:
- API latency (P50, P95, P99)
- Error rates by service
- Active users
- Queue depths

Business:
- Fleet uptime
- Technician utilization
- Revenue metrics
- SLA compliance

Infrastructure:
- CPU/Memory usage
- Database connections
- Disk I/O
- Network throughput
```

### Alerting

```
Severity Levels:
- CRITICAL → PagerDuty → On-call engineer
- HIGH → Slack #alerts → Engineering team
- MEDIUM → Email → Team lead
- LOW → Dashboard only

Example Alerts:
- API error rate > 1% for 5 minutes
- P99 latency > 5 seconds
- Database CPU > 80%
- Kafka lag > 10k messages
- Disk usage > 85%
```

## Disaster Recovery

### RTO/RPO Targets

| Component | RTO | RPO |
|-----------|-----|-----|
| API | 15 minutes | 0 (stateless) |
| Database | 1 hour | 15 minutes |
| Kafka | 30 minutes | 1 minute |
| S3 | 1 hour | 0 (replicated) |

### Backup Strategy

```
Database:
- Daily automated snapshots (retained 30 days)
- Cross-region replication
- Point-in-time recovery capability
- Test restore monthly

Application Data:
- S3 versioning enabled
- Lifecycle policy (archive to Glacier after 90 days)
- Daily incremental backups

Configuration:
- IaC in Git (Terraform)
- Secrets in AWS Secrets Manager
- Encrypted backups
```

## Performance Benchmarks

### API Performance

| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| `/api/jobs` (list) | 50ms | 150ms | 300ms |
| `/api/jobs` (create) | 100ms | 300ms | 500ms |
| `/api/vehicles` (location) | 30ms | 75ms | 150ms |
| `/api/dispatch/optimize` | 500ms | 1000ms | 2000ms |

### Infrastructure

| Metric | Target | Notes |
|--------|--------|-------|
| Throughput | 10k req/s | Peak capacity |
| Telemetry Ingestion | 1M events/day | Real-time processing |
| API Availability | 99.95% | Excludes scheduled maintenance |
| Database Failover | < 1 minute | RDS automated failover |

## Future Considerations

- GraphQL API layer (in addition to REST)
- Service mesh (Istio) for advanced networking
- CQRS pattern for heavy read operations
- Event sourcing for audit compliance
- Machine learning pipeline scaling
- Geographic distribution (multi-region)
