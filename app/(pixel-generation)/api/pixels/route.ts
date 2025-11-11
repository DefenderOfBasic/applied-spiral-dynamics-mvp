import { auth } from "@/app/(auth)/auth";
import {
  getAllPixelsForUser,
  deletePixel,
  deleteAllPixelsForUser,
} from "@/lib/chroma/client";
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

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new ChatSDKError("unauthorized:pixels").toResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const pixelId = searchParams.get("id");

    if (pixelId) {
      // Delete single pixel
      await deletePixel({
        userId: session.user.id,
        pixelId,
      });
      return Response.json({ success: true, deletedId: pixelId });
    } else {
      // Delete all pixels for user
      const result = await deleteAllPixelsForUser(session.user.id);
      return Response.json({
        success: true,
        deletedCount: result.deletedCount,
      });
    }
  } catch (error) {
    console.error("Error deleting pixels:", error);
    return new ChatSDKError(
      "bad_request:database",
      "Failed to delete pixels from ChromaDB"
    ).toResponse();
  }
}

