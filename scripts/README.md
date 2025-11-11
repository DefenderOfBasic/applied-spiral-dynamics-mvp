# Batch Pixel Import Scripts

This directory contains scripts for batch importing pixel data into Chroma DB.

## Overview

The batch import pipeline allows you to inject fake/test data into the system by importing pixels from a JSON file. The imported pixels will:

- ✅ Be stored in Chroma DB with real embeddings generated
- ✅ Show up in the 3D visualization
- ❌ **NOT** be stored in chat log transcripts (this is expected and OK)

## Getting Your User ID

Before running the import script, you need to know your user ID. You can find it by:

1. Logging into the application
2. Checking your session - the user ID is available as `session.user.id` in the application
3. Or check the database/users table if you have access

## JSON File Format

Create a JSON file with an array of pixel objects. See `batch-import-pixels.example.json` for a complete example.

Each pixel object should have:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "pixel": {
    "statement": "The belief statement",
    "context": "Context about when/why this belief was expressed",
    "explanation": "Explanation of the color stage analysis",
    "color_stage": {
      "beige": 0.0,
      "purple": 0.0,
      "red": 0.0,
      "blue": 0.0,
      "orange": -0.3,
      "green": 0.6,
      "yellow": 0.0,
      "turquoise": 0.0,
      "coral": 0.0,
      "teal": 0.0
    },
    "confidence_score": 0.6,
    "too_nuanced": false,
    "absolute_thinking": true
  }
}
```

### Required Fields

- `pixel.statement`: The belief statement
- `pixel.context`: Context about the belief
- `pixel.color_stage`: Object with color stage values (numbers between -1 and 1)

### Optional Fields

- `timestamp`: ISO 8601 timestamp string (e.g., `"2024-01-15T10:30:00.000Z"`). If not provided, uses the current time. This allows you to fake/inject custom timestamps for the pixels.
- `text`: The text that will be embedded. If not provided, it will be auto-constructed as `"context: {context}\nstatement: {statement}"`
- `pixel.explanation`: Explanation text (defaults to empty string)
- `pixel.confidence_score`: Confidence score (defaults to 0)
- `pixel.too_nuanced`: Boolean (defaults to false)
- `pixel.absolute_thinking`: Boolean (defaults to false)

## Usage

### Using npm script:

```bash
pnpm pixels:import <userId> <jsonFilePath>
```

### Using tsx directly:

```bash
pnpm tsx scripts/batch-import-pixels.ts <userId> <jsonFilePath>
```

### Example:

```bash
# Using the example file
pnpm pixels:import user-123 scripts/batch-import-pixels.example.json

# Using your own file
pnpm pixels:import user-123 data/my-pixels.json
```

Omar's userID: `54efca47-0bfe-414c-af53-5c575299afbd`

```
pnpm pixels:import 54efca47-0bfe-414c-af53-5c575299afbd scripts/batch-import-pixels.example.json
```

## How It Works

1. The script reads the JSON file
2. For each pixel:
   - Validates required fields
   - Formats the metadata according to the system's expected structure
   - Generates a unique document ID
   - Calls `storePixel()` which:
     - Generates real embeddings using the AI embedding model
     - Stores the pixel in Chroma DB with embeddings, document text, and metadata
3. Reports success/failure for each pixel

## Environment Variables

Make sure these are set in your `.env` file:

- `CHROMA_TENANT`: Your Chroma DB tenant
- `CHROMA_DATABASE`: Your Chroma DB database name
- `CHROMA_API_KEY`: Your Chroma DB API key
- AI Gateway configuration for embedding generation

## Notes

- The script will generate **real embeddings** for each pixel using your configured embedding model
- Pixels are stored in user-specific collections: `pixels-{userId}`
- The `chatId` and `userEmail` fields will be empty strings for batch imports (as expected)
- Each pixel gets a unique UUID as its document ID
- The script will exit with code 1 if any pixels fail to import

## Troubleshooting

- **"ChromaDB permission error"**: Check your `CHROMA_API_KEY`, `CHROMA_TENANT`, and `CHROMA_DATABASE` environment variables
- **"Missing field"**: Ensure your JSON file has all required fields (see format above)
- **"Failed to generate embeddings"**: Check your AI Gateway configuration and embedding model settings
