import { auth } from "@/app/(auth)/auth";
import { getAllPixelsForUser } from "@/lib/chroma/client";
import { ChatSDKError } from "@/lib/errors";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return new ChatSDKError("unauthorized:pixels").toResponse();
  }

  try {
    const pixels = await getAllPixelsForUser(session.user.id);
    return Response.json(pixels);
  } catch (error) {
    console.error("Error fetching pixels:", error);
    return new ChatSDKError(
      "bad_request:database",
      "Failed to fetch pixels from ChromaDB"
    ).toResponse();
  }
}

