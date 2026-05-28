# Best Equipment OS - API Gateway

Core API application built with **NestJS** and **TypeScript**.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 👥 User and organization management
- 🔑 Role-based access control (RBAC)
- 📊 Multi-tenant architecture
- 🗄️ PostgreSQL database with TypeORM
- ⚡ Redis caching (future)
- 📨 Email notifications (future)

## Project Structure

```
src/
├── modules/
│   ├── auth/           # Authentication (JWT, login, register)
│   ├── users/          # User management
│   ├── organizations/  # Organization/tenant management
│   ├── roles/          # RBAC and permissions
│   └── health/         # Health check endpoints
├── database/
│   ├── entities/       # Database models
│   ├── migrations/     # Database migrations
│   └── seeders/        # Initial data seeding
├── common/             # Shared utilities, guards, decorators
└── main.ts             # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+

### Installation

```bash
# Install dependencies (from root)
pnpm install

# Create .env file
cp .env.example .env.local
```

### Development

```bash
# Start development server
pnpm dev

# Or directly in this directory
pnpm --filter @best-equipment/api start:dev

# Run tests
pnpm --filter @best-equipment/api test

# Run with hot-reload
pnpm --filter @best-equipment/api start:dev
```

### Database

```bash
# Run migrations
pnpm db:migrate

# Seed initial data
pnpm db:seed
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new organization
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/me` - Get current user details
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:userId/roles/:roleId` - Assign role
- `DELETE /api/users/:userId/roles/:roleId` - Remove role
- `GET /api/users/:userId/roles` - Get user roles

### Organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations` - List organizations
- `GET /api/organizations/:id` - Get organization
- `PATCH /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization
- `GET /api/organizations/:id/stats` - Get organization statistics

### Roles
- `POST /api/roles` - Create role
- `GET /api/roles` - List roles by organization
- `GET /api/roles/:id` - Get role
- `PATCH /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `GET /api/roles/:id/permissions` - Get role permissions
- `POST /api/roles/:id/permissions` - Add permission
- `DELETE /api/roles/:id/permissions/:resource/:action` - Remove permission

### Health
- `GET /api/health` - Health check
- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require JWT token in the Authorization header:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/users/me
```

## Testing

```bash
# Run all tests
pnpm --filter @best-equipment/api test

# Run tests in watch mode
pnpm --filter @best-equipment/api test:watch

# Generate coverage report
pnpm --filter @best-equipment/api test:cov
```

## Building

```bash
# Build the application
pnpm --filter @best-equipment/api build

# Run production build
pnpm --filter @best-equipment/api start:prod
```

## Docker

```bash
# Build Docker image
docker build -t best-equipment-os/api:latest -f apps/api/Dockerfile .

# Run Docker container
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://user:password@host:5432/db \
  -e JWT_SECRET=your-secret \
  best-equipment-os/api:latest
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `NODE_ENV` - Environment (development/staging/production)
- `API_PORT` - Port the API listens on
- `DATABASE_URL` or individual `DATABASE_*` vars
- `JWT_SECRET` - Secret key for signing JWTs
- `JWT_EXPIRATION` - JWT expiration time
- `REFRESH_TOKEN_SECRET` - Secret for refresh tokens

## Contributing

1. Follow the NestJS module structure
2. Create controllers/services/modules for new features
3. Add tests for new functionality
4. Run linting and type checking before committing
5. Follow the conventional commit message format

## Next Steps

- Phase 3: Fleet & service backend services
- WebSocket support for real-time updates
- Integration with Kafka for event streaming
- Redis caching layer
- Advanced RBAC with custom permissions
- Email notifications

---

**Status**: Phase 2 - Core Backend Platform
**Last Updated**: May 28, 2026
