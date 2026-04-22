# Email Scheduler System

Email Scheduler System is a full-stack application for composing, scheduling, and delivering emails with bulk recipient support, attachment handling, and BullMQ-backed job processing.

## Overview

The project is split into two applications:

- `backend`: Node.js, TypeScript, Express, Prisma, Supabase Auth, PostgreSQL, Redis, BullMQ, and Nodemailer
- `frontend`: Next.js App Router application for authentication, dashboard, and compose flows

The backend API and BullMQ worker run in the same process.

## Features

- Email authentication with Supabase
- Email scheduling and bulk send pacing
- CSV recipient upload
- File attachments stored in Supabase Storage
- BullMQ job processing with scheduled execution
- Bull Board dashboard for queue inspection
- Render-ready deployment setup

## Repository Structure

```text
backend/   Express API, Prisma schema, BullMQ worker, and deployment config
frontend/  Next.js UI, auth screens, dashboard, and compose experience
```

## Local Setup

### Backend

1. Install dependencies.

```bash
cd backend
npm install
```

2. Create `backend/.env` with the required values.

```env
NODE_ENV=development
PORT=3001

DATABASE_URL=postgresql://postgres:password@localhost:5432/email_scheduler?schema=public

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_email@ethereal.email
SMTP_PASSWORD=your_password

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=email-attachments

BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

MAX_EMAILS_PER_HOUR=100
MIN_DELAY_BETWEEN_EMAILS=2000
WORKER_CONCURRENCY=5
LOG_LEVEL=info
```

3. Generate Prisma client and apply migrations.

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start the backend.

```bash
npm run dev
```

### Frontend

1. Install dependencies.

```bash
cd frontend
npm install
```

2. Create `frontend/.env.local`.

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

3. Start the frontend.

```bash
npm run dev
```

## Available Scripts

### Backend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API server and BullMQ worker in development |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled backend |
| `npm run type-check` | Run TypeScript checks without emitting files |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Create and apply a Prisma migration |
| `npm run prisma:studio` | Open Prisma Studio |

### Frontend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the frontend for production |
| `npm start` | Run the compiled production frontend |

## Environment Variables

### Backend

Required:

- `DATABASE_URL`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Optional:

- `NODE_ENV`
- `PORT`
- `BACKEND_URL`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_DB`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `MAX_EMAILS_PER_HOUR`
- `MIN_DELAY_BETWEEN_EMAILS`
- `WORKER_CONCURRENCY`
- `LOG_LEVEL`

### Frontend

Required:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## API Endpoints

### Health

- `GET /health`
- `GET /health/ready`

### Authentication

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/session`
- `POST /api/auth/logout`

### Emails

- `POST /api/emails`
- `POST /api/emails/bulk`
- `GET /api/emails`
- `GET /api/emails/:id`
- `PUT /api/emails/:id`
- `DELETE /api/emails/:id`

### Bull Board

- `GET /admin/queues`

## Runtime Behavior

- Authentication uses Supabase session cookies on the backend.
- Email rows are created first, then queued in BullMQ.
- `scheduledTime` determines when a queued email is processed.
- Bulk sends support `delayBetweenEmails` and `hourlyLimit` pacing.
- Attachments are stored in Supabase Storage and linked to each email record.

## Deployment Notes

- The backend is Docker-ready and designed to run as a single process on Render.
- The frontend is a Next.js web app and can be deployed on Render or Vercel.
- For the cleanest browser cookie behavior, keep the browser-facing API on the same origin as the frontend when possible.
- Use Supabase direct database connection strings appropriate for your hosted environment.

## Common Issues

- If login returns `401`, verify that the browser has the backend auth cookies.
- If attachment uploads fail, verify that the Supabase storage bucket exists and that the service role key is valid.
- If jobs are not processed, verify that Redis is reachable and the backend process is running.

