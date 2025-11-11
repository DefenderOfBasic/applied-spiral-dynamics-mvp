import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { PixelVisualization3D } from "@/components/pixel-visualization-3d";

export default async function PixelVisualizationPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/guest");
  }

  return (
    <div className="h-screen w-screen relative bg-background">
      <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
        <h1 className="text-2xl font-bold mb-2">Pixel Visualization</h1>
        <p className="text-sm text-muted-foreground">
          3D visualization of your belief pixels using PCA. Hover over boxes to see details.
        </p>
      </div>
      <PixelVisualization3D className="w-full h-full" />
    </div>
  );
}

