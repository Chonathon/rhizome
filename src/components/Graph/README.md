# Unified Graph Component

A flexible, configuration-based graph visualization component supporting multiple layouts, custom styling, and rich interactions.

## Features

- **Multiple Layout Types**: Force-directed, DAG (Directed Acyclic Graph), Star topology, and custom layouts
- **Function-based Styling**: Define node and link appearance through functions
- **Rich Interactions**: Click, hover, zoom, pan with customizable behaviors
- **Performance Optimizations**: Link hiding at low zoom, label fading, curved link thresholds
- **Type-safe**: Full TypeScript support with generics
- **Programmatic Control**: Expose zoom/pan methods via ref

## Basic Usage

```tsx
import { Graph } from '@/components/Graph';
import { GraphConfig, GraphHandle } from '@/types/graph';
import { useRef } from 'react';

function MyGraph() {
  const graphRef = useRef<GraphHandle>(null);

  const config: GraphConfig<MyNode, MyLink> = {
    nodes: myNodes,
    links: myLinks,

    layout: {
      type: 'force',
      forceConfig: {
        charge: -100,
        linkDistance: 70,
      },
    },

    styling: {
      nodeRadius: (node) => 10,
      nodeColor: (node) => node.color,
      nodeLabel: (node) => node.name,
    },

    interactions: {
      onNodeClick: (node) => console.log('Clicked:', node),
      enableZoom: true,
      enablePan: true,
    },
  };

  return (
    <>
      <Graph ref={graphRef} config={config} />
      <button onClick={() => graphRef.current?.zoomIn()}>Zoom In</button>
    </>
  );
}
```

## Configuration Examples

### Genres Graph (DAG Layout)

```tsx
import { createGenresGraphConfig } from '@/components/Graph/configs';

const config = createGenresGraphConfig({
  genres: myGenres,
  links: myLinks,
  colorMap: genreColorMap,
  onGenreClick: handleGenreClick,
  selectedGenreId: selectedId,
  dag: true, // Toggle DAG mode
});

<Graph config={config} />
```

### Artists Graph (Force Layout)

```tsx
import { createArtistsGraphConfig } from '@/components/Graph/configs';

const config = createArtistsGraphConfig({
  artists: myArtists,
  links: myLinks,
  computeArtistColor: (artist) => getArtistColor(artist),
  onArtistClick: handleArtistClick,
  selectedArtistId: selectedId,
});

<Graph config={config} />
```

### Similar Artists Graph (Star Layout)

```tsx
import { createSimilarArtistsGraphConfig } from '@/components/Graph/configs';

const config = createSimilarArtistsGraphConfig({
  centerArtist: selectedArtist,
  similarArtists: similarArtistsList,
  links: similarLinks,
  computeArtistColor: (artist) => getArtistColor(artist),
  onArtistClick: handleArtistClick,
});

<Graph config={config} />
```

## API Reference

### GraphConfig

```typescript
interface GraphConfig<TNode, TLink> {
  // Data
  nodes: TNode[];
  links: TLink[];

  // Layout configuration
  layout: LayoutConfig;

  // Styling configuration
  styling: StylingConfig<TNode, TLink>;

  // Interaction configuration
  interactions: InteractionConfig<TNode>;

  // Controls configuration (optional)
  controls?: ControlsConfig;

  // State (optional)
  state?: GraphState;

  // Viewport size (optional)
  width?: number;
  height?: number;
}
```

### LayoutConfig

```typescript
interface LayoutConfig {
  type: 'force' | 'dag' | 'star' | 'custom';

  // Force-directed layout
  forceConfig?: {
    charge?: number;           // Repulsion strength (negative)
    linkDistance?: number;     // Target distance between nodes
    collisionRadius?: number;  // Collision detection multiplier
    centerStrength?: number;   // Centering force (0-1)
  };

  // DAG layout
  dagConfig?: {
    direction: 'TB' | 'BT' | 'LR' | 'RL';
    nodeSpacing?: number;
    levelSpacing?: number;
  };

  // Star topology
  starConfig?: {
    centerNodeId: string;
    radiusSpacing?: number;
  };

  // Custom layout function
  customLayout?: (nodes, links) => nodes;
}
```

