import './App.css'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import { ChevronDown, Divide, TextSearch } from 'lucide-react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import useArtists from "@/hooks/useArtists";
import useGenres from "@/hooks/useGenres";
import ArtistsForceGraph from "@/components/ArtistsForceGraph";
import GenresForceGraph from "@/components/GenresForceGraph";
import {
  Artist, ArtistNodeLimitType, BadDataReport,
  Genre,
  GenreClusterMode,
  GenreGraphData, GenreNodeLimitType,
  GraphType, InitialGenreFilter,
  NodeLink, Tag, 
} from "@/types";
import { Header } from "@/components/Header"
import { motion, AnimatePresence } from "framer-motion";
import { ResetButton } from "@/components/ResetButton";
import { Toaster, toast } from 'sonner'
import { useMediaQuery } from 'react-responsive';
import { ArtistInfo } from './components/ArtistInfo'
import { Gradient } from './components/Gradient';
import Player from "@/components/Player";
import { Search } from './components/Search';
import {
  buildGenreColorMap,
  generateSimilarLinks,
  isRootGenre,
  isSingletonGenre,
  mixColors,
  primitiveArraysEqual,
  buildGenreTree,
  filterOutGenreTree,
  fixWikiImageURL, appendYoutubeWatchURL,
  envBoolean,
} from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ClusteringPanel from "@/components/ClusteringPanel";
import { ModeToggle } from './components/ModeToggle';
import { useRecentSelections } from './hooks/useRecentSelections';
import DisplayPanel from './components/DisplayPanel';
import NodeLimiter from './components/NodeLimiter'
import useSimilarArtists from "@/hooks/useSimilarArtists";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSideBar"
import { GenreInfo } from './components/GenreInfo';
import GenresFilter from './components/GenresFilter';
import {useTheme} from "next-themes";
import {
  DEFAULT_DARK_NODE_COLOR, DEFAULT_ARTIST_LIMIT_TYPE,
  DEFAULT_CLUSTER_MODE, DEFAULT_GENRE_LIMIT_TYPE,
  DEFAULT_NODE_COUNT,
  DEFAULT_LIGHT_NODE_COLOR,
  TOP_ARTISTS_TO_FETCH, EMPTY_GENRE_FILTER_OBJECT, SINGLETON_PARENT_GENRE, GENRE_FILTER_CLUSTER_MODE
} from "@/constants";
import RhizomeLogo from "@/components/RhizomeLogo";
import AuthOverlay from '@/components/AuthOverlay';
import ZoomButtons from '@/components/ZoomButtons';
import useHotkeys from '@/hooks/useHotkeys';
import { Scope, Mode, View } from '@/state/controlSchema'
import { useScopedControlsState } from '@/state/scopedControls'
import { computeScopeChanges, type ScopeChange } from '@/state/scopeChanges'
import { FeedbackOverlay } from '@/components/FeedbackOverlay'
const API_URL = envBoolean(import.meta.env.VITE_USE_LOCAL_SERVER)
  ? import.meta.env.VITE_LOCALHOST
  : (import.meta.env.VITE_SERVER_URL
      || (import.meta.env.DEV ? '/api' : `https://rhizome-server-production.up.railway.app`));

const MAX_DISCOVERY_DEGREE = 3;
const MAX_DISCOVERY_NEIGHBORS = 30;
const MAX_DISCOVERY_NODES = 400;
const MAX_DISCOVERY_REQUESTS_PER_DEPTH = 24;

function SidebarLogoTrigger() {
  const { toggleSidebar } = useSidebar()
  return (
    <div className="fixed hidden md:block top-[14px] left-3 z-[60] transition-opacity duration-300 md:group-has-data-[state=expanded]/sidebar-wrapper:opacity-0 md:group-has-data-[state=expanded]/sidebar-wrapper:pointer-events-none">
      <button onClick={toggleSidebar} className="group/logo">
        {/* <RhizomeLogo className="h-9 w-auto text-primary" /> */}
        <span className="sr-only">Toggle Sidebar</span>
      </button>
    </div>
  )
}

function graphToScope(graph: GraphType): Scope {
  const mode: Mode = graph === 'collection' ? 'collection' : 'explore'
  const view: View = graph === 'genres' || graph === 'parentGenre' ? 'genres' : 'artists'
  return `${mode}:${view}` as Scope
}

