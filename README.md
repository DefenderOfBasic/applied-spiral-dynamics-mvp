# Spiral Dynamics MVP

**A developmental companion that tracks your beliefs and helps you evolve through Spiral Dynamics stages.**

Deployed at: https://applied-spiral-dynamics-mvp.vercel.app/

## What It Does

This isn't your standard chatbot. It's a developmental companion that:

- **Extracts "pixels"** (belief statements) from your conversations automatically
- **Scores them** across 10 Spiral Dynamics stages (Beige → Teal)
- **Provides context-aware coaching** based on your belief history
- **Runs fast** (~2-3s responses) via streaming parallel architecture
- **Tracks evolution** as your beliefs shift and transcend stages

See [DATAFLOW.md](./DATAFLOW.md) for the full technical architecture.

## Links

- **Forked from:** https://github.com/vercel/ai-chatbot
- **Main research repo:** https://github.com/mettafive/applied-spiral-dynamics
- **Vercel project:** https://vercel.com/defenders-projects/applied-spiral-dynamics-mvp/Hve5iA2eWUoppH8q25sBAe1NZwPi

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm 9+
- PostgreSQL (get free tier from Vercel, Neon, or Supabase)
- OpenAI API key
- (Optional) ChromaDB for RAG - system works without it

### Setup

#### Option 1: Automated Setup (Recommended)

Use our setup script that handles everything:

```bash
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

This script will:

- ✅ Check Node.js and pnpm versions
- ✅ Install dependencies
- ✅ Create `.env.local` from template
- ✅ Generate `AUTH_SECRET` automatically
- ✅ Run database migrations
- ⚠️ Prompt you to add `POSTGRES_URL` and `OPENAI_API_KEY`

After the script completes, edit `.env.local` with your database and API key, then:

```bash
pnpm db:seed  # Optional: Create dev user and sample pixels
pnpm dev      # Start development server
```

Open http://localhost:3000 and login with:

- Email: `dev@example.com`
- Password: `password`

---

#### Option 2: Manual Setup

1. **Clone and install:**

```bash
git clone <your-repo>
cd applied-spiral-dynamics-mvp
pnpm install
```

2. **Set up environment:**

```bash
cp env.example .env.local
```

Edit `.env.local` with your keys:

```bash
# REQUIRED
POSTGRES_URL=postgresql://...        # Get from Vercel/Neon/Supabase
OPENAI_API_KEY=sk-proj-...          # Get from OpenAI
AUTH_SECRET=$(openssl rand -base64 32)  # Generate automatically