### StylingConfig

```typescript
interface StylingConfig<TNode, TLink> {
  // Node styling (required)
  nodeRadius: (node: TNode) => number;
  nodeColor: (node: TNode) => string;

  // Node styling (optional)
  nodeLabel?: (node: TNode) => string;
  nodeImage?: (node: TNode) => string | undefined;

  // Link styling (optional)
  linkColor?: (link: TLink) => string;
  linkWidth?: (link: TLink) => number;
  linkCurvature?: (link: TLink) => number;

  // State-based styling (optional)
  selectedNodeColor?: string;
  hoveredNodeColor?: string;
  highlightNeighbors?: boolean;

  // Performance settings (optional)
  curvedLinksAbove?: number;
  maxLinksToShow?: number;
  minLabelPx?: number;
  strokeMinPx?: number;
}
```

### InteractionConfig

```typescript
interface InteractionConfig<TNode> {
  // Event handlers
  onNodeClick?: (node: TNode) => void;
  onNodeHover?: (node: TNode | null) => void;
  onCanvasClick?: () => void;

  // Interaction toggles
  enableZoom?: boolean;
  enablePan?: boolean;
  enableDrag?: boolean;

  // Zoom behavior
  zoomBounds?: [number, number];
  hideLinksBelowZoom?: number;

  // Label fade
  labelFadeInStart?: number;
  labelFadeInEnd?: number;
}
```

### GraphHandle (Ref API)

```typescript
interface GraphHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (k: number, ms?: number) => void;
  getZoom: () => number;
  centerAt: (x: number, y: number, ms?: number) => void;
  centerNode: (nodeId: string, ms?: number) => void;
}
```

## Layout Types

### Force-Directed Layout

Natural, physics-based positioning where nodes repel each other and links pull connected nodes together.

**Best for**: General-purpose graphs, exploring connections, organic layouts

**Configuration**:
```typescript
layout: {
  type: 'force',
  forceConfig: {
    charge: -100,        // Repulsion between nodes
    linkDistance: 70,    // Desired distance between connected nodes
    centerStrength: 0.1, // How strongly to pull toward center
  }
}
```

### DAG Layout

Hierarchical layout for directed acyclic graphs. Nodes are arranged in levels based on their relationships.

**Best for**: Genre hierarchies, taxonomies, dependency trees

**Configuration**:
```typescript
layout: {
  type: 'dag',
  dagConfig: {
    direction: 'TB',     // Top-to-bottom (or LR, RL, BT)
    levelSpacing: 200,   // Vertical spacing between levels
  },
  forceConfig: {
    charge: -1230,       // Stronger repulsion for DAG
    linkDistance: 150,
  }
}
```

### Star Topology

Fixed layout with one central node and others arranged in a circle around it.

**Best for**: Similar artists, single-artist focus, one degree of separation

**Configuration**:
```typescript
layout: {
  type: 'star',
  starConfig: {
    centerNodeId: 'artist-123',
    radiusSpacing: 200,  // Distance from center to outer nodes
  }
}
```

### Custom Layout

Provide your own positioning function.

```typescript
layout: {
  type: 'custom',
  customLayout: (nodes, links) => {
    return nodes.map((node, i) => ({
      ...node,
      fx: i * 50,  // Fixed x position
      fy: i * 50,  // Fixed y position
    }));
  }
}
```

## Performance Tips

### Large Graphs (1000+ nodes)

```typescript
styling: {
  // Hide links when zoomed out
  maxLinksToShow: 6000,

  // Use straight links to reduce rendering cost
  curvedLinksAbove: 1500,

  // Reduce label clutter
  minLabelPx: 8,
}

interactions: {
  // Hide links at low zoom levels
  hideLinksBelowZoom: 0.35,

  // Faster label fade-in
  labelFadeInStart: 0.5,
  labelFadeInEnd: 1.0,
}
```

### Many Links (5000+)

