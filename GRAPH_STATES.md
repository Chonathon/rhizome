# Graph States & Navigation

## Graph States Overview

### Genres Graph
- **State**: `graph = 'genres'`
- **Label**: Explore / Genres
- **Shows**:
  - Genre nodes
  - Subgenre links
  - Influence links
  - Fusion links
- **Controls**:
  - Cluster mode filter (subgenre, influence, fusion)
  - DAG mode toggle
  - Find filter
  - Node size/count limiter
- **Navigation**:
  - Click genre node → Artists Graph (filtered by that genre)
  - "All Artists" button → Artists Graph

### Artists Graph (Explore)
- **State**: `graph = 'artists'`
- **Label**: Explore / Artists
- **Shows**:
  - Artists filtered by selected genre(s)
  - Genre-based coloring (mixed colors for multi-genre artists)
  - Full network of artists in those genres
- **Controls**:
  - Genre Filter (select/change genres)
  - Find Filter
  - Node size/count limiter
- **Filter Scope**: Scoped to Explore view only (independent from Collections)
- **Navigation**:
  - Click artist node → Opens Artist Info panel
  - Click artist badge → Opens Artist Info panel

### Collections Graph
- **State**: `graph = 'collections'`
- **Label**: Collections
- **Shows**:
  - User's saved artists
  - Custom organization (TBD)
- **Controls**:
  - TBD (may include sorting, custom filtering, grouping)
  - Independent from Explore filters
- **Filter Scope**: Independent state, does NOT inherit Explore filters
- **Data Source**: User's saved artists (from backend/state, TBD)
- **Navigation**:
  - Click artist node → Opens Artist Info panel

### Similar Artists Graph
- **State**: `graph = 'similarArtists'`
- **Label**: Artists (with context badge)
- **Purpose**: The "Go to Artist" view - artist-centric, focused context
- **Shows**:
  - Selected artist at center
  - Similar artists connected in star topology
  - All similar artists (not genre-filtered)
- **Visual Indicator**: Badge showing "Similar artists for {name} ×"
- **Controls**:
  - Click × or Artists tab to exit
  - No filters (shows all loaded similar artists)
- **Data Source**: `artist.similar` names looked up in all loaded artists
- **Navigation**:
  - Click another artist node → Rebuild graph centered on new artist
  - Click × badge → Return to Artists Graph (Explore)
  - Click Artists tab → Return to Artists Graph (Explore)

## Artist Info Panel
- **Type**: Overlay/drawer (not a graph state)
- **Shows**:
  - Artist details (title is clickable)
  - Bio, stats
  - Similar artists (badges)
  - Genres (badges)
- **Available From**: Artists Graph, Collections Graph, Similar Artists Graph
- **Primary Action**:
  - **Click artist title** → "Go to Artist"
    - Navigates to Similar Artists Graph (star topology)
    - Changes to `graph = 'similarArtists'` state
    - Artist-centric view with one degree of separation
- **Secondary Actions**:
  - **View Related Artists** button
    - Switches to/filters Artists Graph (Explore) by artist's genres
    - Genre-focused exploration (broader context)
    - Stays in `graph = 'artists'` state
  - **View Similar Artist Graph** button
    - Same as clicking artist title (redundant but explicit)
    - Navigates to Similar Artists Graph
    - Changes to `graph = 'similarArtists'` state

## State Transitions

### Navigation Flows
- **Genres → Artists (Explore)**
  - Trigger: Click genre node, "All Artists" button, or Artists tab
  - Effect: Loads artists for selected genre(s), switches to Explore view

- **Any State → Collections**
  - Trigger: Collections tab/nav button
  - Effect: Switches to Collections graph, preserves Explore filters independently

- **Collections → Artists (Explore)**
  - Trigger: Artists/Explore tab
  - Effect: Returns to Explore view with previously set filters

- **Artists/Collections → Artist Info**
  - Trigger: Click artist node or artist badge
  - Effect: Opens info panel overlay

- **Artist Info → Similar Artist Graph ("Go to Artist")**
  - Trigger: Click artist title OR "View Similar Artist Graph" button
  - Effect: Changes to `similarArtists` state, shows star topology
  - Purpose: Artist-centric view, one degree of separation
  - Note: This is the primary "go to this artist" action

