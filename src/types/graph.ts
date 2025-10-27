/**
 * Graph Handle for programmatic control
 *
 * Exposed via ref from Graph component and its adapters
 */
export interface GraphHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (k: number, ms?: number) => void;
  getZoom: () => number;
}
