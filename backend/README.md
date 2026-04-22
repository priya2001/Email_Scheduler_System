# Email Scheduler Backend

Backend service for the Email Scheduler system. It is built with Node.js, TypeScript, Express, Prisma, Supabase Auth, PostgreSQL, Redis, BullMQ, and Nodemailer.

## Overview

This service handles:

- Authentication through Supabase
- Email creation, bulk scheduling, and status updates
- BullMQ job processing for scheduled emails
- Attachment storage and delivery
- Health checks and Bull Board access

The API server and BullMQ worker run in the same process.

## Project Structure

```text
src/
├── bullmq/            Bull Board setup
├── config/            Environment, database, and Redis config
├── controllers/       Route handlers
├── lib/               Supabase, mailer, and storage helpers
├── middleware/        Auth, logging, and error handling
├── queues/            BullMQ queue configuration
├── routes/            Express route definitions
├── services/          Database and business logic
├── utils/             Shared utilities
├── workers/           BullMQ worker implementation
└── index.ts           Application entry point
```

## Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL
- Redis
- Supabase project
- SMTP credentials

## Local Setup

1. Install dependencies.

```bash
cd backend
npm install
```

2. Create a `.env` file in `backend/` with the required values.

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

3. Generate the Prisma client and run migrations.

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start the service.

```bash
npm run dev
```

The server starts on `http://localhost:3001`.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API server and BullMQ worker in development |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run type-check` | Run TypeScript checks without emitting files |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Create and apply a Prisma migration |
| `npm run prisma:studio` | Open Prisma Studio |

## Environment Variables

### Required

- `DATABASE_URL`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Optional

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
- Email jobs are queued in BullMQ when email rows are created.
- `scheduledTime` controls when a queued email runs.
- Bulk requests support `delayBetweenEmails` and `hourlyLimit` for pacing.
- Attachment files are uploaded to Supabase Storage and stored as email attachment records.

## Database Models

### Sender

- `id`
- `email`
- `name`
- `createdAt`
- `updatedAt`

### Email

- `id`
- `toEmail`
- `subject`
- `body`
- `scheduledTime`
- `status`
- `senderId`
- `batchId`
- `sentAt`
- `errorMessage`
- `createdAt`
- `updatedAt`

### Attachment

- `id`
- `emailId`
- `filename`
- `mimeType`
- `size`
- `storageBucket`
- `storagePath`
- `publicUrl`
- `createdAt`
- `updatedAt`

## Deployment Notes

- The backend is Docker-ready and intended to run as a single process on Render or similar platforms.
- Set `BACKEND_URL`, `FRONTEND_URL`, and `CORS_ORIGINS` to your deployed URLs.
- If you want the backend to create the attachment bucket automatically, provide `SUPABASE_SERVICE_ROLE_KEY`.
- For Supabase direct database access on hosted platforms, use the connection string recommended for your deployment environment.

## Common Issues

- If `GET /api/auth/session` returns `401`, verify that the browser has the backend auth cookies.
- If attachment uploads fail with a bucket error, confirm that the storage bucket exists or that `SUPABASE_SERVICE_ROLE_KEY` is set.
- If BullMQ jobs are not processed, ensure Redis is reachable and the service is running.