- **Artist Info → Related Artists (filtered Explore)**
  - Trigger: "View Related Artists" button
  - Effect: Switches to/filters Explore graph by artist's genres
  - Purpose: Genre-focused exploration (broader context)

- **Similar Artists → Artists (Explore)**
  - Trigger: Click × badge or Artists tab
  - Effect: Restores full artist list, returns to Explore

- **Similar Artists → New Similar Artist Graph**
  - Trigger: Click another artist node
  - Effect: Rebuilds graph centered on new artist

## Data Flow

### Data Sources
- **Genres Graph**: `useGenres()` → genres, genreLinks
- **Artists Graph (Explore)**: `useArtists(selectedGenreIDs)` → artists, artistLinks
- **Collections Graph**: `useCollections()` or user state (TBD) → user's saved artists
- **Similar Artists Graph**: `artist.similar` names → looked up in loaded artists array

### Filter Scoping
- **Explore (Artists) Filters**:
  - Genre Filter (selected genres)
  - Find Filter (search/filter artists)
  - Node count/limit settings
  - Preserved when switching between Genres → Artists → Similar Artists
  - **NOT** shared with Collections

- **Collections Filters**:
  - Independent filter state (TBD)
  - Does NOT inherit Explore filters
  - May have its own sorting, grouping, or filtering controls

- **Example Flow**:
  1. User sets Genre Filter to "Jazz" in Explore → Shows jazz artists
  2. User switches to Collections tab → Shows ALL saved artists (not filtered to Jazz)
  3. User switches back to Explore → Jazz filter is still active

## Tab/Navigation Behavior

### Tab Display
- **Genres Graph**: Genres tab active
- **Artists Graph**: Artists tab active, GenreFilter shows selected genres
- **Collections Graph**: Collections tab active (TBD: may show count/sort indicator)
- **Similar Artists Graph**: Artists tab active, Badge shows "Similar artists for {name} ×"

### Mobile/Desktop Consistency
- Similar Artists Graph treated as part of Artists view in navigation
- Highlights "Artists" button when `graph === 'artists' || graph === 'similarArtists'`
- Collections has its own navigation button separate from Artists/Explore

### UX Notes
- **"Go to Artist" action**: Click artist title → Similar Artists Graph
  - Simple, predictable, artist-centric
  - Every artist has same view structure (star topology)
  - One degree of separation from selected artist
- **"Explore Related" action**: "View Related Artists" button → Genre-filtered Explore
  - Genre-focused, broader context
  - Shows full network of artists in same genres
  - Multiple degrees of separation
- **Potential improvements**:
  - Consider removing "View Similar Artist Graph" button (redundant with title click)
  - Consider renaming "View Related Artists" to "Explore Related Genres" for clarity

---

# Unified Graph API Design

## Overview
- Refactor to single `<Graph>` component
- Flexible API supports different data types, layouts, interactions
- Configuration-based approach

## Graph Capabilities

### Common Capabilities (All Graphs)
- Node rendering with custom styling
- Link rendering with custom styling
- Force simulation (d3-force)
- Zoom/pan controls
- Node click/hover interactions
- Find/search with highlighting
- Custom node colors
- Loading states
- Error states

### Graph-Specific Capabilities

#### Genres Graph
- Multiple link types (subgenre, influence, fusion)
- Link filtering by cluster mode
- DAG mode (directed acyclic graph layout)
- Color by root genre
- Size by metric (listener/artist count)

#### Artists Graph (Explore)
- Genre filtering
- Color by genre (mixed colors for multi-genre)
- Node limit by metric threshold

