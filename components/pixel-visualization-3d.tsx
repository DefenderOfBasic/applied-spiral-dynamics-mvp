"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import {
  getColorForStage,
  getMostProminentColor,
} from "@/lib/pixel-generation/color-palette";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type PixelData = {
  ids: string[];
  embeddings: number[][];
  documents: string[];
  metadatas: Array<Record<string, any>>;
};

type ProcessedPixel = {
  id: string;
  position: [number, number, number];
  color: string;
  statement: string;
  document: string;
  metadata: Record<string, any>;
  colorStage: Record<string, number> | null;
  prominentColorKey: string | null;
  confidenceScore?: number;
};

// Vanilla PCA implementation
function reduceTo3D(embeddings: number[][]): number[][] {
  if (embeddings.length === 0) return [];
  if (embeddings.length === 1) return [[0, 0, 0]];

  const n = embeddings.length;
  const dims = embeddings[0]?.length ?? 0;
  if (dims <= 3) {
    return embeddings.map((e) => [e[0] ?? 0, e[1] ?? 0, e[2] ?? 0]);
  }

  // Step 1: Center data (subtract mean)
  const means: number[] = [];
  for (let d = 0; d < dims; d++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += embeddings[i]?.[d] ?? 0;
    }
    means[d] = sum / n;
  }

  const centered = embeddings.map((e) => 
    e.map((val, d) => (val ?? 0) - means[d])
  );

  // Step 2: Compute covariance matrix
  const cov: number[][] = [];
  for (let i = 0; i < dims; i++) {
    cov[i] = [];
    for (let j = 0; j < dims; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += (centered[k]?.[i] ?? 0) * (centered[k]?.[j] ?? 0);
      }
      cov[i][j] = sum / (n - 1);
    }
  }

  // Step 3: Power iteration to get top 3 eigenvectors
  const eigenvectors: number[][] = [];
  
  for (let pc = 0; pc < 3; pc++) {
    // Initialize random vector
    let v: number[] = [];
    for (let i = 0; i < dims; i++) {
      v[i] = Math.random() - 0.5;
    }
    
    // Normalize
    let norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    v = v.map((x) => x / norm);

    // Power iteration (10 iterations is usually enough)
    for (let iter = 0; iter < 10; iter++) {
      // Multiply by covariance matrix
      const newV: number[] = [];
      for (let i = 0; i < dims; i++) {
        let sum = 0;
        for (let j = 0; j < dims; j++) {
          sum += cov[i][j] * v[j];
        }
        newV[i] = sum;
      }
      
      // Deflate: subtract previous components
      for (let prev = 0; prev < pc; prev++) {
        const prevVec = eigenvectors[prev];
        let dot = 0;
        for (let i = 0; i < dims; i++) {
          dot += newV[i] * prevVec[i];
        }
        for (let i = 0; i < dims; i++) {
          newV[i] -= dot * prevVec[i];
        }
      }
      
      // Normalize
      norm = Math.sqrt(newV.reduce((sum, x) => sum + x * x, 0));
      v = newV.map((x) => x / norm);
    }
    
    eigenvectors[pc] = v;
  }

  // Step 4: Project centered data onto eigenvectors
  return centered.map((point) => {
    const projected: number[] = [];
    for (let pc = 0; pc < 3; pc++) {
      let dot = 0;
      for (let d = 0; d < dims; d++) {
        dot += (point[d] ?? 0) * eigenvectors[pc][d];
      }
      projected[pc] = dot;
    }
    return projected;
  });
}

// Get top N colors by absolute value
function getTopColorsByAbsoluteValue(
  colorStage: Record<string, number>,
  topN: number = 2
): Array<[string, number]> {
  if (!colorStage || Object.keys(colorStage).length === 0) {
    return [];
  }

  return Object.entries(colorStage)
    .map(([color, value]) => [color, value] as [string, number])
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, topN);
}

