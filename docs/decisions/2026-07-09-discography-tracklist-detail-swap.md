# Discography tracklist uses detail-swap navigation, not an inline grid accordion

**Date**: 2026-07-09
**Area**: UX
**Status**: Active

## Context

The first iteration of the artist drawer's Discography section opened an album's tracklist as a full-width panel spliced into the album grid (`col-span-full` after the clicked cover). This had three problems in a narrow, scrolling drawer: every album after the opened one reflowed to a new grid position; the panel landed on the row below the cover with no visual connector, so it read as detached from what you tapped; and the only way to close it was re-tapping the same cover — an invisible affordance.

## Decision

Tapping an album cover swaps the entire discography grid for that album's detail view: a "← All releases" back link, an album header (cover thumbnail, title, year/type/track count, Play button), and the tracklist. Tapping the back link returns to the grid. One thing is on screen at a time.

## Alternatives Considered

- **Covers-as-tabs**: keep the grid visible and dock the tracklist in a stable slot below the whole grid, with the selected cover ring-highlighted and an ✕ on the panel. Rejected because with larger discographies the selected cover and its panel can be a full scroll apart.
- **Literal tabs** (text chips per album): rejected because cover art is the strongest recognition cue in a discography and tabs discard it; album counts also vary too much for a tab row to stay tidy.
- **Keep the splice, add exits** (caret pointing at the clicked cover + explicit close button): rejected because it fixes the affordance but not the reflow/jumpiness.

## Consequences

- The grid disappears while viewing an album, so comparing/scanning other albums requires going back first. Acceptable in a drawer where vertical space is scarce.
- Matches the master→detail mental model from Spotify/Apple Music, so the back link is a conventional, discoverable exit.
- Implementation stays on the existing `openAlbumId` state; the detail view is a conditional render, so no new state machinery.
