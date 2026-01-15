# Graph Component

A streamlined, performance-focused graph visualization component with centralized physics, pluggable rendering, and simple adapter pattern.

## Philosophy

- **Centralized physics**: One set of standardized force settings for all graphs
- **Simple interface**: Direct props, no configuration objects
- **Adapter pattern**: Thin wrappers that map domain data → simple graph nodes
- **Pluggable rendering**: Optional custom renderers for nodes, selection, labels
- **Performance first**: Graph persistence, data signature tracking, smart reheating

## Architecture

```
Domain Data (Artist[], Genre[], Collection[])
        ↓
Adapter (ArtistsForceGraph, GenresForceGraph, ...)
        ↓ (maps to SharedGraphNode<T>)
Graph Component (centralized physics + rendering)
        ↓ [Optional: Custom Renderers]
        ↓
Canvas Rendering → react-force-graph-2d
```

## Quick Start

```typescript
import Graph, { type GraphHandle, type SharedGraphNode } from "./Graph";

// 1. Create adapter component
const MyGraphAdapter = ({ items, onItemClick }) => {
  const nodes = items.map(item => ({
    id: item.id,
    label: item.name,
    radius: 10,
    color: "#ff6b9d",
    data: item,  // Preserve original data
  }));

  return (
    <Graph
      nodes={nodes}
      links={[]}
      onNodeClick={onItemClick}
    />
  );
};
```

## Type System

### Core Interfaces

```typescript
// Generic node structure
interface SharedGraphNode<T = unknown> {
  id: string;           // Unique identifier
  label: string;        // Display name
  radius: number;       // Visual size (typically 6-32px)
  color?: string;       // Optional color (falls back to theme default)
  data: T;              // Original domain object preserved
}

// Edge structure
interface SharedGraphLink {
  source: string;       // Node ID
  target: string;       // Node ID
}

// Component props
interface GraphProps<T, L extends SharedGraphLink> {
  // Core Data
  nodes: SharedGraphNode<T>[];
  links: L[];

  // Display
  show?: boolean;              // Visibility (default: true)
  loading?: boolean;           // Show loading indicator
  width?: number;              // Canvas width
  height?: number;             // Canvas height

  // Interaction
  selectedId?: string;         // Highlighted node ID
  onNodeClick?: (node: T) => void;
  onNodeHover?: (node: T | undefined) => void;

  // Physics
  dagMode?: boolean;           // Directed acyclic graph layout
  autoFocus?: boolean;         // Auto-center on selected node (default: true)

  // Custom Rendering (optional)
  renderNode?: NodeRenderer<T>;
  renderSelection?: SelectionRenderer<T>;
  renderLabel?: LabelRenderer<T>;

  // Radial layout (for popularity stratification with concentric rings)
  radialLayout?: {
    enabled: boolean;
    nodeToRadius: Map<string, number>;
    strength?: number;  // Force strength (default: 0.3)
  };
}

// Imperative API
interface GraphHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (k: number, ms?: number) => void;
  getZoom: () => number;
}
```

## Usage Examples

### Artists Graph

```typescript
<ArtistsForceGraph
  ref={graphRef}
  artists={artists}
  artistLinks={links}
  onNodeClick={handleClick}
  selectedArtistId={selectedId}
  computeArtistColor={getColor}
  show={isVisible}
  loading={isLoading}
  autoFocus={true}
/>
```

### Genres Graph

```typescript
<GenresForceGraph
  ref={graphRef}
  graphData={genreGraphData}
  onNodeClick={handleClick}
  selectedGenreId={selectedId}
  colorMap={colorMap}
  dag={dagMode}
  show={isVisible}
  loading={isLoading}
  autoFocus={true}
/>
```

## Key Features

### 1. Graph Persistence
Graphs stay mounted but hidden (`display:none`) - physics state survives view switches.

```typescript
// Switch between graphs without losing physics state
<Graph show={currentGraph === 'artists'} ... />
<Graph show={currentGraph === 'genres'} ... />
```

