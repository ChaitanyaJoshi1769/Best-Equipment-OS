# Development Setup Guide - Best Equipment OS

## Prerequisites

- **Node.js** 18.17.0 or higher
- **pnpm** 8.0.0 or higher
- **Docker** & **Docker Compose**
- **Git**
- **Terraform** (for infrastructure)
- **AWS CLI** (for cloud operations)

## Installation

### 1. Install Node.js

```bash
# Using Homebrew (macOS)
brew install node@18

# Or download from https://nodejs.org/
```

### 2. Install pnpm

```bash
npm install -g pnpm@8
```

### 3. Clone Repository

```bash
git clone https://github.com/ChaitanyaJoshi1769/Best-Equipment-OS.git
cd Best-Equipment-OS
```

### 4. Install Dependencies

```bash
pnpm install
```

## Environment Setup

### 1. Create Environment File

```bash
cp .env.example .env.local
```

### 2. Update Environment Variables

Edit `.env.local` with your settings:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/best_equipment_dev
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-key-here
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here

# AWS (for production only)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Integrations (get from respective providers)
SALESFORCE_CLIENT_ID=
MAPBOX_ACCESS_TOKEN=
```

## Docker Setup

### 1. Start Infrastructure

```bash
# Start all services (PostgreSQL, Redis, Kafka, monitoring)
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 2. Initialize Database

```bash
# Run migrations
pnpm db:migrate

# Seed initial data (optional)
pnpm db:seed
```

### 3. Monitor Services

```bash
# View logs
docker-compose logs -f

# Access UIs
- PostgreSQL Admin: http://localhost:8081 (user: postgres, pass: password)
- Kafka UI: http://localhost:8080
- Grafana: http://localhost:3100 (user: admin, pass: admin)
- Jaeger: http://localhost:16686
- MinIO: http://localhost:9001 (user: minioadmin, pass: minioadmin)
```

## Development Workflow

### 1. Start Development Servers

```bash
# Run all services in development mode
pnpm dev

# Available on:
# - Web: http://localhost:3000
# - API: http://localhost:3001
# - Mobile: http://localhost:8081
```

### 2. Code Quality

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type checking
pnpm type-check

# All checks together
pnpm monorepo:validate
```

### 3. Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## Building

### 1. Build Packages

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @best-equipment/ui build
```

### 2. Docker Images

```bash
# Build Docker images
docker-compose build

# Build specific service
docker build -t best-equipment-os/api:latest -f apps/api/Dockerfile .

# Push to registry (after authentication)
docker tag best-equipment-os/api:latest ghcr.io/username/best-equipment-os/api:latest
docker push ghcr.io/username/best-equipment-os/api:latest
```

## Database Management

### 1. Migrations

```bash
# Create new migration
pnpm db:create-migration add_column_to_users

# Run pending migrations
pnpm db:migrate

# Rollback last migration
pnpm db:migrate:rollback

# View migration status
pnpm db:migrate:status
```

### 2. Database Tools

```bash
# Connect to database
psql postgresql://postgres:password@localhost:5432/best_equipment_dev

# Backup database
pg_dump postgresql://postgres:password@localhost:5432/best_equipment_dev > backup.sql

# Restore database
psql postgresql://postgres:password@localhost:5432/best_equipment_dev < backup.sql
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in environment
PORT=3002 pnpm dev
```

### Docker Issues

```bash
# Remove all containers and volumes
docker-compose down -v

# Clean up dangling images
docker image prune -a

# Rebuild from scratch
docker-compose up -d --build
```

### Database Connection Issues

```bash
# Check PostgreSQL status
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Reset database
docker-compose exec postgres dropdb -U postgres best_equipment_dev
docker-compose exec postgres createdb -U postgres best_equipment_dev
pnpm db:migrate
```

### Dependency Issues

```bash
# Clear pnpm cache
pnpm store prune

# Reinstall all dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Update dependencies
pnpm update
```

## AWS Infrastructure (Production)

### 1. Configure AWS CLI

```bash
aws configure
# Enter: Access Key ID, Secret Access Key, Region, Output Format
```

### 2. Initialize Terraform

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Plan infrastructure
terraform plan -var-file="dev.tfvars"

# Apply infrastructure
terraform apply -var-file="dev.tfvars"
```

### 3. Deploy to EKS

```bash
# Get kubeconfig
aws eks update-kubeconfig --name best-equipment-os-dev --region us-east-1

# Deploy application
kubectl apply -f infrastructure/kubernetes/

# Check deployment status
kubectl get pods
kubectl logs -f deployment/api
```

## CI/CD

### GitHub Actions

Push to branches to trigger pipelines:

```bash
# Trigger CI on feature branch
git push origin feature/my-feature

# Trigger deployment on develop
git push origin develop

# Trigger production deployment
git tag v1.0.0 && git push origin v1.0.0
```

## IDEs & Tools

### VS Code

Install extensions:
- ESLint
- Prettier - Code formatter
- Thunder Client (REST client)
- Docker
- Kubernetes

### Recommended Settings

`.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "extensions.recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

## Performance Optimization

### 1. Development

```bash
# Use Fast Refresh
# Enabled by default in Next.js for instant updates

# Use Turbo caching
pnpm build  # Uses Turbo cache
```

### 2. Database Queries

```bash
# Monitor slow queries
SELECT query, calls, mean_time 
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC;
```

### 3. Build Size

```bash
# Analyze bundle size
pnpm build
# Check dist/bundle-analysis.html
```

## Next Steps

1. **Read Documentation**
   - [Architecture Guide](./ARCHITECTURE.md)
   - [Database Schema](./DATABASE.md)
   - [API Documentation](./API.md)

2. **Complete First Tasks**
   - Create a feature branch
   - Make a small change
   - Run tests and linting
   - Create a pull request

3. **Deploy to Development**
   - Ensure Docker services are running
   - Deploy locally: `pnpm dev`
   - Test your changes

4. **Familiarize with Codebase**
   - Explore `/apps` directory
   - Review `/packages` structure
   - Check existing services in `/services`

## Support

- **Documentation**: See `/docs` directory
- **Issues**: GitHub Issues
- **Slack**: #best-equipment-os
- **Email**: engineering@bestequipment.com

---

**Last Updated**: May 28, 2026
**Version**: 0.1.0
