import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { generateText } from "ai";
import { myProvider } from "@/lib/ai/providers";
import { markMessagesAsProcessed } from "@/lib/db/queries";
import { storePixel } from "@/lib/chroma/client";
import { generateUUID } from "@/lib/utils";

export async function POST(request: Request) {
  const { chatId, messages, userId, userEmail } = await request.json();
  console.log({ chatId, userId, userEmail, messageCount: messages?.length });

  try {
    const filePath = join(
      process.cwd(),
      "lib",
      "pixel-generation",
      "belief-extraction.md"
    );
    const fileContent = await readFile(filePath, "utf-8");
    console.log("File content:", fileContent.length);

    // Format chat messages for the prompt
    const chatLog = messages
      ?.map(
        (msg: {
          role: string;
          parts: Array<{ type: string; text?: string }>;
        }) =>
          `${msg.role}: ${msg.parts
            .map((part) => (part.type === "text" ? part.text : ""))
            .join(" ")}`
      )
      .join("\n");

    let { text } = await generateText({
      model: myProvider.languageModel("chat-model"),
      system: fileContent,
      prompt: `Chat log:\n${chatLog || "No messages"}`,
    });

    // remove the ```json
    text = text.replace("```json", "");
    text = text.replace("```", "");
    console.log(text);

    const result = JSON.parse(text);

    // If a pixel was found, store it in ChromaDB
    // This must succeed before marking messages as processed
    if (!result.no_pixel && result.pixel) {
      // Format the text for embedding: "context: ...\nstatement: ..."
      const documentText = `context: ${result.pixel.context}\nstatement: ${result.pixel.statement}`;

      // Prepare metadata
      const metadata: Record<string, string | number | boolean> = {
        statement: result.pixel.statement,
        context: result.pixel.context,
        explanation: result.pixel.explanation,
        color_stage: JSON.stringify(result.pixel.color_stage),
        confidence_score: result.pixel.confidence_score,
        too_nuanced: result.pixel.too_nuanced,
        absolute_thinking: result.pixel.absolute_thinking,
        chatId: chatId || "",
        userEmail: userEmail || "",
        timestamp: new Date().toISOString(),
      };

      // Generate unique ID for this pixel document
      const documentId = generateUUID();

      // Store pixel in ChromaDB - if this fails, the request will fail
      // and messages won't be marked as processed, allowing retry
      await storePixel({
        userId,
        documentText,
        metadata,
        documentId,
      });

      console.log("✅ Pixel stored in ChromaDB:", documentId);
    }

    // Only mark messages as processed if pixel storage succeeded (or no pixel was found)
    // If storage failed, the error above will prevent this from running
    const messageIds =
      messages
        ?.map((msg: { id: string }) => msg.id)
        .filter(Boolean) ?? [];

    if (messageIds.length > 0) {
      await markMessagesAsProcessed({ messageIds });
    }

    return Response.json({ status: "done", result });
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { status: "error", message: "Failed to process request" },
      { status: 500 }
    );
  }
}