### 2. Data Signature Tracking
Only reheats simulation when node/link topology actually changes, not on every prop update.

### 3. Standardized Physics
One set of force settings for all views - consistent feel everywhere:
- Charge force: -200 (repulsion)
- Link distance: 90px
- Collision based on label dimensions
- Selected node anchor forces

### 4. Simple Adapters
Map domain data → simple graph nodes with radius/color logic. Adapters are lightweight (99-106 lines).

### 5. Pluggable Rendering
Override node shapes, selection indicators, or label styles without forking the component.

### 6. Type Safety
Full TypeScript generics with domain data preservation - callbacks receive original typed objects.

### 7. Radial Layout
For popularity-based stratification, nodes can be positioned in concentric rings using `d3.forceRadial`:

```typescript
<Graph
  nodes={nodes}
  links={links}
  radialLayout={{
    enabled: true,
    nodeToRadius: tierMap,  // Map<string, number> - nodeId -> radius from center
    strength: 0.3,          // Force strength (0-1)
  }}
/>
```

This is used with `listeners` clustering to arrange artists in concentric rings by popularity tier (popular at center, underground at outer ring).

## Custom Rendering

### When to Use Custom Renderers

Use custom renderers when you need:
- Different node shapes (stars, hearts, squares)
- Fill patterns or textures
- Icons, avatars, or images
- Badges or metadata overlays
- Different label positioning
- Custom selection indicators

### Render Contexts

Each renderer receives a rich context object with all necessary state:

```typescript
interface NodeRenderContext<T> {
  ctx: CanvasRenderingContext2D;  // Canvas 2D context
  node: SharedGraphNode<T>;       // Full node data
  x: number;                      // Screen position X
  y: number;                      // Screen position Y
  radius: number;                 // Node radius
  color: string;                  // Node color
  isSelected: boolean;            // Selection state
  isNeighbor: boolean;            // Connected to selected node
  isHovered: boolean;             // Hover state
  alpha: number;                  // Calculated opacity (0.15-1.0)
  theme: 'light' | 'dark' | undefined;
}

interface LabelRenderContext<T> extends NodeRenderContext<T> {
  label: string;                  // Label text
  labelAlpha: number;             // Label opacity (zoom-based)
  zoomLevel: number;              // Current zoom level
}
```

### Example: Custom Node with Dotted Stroke

```typescript
<Graph
  nodes={collectionNodes}
  links={collectionLinks}
  renderNode={(ctx) => {
    const { ctx: canvas, x, y, radius, color, alpha } = ctx;

    canvas.save();
    canvas.globalAlpha = alpha;

    // Fill
    canvas.fillStyle = color;
    canvas.beginPath();
    canvas.arc(x, y, radius, 0, 2 * Math.PI);
    canvas.fill();

    // Dotted stroke
    canvas.setLineDash([4, 4]);
    canvas.strokeStyle = color;
    canvas.lineWidth = 2;
    canvas.stroke();

    canvas.restore();
  }}
/>
```

### Example: Custom Selection Indicator (Glow Effect)

```typescript
<Graph
  nodes={nodes}
  links={links}
  renderSelection={(ctx) => {
    const { ctx: canvas, x, y, radius, color } = ctx;

    // Outer glow
    canvas.save();
    canvas.shadowBlur = 20;
    canvas.shadowColor = color;
    canvas.beginPath();
    canvas.arc(x, y, radius + 8, 0, 2 * Math.PI);
    canvas.strokeStyle = color;
    canvas.lineWidth = 4;
    canvas.stroke();
    canvas.restore();
  }}
/>
```

### Example: Label Inside Node

```typescript
<Graph
  nodes={nodes}
  links={links}
  renderLabel={(ctx) => {
    const { ctx: canvas, label, x, y, labelAlpha, theme } = ctx;

    if (labelAlpha <= 0) return;

    canvas.save();
    canvas.globalAlpha = labelAlpha;
    canvas.font = '10px Geist';
    canvas.textAlign = 'center';
    canvas.textBaseline = 'middle';
    canvas.fillStyle = theme === 'dark' ? '#fff' : '#000';
    canvas.fillText(label, x, y);  // Centered on node
    canvas.restore();
  }}
/>
```

