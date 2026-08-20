# NicheLink — Verified Remote Communities & SaaS Platform

NicheLink is a full-stack, enterprise-grade SaaS platform built for verified remote engineers, founders, and technical creators to form micro-tribes, exchange knowledge, match for projects/co-founding, track billable time, and collaborate in real-time.

---

## 1. Technology Stack

### Frontend
- **Framework**: React 19, TypeScript, Vite 6
- **Styling**: Tailwind CSS v4, Lucide Icons, Framer Motion
- **Real-Time Client**: Socket.IO Client v4
- **WebRTC**: Native WebRTC Browser API with STUN/TURN signaling

### Backend
- **Runtime & Server**: Node.js (v18+ / v20+ / v22+), Express 5
- **Database & ORM**: PostgreSQL 16+, Prisma ORM 6
- **Cache & Rate Limiting**: Redis 7, express-rate-limit, rate-limit-redis
- **Real-Time Engine**: Socket.IO v4 (Direct Messaging, Multi-Channel Chat, WebRTC Signaling)
- **Billing & Payments**: Stripe API & Webhooks (idempotent signature validation)
- **Security & Middleware**: JWT + hashed refresh token rotation, BCrypt (cost: 12), Helmet, CSURF, HPP, XSS sanitization, Morgan, Pino structured logger
- **Testing**: Jest 29, Supertest, runInBand test harness

---

## 2. Platform Features & Capabilities

- **Authentication & RBAC**:
  - Email + password registration with double opt-in OTP verification.
  - Hashed refresh token rotation and multi-device session management.
  - Role-Based Access Control (`Guest`, `FreeMember`, `ProMember`, `Admin`, `SUPER_ADMIN`).
  - Secure password reset flows.
- **Niche Micro-Tribes & Communities**:
  - Filterable community directory with topic tags and member counters.
  - Public tribes and Pro-exclusive micro-hubs.
  - Community member management and rules enforcement.
- **Discussion Feed & Nested Comments**:
  - Rich-text formatted posts with tag filtering and image previews.
  - Real-time upvoting, bookmarking, and multi-level hierarchical threaded comments.
- **Real-Time 1-to-1 Direct Messaging**:
  - Socket.IO persistent private messaging.
  - Live online presence tracking (`user:online` / `user:offline`), typing indicators, unread badge counters, attachments, and read receipts.
- **Multi-Channel Community Chat**:
  - Dedicated real-time chat channels per micro-tribe.
  - Membership authorization and live message broadcasting.
- **WebRTC Voice & Video Calling**:
  - Peer-to-peer audio and video calling signaling (`call:initiate`, `call:offer`, `call:answer`, `call:ice-candidate`, `call:end`).
  - In-app incoming call alerts, media device mute/toggle controls, and STUN/TURN support.
- **Project Match & Job Board**:
  - Co-founder & collaborator matchmaking with skill matching and role requirements.
  - Job board with application submission (resumes, cover letters) and applicant management.
- **Time Tracking & Timesheets**:
  - Live stopwatch timer with start, pause, resume, stop, and duration calculations.
  - Timesheet log management linked to projects, tasks, and date ranges.
- **Stripe Billing & Monetization**:
  - Stripe Hosted Checkout sessions and customer portal.
  - Webhook listener with HMAC signature verification and automatic Pro tier provisioning.
- **Admin & Analytics Command Center**:
  - Platform metrics, user moderation, role assignments, and aggregated performance statistics.

---

## 3. Project Structure

```
linkin/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # Prisma database schema & relations
│   ├── src/
│   │   ├── controllers/            # REST API controller handlers
│   │   ├── lib/                    # Prisma client & database connectors
│   │   ├── middlewares/            # Auth, RBAC, rate-limiting, error handlers
│   │   ├── models/                 # Data transformers & response builders
│   │   ├── routes/                 # Express route definitions
│   │   ├── services/               # Business logic & external service integrations
│   │   ├── socket/                 # Socket.IO handlers (chat, presence, WebRTC)
│   │   └── utils/                  # AppError, logger, helpers
│   ├── tests/                      # Jest test suites (29 suites, 198 tests)
│   ├── scripts/                    # Utility & environment generator scripts
│   ├── server.js                   # Application bootstrap & HTTP/Socket server
│   ├── docker-compose.production.yml
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI components & navigation
│   │   ├── context/                # AuthContext, PostContext, global state
│   │   ├── data/                   # Mock seeds & fallback definitions
│   │   ├── pages/                  # Page components & routed views
│   │   ├── services/               # Centralized API client & Socket.IO manager
│   │   ├── types/                  # TypeScript interfaces & types
│   │   ├── App.tsx                 # Route declarations & route guards
│   │   └── main.tsx                # Entry point
│   ├── .env.example
│   ├── vite.config.ts
│   └── package.json
├── README.md
└── .gitignore
```

