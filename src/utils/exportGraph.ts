/**
 * Utility function to export a graph canvas as a high-resolution PNG image
 */

export interface GraphExportOptions {
  filename?: string;
  graphType?: 'genre' | 'artist';
  theme?: 'light' | 'dark' | string;
  scale?: number; // Resolution multiplier (1 = original, 2 = 2x, 3 = 3x, etc.)
}

/**
 * Exports the graph canvas to a PNG file with proper background color
 * @param canvas - The canvas element to export
 * @param options - Export options including filename, graph type, and theme
 */
export const exportGraphAsImage = (
  canvas: HTMLCanvasElement | null,
  options: GraphExportOptions = {}
): void => {
  if (!canvas) {
    console.error('Canvas element not available for export');
    return;
  }

  try {
    // Get scale factor (default to 2 for higher quality exports)
    const scale = options.scale ?? 2;

    // Create a temporary canvas with scaled dimensions
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width * scale;
    tempCanvas.height = canvas.height * scale;
    const ctx = tempCanvas.getContext('2d');

    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }

    // Scale the context first for all operations
    ctx.scale(scale, scale);

    // Get the actual background color from the body element
    // This will automatically match whatever CSS theme is applied
    const bodyStyles = window.getComputedStyle(document.body);
    let backgroundColor = bodyStyles.backgroundColor;

    // Check if background color is transparent or empty, use fallback
    if (!backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
      backgroundColor = options.theme === 'dark' ? '#0a0a0a' : '#ffffff';
    }

    // Fill background with the computed theme color (using unscaled coordinates since context is already scaled)
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the original canvas
    ctx.drawImage(canvas, 0, 0);

    // Generate filename with timestamp and scale info
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const graphType = options.graphType || 'graph';
    const scaleInfo = scale > 1 ? `-${scale}x` : '';
    const filename = options.filename || `Rhizome ${graphType}-export${scaleInfo}-${timestamp}.png`;

    // Convert canvas to blob for better memory handling
    tempCanvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create image blob');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    console.error('Error exporting graph:', error);
  }
};

/**
 * Alternative export method using data URL (fallback)
 */
export const exportGraphAsImageDataURL = (
  canvas: HTMLCanvasElement | null,
  options: GraphExportOptions = {}
): void => {
  if (!canvas) {
    console.error('Canvas element not available for export');
    return;
  }

  try {
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const graphType = options.graphType || 'graph';
    const filename = options.filename || `${graphType}-export-${timestamp}.png`;

    // Convert canvas to data URL
    const dataURL = canvas.toDataURL('image/png');

    // Create download link
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting graph:', error);
  }
};
