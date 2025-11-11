#!/usr/bin/env tsx

/**
 * Batch import pixels from a JSON file into Chroma DB
 * 
 * Usage:
 *   pnpm tsx scripts/batch-import-pixels.ts <userId> <jsonFilePath>
 * 
 * Example:
 *   pnpm tsx scripts/batch-import-pixels.ts user-123 scripts/batch-import-pixels.example.json
 */

import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { storePixel } from "@/lib/chroma/client";
import { generateUUID } from "@/lib/utils";

// Load environment variables from .env.local (or .env if .env.local doesn't exist)
config({
  path: ".env.local",
});

// Also try .env as fallback
config({
  path: ".env",
  override: false, // Don't override existing env vars
});

type PixelData = {
  text?: string; // Optional - will be auto-constructed from context + statement if not provided
  timestamp?: string; // Optional - ISO string timestamp. If not provided, uses current time
  pixel: {
    statement: string;
    context: string;
    explanation?: string;
    color_stage: Record<string, number>;
    confidence_score?: number;
    too_nuanced?: boolean;
    absolute_thinking?: boolean;
  };
};

async function batchImportPixels(userId: string, jsonFilePath: string) {
  try {
    // Read and parse JSON file
    const filePath = join(process.cwd(), jsonFilePath);
    console.log(`📖 Reading JSON file: ${filePath}`);
    const fileContent = await readFile(filePath, "utf-8");
    const pixels: PixelData[] = JSON.parse(fileContent);

    if (!Array.isArray(pixels)) {
      throw new Error("JSON file must contain an array of pixel objects");
    }

    console.log(`📊 Found ${pixels.length} pixels to import`);
    console.log(`👤 User ID: ${userId}\n`);

    // Process each pixel
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < pixels.length; i++) {
      const pixelData = pixels[i];
      const pixel = pixelData.pixel;

      try {
        // Validate required fields
        if (!pixel.statement) {
          throw new Error("Missing 'pixel.statement' field");
        }
        if (!pixel.context) {
          throw new Error("Missing 'pixel.context' field");
        }
        if (!pixel.color_stage) {
          throw new Error("Missing 'pixel.color_stage' field");
        }

        // Format the document text (same format as in pixel-generation route)
        // Auto-construct from context + statement if text not provided
        const documentText = pixelData.text ?? `context: ${pixel.context}\nstatement: ${pixel.statement}`;

        // Validate timestamp if provided
        let timestamp: string;
        if (pixelData.timestamp) {
          // Validate it's a valid ISO string
          const date = new Date(pixelData.timestamp);
          if (Number.isNaN(date.getTime())) {
            throw new Error(`Invalid timestamp format: ${pixelData.timestamp}. Must be ISO 8601 format (e.g., "2024-01-15T10:30:00.000Z")`);
          }
          timestamp = date.toISOString();
        } else {
          timestamp = new Date().toISOString();
        }

        // Prepare metadata (same structure as in pixel-generation route)
        const metadata: Record<string, string | number | boolean> = {
          statement: pixel.statement,
          context: pixel.context,
          explanation: pixel.explanation ?? "",
          color_stage: JSON.stringify(pixel.color_stage),
          confidence_score: pixel.confidence_score ?? 0,
          too_nuanced: pixel.too_nuanced ?? false,
          absolute_thinking: pixel.absolute_thinking ?? false,
          chatId: "", // Empty for batch imports
          userEmail: "", // Empty for batch imports
          timestamp,
        };

        // Generate unique ID for this pixel document
        const documentId = generateUUID();

        // Store pixel in ChromaDB (this will generate embeddings automatically)
        await storePixel({
          userId,
          documentText,
          metadata,
          documentId,
        });

        successCount++;
        console.log(
          `✅ [${i + 1}/${pixels.length}] Imported: "${pixel.statement.substring(0, 50)}${pixel.statement.length > 50 ? "..." : ""}"`
        );
      } catch (error) {
        errorCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `❌ [${i + 1}/${pixels.length}] Failed to import pixel: ${errorMessage}`
        );
        if (pixel?.statement) {
          console.error(`   Statement: ${pixel.statement}`);
        }
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Successfully imported: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📦 Total: ${pixels.length}`);

    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: pnpm tsx scripts/batch-import-pixels.ts <userId> <jsonFilePath>");
  console.error("");
  console.error("Example:");
  console.error('  pnpm tsx scripts/batch-import-pixels.ts user-123 scripts/batch-import-pixels.example.json');
  process.exit(1);
}

const [userId, jsonFilePath] = args;

// Run the batch import
batchImportPixels(userId, jsonFilePath).catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

