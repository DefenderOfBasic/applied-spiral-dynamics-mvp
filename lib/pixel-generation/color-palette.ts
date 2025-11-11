/**
 * Color palette mapping for Spiral Dynamics color stages.
 * 
 * Edit this dictionary to customize the colors for each color_stage key.
 * Colors are in hex format for Three.js.
 */
export const COLOR_PALETTE: Record<string, string> = {
  beige: "#f5f5dc",
  purple: "#800080",
  red: "#ff0000",
  blue: "#0000ff",
  orange: "#ffa500",
  green: "#008000",
  yellow: "#ffff00",
  turquoise: "#40e0d0",
  coral: "#ff7f50",
  teal: "#008080",
  // Add more color mappings as needed
};

/**
 * Get the color for a given color stage key.
 * Returns a default color if the key is not found in the palette.
 */
export function getColorForStage(
  colorStageKey: string,
  defaultColor: string = "#808080"
): string {
  return COLOR_PALETTE[colorStageKey.toLowerCase()] ?? defaultColor;
}

/**
 * Get the most prominent color from a color_stage object.
 * Returns the key with the highest absolute value.
 */
export function getMostProminentColor(
  colorStage: Record<string, number>
): string | null {
  if (!colorStage || Object.keys(colorStage).length === 0) {
    return null;
  }

  let maxKey: string | null = null;
  let maxValue = -Infinity;

  for (const [key, value] of Object.entries(colorStage)) {
    const absValue = Math.abs(Number(value));
    if (absValue > maxValue) {
      maxValue = absValue;
      maxKey = key;
    }
  }

  return maxKey;
}

