import type { EmbeddingModel, LanguageModel } from "ai";

const createMockModel = (): LanguageModel => {
  return {
    specificationVersion: "v2",
    provider: "mock",
    modelId: "mock-model",
    defaultObjectGenerationMode: "tool",
    supportedUrls: [],
    supportsImageUrls: false,
    supportsStructuredOutputs: false,
    doGenerate: async () => ({
      rawCall: { rawPrompt: null, rawSettings: {} },
      finishReason: "stop",
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
      content: [{ type: "text", text: "Hello, world!" }],
      warnings: [],
    }),
    doStream: async () => ({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({
            type: "text-delta",
            id: "mock-id",
            delta: "Mock response",
          });
          controller.close();
        },
      }),
      rawCall: { rawPrompt: null, rawSettings: {} },
    }),
  } as unknown as LanguageModel;
};

const createMockEmbeddingModel = (): EmbeddingModel => {
  return {
    specificationVersion: "v1",
    provider: "mock",
    modelId: "mock-embedding-model",
    maxEmbeddingsPerCall: 1,
    doEmbed: async () => ({
      rawCall: { rawPrompt: null, rawSettings: {} },
      embeddings: [
        // Return a mock 1536-dimensional vector (typical for text-embedding-3-large)
        new Array(1536).fill(0).map(() => Math.random() * 2 - 1),
      ],
      usage: { inputTokens: 10, totalTokens: 10 },
    }),
  } as unknown as EmbeddingModel;
};

export const chatModel = createMockModel();
export const reasoningModel = createMockModel();
export const titleModel = createMockModel();
export const artifactModel = createMockModel();
export const embeddingModel = createMockEmbeddingModel();