---

## 4. Environment Variables

### Backend Configuration (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/nichelink` |
| `JWT_SECRET` | Secret key for signing access JWTs | Secure random string (min 32 chars) |
| `JWT_EXPIRES_IN` | Access token lifespan | `7d` |
| `APP_URL` | Base backend server URL | `http://localhost:5000` |
| `CORS_ORIGINS` | Allowed frontend origin URLs | `http://localhost:3000` |
| `REDIS_URL` | Redis instance connection string | `redis://localhost:6379` |
| `STRIPE_SECRET_KEY` | Stripe secret API key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `SMTP_HOST` / `SMTP_USER` | Outbound email credentials | Optional in dev (logs to console) |

### Frontend Configuration (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env` and configure:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend REST API endpoint URL | `http://localhost:5000/api` |
| `VITE_WEBRTC_STUN_URL` | STUN server for WebRTC signaling | `stun:stun.l.google.com:19302` |
| `VITE_WEBRTC_TURN_URL` | TURN server for NAT traversal | Optional |

---

## 5. Local Setup & Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or later
- **PostgreSQL**: Local instance or hosted PostgreSQL (e.g. Supabase, Neon)
- **Redis** *(Optional for local dev, rate limiter falls back to in-memory)*

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Generate Prisma client and apply committed migrations
npx prisma generate
npx prisma migrate deploy

# (Optional) Seed demo accounts
node seed_demo_users.js

# Start backend dev server (auto-reloads with nodemon)
npm run dev
```
The backend starts at `http://localhost:5000`.

### 3. Frontend Setup
```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend starts at `http://localhost:3000`.

---

## 6. Pre-Configured Demo Accounts

For rapid local testing, the following pre-configured accounts are available:
- **Pro Member Account**:
  - Email: `alex@nichelink.dev`
  - Password: `ProMember`
  - Tier: Pro Member (Full access to Pro micro-tribes, unlimited messaging, video calls)
- **Free Member Account**:
  - Email: `taylor@nichelink.dev`
  - Password: `FreeMember`
  - Tier: Free Member (Standard community access, upgrade prompt on Pro features)

---

## 7. Testing & Quality Assurance

```bash
# 1. Run all 29 backend test suites (198 tests)
cd backend
npm test

# 2. Run backend linter
npm run lint

# 3. Run frontend TypeScript compiler check
cd ../frontend
npm run lint

# 4. Run frontend production build
npm run build
```

---

## 8. Production Deployment

### Production Architecture
- **Frontend**: Vercel, rooted at `frontend`, build command `npm run build`, output `dist`.
- **Backend**: Render or Railway Node service, rooted at `backend`, start command `node server.js`.
- **Database**: Neon PostgreSQL using `DATABASE_URL` for runtime queries and `DIRECT_URL` for Prisma migrations.
- **Realtime**: Socket.IO is served by the backend URL; configure `VITE_API_URL` without a localhost value.
- **WebRTC**: HTTPS is required. Configure production TURN values in the frontend when cross-network calls need relay support.

Backend build command:
```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

Backend health check: `/health`

Required backend environment variable names:
`NODE_ENV`, `PORT`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `APP_URL`, and `CORS_ORIGINS`.
Configure SMTP, Cloudinary, Redis, and Stripe variables when those integrations are enabled.

Required frontend environment variable names:
`VITE_API_URL`, `VITE_WEBRTC_STUN_URL`, `VITE_WEBRTC_TURN_URL`, `VITE_WEBRTC_TURN_USERNAME`, and `VITE_WEBRTC_TURN_CREDENTIAL`.

For Stripe, configure the webhook URL as `<backend-url>/api/billing/webhook` and provide `STRIPE_WEBHOOK_SECRET`; use Stripe test mode until live payments are explicitly approved.

The optional `backend/docker-compose.production.yml` is a self-hosted stack and includes its own Postgres, Redis, and Coturn services. Do not use its local Postgres service when deploying the expected Neon architecture.

### Static Frontend Deployment
Build the optimized static assets:
```bash
cd frontend
npm run build
```
Deploy the resulting `dist/` directory to your static host (e.g., Vercel, Netlify, Cloudflare Pages, AWS S3/CloudFront).

---

## 9. License

This project is licensed under the ISC License.
