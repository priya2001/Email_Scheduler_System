# Email Scheduler Backend 🚀

Production-grade Node.js + TypeScript backend for the Email Scheduler system.

## 📋 Project Structure

```
src/
├── bullmq/
│   └── bullBoard.ts         # Bull Board dashboard setup
├── config/
│   └── environment.ts       # Environment variables & config
│   └── redis.ts             # Redis connection factory for BullMQ
├── controllers/
│   ├── emailController.ts   # Email CRUD handlers
│   └── healthController.ts  # Request handlers
├── middleware/
│   ├── errorHandler.ts      # Error handling middleware
│   └── logger.ts            # Request logging middleware
├── routes/
│   ├── emails.ts            # Email routes
│   └── health.ts            # Route definitions
├── services/
│   ├── emailService.ts      # Email database operations
│   ├── exampleService.ts    # Business logic & external APIs
│   └── senderService.ts     # Sender database operations
├── workers/
│   └── emailWorker.ts       # BullMQ worker entrypoint
├── utils/
│   └── logger.ts            # Logger utility
└── index.ts                 # Main application entry point
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- **PostgreSQL 12+** (for data storage)
- Redis (for job queue)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

**Important:** See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for complete PostgreSQL and Prisma setup instructions.

Quick setup:

```bash
# Create PostgreSQL database
createdb email_scheduler

# Update .env with database credentials
DATABASE_URL="postgresql://postgres:password@localhost:5432/email_scheduler?schema=public"

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
NODE_ENV=development
PORT=3001

# Database - PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/email_scheduler?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# SMTP (Ethereal Email)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_email@ethereal.email
SMTP_PASSWORD=your_password

# Features
MAX_EMAILS_PER_HOUR=100
MIN_DELAY_BETWEEN_EMAILS=2000
WORKER_CONCURRENCY=5
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3001`

### 5. Start the BullMQ Worker

```bash
npm run dev
```

The API server and BullMQ worker now run in the same process, so one command starts both.

### 6. Open Bull Board

The queue dashboard is available at:

```text
http://localhost:3001/admin/queues
```

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run type-check` | Run TypeScript type checking |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Create & run database migrations |
| `npm run prisma:studio` | Open Prisma Studio (GUI for database) |

## 🔌 API Endpoints

### Health Check

```bash
GET /health
GET /health/ready
```

### Email API

```bash
POST /api/emails
POST /api/emails/bulk
GET /api/emails
GET /api/emails/:id
PUT /api/emails/:id
DELETE /api/emails/:id
```

`scheduledTime` controls the BullMQ delay, so jobs run when the email is due.
For bulk sends, `delayBetweenEmails` and `hourlyLimit` control spacing between queued jobs.

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-04-21T10:30:00.000Z",
  "uptime": 120.5,
  "environment": "development"
}
```

## 🏗️ Architecture Overview

### Database Layer (Prisma ORM)

**Tables:**

**Senders** - Email accounts/senders
```
id (UUID) → Primary Key
email (String) → Unique, indexed
name (String)
createdAt (DateTime)
updatedAt (DateTime)
```

**Emails** - Scheduled and sent emails
```
id (UUID) → Primary Key
toEmail (String) → Recipient email
subject (String) → Email subject
body (Text) → Email body
scheduledTime (DateTime) → When to send
status (Enum) → PENDING | SENT | FAILED
senderId (UUID) → Foreign key to Senders
batchId (String) → Shared batch ID for bulk-created emails
sentAt (DateTime) → When email was sent
errorMessage (String) → Failure reason
createdAt (DateTime)
updatedAt (DateTime)
```

**Indexes for Performance:**
- `sender_id`, `scheduled_time`, `status`, `to_email`, `created_at`

**Controllers** → Request handlers, validate input, call services
```typescript
// controllers/healthController.ts
health(req: Request, res: Response) {
  // Handle request
}
```

**Services** → Business logic, external API calls
```typescript
// services/emailService.ts
async createEmail(data: CreateEmailInput) { ... }
async getScheduledEmails() { ... }
async markAsSent(id) { ... }

