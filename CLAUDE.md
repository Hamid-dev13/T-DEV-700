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

**Root-level commands** (from project root):
```bash
npm run dev           # Start all services in development mode
npm run dev:build     # Start with rebuild (--build flag)
npm run dev:logs      # View logs from all services
npm run dev:stop      # Stop all services
npm run db:migrate    # Run Drizzle migrations in backend container
npm run clean         # Stop services and remove volumes (⚠️ deletes data)
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
npm run test          # Run Vitest tests in watch mode
npm run test:ui       # Run tests with Vitest UI
npm run test:coverage # Run tests with coverage report
```

**Admin**
```bash
cd admin
npm run dev           # Start Vite dev server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint on codebase
```

## Architecture

### Backend Structure (`/api`)

**Entry Point**: `index.ts` - Express app configuration, middleware setup, and router registration

**Database Layer**:
- `db/client.ts` - Drizzle database client with PostgreSQL connection pooling
- `models/*.model.ts` - Drizzle schema definitions:
  - `user.model.ts` - Users with authentication (exports `SafeUser` and `safeUserSelect`)
  - `team.model.ts` - Teams with work hours (start_hour, end_hour) and manager
  - `clock.model.ts` - Time tracking entries (clock in/out timestamps)
  - `user_team.model.ts` - Many-to-many junction for user-team relationships
  - `leave_period.model.ts` - Leave requests with acceptance status
  - `password.model.ts` - Password reset tokens with expiration
  - `public_holiday.model.ts` - Public holiday dates
- `drizzle.config.ts` - Drizzle Kit configuration for migrations

**API Layer**:
- `routes/*.routes.ts` - Express routers defining endpoints:
  - `user.routes.ts` - User authentication and CRUD
  - `clock.routes.ts` - Time tracking operations
  - `team.routes.ts` - Team management and member operations
  - `report.routes.ts` - KPI report generation
  - `leave_period.route.ts` - Leave period management
  - `password.route.ts` - Password reset flow
- `controllers/*.controller.ts` - Request handlers with business logic
- `services/*.service.ts` - Reusable business logic:
  - `user.service.ts` - Authentication and user management
  - `clock.service.ts` - Time entries with leave period filtering
  - `team.service.ts` - Team operations and manager permissions
  - `report.service.ts` - KPI calculations (lateness, pause_times, presence, earlyness)
  - `leave_period.service.ts` - Leave request operations
  - `password.service.ts` - Token generation and password reset
  - `mail.service.ts` - SMTP email sending

**Middleware**:
- `middleware/isAuth.ts` - JWT authentication middleware (checks Bearer token or cookie)
- `middleware/isAdmin.ts` - Admin authorization middleware
- `middleware/isMailAvailable.ts` - Returns 503 if mail service unavailable

**Utilities**:
- `utils/password.ts` - Scrypt password hashing with validation (uppercase, lowercase, digit, special char, >4 length)
- `utils/timezone.ts` - Date conversion for Paris timezone using date-fns-tz
- `utils/cookie.ts` - Cookie parser using regex
- `utils/format.ts` - Error response formatter

**Types**:
- `types/express.d.ts` - Augments Express Request with `user_id` and `admin` properties

**Configuration**:
- `config/swagger.config.ts` - OpenAPI/Swagger documentation setup
- `swagger/*.yaml` - Swagger schema and endpoint documentation
- `.env` variables loaded from parent directory (`../env`)

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
- `ADMIN_WEBSITE_URL` - Admin dashboard URL for CORS
- `PORT` / `BACKEND_CONTAINER_PORT` - Backend port configuration (default: 3000)
- `FRONTEND_HOST_PORT` / `FRONTEND_CONTAINER_PORT` - Frontend port configuration
- `ADMIN_HOST_PORT` / `ADMIN_CONTAINER_PORT` - Admin port configuration
- Mail service (optional): `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`

## Key Patterns & Conventions

### Database Schema Management
- Models use Drizzle ORM's schema definition (in `api/models/` directory)
- Each model exports: Table definition, `InferSelectModel` type, and `InferInsertModel` type
- User model exports `SafeUser` type (omits password) and `safeUserSelect` for queries
- Schema changes workflow:
  1. Modify schema files in `api/models/*.model.ts`
  2. Generate migration: `cd api && npm run db:generate` (creates files in `api/drizzle/`)
  3. Apply migration: From root run `npm run db:migrate` (runs inside Docker container)
  4. Alternative for dev: `cd api && npm run db:push` (direct push, skips migrations)

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

