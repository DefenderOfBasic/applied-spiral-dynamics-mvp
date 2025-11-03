# Setup Guide - Spiral Dynamics MVP

Complete setup instructions for local development, testing, and production deployment.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Setup Options](#setup-options)
  - [Automated Setup](#automated-setup-recommended)
  - [Manual Setup](#manual-setup)
- [Optional Services](#optional-services)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

**TL;DR for experienced developers:**

```bash
# Clone and setup
git clone <repo-url>
cd applied-spiral-dynamics-mvp
./scripts/setup-dev.sh

# Add your credentials to .env.local
# POSTGRES_URL and OPENAI_API_KEY

# Seed dev data and start
pnpm db:seed
pnpm dev
```

Login at http://localhost:3000 with `dev@example.com` / `password`

---

## Prerequisites

Before you begin, ensure you have:

### Required

- **Node.js 18+** - [Download](https://nodejs.org/)
- **pnpm 9+** - Install: `npm install -g pnpm`
- **PostgreSQL Database** - See [Database Setup](#database-setup) below
- **OpenAI API Key** - [Get from OpenAI](https://platform.openai.com/api-keys)

### Optional

- **ChromaDB** - For RAG context retrieval (system works without it)
- **Redis/Upstash** - For distributed cache (required for production multi-instance)
- **Docker** - If running ChromaDB locally

### Check Your Versions

```bash
node -v    # Should be v18.0.0 or higher
pnpm -v    # Should be 9.0.0 or higher
```

---

## Environment Variables

All environment variables are documented in `env.example`. Here's a quick reference:

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `POSTGRES_URL` | PostgreSQL connection string | [Vercel](https://vercel.com/storage/postgres), [Neon](https://neon.tech/), [Supabase](https://supabase.com/) |
| `OPENAI_API_KEY` | OpenAI API key for LLMs & embeddings | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `AUTH_SECRET` | Session encryption secret | Generate: `openssl rand -base64 32` |

### Optional Variables

| Variable | Description | Default Behavior |
|----------|-------------|------------------|
| `CHROMA_URL` | ChromaDB server URL | System works without RAG context |
| `CHROMA_API_KEY` | ChromaDB authentication | None (if ChromaDB requires auth) |
| `REDIS_URL` | Redis connection string | Uses in-memory cache (dev only) |

### Auto-Populated Variables

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Environment mode (development/production/test) |
| `VERCEL` | Set by Vercel deployment |
| `VERCEL_URL` | Your Vercel deployment URL |

---

## Setup Options

### Automated Setup (Recommended)

The setup script handles most configuration automatically:

```bash
# Make script executable (first time only)
chmod +x scripts/setup-dev.sh

# Run setup
./scripts/setup-dev.sh
```

**What the script does:**

1. ✅ Checks Node.js and pnpm versions
2. ✅ Installs dependencies via `pnpm install`
3. ✅ Creates `.env.local` from `env.example`
4. ✅ Generates `AUTH_SECRET` automatically
5. ✅ Runs database migrations (if POSTGRES_URL is set)
6. ⚠️ Prompts you to add missing credentials

**After the script completes:**

1. Edit `.env.local` and add your credentials:
   ```bash
   POSTGRES_URL=postgresql://...
   OPENAI_API_KEY=sk-proj-...
   ```

2. Run migrations if you skipped them:
   ```bash
   pnpm db:migrate
   ```

3. Seed development data (optional but recommended):
   ```bash
   pnpm db:seed
   ```

4. Start development server:
   ```bash
   pnpm dev
   ```

---

### Manual Setup

For more control over the setup process:

#### 1. Clone and Install

```bash
git clone <repo-url>
cd applied-spiral-dynamics-mvp
pnpm install
```

#### 2. Database Setup

Choose one of these options:

**Option A: Vercel Postgres (Recommended for quick start)**

1. Go to [Vercel Storage](https://vercel.com/storage/postgres)
2. Create a new Postgres database
3. Copy the connection string

**Option B: Neon (Serverless PostgreSQL)**

1. Sign up at [Neon](https://neon.tech/)
2. Create a new project
3. Copy the connection string

**Option C: Supabase (Full-featured)**

1. Sign up at [Supabase](https://supabase.com/)
2. Create a new project
3. Get connection string from Project Settings → Database

**Option D: Local PostgreSQL**

```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql

# Create database
createdb spiral_dynamics

# Connection string format:
# postgresql://user:password@localhost:5432/spiral_dynamics
```

#### 3. Configure Environment

```bash
# Copy template
cp env.example .env.local

# Generate AUTH_SECRET
openssl rand -base64 32
```

Edit `.env.local`:

```bash
# Required
POSTGRES_URL=postgresql://user:password@host:5432/dbname
OPENAI_API_KEY=sk-proj-your-key-here
AUTH_SECRET=your-generated-secret-here

# Optional (uncomment to enable)
# CHROMA_URL=http://localhost:8000
# CHROMA_API_KEY=
# REDIS_URL=redis://localhost:6379
```

#### 4. Run Database Migrations

```bash
pnpm db:migrate
```

This creates all necessary tables and indexes.

#### 5. Seed Development Data (Optional)

```bash
pnpm db:seed
```

This creates:
- Dev user: `dev@example.com` / `password`
- Sample chat with 5 pre-scored pixels across Spiral stages
- Example data to explore features immediately

#### 6. Start Development Server

```bash
pnpm dev
```

Open http://localhost:3000 and start chatting!

---

## Optional Services

### ChromaDB (RAG Context)

ChromaDB enables retrieval of relevant beliefs from your history during conversations.

**Without ChromaDB:** System works fine, but won't retrieve past pixels for context.

**Setup Options:**

**Option 1: Docker (Easiest)**

```bash
docker run -d -p 8000:8000 chromadb/chroma

# Add to .env.local
CHROMA_URL=http://localhost:8000
```

**Option 2: Cloud (Production)**

Use hosted ChromaDB or similar vector database. Add credentials to `.env.local`.

### Redis (Distributed Cache)

Redis is required for production deployments with multiple instances.

**Without Redis:** System uses in-memory cache (fine for single-instance dev/prod).

**Setup Options:**

**Option 1: Upstash (Recommended for Vercel)**

1. Sign up at [Upstash](https://upstash.com/)
2. Create a Redis database
3. Copy the connection string
4. Add to `.env.local`:
   ```bash
   REDIS_URL=redis://...
   ```

**Option 2: Local Redis**

```bash
# Install Redis
# macOS: brew install redis
# Ubuntu: sudo apt install redis-server

# Start Redis
redis-server

# Add to .env.local
REDIS_URL=redis://localhost:6379
```

---

## Development Workflow

### Available Commands

```bash
# Development
pnpm dev              # Start dev server with hot reload
pnpm build            # Production build (runs migrations first)
pnpm start            # Start production server
pnpm lint             # Check code quality (Ultracite)
pnpm format           # Auto-fix formatting

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed development data
pnpm db:studio        # Open Drizzle Studio (visual DB GUI)
pnpm db:generate      # Generate migration from schema changes
pnpm db:push          # Push schema changes directly (dev only)

# Testing
pnpm test             # Run Playwright e2e tests
pnpm test:unit        # Run Vitest unit tests
pnpm test:unit:watch  # Run unit tests in watch mode
```

### Making Schema Changes

1. Edit `lib/db/schema.ts`
2. Generate migration:
   ```bash
   pnpm db:generate
   ```
3. Review generated SQL in `lib/db/migrations/`
4. Apply migration:
   ```bash
   pnpm db:migrate
   ```

### Visual Database Inspection

```bash
pnpm db:studio
```

Opens Drizzle Studio at http://localhost:4983 for visual database browsing and editing.

---

## Testing

### End-to-End Tests (Playwright)

```bash
# Run all e2e tests
pnpm test

# Run specific test file
pnpm exec playwright test tests/e2e/chat.test.ts

# Run with UI
pnpm exec playwright test --ui

# Debug mode
pnpm exec playwright test --debug
```

**Test Coverage:**
- Authentication flows
- Chat functionality
- Pixel extraction
- Artifact creation
- RAG retrieval

### Unit Tests (Vitest)

```bash
# Run once
pnpm test:unit

# Watch mode
pnpm test:unit:watch
```

**Test Coverage:**
- AI model selection
- Entitlement checks
- Pixel lifecycle
- Helper functions

---

## Production Deployment

### Vercel (Recommended)

1. **Connect Repository:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your Git repository

2. **Configure Environment Variables:**
   
   Add to Vercel project settings:
   ```bash
   POSTGRES_URL=postgresql://...      # Required
   OPENAI_API_KEY=sk-proj-...        # Required
   AUTH_SECRET=your-secret-here      # Required (generate new one)
   REDIS_URL=redis://...             # Required for multi-instance
   CHROMA_URL=http://...             # Optional
   CHROMA_API_KEY=...                # Optional
   ```

3. **Deploy:**
   - Push to main branch (auto-deploys)
   - Or click "Deploy" in Vercel dashboard

**Important Production Settings:**

- ✅ Always set `REDIS_URL` (in-memory cache doesn't work serverless)
- ✅ Use production database (not dev/test database)
- ✅ Generate new `AUTH_SECRET` (don't reuse dev secret)
- ✅ Enable automatic deployments from main branch

### Self-Hosted

```bash
# Build
pnpm build

# Start
NODE_ENV=production pnpm start
```

**Requirements:**
- Node.js 18+ server
- PostgreSQL accessible from server
- Set all required environment variables
- Redis/Upstash for multi-instance (or single-instance is fine)

### Environment Checklist

Before deploying to production:

- [ ] `POSTGRES_URL` set to production database
- [ ] `OPENAI_API_KEY` set with sufficient credits
- [ ] `AUTH_SECRET` generated and kept secure
- [ ] `REDIS_URL` set (if multi-instance)
- [ ] `NODE_ENV=production` (usually auto-set)
- [ ] Database migrations run
- [ ] ChromaDB configured (optional)
- [ ] Test deployment with health check: `/api/health`

---

## Troubleshooting

### "POSTGRES_URL is not defined"

**Cause:** Environment variable not set or `.env.local` not loaded.

**Fix:**
```bash
# Check if .env.local exists
ls -la .env.local

# If not, create it
cp env.example .env.local

# Add your POSTGRES_URL
```

### "ChromaDB initialization failed"

**Cause:** ChromaDB not running or URL incorrect.

**Fix:**
- ChromaDB is **optional** - system works without it
- To use ChromaDB:
  ```bash
  docker run -p 8000:8000 chromadb/chroma
  ```
- Or comment out `CHROMA_URL` in `.env.local`

### "Using in-memory cache" warning

**Cause:** `REDIS_URL` not set.

**Fix:**
- In **development**: This is fine (single instance)
- In **production**: Set `REDIS_URL` for multi-instance deployments

### "Migration failed"

**Cause:** Database connection issue or existing data conflict.

**Fix:**
```bash
# Check connection
psql "$POSTGRES_URL" -c "SELECT version();"

# View migration status
pnpm db:studio

# Reset database (⚠️ destroys data)
# Drop all tables, then:
pnpm db:migrate
```

### Pixel extraction seems slow

**Not a bug!** Pixel extraction happens asynchronously in the background. You'll see responses instantly (~2-3s), and pixels appear in your profile after analysis completes.

### Rate limit errors

**Cause:** OpenAI rate limits hit during testing.

**Fix:**
- Interpreter calls limited to 20/minute/user (by design)
- Check OpenAI usage dashboard
- Upgrade OpenAI plan if needed

### Port 3000 already in use

**Fix:**
```bash
# Use different port
PORT=3001 pnpm dev

# Or kill process on 3000
lsof -ti:3000 | xargs kill
```

### Tests failing

**Common issues:**

1. **Database not set:**
   ```bash
   export POSTGRES_URL=postgresql://...
   pnpm test
   ```

2. **Server not starting:**
   - Check port 3000 is free
   - Ensure all required env vars are set

3. **Test-specific env vars:**
   Tests automatically set `PLAYWRIGHT=True` for test detection

---

## Health Checks

### Development Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "...",
  "checks": {
    "database": "healthy",
    "openai": "healthy",
    "chroma": "not_configured",
    "redis": "not_configured"
  }
}
```

### Production Health Check

```bash
curl https://your-app.vercel.app/api/ready
```

**Expected response:**
```json
{
  "status": "ready",
  "checks": { ... }
}
```

---

## Getting Help

- **Documentation:** See `README.md` for feature overview
- **Architecture:** See `DATAFLOW.md` for system design
- **Environment Variables:** See `env.example` for all options
- **Issues:** Check GitHub issues or create a new one

---

## Quick Reference Card

```bash
# Setup (first time)
./scripts/setup-dev.sh      # Automated setup
pnpm db:seed                # Create dev data
pnpm dev                    # Start dev server

# Daily workflow
pnpm dev                    # Start dev
pnpm db:studio              # View database
pnpm test                   # Run tests
pnpm lint                   # Check code

# Database
pnpm db:migrate             # Run migrations
pnpm db:generate            # Create migration
pnpm db:seed                # Seed dev data

# Testing
pnpm test                   # E2E tests
pnpm test:unit              # Unit tests

# Production
pnpm build                  # Build for prod
pnpm start                  # Run prod server
```

---

**Happy coding! 🚀**

