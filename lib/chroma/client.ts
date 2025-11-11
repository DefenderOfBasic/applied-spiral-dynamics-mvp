import type { EmbeddingFunction } from "chromadb";
import { ChromaClient, CloudClient } from "chromadb";
import { myProvider } from "@/lib/ai/providers";

// Custom embedding function that uses Vercel AI Gateway
class AIGatewayEmbeddingFunction implements EmbeddingFunction {
  async generate(texts: string[]): Promise<number[][]> {
    const embeddingModel = myProvider.textEmbeddingModel("embedding-model");
    const { embeddings } = await embeddingModel.doEmbed({
      values: texts,
    });
    return embeddings;
  }
}

const embeddingFunction = new AIGatewayEmbeddingFunction();

let chromaClient: ChromaClient | null = null;
let connectionAttempted = false;
let connectionError: Error | null = null;

export function getChromaClient(): ChromaClient {
  if (!chromaClient && !connectionAttempted) {
    connectionAttempted = true;

    const chromaTenant = process.env.CHROMA_TENANT;
    const chromaDatabase = process.env.CHROMA_DATABASE;
    const chromaApiKey = process.env.CHROMA_API_KEY;

    console.log({  chromaTenant,chromaDatabase,chromaApiKey })

    try {
        chromaClient = new CloudClient({
          tenant: chromaTenant,
          database: chromaDatabase,
          apiKey: chromaApiKey,
        });
        console.log("✅ ChromaDB Cloud client initialized successfully");
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

export async function getOrCreatePixelCollectionForUser(userId: string) {
  const client = getChromaClient();

  return await client.getOrCreateCollection({
    name: `pixels-${userId}`,
    embeddingFunction,
    metadata: {
      "hnsw:space": "cosine",
      "hnsw:construction_ef": 100,
      "hnsw:search_ef": 100,
    },
  });
}

export async function getAllPixelsForUser(userId: string) {
  try {
    const collection = await getOrCreatePixelCollectionForUser(userId);
    
    // Get all documents from the collection including embeddings
    // This returns: { ids, embeddings, documents, metadatas }
    const results = await collection.get({
      include: ["embeddings", "documents", "metadatas"],
    });
    
    return results;
  } catch (error) {
    console.error("ChromaDB error in getAllPixelsForUser:", error);
    // Check if it's a ChromaDB permission error
    if (error instanceof Error && error.message.includes("permission")) {
      throw new Error(
        "ChromaDB permission error: Please check your CHROMA_API_KEY, CHROMA_TENANT, and CHROMA_DATABASE environment variables."
      );
    }
    throw error;
  }
}

export async function storePixel({
  userId,
  documentText,
  metadata,
  documentId,
}: {
  userId: string;
  documentText: string;
  metadata: Record<string, string | number | boolean>;
  documentId: string;
}) {
  // Generate embedding using AI SDK
  const embeddingModel = myProvider.textEmbeddingModel("embedding-model");
  const { embeddings } = await embeddingModel.doEmbed({
    values: [documentText],
  });
  const embedding = embeddings[0];

  // Get user's collection
  const collection = await getOrCreatePixelCollectionForUser(userId);

  // Add document with embedding
  await collection.add({
    ids: [documentId],
    embeddings: [embedding],
    documents: [documentText],
    metadatas: [metadata],
  });
}

export async function deletePixel({
  userId,
  pixelId,
}: {
  userId: string;
  pixelId: string;
}) {
  try {
    const collection = await getOrCreatePixelCollectionForUser(userId);
    await collection.delete({
      ids: [pixelId],
    });
  } catch (error) {
    console.error("ChromaDB error in deletePixel:", error);
    if (error instanceof Error && error.message.includes("permission")) {
      throw new Error(
        "ChromaDB permission error: Please check your CHROMA_API_KEY, CHROMA_TENANT, and CHROMA_DATABASE environment variables."
      );
    }
    throw error;
  }
}

export async function deleteAllPixelsForUser(userId: string) {
  try {
    const collection = await getOrCreatePixelCollectionForUser(userId);
    // Get all IDs first
    const results = await collection.get();
    const ids = results.ids || [];
    
    if (ids.length > 0) {
      await collection.delete({
        ids,
      });
    }
    
    return { deletedCount: ids.length };
  } catch (error) {
    console.error("ChromaDB error in deleteAllPixelsForUser:", error);
    if (error instanceof Error && error.message.includes("permission")) {
      throw new Error(
        "ChromaDB permission error: Please check your CHROMA_API_KEY, CHROMA_TENANT, and CHROMA_DATABASE environment variables."
      );
    }
    throw error;
  }
}
