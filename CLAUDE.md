# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack Time Manager application for tracking work hours, built as a monorepo with three main services:
- **API (Backend)**: Express.js + TypeScript REST API with JWT authentication
- **Frontend**: React + Vite user-facing application
- **Admin**: React + Vite administrative dashboard

The application uses PostgreSQL (via Supabase) with Drizzle ORM for database management, and is containerized with Docker.

## Development Setup

### Starting Development Environment
```bash
# Start all services in development mode
npm run dev

# Start with rebuild
npm run dev:build

# View logs
npm run dev:logs

# Stop services
npm run dev:stop

# Clean up (removes volumes)
npm run clean
```

### Individual Service Commands

**Backend (API)**
```bash
cd api
npm run dev           # Start with hot-reload (tsx watch)
npm run build         # Compile TypeScript
npm run serve         # Run compiled production build
npm run db:generate   # Generate Drizzle migrations
npm run db:push       # Push schema changes to database
```

**Frontend**
```bash
cd frontend
npm run dev           # Start Vite dev server
npm run build         # Build for production
npm run preview       # Preview production build
```

**Admin**
```bash
cd admin
npm run dev           # Start Vite dev server
npm run build         # Build for production
npm run preview       # Preview production build
```

## Architecture

### Backend Structure (`/api`)

**Entry Point**: `index.ts` - Express app configuration, middleware setup, and router registration

**Database Layer**:
- `db/client.ts` - Drizzle database client with PostgreSQL connection pooling
- `models/*.model.ts` - Drizzle schema definitions (users, teams, clocks, attendance)
- `drizzle.config.ts` - Drizzle Kit configuration for migrations

**API Layer**:
- `routes/*.routes.ts` - Express routers defining endpoints
- `controllers/*.controller.ts` - Request handlers with business logic
- `services/*.service.ts` - Reusable business logic (e.g., attendance calculations)

**Middleware**:
- `middleware/isAuth.ts` - JWT authentication middleware (checks Bearer token or cookie)
- `middleware/isAdmin.ts` - Admin authorization middleware

**Configuration**:
- `config/swagger.config.ts` - OpenAPI/Swagger documentation setup
- `swagger/*.yaml` - Swagger schema and endpoint documentation

**Authentication Flow**:
1. User logs in via `POST /user/login` (no auth required)
2. Server generates JWT with `user_id` and `admin` claims
3. JWT returned as cookie and in response body
4. Protected routes use `isAuth` middleware (extracts from Bearer header or cookie)
5. Admin routes use both `isAuth` and `isAdmin` middleware

### Frontend Applications

**Frontend** (`/frontend`): Public-facing React app for regular users (time tracking, personal dashboard)

**Admin** (`/admin`): Administrative React app with Tailwind CSS for managing users and teams

Both use:
- React Router for navigation
- Context API for authentication state
- Vite for bundling and hot-reload

### Docker Setup

**Development** (`docker-compose.dev.yml`):
- Mounts source code as volumes for hot-reload
- Runs services with development commands
- Backend: `tsx watch`, Frontend/Admin: `vite`

**Production** (`docker-compose.prod.yml`):
- Uses multi-stage Dockerfiles with production targets
- Serves optimized production builds

### Environment Variables

Required in `.env` (root directory):
- `DATABASE_URL` - PostgreSQL connection string (Supabase)
- `JWT_SECRET` - Secret for signing JWT tokens
- `WEBSITE_URL` - Frontend URL for CORS
- `PORT` / `BACKEND_CONTAINER_PORT` - Backend port configuration
- `FRONTEND_HOST_PORT` / `FRONTEND_CONTAINER_PORT` - Frontend port configuration
- `ADMIN_HOST_PORT` / `ADMIN_CONTAINER_PORT` - Admin port configuration

## Key Patterns & Conventions

### Database Schema Management
- Models use Drizzle ORM's schema definition
- Each model exports: Table definition, `InferSelectModel` type, and `InferInsertModel` type
- User model exports `SafeUser` type (omits password) and `safeUserSelect` for queries
- Run `npm run db:generate` to create migrations from schema changes
- Run `npm run db:push` to apply changes directly (dev only)

### API Routes Pattern
Routes follow RESTful conventions:
- `GET /user` - Get authenticated user's profile
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get specific user (authenticated)
- `POST /users` - Create user (admin only)
- `PUT /user` - Update own profile
- `PUT /users/:id` - Update other user (admin only)
- `DELETE /user` - Delete own account
- `DELETE /users/:id` - Delete other user (admin only)

### Type Safety
- Backend uses TypeScript with strict mode
- Request types augmented via `types/express.d.ts` to include `user_id` and `admin` properties
- Drizzle provides compile-time type safety for database queries

## CI/CD

The project uses GitHub Actions workflows:

**CI** (`.github/workflows/ci.yml`):
- Triggers on push/PR to `main`, `dev`, `CICD` branches
- Builds Docker images with Buildx
- Pushes to Docker Hub with branch-based tags
- Tags `main` branch as both `:main` and `:latest`
- Deploys to VPS only on push to `main`

**Deployment Process**:
1. Images built and pushed to Docker Hub
2. SSH into VPS
3. Pull latest code from GitHub
4. Pull new Docker images
5. Restart containers with `docker-compose.prod.yml`
6. Clean up old images

## API Documentation

Swagger UI available at `/api-docs` when backend is running. Documentation is defined in:
- `config/swagger.config.ts` - Main configuration
- `swagger/*.yaml` - Endpoint and schema definitions

## Database Connection

The API uses Supabase (PostgreSQL) with:
- Connection pooling (max 1 connection for Supabase pooler)
- SSL enabled with `rejectUnauthorized: false`
- Environment-based configuration via `DATABASE_URL`

## Testing & Debugging

- Health check endpoint: `GET /health` - Verifies database connectivity
- Root endpoint: `GET /` - Returns "Hello World"
- Backend runs on port 3000 by default (configurable via `PORT`)
- Check Docker logs: `docker-compose -f docker-compose.dev.yml logs -f [service-name]`
