# NicheLink Backend

## Overview
A Node.js + Express + Prisma + PostgreSQL backend for the NicheLink SaaS foundation, including authentication, client management, projects/tasks, email verification, password reset, profile updates, uploads, logging, and rate limiting.

## Features
- User registration, login, JWT auth, and `/api/auth/me`
- Email verification and password reset flows with expiration and one-time token usage
- Google OAuth login route (requires Google credentials in `.env`)
- Full CRUD for clients scoped to the authenticated user
- Project and task modules with ownership and member assignment
- Avatar/cover/document uploads with local fallback storage or Cloudinary when configured
- Input validation, centralized error handling, request logging, and rate limiting

## Prerequisites
- Node.js 18+
- PostgreSQL 16+ (or any compatible PostgreSQL instance)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a PostgreSQL database (for example `nichelink_backend`).
3. Update `.env` with your database connection details and optional SMTP/Cloudinary/Google settings.
4. Apply the Prisma schema to the database:
   ```bash
   npx prisma db push
   ```
5. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

> Windows note: if `npx prisma generate` fails with an `EPERM` rename error, stop any running Node.js processes using the project, delete stale files under `node_modules/.prisma/client`, and rerun `npx prisma generate`.

6. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `POST /api/auth/verify-email`
- `GET /api/auth/verify-email/:token`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/google`

### Clients
- `POST /api/clients`
- `GET /api/clients`
- `GET /api/clients/:id`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`

### Projects
- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:projectId`
- `PUT /api/projects/:projectId`
- `DELETE /api/projects/:projectId`
- `POST /api/projects/:projectId/members`

### Tasks
- `POST /api/projects/:projectId/tasks`
- `GET /api/projects/:projectId/tasks`
- `PUT /api/projects/:projectId/tasks/:taskId`
- `DELETE /api/projects/:projectId/tasks/:taskId`

### Uploads
- `POST /api/uploads/avatar`
- `POST /api/uploads/cover`
- `POST /api/uploads/documents`

## Example requests
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","username":"jane","email":"jane@example.com","password":"password123"}'
```
