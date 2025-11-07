/**
 * Utility function to export a graph canvas as a high-resolution PNG image
 */

export interface GraphExportOptions {
  filename?: string;
  graphType?: 'genre' | 'artist';
}

/**
 * Exports the graph canvas to a PNG file
 * @param canvas - The canvas element to export
 * @param options - Export options including filename and graph type
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
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const graphType = options.graphType || 'graph';
    const filename = options.filename || `Rhizome ${graphType}-export-${timestamp}.png`;

    // Convert canvas to blob for better memory handling
    canvas.toBlob((blob) => {
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