// Normalize positions to fit in a reasonable 3D space
function normalizePositions(
  positions: number[][],
  scale: number = 5
): number[][] {
  if (positions.length === 0) return [];

  // Find min/max for each dimension
  const mins = [Infinity, Infinity, Infinity];
  const maxs = [-Infinity, -Infinity, -Infinity];

  for (const pos of positions) {
    for (let i = 0; i < 3; i++) {
      mins[i] = Math.min(mins[i], pos[i] ?? 0);
      maxs[i] = Math.max(maxs[i], pos[i] ?? 0);
    }
  }

  // Calculate center and range
  const centers = [
    (mins[0] + maxs[0]) / 2,
    (mins[1] + maxs[1]) / 2,
    (mins[2] + maxs[2]) / 2,
  ];
  const ranges = [
    maxs[0] - mins[0] || 1,
    maxs[1] - mins[1] || 1,
    maxs[2] - mins[2] || 1,
  ];
  const maxRange = Math.max(...ranges) || 1;

  // Normalize and scale
  return positions.map((pos) => [
    ((pos[0] ?? 0) - centers[0]) / maxRange * scale,
    ((pos[1] ?? 0) - centers[1]) / maxRange * scale,
    ((pos[2] ?? 0) - centers[2]) / maxRange * scale,
  ]);
}

function PixelBox({
  pixel,
  onHover,
  onSelect,
  isHovered,
  isSelected,
}: {
  pixel: ProcessedPixel;
  onHover: (pixel: ProcessedPixel | null) => void;
  onSelect: (pixel: ProcessedPixel | null) => void;
  isHovered: boolean;
  isSelected: boolean;
}) {
  const boxSize = 0.1;

  return (
    <group
      position={pixel.position}
      onPointerEnter={() => onHover(pixel)}
      onPointerLeave={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSelected ? null : pixel);
      }}
    >
      <mesh>
        <boxGeometry args={[boxSize, boxSize, boxSize]} />
        <meshBasicMaterial
          color={pixel.color}
          opacity={isSelected ? 1 : isHovered ? 1 : 0.8}
          transparent
        />
      </mesh>
    </group>
  );
}

function PixelScene({
  pixels,
  onPixelHover,
  onPixelSelect,
  hoveredPixel,
  selectedPixel,
}: {
  pixels: ProcessedPixel[];
  onPixelHover: (pixel: ProcessedPixel | null) => void;
  onPixelSelect: (pixel: ProcessedPixel | null) => void;
  hoveredPixel: ProcessedPixel | null;
  selectedPixel: ProcessedPixel | null;
}) {
  return (
    <>
      {pixels.map((pixel) => (
        <PixelBox
          key={pixel.id}
          pixel={pixel}
          onHover={onPixelHover}
          onSelect={onPixelSelect}
          isHovered={hoveredPixel?.id === pixel.id}
          isSelected={selectedPixel?.id === pixel.id}
        />
      ))}
      <OrbitControls enableDamping dampingFactor={0.05} />
    </>
  );
}

