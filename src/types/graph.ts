/**
 * Unified Graph API Types
 *
 * Configuration-based API for all graph visualizations
 * (Genres, Artists, Collections, Similar Artists)
 */

/**
 * Layout configuration for graph positioning
 */
export interface LayoutConfig {
  type: 'force' | 'dag' | 'star' | 'custom';

  // Force-directed layout settings
  forceConfig?: {
    charge?: number;           // Negative = repulsion, positive = attraction
    linkDistance?: number;     // Target distance between connected nodes
    collisionRadius?: number;  // Collision detection radius multiplier
    centerStrength?: number;   // Centering force strength (0-1)
  };

  // DAG (Directed Acyclic Graph) layout settings
  dagConfig?: {
    direction: 'TB' | 'BT' | 'LR' | 'RL';  // Top-Bottom, Bottom-Top, Left-Right, Right-Left
    nodeSpacing?: number;      // Spacing between nodes in pixels
    levelSpacing?: number;     // Spacing between hierarchical levels
  };

  // Star topology layout settings (for Similar Artists)
  starConfig?: {
    centerNodeId: string;      // ID of the center node
    radiusSpacing?: number;    // Radius from center to outer nodes
  };

  // Custom layout function
  customLayout?: <TNode extends { id: string }>(
    nodes: TNode[],
    links: GraphLink[]
  ) => TNode[];
}

/**
 * Styling configuration with function-based styling
 */
export interface StylingConfig<TNode, TLink> {
  // Node styling
  nodeRadius: (node: TNode) => number;
  nodeColor: (node: TNode) => string;
  nodeLabel?: (node: TNode) => string;
  nodeImage?: (node: TNode) => string | undefined;

  // Link styling
  linkColor?: (link: TLink) => string;
  linkWidth?: (link: TLink) => number;
  linkCurvature?: (link: TLink) => number;  // 0 = straight, higher = more curved

  // Conditional/state-based styling
  selectedNodeColor?: string;
  hoveredNodeColor?: string;
  highlightNeighbors?: boolean;  // Highlight connected nodes on hover

  // Performance settings
  curvedLinksAbove?: number;     // Use curved links only when link count is below this
  maxLinksToShow?: number;       // Hide links when count exceeds this (until zoomed in)
  minLabelPx?: number;           // Minimum label size to render
  strokeMinPx?: number;          // Minimum node size for halo stroke
}

/**
 * Interaction configuration
 */
export interface InteractionConfig<TNode> {
  onNodeClick?: (node: TNode) => void;
  onNodeHover?: (node: TNode | null) => void;
  onCanvasClick?: () => void;

  // Enable/disable interactions
  enableZoom?: boolean;
  enablePan?: boolean;
  enableDrag?: boolean;

  // Zoom behavior
  zoomBounds?: [number, number];  // [min, max] zoom levels

  // Link visibility at different zoom levels
  hideLinksBelowZoom?: number;

  // Label fade behavior
  labelFadeInStart?: number;
  labelFadeInEnd?: number;
}

/**
 * Controls configuration (UI overlays on graph)
 */
export interface ControlsConfig {
  // Filter controls
  showFind?: boolean;
  findFilter?: <TNode>(searchTerm: string, nodes: TNode[]) => TNode[];

  // Display controls
  showNodeCount?: boolean;
  showLegend?: boolean;

  // Layout controls
  enableDagToggle?: boolean;
  enableLayoutReset?: boolean;

  // Zoom controls
  showZoomButtons?: boolean;
}

/**
 * Graph state (selections, highlights, etc)
 */
export interface GraphState {
  selectedNodeId?: string;
  hoveredNodeId?: string;
  searchTerm?: string;
  highlightedNodeIds?: string[];
}

/**
 * Graph link type (must have source, target, and linkType)
 */
export interface GraphLink {
  source: string;
  target: string;
  linkType: string;
}

/**
 * Main configuration object for the unified Graph component
 */
export interface GraphConfig<TNode extends { id: string; name: string }, TLink extends GraphLink> {
  // Data
  nodes: TNode[];
  links: TLink[];

  // Layout
  layout: LayoutConfig;

  // Styling
  styling: StylingConfig<TNode, TLink>;

  // Interactions
  interactions: InteractionConfig<TNode>;

  // Controls (optional)
  controls?: ControlsConfig;

  // State (optional)
  state?: GraphState;

  // Viewport size (optional, auto-detected if not provided)
  width?: number;
  height?: number;
}

/**
 * Ref handle for programmatic graph control
 */
export interface GraphHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (k: number, ms?: number) => void;
  getZoom: () => number;
  centerAt: (x: number, y: number, ms?: number) => void;
  centerNode: (nodeId: string, ms?: number) => void;
}