- Use `maxLinksToShow` to hide links until zoomed in
- Set `curvedLinksAbove` to use straight lines
- Consider filtering links based on importance

## Advanced Features

### Selection and Highlighting

The graph automatically highlights selected nodes and their neighbors when `state.selectedNodeId` is set:

```typescript
state: {
  selectedNodeId: 'node-123',
}
```

Selected nodes are:
- Enlarged (1.4x radius)
- Fully opaque
- Surrounded by a highlight ring
- Always show label (alpha = 1)

Neighbors are:
- Fully opaque
- Show label at high opacity (alpha = 0.85)

Non-related nodes are:
- Dimmed (alpha = 0.3)
- Label faded

### Hover Animation

Labels smoothly animate upward when hovering over nodes (4px offset with easing).

### Theme Support

The component automatically adapts to light/dark themes via `useTheme()`.

### Mobile Support

- Automatic mobile detection
- Adjusted initial zoom for smaller screens
- Mobile drawer offset when centering nodes

## Migration from Existing Graphs

### From GenresForceGraph

```typescript
// Before
<GenresForceGraph
  graphData={genreGraphData}
  onNodeClick={handleClick}
  dag={isDag}
  selectedGenreId={selectedId}
/>

// After
import { createGenresGraphConfig } from '@/components/Graph/configs';

const config = createGenresGraphConfig({
  genres: genreGraphData.nodes,
  links: genreGraphData.links,
  colorMap: genreColorMap,
  onGenreClick: handleClick,
  selectedGenreId: selectedId,
  dag: isDag,
});

<Graph config={config} />
```

### From ArtistsForceGraph

```typescript
// Before
<ArtistsForceGraph
  artists={artists}
  artistLinks={links}
  onNodeClick={handleClick}
  selectedArtistId={selectedId}
  computeArtistColor={getColor}
/>

// After
import { createArtistsGraphConfig } from '@/components/Graph/configs';

const config = createArtistsGraphConfig({
  artists: artists,
  links: links,
  computeArtistColor: getColor,
  onArtistClick: handleClick,
  selectedArtistId: selectedId,
});

<Graph config={config} />
```

## Extending the Component

### Custom Node Rendering

To add custom node rendering (e.g., images), modify the `nodeCanvasObject` section in [Graph.tsx](./Graph.tsx:385-447).

### Custom Controls

Add controls configuration to `GraphConfig` and implement UI components that interact with the graph via the ref API.

### Custom Link Types

Modify link rendering in the `linkColor` and `linkWidth` configuration functions to handle different link types.

## Type Safety

The Graph component is fully generic:

```typescript
<Graph<Artist, NodeLink> config={artistConfig} />
<Graph<Genre, GenreLink> config={genreConfig} />
```

TypeScript will enforce that your configuration functions receive the correct node/link types.

## Testing

Example test structure:

```typescript
import { render } from '@testing-library/react';
import { Graph } from '@/components/Graph';

test('renders graph with nodes', () => {
  const config = {
    nodes: [{ id: '1', name: 'Node 1' }],
    links: [],
    layout: { type: 'force' },
    styling: {
      nodeRadius: () => 10,
      nodeColor: () => '#fff',
    },
    interactions: {},
  };

  const { container } = render(<Graph config={config} />);
  expect(container.querySelector('canvas')).toBeInTheDocument();
});
```

## Troubleshooting

### Links not showing

- Check `linkVisibility` logic (may be hidden at low zoom)
- Ensure `maxLinksToShow` threshold isn't exceeded
- Verify link source/target IDs match node IDs

### Nodes overlapping

- Increase `charge` (more negative = more repulsion)
- Increase `collisionRadius` multiplier
- Increase `linkDistance`

### Performance issues

- Reduce link curvature with `curvedLinksAbove`
- Hide links at low zoom with `maxLinksToShow`
- Simplify custom styling functions
- Reduce node count with filtering

### Star layout not centering

- Verify `centerNodeId` exists in nodes array
- Check that `starConfig` is properly set
- Ensure simulation forces are disabled (handled automatically)

## License

Part of the rizhome project.