// services/senderService.ts
async createSender(data) { ... }
async getSenderById(id) { ... }
```

**Routes** → Map HTTP methods to controllers
```typescript
// routes/health.ts
router.get('/health', (req, res) => healthController.health(req, res))
```

**Middleware** → Cross-cutting concerns (logging, auth, error handling)
```typescript
// middleware/errorHandler.ts
app.use(errorHandler.handle)
```

**Utils** → Helper functions and utilities
```typescript
// utils/logger.ts
logger.info('message', data)
```

**Config** → Environment and application configuration
```typescript
// config/environment.ts
export const environment = { port, redis, ... }
```

### Error Handling

All errors are caught and formatted consistently:

```typescript
{
  "success": false,
  "error": {
    "status": 400,
    "message": "Invalid request"
  },
  "timestamp": "2024-04-21T10:30:00.000Z"
}
```

### Logging

Structured logging with levels:

```typescript
logger.debug('Debug message', data);    // Lowest priority
logger.info('Info message', data);
logger.warn('Warning message', data);
logger.error('Error message', error);   // Highest priority
```

## � Database & ORM

This project uses **Prisma ORM** with **PostgreSQL**:

- Type-safe database queries
- Automatic migrations
- Built-in query builder
- Real-time schema updates

### Basic Usage Examples

**Create a Sender:**
```typescript
import { senderService } from './services/senderService';

const sender = await senderService.createSender({
  email: 'support@company.com',
  name: 'Company Support'
});
```

**Schedule an Email:**
```typescript
import { emailService } from './services/emailService';

const email = await emailService.createEmail({
  toEmail: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thank you for signing up',
  scheduledTime: new Date('2024-04-22T10:00:00Z'),
  senderId: sender.id
});
```

**Get Scheduled Emails:**
```typescript
const pendingEmails = await emailService.getScheduledEmails(50);
```

**Mark Email as Sent:**
```typescript
await emailService.markAsSent(email.id);
```

**Get Statistics:**
```typescript
const stats = await emailService.getEmailStats();
// { total: 100, pending: 20, sent: 75, failed: 5 }
```

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed database setup instructions.



### Build for Production

```bash
npm run build
```

This generates `dist/` folder with compiled JavaScript.

### Run Production Build

```bash
npm start
```

### Docker Support

```bash
docker build -t email-scheduler-backend -f backend/Dockerfile backend
docker run -p 3001:3001 --env-file backend/.env email-scheduler-backend
```

For backend Docker, point the service to `backend/` as the Docker build context and set the required environment variables there. The container listens on `PORT` and starts the API server plus BullMQ worker in one process. The image uses `node:20-bullseye-slim` so Prisma can load the expected OpenSSL 1.1 engine in production containers.

## 📝 Best Practices Implemented

✅ **Modular Architecture** - Separation of concerns
✅ **TypeScript** - Strong typing and type safety
✅ **Environment Config** - 12-factor app compliant
✅ **Error Handling** - Centralized error middleware
✅ **Logging** - Structured logging with levels
✅ **CORS** - Cross-origin support configured
✅ **Graceful Shutdown** - SIGTERM/SIGINT handlers
✅ **Clean Code** - Well-organized, documented code
✅ **Async/Await** - Modern async patterns

## 🔒 Security Considerations

- [ ] Use strong database password
- [ ] Enable SSL for database connections
- [ ] Add rate limiting middleware
- [ ] Add request validation (joi, zod)
- [ ] Add JWT authentication
- [ ] Add HTTPS in production
- [ ] Add helmet for security headers
- [ ] Add input sanitization
- [ ] Use environment secrets manager

## 📚 Next Steps

1. ✅ **Database Setup** - PostgreSQL + Prisma configured
2. ✅ **Email & Sender Models** - Prisma schema ready
3. ✅ **CRUD Services** - emailService & senderService
4. **API Endpoints** - Build routes for scheduling emails
5. **BullMQ Integration** - Connect job queue
6. **SMTP Configuration** - Setup email sending
7. **Rate Limiting** - Implement hourly limits
8. **Authentication** - Add Google OAuth
9. **Worker Setup** - Create job processor

## 📖 Project Structure Explanation

```
Email Scheduler Backend
│
├── src/index.ts
│   └── Main Express app setup
│
├── src/config/environment.ts
│   └── Centralized config from .env file
│
├── src/middleware/
│   ├── errorHandler.ts → Catches & formats errors
│   └── logger.ts → Logs all requests
│
├── src/routes/
│   └── health.ts → Define API endpoints
│
├── src/controllers/
│   └── healthController.ts → Handle requests
│
├── src/services/
│   └── exampleService.ts → Business logic
│
└── src/utils/
    └── logger.ts → Helper utilities
```

## 🤝 Contributing

1. Keep code modular and reusable
2. Use TypeScript strict mode
3. Add proper error handling
4. Document public methods
5. Follow the established folder structure

## 📄 License

MIT