function App() {
  type GraphHandle = { zoomIn: () => void; zoomOut: () => void; zoomTo: (k: number, ms?: number) => void; getZoom: () => number }
  const genresGraphRef = useRef<GraphHandle | null>(null);
  const artistsGraphRef = useRef<GraphHandle | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const selectedGenreIDs = useMemo(() => {
    return selectedGenres.map(genre => genre.id);
  }, [selectedGenres]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | undefined>(undefined);
  const [showArtistCard, setShowArtistCard] = useState(false);
  const [graph, setGraph] = useState<GraphType>('genres');
  const [currentArtists, setCurrentArtists] = useState<Artist[]>([]);
  const [currentArtistLinks, setCurrentArtistLinks] = useState<NodeLink[]>([]);
  const [canCreateSimilarArtistGraph, setCanCreateSimilarArtistGraph] = useState<boolean>(false);
  const [genreClusterMode, setGenreClusterMode] = useState<GenreClusterMode[]>(DEFAULT_CLUSTER_MODE);
  const [dagMode, setDagMode] = useState<boolean>(() => {
    const storedDagMode = localStorage.getItem('dagMode');
    return storedDagMode ? JSON.parse(storedDagMode) : false;
  });
  const [currentGenres, setCurrentGenres] = useState<GenreGraphData>();
  const [selectedArtistNoGenre, setSelectedArtistNoGenre] = useState<Artist | undefined>();
  const [genreSizeThreshold, setGenreSizeThreshold] = useState<number>(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [genreNodeLimitType, setGenreNodeLimitType] = useState<GenreNodeLimitType>(DEFAULT_GENRE_LIMIT_TYPE);
  const [artistNodeLimitType, setArtistNodeLimitType] = useState<ArtistNodeLimitType>(DEFAULT_ARTIST_LIMIT_TYPE);
  const [genreNodeCount, setGenreNodeCount] = useState<number>(DEFAULT_NODE_COUNT);
  const [artistNodeCount, setArtistNodeCount] = useState<number>(DEFAULT_NODE_COUNT);
  const [collectionNodeCount, setCollectionNodeCount] = useState<number>(DEFAULT_NODE_COUNT);
  const [collectionDegree, setCollectionDegree] = useState<number>(0);
  const [collectionDiscoveryLoading, setCollectionDiscoveryLoading] = useState<boolean>(false);
  const [collectionDiscoveryArtists, setCollectionDiscoveryArtists] = useState<Artist[]>([]);
  const [collectionDiscoveryLinks, setCollectionDiscoveryLinks] = useState<NodeLink[]>([]);
  const [collectionDiscoveryDepth, setCollectionDiscoveryDepth] = useState<Map<string, number>>(
    () => new Map<string, number>()
  );
  const collectionSimilarCacheRef = useRef<Map<string, Artist[]>>(new Map());
  const fallbackArtistCacheRef = useRef<Map<string, Artist>>(new Map());
  const scope = useMemo<Scope>(() => graphToScope(graph), [graph])
  const { store } = useScopedControlsState()
  const [scopeChanges, setScopeChanges] = useState<ScopeChange[]>([])
  const [overlayVisible, setOverlayVisible] = useState(false)
  const previousScopeRef = useRef<Scope>(scope)
  const handleCollectionDegreeChange = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(MAX_DISCOVERY_DEGREE, value));
    setCollectionDegree(clamped);
  }, []);
  const [isBeforeArtistLoad, setIsBeforeArtistLoad] = useState<boolean>(true);
  const [initialGenreFilter, setInitialGenreFilter] = useState<InitialGenreFilter>(EMPTY_GENRE_FILTER_OBJECT);
  const [genreColorMap, setGenreColorMap] = useState<Map<string, string>>(new Map());
  const { addRecentSelection } = useRecentSelections();
  const {
    genres,
    genreLinks,
    genresLoading,
    genresError,
    genreRoots,
    flagBadGenreData,
    genresDataFlagLoading,
    setGenres, // Don't use this unless necessary for data synchronization
  } = useGenres();
  const {
    artists,
    artistLinks,
    artistsLoading,
    artistsError,
    flagBadArtistData,
    artistsDataFlagLoading,
    artistsDataFlagError,
    totalArtistsInDB,
    topArtists,
    fetchArtistTopTracksYT,
  } = useArtists(selectedGenreIDs, TOP_ARTISTS_TO_FETCH, artistNodeLimitType, artistNodeCount, isBeforeArtistLoad);
  const { similarArtists, similarArtistsLoading, similarArtistsError } = useSimilarArtists(selectedArtistNoGenre);
  const { theme } = useTheme();
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerVideoIds, setPlayerVideoIds] = useState<string[]>([]);
  const [playerTitle, setPlayerTitle] = useState<string | undefined>(undefined);
  const [playerArtworkUrl, setPlayerArtworkUrl] = useState<string | undefined>(undefined);
  const [playerLoading, setPlayerLoading] = useState<boolean>(false);
  const [playerLoadingKey, setPlayerLoadingKey] = useState<string | undefined>(undefined); // e.g., "artist:123" or "genre:abc"
  const playRequest = useRef(0);
  const [playerSource, setPlayerSource] = useState<'artist' | 'genre' | undefined>(undefined);
  const [playerEntityName, setPlayerEntityName] = useState<string | undefined>(undefined);
  // Prototype: in-session collection state (temporary)
  const [sessionCollectionIds, setSessionCollectionIds] = useState<string[]>(() => {
    try {
      const raw = sessionStorage.getItem('sessionCollection');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem('sessionCollection', JSON.stringify(sessionCollectionIds));
    } catch {}
  }, [sessionCollectionIds]);

  // Store full artist objects for the session collection graph
  const [sessionCollectionById, setSessionCollectionById] = useState<Record<string, Artist>>(() => {
    try {
      const raw = sessionStorage.getItem('sessionCollectionArtists');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {} as Record<string, Artist>;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem('sessionCollectionArtists', JSON.stringify(sessionCollectionById));
    } catch {}
  }, [sessionCollectionById]);

  useEffect(() => {
    const prev = previousScopeRef.current
    if (prev === scope) return

    const changes = computeScopeChanges(prev, scope, store)
    setScopeChanges(changes)
    setOverlayVisible(changes.length > 0)
    previousScopeRef.current = scope
  }, [scope, store])

  const singletonParentGenre = useMemo(() => {
    return {
      ...SINGLETON_PARENT_GENRE,
      subgenres: genres.filter(g => isSingletonGenre(g, GENRE_FILTER_CLUSTER_MODE)).map(s => {
        return {id: s.id, name: s.name}
      })
    }
  }, [genres]);

  const isMobile = useMediaQuery({ maxWidth: 640 });
  // const [isLayoutAnimating, setIsLayoutAnimating] = useState(false);

  useEffect(() => {
    localStorage.setItem('dagMode', JSON.stringify(dagMode));
  }, [dagMode]);

  // Zoom hotkeys (+ / -)
  useHotkeys({
    onZoomIn: () => {
      const ref = graph === 'genres' ? genresGraphRef.current : artistsGraphRef.current;
      ref?.zoomIn?.();
    },
    onZoomOut: () => {
      const ref = graph === 'genres' ? genresGraphRef.current : artistsGraphRef.current;
      ref?.zoomOut?.();
    },
  }, [graph]);

  // Restore standalone Escape handling (deselect)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (graph === 'genres' && selectedGenres.length){
          deselectGenre();
          return;
        }
        if (selectedArtist) {
          deselectArtist();
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [graph, selectedArtist, selectedGenres]);

  // Restore Cmd/Ctrl+K handling (search)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Sets current artists/links shown in the graph when artists are fetched from the DB
  useEffect(() => {
    setCurrentArtists(artists);
    setCurrentArtistLinks(artistLinks);
  }, [artists]);

  // Decorate artists with inCollection for rendering only
  const sessionCollectionSet = useMemo(() => new Set(sessionCollectionIds), [sessionCollectionIds]);
  const displayArtists: Artist[] = useMemo(() => {
    return currentArtists.map(a => ({ ...a, inCollection: sessionCollectionSet.has(a.id) }));
  }, [currentArtists, sessionCollectionSet]);

  // Toggle add/remove for this session
  const toggleSessionCollection = (artist: Artist) => {
    setSessionCollectionIds(prev => {
      const set = new Set(prev);
      if (set.has(artist.id)) set.delete(artist.id); else set.add(artist.id);
      return Array.from(set);
    });
    setSessionCollectionById(prev => {
      const next = { ...prev } as Record<string, Artist>;
      if (next[artist.id]) delete next[artist.id]; else next[artist.id] = { ...artist, inCollection: true };
      return next;
    });
    // Keep selected artist(s) objects in sync for immediate UI feedback
    setSelectedArtist(prev => prev && prev.id === artist.id ? { ...prev, inCollection: !prev.inCollection } as Artist : prev);
    setSelectedArtistNoGenre(prev => prev && prev.id === artist.id ? { ...prev, inCollection: !prev.inCollection } as Artist : prev);
  };

  // Build collection graph data from session collection
  const collectionArtists: Artist[] = useMemo(() => {
    return Object.values(sessionCollectionById);
  }, [sessionCollectionById]);
  const collectionLinks: NodeLink[] = useMemo(() => {
    const links: NodeLink[] = [];
    const byName = new Map<string, Artist>();
    collectionArtists.forEach(a => byName.set(a.name, a));
    const seen = new Set<string>();
    collectionArtists.forEach(a => {
      (a.similar || []).forEach(simName => {
        const b = byName.get(simName);
        if (b && a.id !== b.id) {
          const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
          if (!seen.has(key)) {
            links.push({ source: a.id, target: b.id, linkType: 'similar' });
            seen.add(key);
          }
        }
      });
    });
    return links;
  }, [collectionArtists]);

  // Apply genre filter to collection graph
  const collectionFilteredArtists: Artist[] = useMemo(() => {
    if (!selectedGenres.length) return collectionArtists;
    const selected = new Set(selectedGenres.map(g => g.id));
    return collectionArtists.filter(a => (a.genres || []).some(g => selected.has(g)));
  }, [collectionArtists, selectedGenres]);
  const collectionFilteredLinks: NodeLink[] = useMemo(() => {
    if (!selectedGenres.length) return collectionLinks;
    const allowed = new Set(collectionFilteredArtists.map(a => a.id));
    return collectionLinks.filter(l => {
      const s = typeof l.source === 'string' ? l.source : (l as any)?.source?.id;
      const t = typeof l.target === 'string' ? l.target : (l as any)?.target?.id;
      return s && t && allowed.has(s) && allowed.has(t);
    });
  }, [collectionLinks, collectionFilteredArtists]);

  // Sort and cap collection by node limiter
  const collectionSortedArtists: Artist[] = useMemo(() => {
    return [...collectionFilteredArtists].sort((a, b) => (b[artistNodeLimitType] as number) - (a[artistNodeLimitType] as number));
  }, [collectionFilteredArtists, artistNodeLimitType]);
  const collectionFinalArtists: Artist[] = useMemo(() => {
    return collectionSortedArtists.slice(0, Math.min(collectionNodeCount, collectionSortedArtists.length));
  }, [collectionSortedArtists, collectionNodeCount]);
  const collectionFinalLinks: NodeLink[] = useMemo(() => {
    const allowed = new Set(collectionFinalArtists.map(a => a.id));
    return collectionFilteredLinks.filter(l => {
      const s = typeof l.source === 'string' ? l.source : (l as any)?.source?.id;
      const t = typeof l.target === 'string' ? l.target : (l as any)?.target?.id;
      return s && t && allowed.has(s) && allowed.has(t);
    });
  }, [collectionFilteredLinks, collectionFinalArtists]);

  useEffect(() => {
    const baseDepth = new Map<string, number>();
    const baseIds = new Set<string>();
    collectionFinalArtists.forEach((artist) => {
      if (artist?.id) {
        baseDepth.set(artist.id, 0);
        baseIds.add(artist.id);
      }
    });

    if (
      graph !== 'collection' ||
      collectionDegree <= 0 ||
      collectionFinalArtists.length === 0
    ) {
      setCollectionDiscoveryArtists([]);
      setCollectionDiscoveryLinks([]);
      setCollectionDiscoveryDepth(baseDepth);
      setCollectionDiscoveryLoading(false);
      return;
    }

    let cancelled = false;

    const canonicalKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

    const baseLinkKeys = new Set<string>();
    collectionFinalLinks.forEach((link) => {
      const source = typeof link.source === 'string' ? link.source : (link as any)?.source?.id;
      const target = typeof link.target === 'string' ? link.target : (link as any)?.target?.id;
      if (source && target) {
        baseLinkKeys.add(canonicalKey(source, target));
      }
    });

    const artistById = new Map<string, Artist>();
    collectionFinalArtists.forEach((artist) => {
      if (artist?.id) artistById.set(artist.id, artist);
    });

    const knownByName = new Map<string, Artist>();
    const registerKnown = (artist?: Artist) => {
      if (!artist?.name) return;
      const key = artist.name.trim().toLowerCase();
      if (!knownByName.has(key)) knownByName.set(key, artist);
    };

    collectionFinalArtists.forEach(registerKnown);
    currentArtists.forEach(registerKnown);
    displayArtists.forEach(registerKnown);
    fallbackArtistCacheRef.current.forEach((artist) => registerKnown(artist));

    const slugFromName = (name: string) =>
      name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const resolveFallbackArtist = (name: string): Artist | undefined => {
      if (!name) return undefined;
      const key = name.trim().toLowerCase();
      const existing = knownByName.get(key);
      if (existing) return existing;
      const slug = slugFromName(name);
      const cacheKey = `stub:${slug}`;
      const cached = fallbackArtistCacheRef.current.get(cacheKey);
      if (cached) {
        registerKnown(cached);
        return cached;
      }
      const stub: Artist = {
        id: cacheKey,
        name: name.trim(),
        listeners: 1,
        playcount: 1,
        tags: [],
        genres: [],
        similar: [],
        bio: { link: '', summary: '', content: '' },
        noMBID: true,
        inCollection: false,
      };
      fallbackArtistCacheRef.current.set(cacheKey, stub);
      registerKnown(stub);
      return stub;
    };

    const fallbackSimilarForId = (sourceId: string): Artist[] => {
      const sourceArtist = artistById.get(sourceId);
      if (!sourceArtist) return [];
      const names = Array.isArray(sourceArtist.similar) ? sourceArtist.similar : [];
      const seen = new Set<string>();
      const results: Artist[] = [];
      names.forEach((name) => {
        const candidate = resolveFallbackArtist(name);
        if (!candidate?.id) return;
        if (baseIds.has(candidate.id) || seen.has(candidate.id)) return;
        seen.add(candidate.id);
        results.push({ ...candidate, id: candidate.id, inCollection: false });
      });
      return results;
    };

    const fetchSimilar = async (artistId: string): Promise<Artist[]> => {
      if (!artistId) return [];
      const cache = collectionSimilarCacheRef.current.get(artistId);
      if (cache) return cache;

      let combined: Artist[] = [];
      try {
        const response = await axios.get<Artist[]>(`${API_URL}/artists/similar/${artistId}`);
        const data = Array.isArray(response.data) ? response.data : [];
        combined = data
          .map((artist) => {
            const rawId = (artist as any)?.id;
            const id = typeof rawId === 'number' ? String(rawId) : rawId;
            if (!id) return undefined;
            return {
              ...artist,
              id,
              inCollection: baseIds.has(id),
            } as Artist;
          })
          .filter((artist): artist is Artist => !!artist?.id);
      } catch (error) {
        console.error('Failed to fetch similar artists for', artistId, error);
      }

      const fallback = fallbackSimilarForId(artistId);
      if (fallback.length) {
        const existingIds = new Set(combined.map((artist) => artist.id));
        fallback.forEach((artist) => {
          if (!artist.id || existingIds.has(artist.id)) return;
          combined.push(artist);
          existingIds.add(artist.id);
        });
      }

      collectionSimilarCacheRef.current.set(artistId, combined);
      return combined;
    };

    const explore = async () => {
      setCollectionDiscoveryLoading(true);
      const maxDepth = Math.min(collectionDegree, MAX_DISCOVERY_DEGREE);
      const visited = new Map(baseDepth);
      const newNodes = new Map<string, Artist>();
      const newLinks: NodeLink[] = [];
      const allLinkKeys = new Set(baseLinkKeys);

      let frontierIds = collectionFinalArtists
        .map((artist) => artist?.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);

      try {
        for (let depth = 0; depth < maxDepth && frontierIds.length; depth++) {
          if (cancelled) return;

          const nextFrontier = new Set<string>();

          for (let i = 0; i < frontierIds.length; i += MAX_DISCOVERY_REQUESTS_PER_DEPTH) {
            if (cancelled) return;
            const chunk = frontierIds.slice(i, i + MAX_DISCOVERY_REQUESTS_PER_DEPTH);
            const responses = await Promise.all(
              chunk.map(async (sourceId) => {
                const neighbors = await fetchSimilar(sourceId);
                return { sourceId, neighbors: neighbors.slice(0, MAX_DISCOVERY_NEIGHBORS) };
              })
            );

            for (const { sourceId, neighbors } of responses) {
              if (cancelled) return;
              for (const neighbor of neighbors) {
                const rawId = neighbor?.id;
                const neighborId = typeof rawId === 'string'
                  ? rawId
                  : typeof rawId === 'number'
                    ? String(rawId)
                    : undefined;

                if (!neighborId || neighborId === sourceId) continue;

                const neighborDepth = depth + 1;
                const linkKey = canonicalKey(sourceId, neighborId);

                if (!allLinkKeys.has(linkKey)) {
                  newLinks.push({ source: sourceId, target: neighborId, linkType: 'similar' });
                  allLinkKeys.add(linkKey);
                }

                const existingDepth = visited.get(neighborId);
                if (existingDepth === undefined || neighborDepth < existingDepth) {
                  visited.set(neighborId, neighborDepth);
                }

                if (!baseIds.has(neighborId) && !newNodes.has(neighborId)) {
                  newNodes.set(neighborId, {
                    ...neighbor,
                    id: neighborId,
                    inCollection: false,
                  } as Artist);
                }

                const canExploreDeeper = neighborDepth < maxDepth && newNodes.size < MAX_DISCOVERY_NODES;
                if (canExploreDeeper && (existingDepth === undefined || neighborDepth < existingDepth)) {
                  nextFrontier.add(neighborId);
                }

                if (newNodes.size >= MAX_DISCOVERY_NODES) break;
              }

              if (newNodes.size >= MAX_DISCOVERY_NODES) break;
            }

            if (newNodes.size >= MAX_DISCOVERY_NODES) break;
          }

          frontierIds = Array.from(nextFrontier);
          if (newNodes.size >= MAX_DISCOVERY_NODES) break;
        }

        if (!cancelled) {
          setCollectionDiscoveryArtists(Array.from(newNodes.values()));
          setCollectionDiscoveryLinks(newLinks);
          setCollectionDiscoveryDepth(visited);
        }
      } finally {
        if (!cancelled) {
          setCollectionDiscoveryLoading(false);
        }
      }
    };

    explore();

    return () => {
      cancelled = true;
    };
  }, [
    collectionDegree,
    collectionFinalArtists,
    collectionFinalLinks,
    currentArtists,
    displayArtists,
    graph,
  ]);

  const collectionGraphArtists: Artist[] = useMemo(() => {
    const base = collectionFinalArtists.map((artist) => ({ ...artist, inCollection: true }));
    if (!collectionDiscoveryArtists.length) return base;
    const baseIds = new Set(collectionFinalArtists.map((artist) => artist.id));
    const extras = collectionDiscoveryArtists
      .filter((artist) => artist?.id && !baseIds.has(artist.id))
      .map((artist) => ({ ...artist, inCollection: false }));
    return [...base, ...extras];
  }, [collectionFinalArtists, collectionDiscoveryArtists]);

  const collectionGraphLinks: NodeLink[] = useMemo(() => {
    if (!collectionDiscoveryLinks.length) return collectionFinalLinks;
    const merged = [...collectionFinalLinks];
    const canonicalKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
    const existingKeys = new Set<string>();
    collectionFinalLinks.forEach((link) => {
      const source = typeof link.source === 'string' ? link.source : (link as any)?.source?.id;
      const target = typeof link.target === 'string' ? link.target : (link as any)?.target?.id;
      if (source && target) existingKeys.add(canonicalKey(source, target));
    });

    collectionDiscoveryLinks.forEach((link) => {
      const source = typeof link.source === 'string' ? link.source : (link as any)?.source?.id;
      const target = typeof link.target === 'string' ? link.target : (link as any)?.target?.id;
      if (!source || !target) return;
      const key = canonicalKey(source, target);
      if (existingKeys.has(key)) return;
      merged.push({ source, target, linkType: 'similar' });
      existingKeys.add(key);
    });

    return merged;
  }, [collectionFinalLinks, collectionDiscoveryLinks]);

  const collectionGraphDepth = useMemo(() => {
    const map = new Map<string, number>();
    collectionFinalArtists.forEach((artist) => {
      if (artist?.id) map.set(artist.id, 0);
    });
    collectionDiscoveryDepth.forEach((depth, id) => {
      if (typeof id === 'string') map.set(id, depth);
    });
    return map;
  }, [collectionFinalArtists, collectionDiscoveryDepth]);

  // Initializes the genre graph data after fetching genres from DB
  useEffect(() => {
    const nodeCount = genres.length;
    onGenreNodeCountChange(nodeCount);
    setGenreColorMap(buildGenreColorMap(genres, genreRoots));
  }, [genres, genreLinks]);

  useEffect(() => {
    if (canCreateSimilarArtistGraph) {
      if (similarArtists.length > 1) {
        const links = generateSimilarLinks(similarArtists);
        setCurrentArtists(similarArtists);
        setCurrentArtistLinks(links);
        setGraph('similarArtists');
      }
      setCanCreateSimilarArtistGraph(false);
    }
  }, [similarArtists]);

  // Play handlers using embedded YouTube player
  const onPlayArtist = async (artist: Artist) => {
    const req = ++playRequest.current;
    setPlayerLoading(true);
    setPlayerLoadingKey(`artist:${artist.id}`);
    setPlayerSource('artist');
    setPlayerEntityName(artist.name);
    // Show the player instantly with provisional metadata
    setPlayerTitle(artist.name);
    const imgEarly = typeof artist.image === 'string' && artist.image.trim()
      ? fixWikiImageURL(artist.image as string)
      : undefined;
    setPlayerArtworkUrl(imgEarly);
    setPlayerVideoIds([]); // clear any previous playlist immediately
    setPlayerOpen(true);
    try {
      const ids = await fetchArtistTopTracksYT(artist.id, artist.name);
      if (req !== playRequest.current) return; // superseded by a newer request
      if (ids && ids.length > 0) {
        setPlayerVideoIds(ids);
        // title/artwork already set above for instant UI
      } else {
        toast.error('No YouTube tracks found for this artist');
        setPlayerLoading(false);
        setPlayerLoadingKey(undefined);
        setPlayerOpen(false);
      }
    } catch (e) {
      if (req === playRequest.current) {
        toast.error('Unable to fetch YouTube tracks for artist');
        setPlayerLoading(false);
        setPlayerLoadingKey(undefined);
        setPlayerSource(undefined);
        setPlayerOpen(false);
      }
    }
  };

  const onPlayGenre = async (genre: Genre) => {
    const req = ++playRequest.current;
    setPlayerLoading(true);
    setPlayerLoadingKey(`genre:${genre.id}`);
    setPlayerSource('genre');
    setPlayerEntityName(genre.name);
    // Open player immediately with genre title and best-effort artwork
    setPlayerTitle(`${genre.name}`);
    {
      const source = topArtists && topArtists.length ? topArtists : currentArtists;
      const coverArtist = source.find(a => typeof a.image === 'string' && (a.image as string).trim());
      const img = coverArtist ? fixWikiImageURL(coverArtist.image as string) : undefined;
      setPlayerArtworkUrl(img);
    }
    setPlayerVideoIds([]);
    setPlayerOpen(true);
    try {
      // Use available topArtists for the selected genre; fallback to current artists
      const source = topArtists && topArtists.length ? topArtists : currentArtists;
      const top = source.slice(0, 8);
      const firstTrackIds = await Promise.all(
        top.map(async (a) => {
          try {
            const ids = await fetchArtistTopTracksYT(a.id, a.name);
            return ids && ids.length ? ids[0] : undefined;
          } catch {
            return undefined;
          }
        })
      );
      if (req !== playRequest.current) return; // superseded
      const videoIds = firstTrackIds.filter(Boolean) as string[];
      if (videoIds.length === 0) {
        toast.error('No YouTube tracks found for this genre');
        setPlayerLoading(false);
        setPlayerLoadingKey(undefined);
        setPlayerSource(undefined);
        setPlayerOpen(false);
        return;
      }
      setPlayerVideoIds(videoIds);
      // title/artwork already set for instant UI
    } catch (e) {
      if (req === playRequest.current) {
        toast.error('Unable to fetch YouTube tracks for genre');
        setPlayerLoading(false);
        setPlayerLoadingKey(undefined);
        setPlayerSource(undefined);
        setPlayerOpen(false);
      }
    }
  };

  const handlePlayerLoadingChange = (v: boolean) => {
    setPlayerLoading(v);
    if (!v) { setPlayerLoadingKey(undefined); }
  };

  // Clear selection info when player is closed
  useEffect(() => {
    if (!playerOpen) {
      setPlayerSource(undefined);
      setPlayerEntityName(undefined);
      setPlayerLoading(false);
      setPlayerLoadingKey(undefined);
    }
  }, [playerOpen]);

  const handlePlayerTitleClick = () => {
    if (!playerEntityName || !playerSource) return;
    if (playerSource === 'artist') {
      const artistObj = getArtistByName(playerEntityName);
      if (artistObj) {
        onTopArtistClick(artistObj);
      } else {
        setArtistFromName(playerEntityName);
      }
    } else if (playerSource === 'genre') {
      onGenreNameClick(playerEntityName);
    }
  };

  const setArtistFromName = (name: string) => {
    const source = graph === 'collection' ? collectionFilteredArtists : currentArtists;
    const artist = source.find((a) => a.name === name);
    if (artist) {
      onArtistNodeClick(artist);
    }
  }

  const getArtistImageByName = (name: string) => {
    const source = graph === 'collection' ? collectionFilteredArtists : currentArtists;
    const a = source.find((x) => x.name === name);
    const raw = a?.image as string | undefined;
    return raw ? fixWikiImageURL(raw) : undefined;
  }

  const getArtistByName = (name: string) => {
    const source = graph === 'collection' ? collectionFilteredArtists : currentArtists;
    return source.find((a) => a.name === name);
  }

  const getGenreNameById = (id: string) => {
    return genres.find((g) => g.id === id)?.name;
  }

  const onGenreNodeClick = (genre: Genre) => {
    if (isBeforeArtistLoad) setIsBeforeArtistLoad(false);
    setInitialGenreFilter(createInitialGenreFilterObject(genre));
    setSelectedGenres([genre]);
    setShowArtistCard(false); // ensure only one card
    setSelectedArtist(undefined);
    addRecentSelection(genre);
  }

  // Trigger full artist view for a genre from UI (e.g., GenreInfo "All Artists")
  const onShowAllArtists = (genre: Genre) => {
    // Ensure the artists hook actually fetches data when switching via this path
    if (isBeforeArtistLoad) setIsBeforeArtistLoad(false);
    if (!selectedGenres.length) setSelectedGenres([genre]); // safety in case no genre selected
    setGraph('artists');
    addRecentSelection(genre);
    console.log("Show all artists for genre:", genre);
  }

  // Switch to artists graph and select the clicked artist
  const onTopArtistClick = (artist: Artist) => {
    setGraph('artists');
    setSelectedArtist(artist);
    setShowArtistCard(true);
    addRecentSelection(artist);
  }

  const onArtistNodeClick = (artist: Artist) => {
    if (graph === 'artists' || graph === 'collection') {
      setSelectedArtist(artist);
      setShowArtistCard(true);
      addRecentSelection(artist);
    }
    if (graph === 'similarArtists') {
      createSimilarArtistGraph(artist);
    }
  }

  const resetAppState = () => {
    setGraph('genres');
    setCurrentGenres({nodes: genres, links: genreLinks.filter(link => {
        return DEFAULT_CLUSTER_MODE.includes(link.linkType as "subgenre" | "influence" | "fusion")
      })});
    deselectGenre();
    deselectArtist();
    setCanCreateSimilarArtistGraph(false);
    setGenreClusterMode(DEFAULT_CLUSTER_MODE);
  }

  const deselectGenre = () => {
    setSelectedGenres([]);
    setGraph('genres');
    setCurrentArtists([]);
    setCurrentArtistLinks([]);
    setInitialGenreFilter(EMPTY_GENRE_FILTER_OBJECT);
  }

  const deselectArtist = () => {
    setSelectedArtist(undefined);
    setShowArtistCard(false);
    setSelectedArtistNoGenre(undefined);
  }

  const similarArtistFilter = (similarArtists: string[]) => {
    if (graph === 'collection') {
      const sourceNames = new Set<string>();
      collectionFilteredArtists.forEach((artist) => {
        if (artist?.name) sourceNames.add(artist.name);
      });
      collectionDiscoveryArtists.forEach((artist) => {
        if (artist?.name) sourceNames.add(artist.name);
      });
      return similarArtists.filter((name) => sourceNames.has(name));
    }
    return similarArtists.filter((name) => currentArtists.some((artist) => artist.name === name));
  }

  const createSimilarArtistGraph = (artistResult: Artist) => {
    setSelectedArtist(artistResult);
    setSelectedArtistNoGenre(artistResult);
    setShowArtistCard(true);
    setCanCreateSimilarArtistGraph(true);
  }
  const onGenreClusterModeChange = (newMode: GenreClusterMode[]) => {
    setGenreClusterMode([...newMode]);
    if (currentGenres) {
      setCurrentGenres({ nodes: currentGenres.nodes, links: filterLinksByClusterMode(newMode) });
    }
  }

  const filterLinksByClusterMode = (newMode: GenreClusterMode[]) => {
    return genreLinks && genreLinks.length
        ? genreLinks.filter(l => newMode.includes(l.linkType as "subgenre" | "influence" | "fusion"))
        : [];
  }

  const onGenreNodeCountChange = (count: number) => {
    setGenreNodeCount(count);
    if (genres && genres.length && count < genres.length) {
      const filteredGenres = [...genres]
          .sort((a, b) => b[genreNodeLimitType] - a[genreNodeLimitType])
          .slice(0, count);
      const genreSet = new Set(filteredGenres.map(genre => genre.id));
      const filteredLinks = genreLinks.filter(l => {
        return genreSet.has(l.source) && genreSet.has(l.target) && genreClusterMode.includes(l.linkType as "subgenre" | "influence" | "fusion");
      });
      setCurrentGenres({
        nodes: filteredGenres,
        links: filteredLinks,
      });
    } else {
      setCurrentGenres({ nodes: genres, links: filterLinksByClusterMode(genreClusterMode) });
    }
  }

  const showGenreNodeLimiter = () => {
    if (graph === 'genres') {
      return !!genres && !genresLoading && !genresError;
    } else return false;
  }

  const showArtistNodeLimiter = () => {
    if (graph === 'artists') {
      return !!artists && !artistsLoading && !artistsError;
    } else return false;
  }

  const showCollectionNodeLimiter = () => {
    return graph === 'collection';
  }

  const onLinkedGenreClick = (genreID: string) => {
    const newGenre = genres.find((g) => g.id === genreID);
    if (newGenre) {
      onGenreNodeClick(newGenre);
    }
  }

  const onGenreNameClick = (name: string) => {
    const newGenre = genres.find((g) => g.name === name);
    if (newGenre) {
      setGraph('genres');
      onGenreNodeClick(newGenre);
    } else {
      toast.error(`Genre not found: ${name}`);
    }
  }

  const onTabChange = async (graphType: GraphType) => {
    if (graphType === 'genres') {
      setIsBeforeArtistLoad(true);
      setGraph('genres');
      setCurrentArtists([]);
      setCurrentArtistLinks([]);
      setSelectedGenres([]);
      setShowArtistCard(false);
      setInitialGenreFilter(EMPTY_GENRE_FILTER_OBJECT);
    } else if (graphType === 'artists') {
      if (isBeforeArtistLoad) setIsBeforeArtistLoad(false);
      setGraph('artists');
    } else if (graphType === 'collection') {
      setGraph('collection');
      setShowArtistCard(false);
      // keep other state; graph will consume collectionArtists/links
    }
  }

  const getGenreRootsFromID = (genreID: string) => {
    const genre = genres.find((g) => g.id === genreID);
    if (genre) {
      return genre.rootGenres;
    }
    return [];
  }

  const onBadDataGenreSubmit = async (itemID: string, reason: string, type: 'genre' | 'artist', hasFlag: boolean, details?: string) => {
    //TODO: use actual user ID when accounts are implemented
    const userID = 'dev';
    const report: BadDataReport = {
      userID,
      itemID,
      reason,
      type,
      resolved: false,
      details,
    }
    const success = await flagBadGenreData(report);
    if (success && !hasFlag && selectedGenres.length && currentGenres) {
      const updatedGenre = {...selectedGenres[0], badDataFlag: true};
      setSelectedGenres([updatedGenre]);
      // 2 options for synchronizing flagged state:
      // this doesn't set genres, so a browser refresh is needed if genres are filtered after this to reflect the genre's flag
      // setCurrentGenres({ nodes: [...currentGenres.nodes.filter(n => n.id !== updatedGenre.id), updatedGenre], links: currentGenres.links });
      // sets genres but triggers a larger chain of refreshes
      setGenres([...genres.filter(g => g.id !== updatedGenre.id), updatedGenre]);
    }
    return success;
  }

  const onBadDataArtistSubmit = async (itemID: string, reason: string, type: 'genre' | 'artist', hasFlag: boolean, details?: string) => {
    //TODO: use actual user ID when accounts are implemented
    const userID = 'dev';
    const report: BadDataReport = {
      userID,
      itemID,
      reason,
      type,
      resolved: false,
      details,
    }
    const success = await flagBadArtistData(report);
    if (success && !hasFlag) {
      if (selectedArtistNoGenre) {
        const updatedSelected = {...selectedArtistNoGenre, badDataFlag: true};
        setCurrentArtists([...currentArtists.filter(a => a.id !== selectedArtistNoGenre.id), updatedSelected]);
        setSelectedArtistNoGenre(updatedSelected);
      } else if (selectedArtist) {
        const updatedSelected = {...selectedArtist, badDataFlag: !selectedArtist.badDataFlag};
        setCurrentArtists([...currentArtists.filter(a => a.id !== selectedArtist.id), updatedSelected]);
        setSelectedArtist(updatedSelected);
      }
    }
    return success;
  }

  const getRootGenreFromTags = (tags: Tag[]) => {
    if (tags && tags.length) {
      const genreTags = tags.filter(t => genres.some((g) => g.name === t.name));
      if (genreTags.length > 0) {
        const bestTag = genreTags.sort((a, b) => b.count - a.count)[0];
        const tagGenre = genres.find((g) => g.name === bestTag.name);
        if (tagGenre) return tagGenre.rootGenres;
      }
    }
    return [];
  }

  const getArtistColor = (artist: Artist) => {
    let color;
    // First try strongest tag that is a genre
    const rootIDs = getRootGenreFromTags(artist.tags);
    if (rootIDs.length) color = getGenreColorFromRoots(rootIDs);

    // Next try genres until a root is found
    if (!color) {
      for (const g of artist.genres) {
        color = getGenreColorFromID(g);
        if (color && color !== DEFAULT_DARK_NODE_COLOR && color !== DEFAULT_LIGHT_NODE_COLOR) break;
      }
    }
    // If no roots are found
    if (!color) color = colorFallback();
    return color;
  }

  const getGenreColorFromID = (genreID: string) => {
    const roots = getGenreRootsFromID(genreID);
    let color = getGenreColorFromRoots(roots);
    if (!color) color = colorFallback(genreID);
    return color;
  }

  const getGenreColorFromRoots = (roots: string[]) => {
    let color;
    if (roots.length === 1) {
      color = genreColorMap.get(roots[0]);
    } else if (roots.length > 1) {
      const colors: string[] = [];
      roots.forEach(root => {
        const rootColor = genreColorMap.get(root);
        if (rootColor) colors.push(rootColor);
      });
      color = mixColors(colors);
    }
    return color;
  }

  const colorFallback = (genreID?: string) => {
    let color;
    if (genreID) color = genreColorMap.get(genreID);
    if (!color) color = theme === 'dark' ? DEFAULT_DARK_NODE_COLOR : DEFAULT_LIGHT_NODE_COLOR;
    return color;
  }

  const onGenreFilterSelectionChange = async (selectedIDs: string[]) => {
    if (graph === 'genres') {
      // filters genres in genre mode; buggy
      // setCurrentGenres({ nodes: genres.filter((g) => selectedIDs.includes(g.id)), links: genreLinks.filter(l => {
      //   return genreClusterMode
      //       .includes(l.linkType as "subgenre" | "influence" | "fusion") && (selectedIDs.includes(l.target) || selectedIDs.includes(l.source));
      //   })
      // });
    } else {
      if (isBeforeArtistLoad) setIsBeforeArtistLoad(false);
      // console.log('gf selection change: ' + selectedIDs.length)
      if (selectedIDs.length === 0) {
        if (selectedGenres.length !== 0) setSelectedGenres([]);
      } else {
        if (!primitiveArraysEqual(selectedIDs, selectedGenres.map(genre => genre.id))) {
          setSelectedGenres(selectedIDs.map(s => {
            return { id: s } as Genre
          }));
        }
      }
    }
  }

  const artistNodeCountSelection = (value: number) => {
    if (value <= artistNodeCount) {
      if (artists && artists.length) {
        const filteredArtists = [...artists]
            .sort((a: Artist, b: Artist) => b[artistNodeLimitType] - a[artistNodeLimitType])
            .slice(0, value);
        const artistSet = new Set(filteredArtists.map((artist: Artist) => artist.id));
        const filteredLinks = artistLinks.filter(l => {
          return artistSet.has(l.source) && artistSet.has(l.target);
        });
        setCurrentArtists(filteredArtists);
        setCurrentArtistLinks(filteredLinks);
      }
    } else {
      setArtistNodeCount(value);
    }
  }

  // Builds the initial genres for the GenresFilter
  const createInitialGenreFilterObject = (genre: Genre) => {
    const isSingleton = isSingletonGenre(genre, GENRE_FILTER_CLUSTER_MODE);
    const isRoot = isRootGenre(genre, GENRE_FILTER_CLUSTER_MODE);
    let parents: Record<string, Set<string>> = {};
    if (isSingleton) {
      parents = { [SINGLETON_PARENT_GENRE.id]: new Set([genre.id]) };
    } else if (isRoot) {
      parents = { [genre.id]: new Set()};
    } else {
      const initialSelectedParents = genre.specificRootGenres
          .filter(g => g.type === GENRE_FILTER_CLUSTER_MODE[0]) // change if multiple modes needed
          .map(f => f.id);
      initialSelectedParents.forEach(p => {
        parents[p] = new Set([genre.id]);
      });
    }
    return { genre, isRoot, parents };
  }

  return (
    <SidebarProvider>
      <AppSidebar
        onLinkedGenreClick={onLinkedGenreClick}
        setSearchOpen={setSearchOpen}
        onClick={resetAppState}
        selectedGenre={selectedGenres[0]}
        graph={graph}
        onGraphChange={onTabChange}
        resetAppState={resetAppState}
      >
        <SidebarLogoTrigger />
        <Toaster />
        <Gradient />
        <div className="relative h-screen w-screen overflow-hidden no-scrollbar">
          <motion.div
            className={
              "fixed top-0 left-0 z-50 pt-2 pl-3 flex justify-left flex-col items-start md:flex-row gap-3"
            }
            style={{
              left: "var(--sidebar-gap)",
            }}
          >
            {/* <Header 
            selectedGenre={selectedGenres[0]?.name}
            selectedArtist={selectedArtist}
            graph={graph}
            toggleListView={() => {}}
            showListView={false}
            hideArtistCard={() => setShowArtistCard(false)}
            content={
              graph === 'artists' &&
                <div className='flex mr-[var(--sidebar-gap)] flex-col w-full justify-center sm:flex-row gap-3'>
                   <GenresFilter
                    key={initialGenreFilter.genre ? initialGenreFilter.genre.id : "none_selected"}
                    genres={[...genres, singletonParentGenre]}
                    genreClusterModes={GENRE_FILTER_CLUSTER_MODE}
                    graphType={graph}
                    onGenreSelectionChange={onGenreFilterSelectionChange}
                    initialSelection={initialGenreFilter}
                   />

                  <Button size='default' variant='outline'>Mood & Activity
                    <ChevronDown />
                  </Button>
                  <Button size='default' className='self-start' variant='outline'>Decade
                    <ChevronDown />
                  </Button>
                </div>
                }
            /> */}
            {graph !== 'collection' && (
              <Tabs
                  value={graph}
                  onValueChange={(val) => onTabChange(val as GraphType)}>
                    <TabsList>
                        <TabsTrigger
                        onClick={() => onTabChange("genres")} value="genres">Genres</TabsTrigger>
                      <TabsTrigger
                      onClick={() => onTabChange('artists')} value="artists">Artists</TabsTrigger>
                    </TabsList>
                  </Tabs>
            )}
               
                { graph === 'artists' &&
                <div className='flex flex-col items-start sm:flex-row gap-3'>
                   <GenresFilter
                    key={initialGenreFilter.genre ? initialGenreFilter.genre.id : "none_selected"}
                    genres={[...genres, singletonParentGenre]}
                    genreClusterModes={GENRE_FILTER_CLUSTER_MODE}
                    graphType={graph}
                    onGenreSelectionChange={onGenreFilterSelectionChange}
                    initialSelection={initialGenreFilter}
                   />

                  <Button size='lg' variant='outline'
                  onClick={() => toast('Opens a filter menu for Moods & Activities...')}
                  >Mood & Activity
                    <ChevronDown />
                  </Button>
                  <Button size='lg' className='self-start' variant='outline'
                  onClick={() => toast('Opens a filter menu for decades...')}
                  >Decade
                    <ChevronDown />
                  </Button>
                </div>
                }
                { graph === 'collection' &&
                  <div className='flex flex-col items-start sm:flex-row gap-3'>
                    <GenresFilter
                      key={initialGenreFilter.genre ? initialGenreFilter.genre.id : "none_selected"}
                      genres={[...genres, singletonParentGenre]}
                      genreClusterModes={GENRE_FILTER_CLUSTER_MODE}
                      graphType={graph}
                      onGenreSelectionChange={onGenreFilterSelectionChange}
                      initialSelection={initialGenreFilter}
                    />
                    <Button size='lg' variant='outline'
                      onClick={() => toast('Opens a filter menu for Moods & Activities...')}
                    >Mood & Activity
                      <ChevronDown />
                    </Button>
                    <Button size='lg' className='self-start' variant='outline'
                      onClick={() => toast('Opens a filter menu for decades...')}
                    >Decade
                      <ChevronDown />
                    </Button>
                  </div>
                }
                <Button size='lg' className='self-start' variant='outline'
                  onClick={() => toast('Filters the current view based on your text input...')} >
                    <TextSearch />Find
                  </Button>
          </motion.div>
                <GenresForceGraph
                  ref={genresGraphRef as any}
                  graphData={currentGenres}
                  onNodeClick={onGenreNodeClick}
                  loading={genresLoading}
                  show={graph === "genres" && !genresError}
                  dag={dagMode}
                  clusterModes={genreClusterMode}
                  colorMap={genreColorMap}
                  selectedGenreId={selectedGenres[0]?.id}
                />
                <ArtistsForceGraph
                    ref={artistsGraphRef as any}
                    artists={graph === 'collection' ? collectionGraphArtists : displayArtists}
                    artistLinks={graph === 'collection' ? collectionGraphLinks : currentArtistLinks}
                    loading={graph === 'collection' ? false : artistsLoading}
                    onNodeClick={onArtistNodeClick}
                    selectedArtistId={selectedArtist?.id}
                    show={graph === 'collection' ? true : ((graph === "artists" || graph === "similarArtists") && !artistsError)}
                    computeArtistColor={getArtistColor}
                    discoveryDepthById={graph === 'collection' ? collectionGraphDepth : undefined}
                />

            <div className='z-20 fixed bottom-[52%] sm:bottom-16 right-3'>
              <ZoomButtons
                onZoomIn={() => {
                  const ref = graph === 'genres' ? genresGraphRef.current : artistsGraphRef.current;
                  ref?.zoomIn();
                }}
                onZoomOut={() => {
                  const ref = graph === 'genres' ? genresGraphRef.current : artistsGraphRef.current;
                  ref?.zoomOut();
                }}
              />
            </div>
          <div className='z-20 fixed bottom-4 right-3 flex flex-col items-end gap-3'>
            {!isMobile && (
              <>
                <NodeLimiter
                  totalNodes={genres.length}
                  nodeType={'genres'}
                  initialValue={genreNodeCount}
                  onChange={onGenreNodeCountChange}
                  show={showGenreNodeLimiter()}
                />
                <NodeLimiter
                  totalNodes={totalArtistsInDB}
                  nodeType={'artists'}
                  initialValue={currentArtists.length}
                  onChange={(value) => artistNodeCountSelection(value)}
                  show={showArtistNodeLimiter()}
                />
                <NodeLimiter
                  totalNodes={collectionFilteredArtists.length}
                  nodeType={'collection'}
                  initialValue={collectionFinalArtists.length}
                  onChange={(value) => setCollectionNodeCount(value)}
                  show={showCollectionNodeLimiter()}
                />
              </>
            )}
          </div>
          {/* right controls */}
          <div className="fixed flex flex-col h-auto right-3 top-3 justify-end gap-3 z-50">
              <ModeToggle />
              <ClusteringPanel 
                scope={scope}
                clusterMode={genreClusterMode[0]}
                setClusterMode={onGenreClusterModeChange}
                dagMode={dagMode} 
                setDagMode={setDagMode}
                showDiscovery={graph === 'collection'}
                discoveryDegree={collectionDegree}
                onDiscoveryDegreeChange={handleCollectionDegreeChange}
                discoveryLoading={collectionDiscoveryLoading}
                discoveryDisabled={collectionFinalArtists.length === 0}
                discoveryCount={collectionDiscoveryArtists.length}
                discoveryMax={MAX_DISCOVERY_DEGREE}
              />
              <DisplayPanel
                genreArtistCountThreshold={genreSizeThreshold}
                setGenreArtistCountThreshold={setGenreSizeThreshold}
              />
          </div>

          <AnimatePresence mode="popLayout">
            <motion.div
              className={`
                  fixed left-1/2 transform -translate-x-1/2 z-50
                  flex flex-col gap-4 md:group-has-data-[state=expanded]/sidebar-wrapper:left-[calc(var(--sidebar-width))] md:group-has-data-[state=collapsed]/sidebar-wrapper:left-16
                  ${
                    isMobile
                      ? "w-full px-4 items-center bottom-4"
                      : "bottom-4 items-end"
                  }
                `}
            >
              <GenreInfo 
                selectedGenre={selectedGenres[0]}
                onLinkedGenreClick={onLinkedGenreClick}
                show={graph === 'genres' && selectedGenres.length === 1 && !showArtistCard}
                genreArtistsLoading={artistsLoading}
                onTopArtistClick={onTopArtistClick}
                deselectGenre={deselectGenre}
                onSelectGenre={onLinkedGenreClick}
                allArtists={onShowAllArtists}
                onBadDataSubmit={onBadDataGenreSubmit}
                topArtists={topArtists}
                getArtistImageByName={getArtistImageByName}
                genreColorMap={genreColorMap}
                getArtistColor={getArtistColor}
                onPlayGenre={onPlayGenre}
                playLoading={playerLoading && (!!selectedGenres[0] ? playerLoadingKey === `genre:${selectedGenres[0].id}` : false)}
              />
              <ArtistInfo
                selectedArtist={selectedArtist}
                setArtistFromName={setArtistFromName}
                artistLoading={false}
                artistError={false}
                show={showArtistCard}
                deselectArtist={deselectArtist}
                similarFilter={similarArtistFilter}
                onBadDataSubmit={onBadDataArtistSubmit}
                onGenreClick={onGenreNameClick}
                getArtistImageByName={getArtistImageByName}
                getArtistByName={getArtistByName}
                genreColorMap={genreColorMap}
                getArtistColor={getArtistColor}
                getGenreNameById={getGenreNameById}
                onPlay={onPlayArtist}
                playLoading={playerLoading && (!!selectedArtist ? playerLoadingKey === `artist:${selectedArtist.id}` : false)}
                onToggleCollection={toggleSessionCollection}
                isInCollection={selectedArtist ? sessionCollectionSet.has(selectedArtist.id) : false}
              />

            {/* Show reset button in desktop header when Artists view is pre-filtered by a selected genre */}
            {/* TODO: Consider replace with dismissible toast and adding reference to selected genre */}
              <div
                className={`sm:hidden flex justify-center gap-3 ${graph !== "genres" ? "w-full" : ""}`}>
                  <ResetButton
                    onClick={() => {
                      setGraph('genres')
                      // setSelectedArtist(undefined)
                    }
                    }
                    show={graph === 'artists' && selectedGenres.length === 1}
                  />
                <motion.div
                  layout
                  // className={`${graph === 'artists' ? 'flex-grow' : ''}`}
                  className='hidden'
                >
                  <Search
                    onGenreSelect={onGenreNodeClick}
                    onArtistSelect={createSimilarArtistGraph}
                    currentArtists={currentArtists}
                    genres={currentGenres?.nodes}
                    graphState={graph}
                    selectedGenres={selectedGenres}
                    selectedArtist={selectedArtist}
                    open={searchOpen}
                    setOpen={setSearchOpen}
                  />

                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
          <Player
            open={playerOpen}
            onOpenChange={setPlayerOpen}
            videoIds={playerVideoIds}
            title={playerTitle}
            autoplay
            anchor="bottom-left"
            artworkUrl={playerArtworkUrl}
            loading={playerLoading}
            onLoadingChange={handlePlayerLoadingChange}
            headerPreferProvidedTitle={playerSource === 'genre'}
            onTitleClick={handlePlayerTitleClick}
          />
          <FeedbackOverlay
            scope={scope}
            changes={scopeChanges}
            visible={overlayVisible}
            onClose={() => setOverlayVisible(false)}
          />
        </div>
      </AppSidebar>
      <AuthOverlay />
    </SidebarProvider>
  );
}

export default App
