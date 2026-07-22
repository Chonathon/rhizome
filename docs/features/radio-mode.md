# Radio Mode (Guided Journeys)

## UX intent

"Radio with a map": the most lean-back, game-loop-like way to use Rhizome. Pick a starting artist and the app travels the artist graph for you — one top track per stop — deliberately steering toward lesser-known similar artists so listening doubles as discovery. The path you take draws as a glowing trail through the graph and is shareable as a URL.

## How it behaves

- **Start**: Radio button (or "Start radio" in the ⋯ menu) on any artist's info drawer.
- **Stops**: each stop auto-plays the artist's single top track and opens the bio card. When the track ends, the journey auto-advances (radio loop). The sidebar player's Next button also skips to the next stop.
- **Next stop**: exactly one proposed next stop at a time, drawn from a candidate pool (up to 8) weighted toward artists with fewer listeners than the current stop (`(current/candidate)^0.6`, clamped). Shuffle cycles the pool. Options with 10× fewer listeners get a "gem" badge.
- **Dead ends**: if a stop has no unvisited similar artists, the journey hops out via the discovery-hops graph (`/artists/hops`) — first from the current stop, then from anywhere along the path.
- **Graph**: `graph = 'radio'` shows the visited path chained in visit order plus the single next stop. The trail renders along the same curved link beziers as normal edges, and a flow force drifts stops left-to-right by visit order (organic y). Clicking the next-stop node advances; clicking a visited node reopens its card.
- **Persistence across views**: switching to Genres/Artists or exploring never ends the journey — playback and auto-advance continue (quietly: no bio card or history entries while exploring). A map button returns to the journey graph. Only ✕ ends the radio.
- **Placement**: on desktop with the sidebar expanded, the player card *becomes* the radio — the radio header ("Radio · n stops" + like/save/link/end/map) sits above the player's transport row (play, track title, progress bar, next), and the journey controls (next stop, shuffle, saved radios) sit below it, all one section. If the player is closed while a journey is active, or between journeys when saved radios exist, a standalone section renders above the player slot instead. When the sidebar is collapsed or on mobile, it falls back to a compact floating pill at top-center.
- **Saved radios**: the bookmark button saves the current path to localStorage (max 20, deduped by path). The sidebar section lists saved radios — visible even between journeys — with resume (refetches stops and continues) and delete.
- **Sharing**: the path mirrors into a `journey` URL param (comma-separated artist IDs, replaceState — no history spam). Opening a shared link restores the journey without autoplay.

## Why it works this way

- One track per stop keeps the journey moving through artists, not discographies — maximizes discovery per minute.
- A single proposed next stop (vs. a grid of options) keeps the "what's in front of you" unambiguous; shuffle preserves agency.
- The journey survives exploration because radio is a listening feature, not a graph view — like music keeps playing while you browse.
- No skip button in the radio UI itself: the next-stop row advances on click and the player's Next covers lean-back skipping.

## Implementation pointers

- `src/hooks/useJourney.ts` — journey state machine, candidate weighting, hops fallback, URL param, saved radios (localStorage `savedRadios`).
- `src/components/JourneyPanel.tsx` — player-embedded radio (two portals sandwiching the player's transport row: `#sidebar-player-radio-header-slot` + `#sidebar-player-radio-slot`, rendered by SidebarPlayer when `radioActive`), standalone sidebar fallback (`#sidebar-radio-slot` in AppSideBar), and floating pill.
- `src/components/Graph/Graph.tsx` — `trailNodeIds` (glowing curved trail, pre-frame) and `flowLayout` (left-to-right x-force).
- `src/components/SidebarPlayer.tsx` — `onTrackEnded` (auto-advance) and `onSkipNext` (Next button override when no playlist).
- `src/App.tsx` — orchestration: `focusJourneyStop`, quiet advance, `'radio'` graph state, restore-from-URL, saved-radio resume.
