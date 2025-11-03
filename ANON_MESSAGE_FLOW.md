## Anonymous Message → Data Flow (High-Level)

This document describes the data flow when an anonymous user starts a new chat and sends their first message.

### Mermaid Diagram

```mermaid
sequenceDiagram
    autonumber
    actor U as Anonymous User
    participant B as Browser (App Router UI)
    participant A as Next.js Server (API / Server Actions)
    participant DB as Postgres (Supabase)
    participant V as Vercel AI Gateway
    participant O as OpenAI (GPT‑5)
    participant C as ChromaDB (Cloud)

    U->>B: Open app, start chat
    B->>A: POST /api/chat (message, selectedModelId, session cookie)
    Note right of A: If no session, create guest user/session
    A->>DB: Upsert User (guest) + Chat row
    A->>V: Stream completion (model = openai/gpt-5)
    V->>O: Proxy request with OPENAI_API_KEY
    O-->>V: Token stream
    V-->>A: Streamed chunks
    A-->>B: Server-sent stream (UI renders tokens)
    A->>DB: Insert Message rows (user + assistant)
    par Non-blocking Pixel Interpreter
      A->>V: Structured output call (model = openai/gpt-5-thinking)
      V->>O: Proxy request
      O-->>V: Pixel objects (structured)
      V-->>A: Parsed JSON
      A->>C: Upsert embeddings + docs (generateEmbedding → OpenAI)
      A->>DB: Insert Pixel + PixelHistory
    and Insights/Scoring (background)
      A->>V: Follow-up analysis (GPT‑5)
      V->>O: Proxy
      O-->>V: Suggestions/insights
      V-->>A: Structured guidance
      A->>DB: Store suggestion/insight
    end
    B->>A: GET /api/history
    A->>DB: Query recent messages/pixels
    A-->>B: Render full conversation + belief context
```

### Key Notes

- Anonymous sessions use a guest account; credentials are not required.
- Primary chat model: `openai/gpt-5`. Reasoning path uses `openai/gpt-5-thinking`.
- Embeddings use OpenAI embeddings and are written to ChromaDB for RAG.
- Database holds durable state: `User`, `Chat`, `Message`, `Pixel`, `PixelHistory`.
- Vector store (ChromaDB) enables retrieval of relevant beliefs in later turns.
- All LLM calls route via Vercel AI Gateway using your `OPENAI_API_KEY`.
