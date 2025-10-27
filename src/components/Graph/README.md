# Simplified Graph Component

A streamlined, performance-focused graph visualization component with centralized physics and simple adapter pattern.

## Philosophy

- **Centralized physics**: One set of standardized force settings for all graphs
- **Simple interface**: Direct props, no configuration objects
- **Adapter pattern**: Thin wrappers that map domain data → simple graph nodes
- **Performance first**: Graph persistence, data signature tracking, smart reheating

## Architecture

```
Domain Data (Artist[], Genre[])
        ↓
Adapter (ArtistsForceGraph, GenresForceGraph)
        ↓ (maps to SharedGraphNode)
Graph Component (centralized rendering + physics)
        ↓
ForceGraph (react-force-graph-2d)
```

## Usage Example

```typescript
// Artists
<ArtistsForceGraph
  ref={graphRef}
  artists={artists}
  artistLinks={links}
  onNodeClick={handleClick}
  selectedArtistId={selectedId}
  computeArtistColor={getColor}
  show={isVisible}
  loading={isLoading}
/>

// Genres
<GenresForceGraph
  ref={graphRef}
  graphData={genreGraphData}
  onNodeClick={handleClick}
  selectedGenreId={selectedId}
  colorMap={colorMap}
  dag={dagMode}
  show={isVisible}
  loading={isLoading}
/>
```

## Key Features

### 1. Graph Persistence
Graphs stay mounted but hidden (display:none) - physics state survives view switches

### 2. Data Signature Tracking
Only reheats simulation when node/link topology actually changes

### 3. Standardized Physics
One set of force settings for all views - consistent feel everywhere

### 4. Simple Adapters
Map domain data → simple graph nodes with radius/color logic

## Ref API

```typescript
interface GraphHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (k: number, ms?: number) => void;
  getZoom: () => number;
}
```

## Results

- **62% less code** (1,450 → 556 lines)
- **Better performance** (graph persistence, smart reheating)
- **Smaller bundle** (1,038.60 kB → 1,034.99 kB)
- **Easier to maintain** (no config objects, simple adapters)