# OPTIONAL (recommended for production)
CHROMA_URL=http://localhost:8000    # For RAG context
REDIS_URL=redis://...               # For distributed cache
```

3. **Run migrations:**

```bash
pnpm db:migrate
```

4. **Seed development data (optional but recommended):**

```bash
pnpm db:seed
```

This creates:

- Dev user: `dev@example.com` / `password`
- Sample chat with 5 pre-scored pixels across different Spiral stages
- Test data to explore pixel extraction immediately

5. **Start dev server:**

```bash
pnpm dev
```

Open http://localhost:3000 and start chatting!

## How It Works (The Cool Part)

### Streaming Parallel Chain Architecture

**Fast Path (2-3s):**

1. You send a message
2. System retrieves relevant beliefs from your history (RAG)
3. Main LLM responds with enriched context
4. You see the response streaming in real-time

**Parallel Path (non-blocking):**

- While you're reading the response, an Interpreter LLM extracts any belief statements ("pixels")
- Scores them across Spiral Dynamics stages
- Saves to database and vector store

**Background (after response):**

- Insight Model analyzes the conversation + your belief landscape
- Generates developmental guidance for the _next_ turn
- Adjusts pixel confidence scores
- Archives transcended beliefs

You get fast responses, but the system is doing sophisticated developmental analysis in the background.

## Key Features

### Pixel Extraction

The system automatically identifies belief statements like:

- "I believe X"
- "People should Y"
- "Success requires Z"

And skips non-beliefs like questions, facts, or observations.

### Spiral Dynamics Scoring

Each pixel gets scored -1 to 1 across 10 stages:

- **Beige** - Survival instinct
- **Purple** - Tribal belonging
- **Red** - Power and ego
- **Blue** - Order and rules
- **Orange** - Achievement and success
- **Green** - Equality and empathy
- **Yellow** - Systemic thinking
- **Turquoise** - Holistic experience
- **Coral** - Radical authenticity
- **Teal** - Deep practice

### Developmental Coaching

The system provides guidance based on:

- Which stages you're currently in
- Contradictions in your beliefs
- Signs of stage transition
- What limitations might be visible

It doesn't push you to higher stages - it helps you see where your current stage isn't working, so the next stage emerges naturally.

## Development

```bash
pnpm dev          # Start dev server with hot reload
pnpm build        # Production build (runs migrations first)
pnpm start        # Start production server
pnpm test         # Run Playwright tests
pnpm lint         # Check code quality (Ultracite)
pnpm format       # Auto-fix formatting
pnpm db:studio    # Open Drizzle Studio (visual DB)
pnpm db:migrate   # Run migrations manually
```

## Environment Variables

**Required:**

- `POSTGRES_URL` - Your database connection string
- `OPENAI_API_KEY` - For LLM and embeddings
- `AUTH_SECRET` - For NextAuth (generate with openssl)

**Optional (but recommended for production):**

- `CHROMA_URL` - ChromaDB server for RAG context
- `CHROMA_API_KEY` - ChromaDB authentication
- `REDIS_URL` - For distributed caching (multi-instance)

See `env.example` for details.

## Deployment

### Vercel (Easiest)

1. Connect repo to Vercel
2. Add environment variables in dashboard
3. Deploy (auto-deploys on push to main)

**Important:** Set `REDIS_URL` for production - in-memory cache doesn't work with serverless.

### Self-Hosted

```bash
pnpm build
pnpm start
```

Make sure PostgreSQL (and optionally ChromaDB/Redis) are accessible.

## Troubleshooting

**"POSTGRES_URL is not defined"**
→ Copy `env.example` to `.env.local` and add your database URL

**"ChromaDB initialization failed"**
→ ChromaDB is optional. System works without it (no RAG context).

**"Using in-memory cache" warning**
→ Normal for development. Set `REDIS_URL` for production.

**Pixel extraction seems slow**
→ It's async in background - doesn't block your chat experience

**Rate limit warnings**
→ Normal during testing. Limits are 20 interpreter calls/minute/user.

## Architecture Notes

- **PostgreSQL** - Stores chats, messages, pixels, pixel history
- **ChromaDB** - Vector store for RAG retrieval (optional)
- **Redis** - Distributed cache for guidance (optional, prod-only)
- **OpenAI** - LLMs (main, interpreter, insight) + embeddings
- **Next.js 15** - App router, server actions, streaming
- **Vercel AI SDK** - For streaming and structured output
- **Drizzle ORM** - Type-safe database operations

## Testing

Run the test suite:

```bash
pnpm test
```

Tests cover:

- Chat functionality (e2e)
- Pixel extraction (unit + integration)
- RAG retrieval (integration)
- Document operations (routes)

## Contributing

1. Branch from main
2. Make your changes
3. Run `pnpm lint` and `pnpm test`
4. Submit PR with clear description

We enforce strict linting (Ultracite) - see [workspace rules](.cursorrules) for details.

## What's Next

Current TODOs:

- [ ] 3D pixel visualization (Three.js belief map)
- [ ] Pixel families (tracking related beliefs)
- [ ] Export/import pixel history
- [ ] Comparative analysis (track developmental trajectory)
- [ ] Multi-modal input (voice, images)

See issues for detailed roadmap.

## License

MIT - See LICENSE file