export function PixelVisualization3D({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { data: pixelData, error, isLoading } = useSWR<PixelData>(
    "/api/pixels",
    fetcher
  );

  const [processedPixels, setProcessedPixels] = useState<ProcessedPixel[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hoveredPixel, setHoveredPixel] = useState<ProcessedPixel | null>(null);
  const [selectedPixel, setSelectedPixel] = useState<ProcessedPixel | null>(null);

  useEffect(() => {
    if (!pixelData?.embeddings || pixelData.embeddings.length === 0) {
      setProcessedPixels([]);
      return;
    }

    setIsProcessing(true);
    try {
      const reducedPositions = reduceTo3D(pixelData.embeddings);
      const normalizedPositions = normalizePositions(
        reducedPositions,
        compact ? 3 : 5
      );

      // Process each pixel
      const processed = pixelData.ids.map((id, index) => {
        const metadata = pixelData.metadatas?.[index];
        const document = pixelData.documents?.[index] ?? "";

        // Parse color_stage
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

        // Get most prominent color
        const prominentColorKey = colorStage
          ? getMostProminentColor(colorStage)
          : null;
        const color = prominentColorKey
          ? getColorForStage(prominentColorKey)
          : "#808080";

        const statement = metadata?.statement ?? "Untitled Pixel";
        const confidenceScore = metadata?.confidence_score
          ? Number(metadata.confidence_score)
          : undefined;

        return {
          id,
          position: normalizedPositions[index] as [number, number, number],
          color,
          statement,
          document,
          metadata: metadata ?? {},
          colorStage,
          prominentColorKey,
          confidenceScore,
        };
      });

      setProcessedPixels(processed);
    } catch (error) {
      console.error("Error processing pixels:", error);
      setProcessedPixels([]);
    } finally {
      setIsProcessing(false);
    }
  }, [pixelData, compact]);

  if (isLoading || isProcessing) {
    return (
      <div
        className={`flex items-center justify-center ${className ?? ""}`}
        style={{ minHeight: compact ? "240px" : "400px" }}
      >
        <div className="text-sm text-muted-foreground">Loading pixels...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center ${className ?? ""}`}
        style={{ minHeight: compact ? "240px" : "400px" }}
      >
        <div className="text-sm text-destructive">
          Failed to load pixels
        </div>
      </div>
    );
  }

  if (processedPixels.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className ?? ""}`}
        style={{ minHeight: compact ? "240px" : "400px" }}
      >
        <div className="text-sm text-muted-foreground">No pixels to display</div>
      </div>
    );
  }

  if (hoveredPixel){
console.log(hoveredPixel.metadata)
  }
  

  return (
    <div className={className} style={{ minHeight: compact ? "240px" : "400px" }}>
      <div className="relative w-full h-full">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: true, alpha: true }}
          onPointerMissed={() => {
            // Clicking on empty space deselects the pixel
            setSelectedPixel(null);
          }}
        >
          <PixelScene
            pixels={processedPixels}
            onPixelHover={setHoveredPixel}
            onPixelSelect={setSelectedPixel}
            hoveredPixel={hoveredPixel}
            selectedPixel={selectedPixel}
          />
        </Canvas>
        {hoveredPixel && !selectedPixel && (
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="bg-black/90 text-white text-xs p-2 rounded w-48">
              {hoveredPixel.metadata?.context && (
                <div className="mb-2 pb-2 border-b border-white/20">
                  {hoveredPixel.metadata.context.length > 240
                    ? `${hoveredPixel.metadata.context.slice(0, 50)}...`
                    : hoveredPixel.metadata.context}
                </div>
              )}
              {hoveredPixel.colorStage &&
                getTopColorsByAbsoluteValue(hoveredPixel.colorStage, 2).map(
                  ([color, value]) => (
                    <div key={color} className="mb-0.5 last:mb-0">
                      {color}: {Number(value).toFixed(2)}
                    </div>
                  )
                )}
            </div>
          </div>
        )}
        {selectedPixel && !compact && (
          <div className="absolute top-4 right-4 w-80 max-h-[80vh] overflow-y-auto z-10">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {selectedPixel.statement}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono mb-2">
                      ID: {selectedPixel.id}
                    </CardDescription>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPixel(null)}
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    ×
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPixel.metadata?.context && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Context</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedPixel.metadata.context}
                    </p>
                  </div>
                )}

                {selectedPixel.metadata?.explanation && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Explanation</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedPixel.metadata.explanation}
                    </p>
                  </div>
                )}

                {selectedPixel.colorStage && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Color Stage</h4>
                    <div className="flex gap-2 flex-wrap">
                      {getTopColorsByAbsoluteValue(
                        selectedPixel.colorStage,
                        2
                      ).map(([color, value]) => (
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
                  {selectedPixel.metadata?.chatId && (
                    <div>
                      <span className="font-semibold">Chat ID: </span>
                      <span className="font-mono">
                        {selectedPixel.metadata.chatId}
                      </span>
                    </div>
                  )}
                  {selectedPixel.metadata?.timestamp && (
                    <div>
                      <span className="font-semibold">Stored: </span>
                      <span>
                        {new Date(
                          selectedPixel.metadata.timestamp
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {selectedPixel.document && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <h4 className="text-xs font-semibold mb-1">
                      Embedded Text
                    </h4>
                    <p className="text-xs font-mono whitespace-pre-wrap">
                      {selectedPixel.document}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
