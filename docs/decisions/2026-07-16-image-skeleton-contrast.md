# Image loading skeletons use muted-foreground/20, not the shadcn Skeleton's bg-muted

**Date**: 2026-07-16
**Area**: Visual Design
**Status**: Active

## Context

We added a reusable `ImageWithFallback` component so every artist/genre image shows a loading state while it fetches and a graceful fallback on broken URLs. The first implementation used `bg-muted animate-pulse` for the skeleton — the same recipe as `src/components/ui/skeleton.tsx`. In practice the loading state was invisible: users reported never seeing it.

Debugging (computed-style inspection under network throttling) showed the skeleton was rendering and animating correctly, but `--muted` in this theme is oklch 0.95 lightness — only ~5% darker than the white card background. `animate-pulse` drops the element to 50% opacity at its trough, halving that difference to ~2.5%: imperceptible.

## Decision

`ImageWithFallback`'s skeleton uses `bg-muted-foreground/20` (a mid-grey at 20% alpha) instead of `bg-muted`. This survives the pulse trough with visible contrast in both light and dark themes, and roughly matches the tone of the app's existing initial-letter placeholders (`bg-muted` circles, `from-gray-300/30` gradients — which read fine because they sit at full opacity).

## Alternatives Considered

- **Keep `bg-muted` to match `ui/skeleton.tsx`** — consistent on paper, but empirically invisible against card backgrounds once pulsed. Consistency with an invisible loading state isn't worth much. The text skeletons in Search/players get away with `bg-muted` because they sit against slightly different backgrounds and larger shapes.
- **Change the `--muted` token or `ui/skeleton.tsx` globally** — too broad a blast radius; `bg-muted` is used as a fill in dozens of non-skeleton contexts.
- **Minimum skeleton display time** — would make the loading state always perceptible even on cached loads, but trades snappiness for consistency; rejected (cached images should appear instantly).

## Consequences

- Image loading skeletons are visibly darker than text skeletons (`ui/skeleton.tsx`). This is intentional — do not "normalize" `ImageWithFallback` back to `bg-muted` for consistency, or the loading state disappears again. An inline comment in the component guards this.
- On fast/cached loads the skeleton still only flashes for milliseconds; that's by design.