### Default Renderers

If you don't provide custom renderers, these defaults are used:
- **Node**: Circular shape with opacity
- **Selection**: Ring at `radius + 4px` with `3px` stroke
- **Label**: Below node with zoom-based fade-in

## Creating New Graph Types

### Step-by-Step Guide

1. **Create adapter component**

```typescript
import { forwardRef, useMemo } from "react";
import Graph, { type GraphHandle, type SharedGraphNode } from "./Graph";
import { Collection, CollectionLink } from "@/types";

interface CollectionsForceGraphProps {
  collections: Collection[];
  collectionLinks: CollectionLink[];
  onNodeClick: (collection: Collection) => void;
  selectedCollectionId?: string;
  // ... other props
}

const CollectionsForceGraph = forwardRef<GraphHandle, CollectionsForceGraphProps>(
  ({ collections, collectionLinks, onNodeClick, selectedCollectionId }, ref) => {
    // ... implementation
  }
);
```

2. **Map domain data to SharedGraphNode<T>**

```typescript
const graphNodes = useMemo<SharedGraphNode<Collection>[]>(() => {
  return collections.map((collection) => ({
    id: collection.id,
    label: collection.name,
    radius: 15,  // Fixed or calculated
    color: "#ff6b9d",  // Your color logic
    data: collection,  // Preserve original
  }));
}, [collections]);
```

3. **Normalize links**

```typescript
const graphLinks = useMemo(() => {
  return collectionLinks
    .map((link) => {
      const source = typeof link.source === "string"
        ? link.source
        : link.source?.id;
      const target = typeof link.target === "string"
        ? link.target
        : link.target?.id;

      if (!source || !target) return undefined;

      return { source, target };
    })
    .filter(Boolean);
}, [collectionLinks]);
```

4. **Render Graph component**

```typescript
return (
  <Graph
    ref={ref}
    nodes={graphNodes}
    links={graphLinks}
    selectedId={selectedCollectionId}
    onNodeClick={onNodeClick}
    // Optional custom renderers
    renderNode={customNodeRenderer}
  />
);
```

5. **Export GraphHandle type**

```typescript
export type { GraphHandle };
export default CollectionsForceGraph;
```

### Complete Example: Collections Graph

```typescript
import { forwardRef, useMemo } from "react";
import Graph, {
  type GraphHandle,
  type SharedGraphNode,
  type NodeRenderContext
} from "./Graph";

const MIN_RADIUS = 10;
const MAX_RADIUS = 20;

const CollectionsForceGraph = forwardRef<GraphHandle, CollectionsForceGraphProps>(
  ({ collections, links, onNodeClick, selectedCollectionId }, ref) => {
    const graphNodes = useMemo<SharedGraphNode<Collection>[]>(() => {
      const counts = collections.map((c) => c.artistCount || 1);
      const min = Math.min(...counts);
      const max = Math.max(...counts);
      const denom = Math.max(1e-6, max - min);

      return collections.map((collection) => {
        const t = (collection.artistCount - min) / denom;
        const radius = MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);

        return {
          id: collection.id,
          label: collection.name,
          radius,
          color: "#ff6b9d",
          data: collection,
        };
      });
    }, [collections]);

    const customNodeRenderer = (ctx: NodeRenderContext<Collection>) => {
      const { ctx: canvas, x, y, radius, color, alpha } = ctx;

      canvas.save();
      canvas.globalAlpha = alpha;

      // Dotted stroke pattern
      canvas.fillStyle = color;
      canvas.beginPath();
      canvas.arc(x, y, radius, 0, 2 * Math.PI);
      canvas.fill();

      canvas.setLineDash([4, 4]);
      canvas.strokeStyle = color;
      canvas.lineWidth = 2;
      canvas.stroke();

      canvas.restore();
    };

    return (
      <Graph
        ref={ref}
        nodes={graphNodes}
        links={links}
        selectedId={selectedCollectionId}
        onNodeClick={onNodeClick}
        renderNode={customNodeRenderer}
      />
    );
  }
);

export type { GraphHandle };
export default CollectionsForceGraph;
```

