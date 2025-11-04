import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { generateText } from "ai";
import { myProvider } from "@/lib/ai/providers";

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

    return Response.json({ status: "done", result });
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { status: "error", message: "Failed to process request" },
      { status: 500 }
    );
  }
}
