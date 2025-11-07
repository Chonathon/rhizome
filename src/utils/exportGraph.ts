/**
 * Utility function to export a graph canvas as a high-resolution PNG image
 */

export interface GraphExportOptions {
  filename?: string;
  graphType?: 'genre' | 'artist';
  theme?: 'light' | 'dark' | string;
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
    // Create a temporary canvas with the same dimensions
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');

    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }

    // Get the actual background color from the body element
    // This will automatically match whatever CSS theme is applied
    const bodyStyles = window.getComputedStyle(document.body);
    let backgroundColor = bodyStyles.backgroundColor;

    // Check if background color is transparent or empty, use fallback
    if (!backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
      backgroundColor = options.theme === 'dark' ? '#0a0a0a' : '#ffffff';
    }

    // Fill background with the computed theme color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the original canvas on top
    ctx.drawImage(canvas, 0, 0);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const graphType = options.graphType || 'graph';
    const filename = options.filename || `Rhizome ${graphType}-export-${timestamp}.png`;

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
