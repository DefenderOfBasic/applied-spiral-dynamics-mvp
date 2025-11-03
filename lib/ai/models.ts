export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "GPT-5",
    description: "OpenAI's latest general model (no reasoning overhead)",
  },
  {
    id: "chat-model-reasoning",
    name: "GPT-5 Thinking",
    description: "GPT-5 variant optimized for complex reasoning",
  },
];
