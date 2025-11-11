import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { getAllPixelsForUser } from "@/lib/chroma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PixelDeleteButton, DeleteAllPixelsButton } from "@/components/pixel-delete-buttons";

export default async function PixelsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/guest");
  }

  let pixels;
  let error: string | null = null;

  // Log user ID for batch import reference
  console.log("👤 User ID for batch import:", session.user.id);

  try {
    const result = await getAllPixelsForUser(session.user.id);
    pixels = result;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to fetch pixels";
    console.error("Error fetching pixels:", err);
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Stored Pixels</h1>
        <p className="text-muted-foreground">
          All stored belief pixels from your conversations
        </p>
        <div className="mt-2 p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">User ID:</span>{" "}
            <span className="font-mono text-xs">{session.user.id}</span>
            <span className="text-muted-foreground ml-2 text-xs">
              (Use this for batch imports)
            </span>
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive mb-6">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!error && pixels && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total pixels: {pixels.ids?.length ?? 0}
            </p>
            {pixels.ids && pixels.ids.length > 0 && <DeleteAllPixelsButton />}
          </div>

          {!pixels.ids || pixels.ids.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No pixels found</CardTitle>
                <CardDescription>
                  No belief pixels have been stored yet. Pixels are created when
                  conversations contain belief statements.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              {pixels.ids.map((id, index) => {
                const metadata = pixels.metadatas?.[index];
                const document = pixels.documents?.[index];

                // Parse color_stage if it's a string
                let colorStage: Record<string, number> | null = null;
                if (metadata?.color_stage) {
                  try {
                    colorStage =
                      typeof metadata.color_stage === "string"
                        ? JSON.parse(metadata.color_stage)
                        : metadata.color_stage;
                  } catch {
                    // Ignore parse errors
                  }
                }

                return (
                  <Card key={id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">
                            {metadata?.statement || "Untitled Pixel"}
                          </CardTitle>
                          <CardDescription className="text-xs font-mono mb-2">
                            ID: {id}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                          {metadata?.confidence_score !== undefined && (
                            <Badge variant="outline">
                              Confidence:{" "}
                              {Number(metadata.confidence_score).toFixed(2)}
                            </Badge>
                          )}
                          {metadata?.absolute_thinking === "true" && (
                            <Badge variant="destructive">Absolute Thinking</Badge>
                          )}
                          {metadata?.too_nuanced === "true" && (
                            <Badge variant="secondary">Too Nuanced</Badge>
                          )}
                          <PixelDeleteButton pixelId={id} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {metadata?.context && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">
                            Context
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {metadata.context}
                          </p>
                        </div>
                      )}

                      {metadata?.explanation && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">
                            Explanation
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {metadata.explanation}
                          </p>
                        </div>
                      )}

                      {colorStage && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">
                            Color Stage
                          </h4>
                          <div className="flex gap-2 flex-wrap">
                            {Object.entries(colorStage).map(([color, value]) => (
                              <Badge
                                key={color}
                                variant="outline"
                                className={
                                  Number(value) > 0.5
                                    ? "border-primary"
                                    : Number(value) < 0
                                    ? "border-destructive"
                                    : ""
                                }
                              >
                                {color}: {Number(value).toFixed(2)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator />

                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        {metadata?.chatId && (
                          <div>
                            <span className="font-semibold">Chat ID: </span>
                            <span className="font-mono">{metadata.chatId}</span>
                          </div>
                        )}
                        {metadata?.timestamp && (
                          <div>
                            <span className="font-semibold">Stored: </span>
                            <span>
                              {new Date(metadata.timestamp).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {document && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <h4 className="text-xs font-semibold mb-1">
                            Embedded Text
                          </h4>
                          <p className="text-xs font-mono whitespace-pre-wrap">
                            {document}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

