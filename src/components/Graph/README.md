# Graph Module

A small force-graph module built on `react-force-graph-2d`. The module is centered around a single `Graph` component with thin adapters for domain data.

## What This Module Contains

- `Graph.tsx` - core canvas rendering, forces, interaction, and display controls.
- `graphStyle.ts` - shared styling and label/size helpers.
- `ArtistsForceGraph.tsx` - adapter for artist nodes/links (used by the artists and collection views).
- `GenresForceGraph.tsx` - adapter for genre nodes/links.
- `index.ts` - exports the component and types.

## How It Fits Together

```
Domain data
  ->
Adapter (ArtistsForceGraph / GenresForceGraph)
  -> (maps to SharedGraphNode<T> + links)
Graph (forces + rendering)
  ->
Canvas via react-force-graph-2d
```

## Collection Mode

There is no separate Collections graph component. Collection mode uses the artists graph with a filtered subset of the user's added artists.

## Key Behaviors

- Graphs stay mounted and are paused/resumed via the `show` prop so physics state persists between views.
- A data signature is used to reheat the simulation only when node/link topology changes.
- Labels fade in/out based on zoom and optional priority label logic.
- Popularity clustering can enable a radial layout (concentric rings) via `d3.forceRadial`.

## Entry Points Used by the App

- Artists view -> `ArtistsForceGraph.tsx`
- Genres view -> `GenresForceGraph.tsx`

For exact prop shapes and rendering hooks, see `Graph.tsx` and `graphStyle.ts`.