### Permission Model
- **Admin**: Full access to all resources (checked via JWT `admin` claim)
- **Manager**: Can manage their team members' data (clocks, reports, leave periods)
- **User**: Can only manage their own data
- Services include manager permission checks (e.g., `isManagerOf()` in team.service.ts)

### Time Tracking & KPIs
- Clock entries are paired (clock in/out) for each work period
- KPI calculations require even number of clock entries per day
- Report types: `lateness`, `pause_times`, `presence`, `earlyness`
- KPIs calculated based on team work hours (start_hour, end_hour)
- Clock filtering excludes entries during accepted leave periods
- Timezone handling uses Paris timezone by default (date-fns-tz)

### Leave Period Management
- Users can create and view their own leave periods
- Only unaccepted leave periods can be deleted by the user
- Managers/Admins can accept/reject and delete any leave periods
- Accepted leave periods affect clock filtering in reports

## Testing

**Frontend Testing** (Vitest + React Testing Library):
- Test files: `*.test.tsx` and `*.test.ts` in `frontend/src/`
- Run tests: `npm run test` (watch mode), `npm run test:ui` (UI mode), `npm run test:coverage`
- Coverage requirement: Minimum 40% (enforced in CI on push to `main`)
- Test setup: `frontend/src/test/setup.ts` (loaded by vitest.config.ts)
- Coverage reporter: v8 provider, outputs text/json/html reports
- Coverage excludes: `node_modules/`, `src/test/`, `**/*.d.ts`, `**/*.config.*`, `**/mockData`, `dist/`
- Path alias: `@` resolves to `frontend/src/`
- Tests include: Pages (Login, Dashboard, Clock, Account, TeamManage, MemberDetails), API utilities

**Backend Testing**:
- No test suite currently configured (only test command is placeholder)

## CI/CD

The project uses GitHub Actions workflows:

**CI** (`.github/workflows/ci.yml`):
- Triggers on push/PR to `main`, `dev`, `CICD` branches
- **Job 1 - Frontend Tests**: Runs on push to `main` only
  - Installs dependencies with `npm ci`
  - Runs `npm run test:coverage -- --run`
  - Validates coverage ≥40% threshold
  - Uploads coverage report as artifact (90-day retention)
- **Job 2 - Docker Build & Push**: Depends on test job passing
  - Builds three Docker images with Buildx (backend, frontend, admin)
  - Pushes to Docker Hub: `hamidledev/monapp-{backend,frontend,admin}:{branch}`
  - Tags `main` branch as both `:main` and `:latest`
  - Uses GitHub Actions cache for faster builds
- **Job 3 - Deploy**: Only on push to `main`, depends on previous jobs
  - SSHs into VPS (requires secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PORT`)
  - Pulls latest code from GitHub
  - Pulls new Docker images from Docker Hub
  - Restarts containers with `docker-compose.prod.yml`
  - Prunes unused images for cleanup

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

**Health Check**:
- `GET /health` - Returns JSON with database and mail service status
  - Returns 200 if both available, 500 otherwise
  - Response: `{ "database": "connected|disconnected", "mail": "available|not available" }`

**API Documentation**:
- Swagger UI: `GET /api-docs` (interactive documentation)
- Swagger JSON: `GET /api-docs.json` (raw OpenAPI spec)

**Common Issues**:
- **Port Mapping Differences**:
  - Development: Backend runs on port 3000 (default)
  - Production (`docker-compose.prod.yml`): Backend mapped to 5001:3001 (host:container)
  - Frontend: 3001:80 (production), Admin: 3002:80 (production)
- CORS configured for `WEBSITE_URL` and `ADMIN_WEBSITE_URL` origins only
- Check Docker logs: `docker-compose -f docker-compose.dev.yml logs -f [service-name]`
- Clock operations use ±1 second tolerance for matching updates/deletes
- Authentication issues between environments: Verify `API_URL` environment variable matches actual backend URL and that CORS origins include the frontend domain