## Module API Reference

### Exports from `./Graph`

```typescript
// Default export
export default Graph;  // Main component

// Core types
export type { GraphHandle }
export type { SharedGraphNode }
export type { SharedGraphLink }
export type { GraphProps }

// Render system types
export type { NodeRenderContext }
export type { SelectionRenderContext }
export type { LabelRenderContext }
export type { NodeRenderer }
export type { SelectionRenderer }
export type { LabelRenderer }
```

### Import Patterns

```typescript
// Import component with types
import Graph, {
  type GraphHandle,
  type SharedGraphNode,
} from "./Graph";

// Import render types for custom rendering
import Graph, {
  type NodeRenderContext,
  type NodeRenderer,
} from "./Graph";
```

## Performance Tips

### 1. Use Graph Persistence
Keep graphs mounted but hidden instead of unmounting:

```typescript
// ✅ Good - preserves physics state
<Graph show={isVisible} ... />

// ❌ Bad - resets physics on every mount
{isVisible && <Graph ... />}
```

### 2. Memoize Color Callbacks
Color computation functions should be wrapped in `useCallback`:

```typescript
const computeArtistColor = useCallback((artist: Artist) => {
  return getGenreColor(artist.genres);
}, [/* dependencies */]);
```

### 3. Keep Custom Renderers Lightweight
Avoid expensive operations or allocations inside render loops:

```typescript
// ❌ Bad - creates new array every render
renderNode={(ctx) => {
  const colors = [ctx.color, '#fff', '#000'];  // Allocation!
  // ...
}}

// ✅ Good - use passed values directly
renderNode={(ctx) => {
  const { color, alpha } = ctx;
  // ...
}}
```

### 4. Data Signature Optimization
Graph automatically tracks topology changes. Avoid unnecessary array/object recreations:

```typescript
// ✅ Good - stable reference
const [nodes] = useState(initialNodes);

// ❌ Bad - new reference every render
const nodes = artists.map(...);  // Should be memoized
```

## Troubleshooting

### Graph Not Centering on Selection

**Problem**: Selected node doesn't center when `autoFocus={true}`

**Solution**: Toggle autoFocus state to re-trigger:
```typescript
setAutoFocus(false);
setTimeout(() => setAutoFocus(true), 16);
```

### Performance Issues with Many Nodes

**Problem**: Laggy rendering with 2000+ nodes

**Solutions**:
1. Enable auto-pause: Already enabled by default (`autoPauseRedraw={true}`)
2. Reduce node count via filters
3. Simplify custom renderers
4. Check for unnecessary rerenders in parent

### Custom Renderer Not Being Called

**Problem**: Provided `renderNode` but still seeing circles

**Solution**: Ensure prop is passed correctly:
```typescript
// ✅ Correct
<Graph renderNode={myRenderer} />

// ❌ Wrong - wrapped in object
<Graph renderNode={{ fn: myRenderer }} />
```

### Type Errors with Generics

**Problem**: TypeScript complaining about node.data type

**Solution**: Specify generic explicitly:
```typescript
const graphNodes = useMemo<SharedGraphNode<Artist>[]>(() => {
  // TypeScript now knows data is Artist
}, []);
```

## Results

**Code Metrics**:
- **750 total lines** (Graph + adapters + utilities)
- **71% reduction** in adapter complexity (347 → 99 lines per adapter)
- **Centralized physics** in single location
- **Zero breaking changes** - fully backward compatible

**Benefits**:
- Better performance (graph persistence, smart reheating)
- Easier to maintain (no config objects, simple adapters)
- Extensible (pluggable rendering system)
- Type-safe (full TypeScript generics)
- Consistent (standardized physics across all graphs)

**Supported Graph Types**:
- Artists (by listener count, genre colors)
- Genres (by artist count, root genre colors)
- Similar Artists (star topology)
- Collections (coming soon - custom styling)