#### Collections Graph
- Custom organization (user-defined, TBD)
- Independent filters (scoped to collections)
- Persistence (save/load user's collection state)

#### Similar Artists Graph
- Star topology (fixed center node layout)
- Single link type ('similar' only)
- Dynamic rebuild on artist change

## API Interface

### GraphConfig Type
```typescript
interface GraphConfig<TNode, TLink> {
  nodes: TNode[]
  links: TLink[]
  layout: LayoutConfig
  styling: StylingConfig<TNode, TLink>
  interactions: InteractionConfig<TNode>
  controls?: ControlsConfig
  state?: GraphState
}
```

### Layout Config
```typescript
interface LayoutConfig {
  type: 'force' | 'dag' | 'star' | 'custom'
  forceConfig?: {
    charge?: number
    linkDistance?: number
    collisionRadius?: number
  }
  dagConfig?: {
    direction: 'TB' | 'BT' | 'LR' | 'RL'
    nodeSpacing?: number
  }
  starConfig?: {
    centerNodeId: string
    radiusSpacing?: number
  }
}
```

### Styling Config
```typescript
interface StylingConfig<TNode, TLink> {
  // Node styling
  nodeRadius: (node: TNode) => number
  nodeColor: (node: TNode) => string
  nodeLabel?: (node: TNode) => string
  nodeImage?: (node: TNode) => string | undefined

  // Link styling
  linkColor?: (link: TLink) => string
  linkWidth?: (link: TLink) => number
  linkType?: (link: TLink) => string

  // Conditional styling
  selectedNodeColor?: string
  hoveredNodeColor?: string
  highlightNeighbors?: boolean
}
```

### Interaction Config
```typescript
interface InteractionConfig<TNode> {
  onNodeClick?: (node: TNode) => void
  onNodeHover?: (node: TNode | null) => void
  onCanvasClick?: () => void
  enableZoom?: boolean
  enablePan?: boolean
  enableDrag?: boolean
}
```

### Controls Config
```typescript
interface ControlsConfig {
  showFind?: boolean
  findFilter?: (searchTerm: string, nodes: TNode[]) => TNode[]
  showNodeCount?: boolean
  showLegend?: boolean
  enableDagToggle?: boolean
  enableLayoutReset?: boolean
}
```

### Graph State
```typescript
interface GraphState {
  selectedNodeId?: string
  hoveredNodeId?: string
  searchTerm?: string
  highlightedNodeIds?: string[]
}
```

## Configuration Examples

### Genres Graph
- **Layout**: DAG or force (toggle)
- **Node Radius**: Based on metric (listeners/artist count)
- **Node Color**: From genreColorMap
- **Link Color**: By link type (subgenre, influence, fusion)
- **Link Width**: Subgenre = 2, others = 1
- **Highlight Neighbors**: true
- **Controls**: Find, node count, DAG toggle

### Artists Graph (Explore)
- **Layout**: Force simulation
- **Node Radius**: Based on metric (listeners/playcount)
- **Node Color**: Mixed genre colors (getArtistColor)
- **Node Image**: Artist avatar
- **Highlight Neighbors**: false
- **Controls**: Find, node count

### Collections Graph
- **Layout**: Force or custom
- **Node Radius**: Uniform or custom
- **Node Color**: By genre (getArtistColor)
- **Node Image**: Artist avatar
- **Controls**: Find, node count, custom controls (TBD)
- **State**: Independent from Explore

### Similar Artists Graph
- **Layout**: Star topology (center = selected artist)
- **Node Radius**: Center larger (20), others smaller (12)
- **Node Color**: By genre
- **Link Color**: Uniform gray
- **Enable Drag**: false (fixed layout)
- **Controls**: No find/count (simple graph)

## Component Usage
```typescript
<Graph
  config={
    graph === 'genres' ? genresGraphConfig :
    graph === 'artists' ? artistsGraphConfig :
    graph === 'collections' ? collectionsGraphConfig :
    similarArtistsGraphConfig
  }
  loading={loading}
  error={error}
/>
```

## Migration Strategy
1. **Phase 1**: Create unified `<Graph>` component with full API
2. **Phase 2**: Refactor GenresForceGraph to use new API
3. **Phase 3**: Refactor ArtistsForceGraph to use new API
4. **Phase 4**: Implement Collections using new API
5. **Phase 5**: Remove old graph components

## Benefits
- Code reusability (single graph implementation)
- Consistency (uniform behavior across all graphs)
- Maintainability (changes in one place)
- Extensibility (easy to add new graph types)
- Type safety (full TypeScript support with generics)
- Performance (optimizations benefit all graphs)
- Testing (test once, validate everywhere)

## Extensibility Options

### Adding New Graph Types
- Create new configuration object following `GraphConfig` interface
- No need to create new component

### Custom Layouts
- Use `layout.type = 'custom'`
- Provide custom layout function
- Return positioned nodes

### Plugin System (Future)
- Consider plugin architecture for advanced features
- Example: clustering, minimap, annotations
- Installable/uninstallable plugins
