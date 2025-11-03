import { ChromaClient, CloudClient } from "chromadb";

let chromaClient: ChromaClient | null = null;
let connectionAttempted = false;
let connectionError: Error | null = null;

export function getChromaClient(): ChromaClient {
  if (!chromaClient && !connectionAttempted) {
    connectionAttempted = true;

    const chromaTenant = process.env.CHROMA_TENANT;
    const chromaDatabase = process.env.CHROMA_DATABASE;
    const chromaApiKey = process.env.CHROMA_API_KEY;
    const chromaUrl = process.env.CHROMA_URL;

    // If no configuration provided, disable ChromaDB
    if (!chromaApiKey && !chromaUrl) {
      connectionError = new Error(
        "ChromaDB not configured. Pixel extraction will continue but RAG context will be disabled."
      );
      console.warn(connectionError.message);
      throw connectionError;
    }

    try {
      // Use CloudClient if tenant/database/apiKey are provided (ChromaDB Cloud)
      if (chromaTenant && chromaDatabase && chromaApiKey) {
        chromaClient = new CloudClient({
          tenant: chromaTenant,
          database: chromaDatabase,
          apiKey: chromaApiKey,
        });
        console.log("✅ ChromaDB Cloud client initialized successfully");
      }
      // Otherwise use standard ChromaClient (self-hosted)
      else if (chromaUrl) {
        chromaClient = new ChromaClient({
          path: chromaUrl,
          auth: chromaApiKey
            ? { provider: "token", credentials: chromaApiKey }
            : undefined,
        });
        console.log("✅ ChromaDB client initialized successfully");
      } else {
        throw new Error(
          "ChromaDB configuration incomplete. Provide either (CHROMA_TENANT + CHROMA_DATABASE + CHROMA_API_KEY) for Cloud or CHROMA_URL for self-hosted."
        );
      }
    } catch (error) {
      connectionError =
        error instanceof Error
          ? error
          : new Error("Failed to initialize ChromaDB client");
      console.error("❌ ChromaDB initialization failed:", connectionError);
      throw connectionError;
    }
  }

  if (connectionError) {
    throw connectionError;
  }

  if (!chromaClient) {
    throw new Error("ChromaDB client not initialized");
  }

  return chromaClient;
}

export async function getOrCreatePixelCollection() {
  const client = getChromaClient();

  return await client.getOrCreateCollection({
    name: "pixels",
    metadata: {
      "hnsw:space": "cosine",
      "hnsw:construction_ef": 100,
      "hnsw:search_ef": 100,
    },
  });
}
