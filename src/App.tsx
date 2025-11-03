import './App.css'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import { ChevronDown, Divide, Settings, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import useArtists from "@/hooks/useArtists";
import useGenres from "@/hooks/useGenres";
import useGenreTopArtists from "@/hooks/useGenreTopArtists";
import ArtistsForceGraph, { type GraphHandle } from "@/components/ArtistsForceGraph";
import GenresForceGraph from "@/components/GenresForceGraph";
import {
  AccountMenuState, Artist, ArtistNodeLimitType, BadDataReport,
  Genre,
  GenreClusterMode,
  GenreGraphData, GenreNodeLimitType,
  GraphType, InitialGenreFilter,
  NodeLink, Tag, TopTrack,
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
import FindFilter, { FindOption } from "@/components/FindFilter";

import {
  buildGenreColorMap,
  generateSimilarLinks,
  isRootGenre,
  isSingletonGenre,
  mixColors,
  primitiveArraysEqual,
  fixWikiImageURL,
  formatNumber,
  until,
  serverUrl,
} from "@/lib/utils";
import axios from "axios";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ClusteringPanel from "@/components/ClusteringPanel";
import { ModeToggle } from './components/ModeToggle';
import { useRecentSelections } from './hooks/useRecentSelections';
import DisplayPanel from './components/DisplayPanel';
import NodeLimiter from './components/NodeLimiter'
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSideBar"
import { GenreInfo } from './components/GenreInfo';
import GenresFilter from './components/GenresFilter';
import {useTheme} from "next-themes";
import {
  DEFAULT_DARK_NODE_COLOR,
  DEFAULT_ARTIST_LIMIT_TYPE,
  DEFAULT_CLUSTER_MODE,
  DEFAULT_GENRE_LIMIT_TYPE,
  DEFAULT_NODE_COUNT,
  DEFAULT_LIGHT_NODE_COLOR,
  TOP_ARTISTS_TO_FETCH,
  EMPTY_GENRE_FILTER_OBJECT,
  SINGLETON_PARENT_GENRE,
  GENRE_FILTER_CLUSTER_MODE,
  MAX_YTID_QUEUE_SIZE, DEFAULT_PLAYER
} from "@/constants";
import {FixedOrderedMap} from "@/lib/fixedOrderedMap";
import RhizomeLogo from "@/components/RhizomeLogo";
import AuthOverlay from '@/components/AuthOverlay';
import FeedbackOverlay from '@/components/FeedbackOverlay';
import ZoomButtons from '@/components/ZoomButtons';
import useHotkeys from '@/hooks/useHotkeys';
import SettingsOverlay from '@/components/SettingsOverlay';

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

function App() {
  const genresGraphRef = useRef<GraphHandle | null>(null);
  const artistsGraphRef = useRef<GraphHandle | null>(null);
  const [viewport, setViewport] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [artistGenreFilter, setArtistGenreFilter] = useState<Genre[]>([]);
  const [artistFilterGenres, setArtistFilterGenres] = useState<Genre[]>([]);
  const artistGenreFilterIDs = useMemo(() => {
    return artistGenreFilter.map(genre => genre.id);
  }, [artistGenreFilter]);
  const selectedGenreIDs = useMemo(() => {
    return selectedGenres.map(genre => genre.id);
  }, [selectedGenres]);
  const artistFilterGenreIDs = useMemo(() => {
    return artistFilterGenres.map(genre => genre.id);
  }, [artistFilterGenres]);
  const artistQueryGenreIDs = useMemo(() => {
    return artistFilterGenreIDs;
  }, [artistFilterGenreIDs]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | undefined>(undefined);
  const [selectedArtistFromSearch, setSelectedArtistFromSearch] = useState<boolean>(false);
  const [artistPreviewStack, setArtistPreviewStack] = useState<Artist[]>([]);
  const [artistInfoDrawerVersion, setArtistInfoDrawerVersion] = useState(0);
  const [artistInfoToShow, setArtistInfoToShow] = useState<Artist | undefined>(undefined);
  const [showArtistCard, setShowArtistCard] = useState(false);
  const [genreInfoToShow, setGenreInfoToShow] = useState<Genre | undefined>(undefined);
  const [showGenreCard, setShowGenreCard] = useState(false);
  const [restoreGenreCardOnArtistDismiss, setRestoreGenreCardOnArtistDismiss] = useState(false);
  const [graph, setGraph] = useState<GraphType>('genres');
  const [currentArtists, setCurrentArtists] = useState<Artist[]>([]);
  const [currentArtistLinks, setCurrentArtistLinks] = useState<NodeLink[]>([]);
  const [pendingArtistGenreGraph, setPendingArtistGenreGraph] = useState<Artist | undefined>(undefined);
  const [genreClusterMode, setGenreClusterMode] = useState<GenreClusterMode[]>(DEFAULT_CLUSTER_MODE);
  const [dagMode, setDagMode] = useState<boolean>(() => {
    const storedDagMode = localStorage.getItem('dagMode');
    return storedDagMode ? JSON.parse(storedDagMode) : false;
  });
  const [currentGenres, setCurrentGenres] = useState<GenreGraphData>();
  const [selectedArtistNoGenre, setSelectedArtistNoGenre] = useState<Artist | undefined>();
  const [similarArtistAnchor, setSimilarArtistAnchor] = useState<Artist | undefined>();
  const [genreSizeThreshold, setGenreSizeThreshold] = useState<number>(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isFindFilterOpen, setIsFindFilterOpen] = useState(false);
  const [genreNodeLimitType, setGenreNodeLimitType] = useState<GenreNodeLimitType>(DEFAULT_GENRE_LIMIT_TYPE);
  const [artistNodeLimitType, setArtistNodeLimitType] = useState<ArtistNodeLimitType>(DEFAULT_ARTIST_LIMIT_TYPE);
  const [genreNodeCount, setGenreNodeCount] = useState<number>(DEFAULT_NODE_COUNT);
  const [artistNodeCount, setArtistNodeCount] = useState<number>(DEFAULT_NODE_COUNT);
  const [isBeforeArtistLoad, setIsBeforeArtistLoad] = useState<boolean>(true);
  const [initialGenreFilter, setInitialGenreFilter] = useState<InitialGenreFilter>(EMPTY_GENRE_FILTER_OBJECT);
  const [genreColorMap, setGenreColorMap] = useState<Map<string, string>>(new Map());
  const accountMenuState: AccountMenuState = "guest"; // Placeholder for auth state
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
    fetchArtistTopTracks,
    artistsPlayIDsLoading,
    artistPlayIDLoadingKey,
  } = useArtists(artistQueryGenreIDs, TOP_ARTISTS_TO_FETCH, artistNodeLimitType, artistNodeCount, isBeforeArtistLoad);

  // Fetch top artists for the currently displayed genre info or the active filter
  const topArtistsGenreId = genreInfoToShow?.id || artistFilterGenres[0]?.id;
  const { topArtists, loading: topArtistsLoading } = useGenreTopArtists(topArtistsGenreId);

  const { resolvedTheme } = useTheme();
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerVideoIds, setPlayerVideoIds] = useState<string[]>([]);
  const [playerTitle, setPlayerTitle] = useState<string | undefined>(undefined);
  const [playerArtworkUrl, setPlayerArtworkUrl] = useState<string | undefined>(undefined);
  const [playerLoading, setPlayerLoading] = useState<boolean>(false);
  const [playerLoadingKey, setPlayerLoadingKey] = useState<string | undefined>(undefined); // e.g., "artist:123" or "genre:abc"
  const playRequest = useRef(0);
  const [playerSource, setPlayerSource] = useState<'artist' | 'genre' | undefined>(undefined);
  const [playerEntityName, setPlayerEntityName] = useState<string | undefined>(undefined);
  const [playerIDQueue, setPlayerIDQueue] = useState<FixedOrderedMap<string, TopTrack[]>>(new FixedOrderedMap(MAX_YTID_QUEUE_SIZE));
  const [autoFocusGraph, setAutoFocusGraph] = useState<boolean>(true);

  // Track window size and pass to ForceGraph for reliable resizing
  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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

  // refs and effects for checking current loading play ids
  const artistsPlayIDsLoadingRef = useRef(artistsPlayIDsLoading);
  const artistPlayIDLoadingKeyRef = useRef(artistPlayIDLoadingKey);
  useEffect(() => { artistsPlayIDsLoadingRef.current = artistsPlayIDsLoading; }, [artistsPlayIDsLoading]);
  useEffect(() => { artistPlayIDLoadingKeyRef.current = artistPlayIDLoadingKey; }, [artistPlayIDLoadingKey]);

  useEffect(() => {
    localStorage.setItem('dagMode', JSON.stringify(dagMode));
  }, [dagMode]);

  const findOptions = useMemo<FindOption[]>(() => {
    if (graph === 'genres' && currentGenres) {
      return currentGenres.nodes.map((genre) => {
        const subtitleParts: string[] = [];

        if (typeof genre.artistCount === "number" && genre.artistCount > 0) {
          subtitleParts.push(`${formatNumber(genre.artistCount)} artists`);
        }

        if (typeof genre.totalListeners === "number" && genre.totalListeners > 0) {
          subtitleParts.push(`${formatNumber(genre.totalListeners)} listeners`);
        }

        if (typeof genre.totalPlays === "number" && genre.totalPlays > 0) {
          subtitleParts.push(`${formatNumber(genre.totalPlays)} plays`);
        }

        return {
          id: genre.id,
          name: genre.name,
          entityType: 'genre' as const,
          subtitle: subtitleParts.length ? subtitleParts.join(" • ") : undefined,
        };
      });
    }

    if ((graph === 'artists' || graph === 'similarArtists') && currentArtists.length) {
      return currentArtists.map((artist) => {
        const subtitleParts: string[] = [];

        if (typeof artist.listeners === "number" && artist.listeners > 0) {
          subtitleParts.push(`${formatNumber(artist.listeners)} listeners`);
        }

        if (typeof artist.playcount === "number" && artist.playcount > 0) {
          subtitleParts.push(`${formatNumber(artist.playcount)} plays`);
        }

        return {
          id: artist.id,
          name: artist.name,
          entityType: 'artist' as const,
          subtitle: subtitleParts.length ? subtitleParts.join(" • ") : undefined,
        };
      });
    }

    return [];
  }, [graph, currentArtists, currentGenres]);

  const hasFindSelection =
    (graph === 'genres' && selectedGenres.length > 0) ||
    ((graph === 'artists' || graph === 'similarArtists') && !!selectedArtist);

  const findPanelDisabled = !hasFindSelection && findOptions.length === 0;

  useEffect(() => {
    if (findPanelDisabled && isFindFilterOpen) {
      setIsFindFilterOpen(false);
    }
  }, [findPanelDisabled, isFindFilterOpen]);

  // Global hotkeys (+, -, /)
  useHotkeys({
    onZoomIn: () => {
      const ref = graph === 'genres' ? genresGraphRef.current : artistsGraphRef.current;
      ref?.zoomIn?.();
    },
    onZoomOut: () => {
      const ref = graph === 'genres' ? genresGraphRef.current : artistsGraphRef.current;
      ref?.zoomOut?.();
    },
    onOpenFind: () => {
      if (findPanelDisabled) return;
      setIsFindFilterOpen(true);
    },
  }, [graph, findPanelDisabled]);

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
    // Don't override if we're waiting for artist genre graph to be built
    if (pendingArtistGenreGraph) {
      return;
    }

    // Only manage currentArtists when graph is in 'artists' mode
    // similarArtists mode manages its own filtered list and fetches directly from API
    if (graph !== 'artists') {
      return;
    }

    // Ensure the selected artist is always included in the results unless they were opened via search
    if (selectedArtist && artists.length > 0) {
      const artistExists = artists.some(a => a.id === selectedArtist.id);
      console.log('[useEffect artists]', {
        selectedArtistId: selectedArtist.id,
        selectedArtistName: selectedArtist.name,
        artistExists,
        totalArtists: artists.length,
        artistGenreFilterIDs
      });
      if (!artistExists) {
        if (selectedArtistFromSearch) {
          console.log('[useEffect artists] Selected artist filtered out by current view; keeping graph results unchanged');
          setCurrentArtists(artists);
        } else {
          console.log('[useEffect artists] Adding missing artist to results');
          // Add the selected artist to the results if it's not already there
          setCurrentArtists([...artists, selectedArtist]);
        }
      } else {
        setCurrentArtists(artists);
      }
    } else {
      setCurrentArtists(artists);
    }
    setCurrentArtistLinks(artistLinks);
  }, [artists, selectedArtist, selectedArtistFromSearch, graph, pendingArtistGenreGraph]);

  const findLabel = useMemo(() => {
    if (graph === 'genres' && selectedGenres.length) {
      return selectedGenres[0].name;
    }
    if ((graph === 'artists' || graph === 'similarArtists') && selectedArtist) {
      return selectedArtist.name;
    }
    return null;
  }, [graph, selectedGenres, selectedArtist]);

  // Initializes the genre graph data after fetching genres from DB
  useEffect(() => {
    const nodeCount = genres.length;
    onGenreNodeCountChange(nodeCount);
    setGenreColorMap(buildGenreColorMap(genres, genreRoots));
  }, [genres, genreLinks]);

  // Fetches top tracks of selected genre player ids in the background
  useEffect(() => {
    updateGenrePlayerIDs();
  }, [topArtists, topArtistsGenreId]);

  // Fetches top tracks of selected artist player ids in the background
  useEffect(() => {
    updateArtistPlayerIDs();
  }, [selectedArtist]);

  // Note: Similar artist graph is now built directly in createSimilarArtistGraph()
  // by fetching all similar artists from the API, not limited by current genre selection

  // Switch to artist graph after genres' artists are loaded
  useEffect(() => {
    if (pendingArtistGenreGraph && artists.length > 0 && !artistsLoading) {
      console.log('[useEffect pendingArtistGenreGraph] Artists loaded, switching to artists graph');
      setGraph('artists');
      setPendingArtistGenreGraph(undefined);
    }
  }, [pendingArtistGenreGraph, artists, artistsLoading]);

  // Add genre play IDs to the playerIDQueue on genre click
  const updateGenrePlayerIDs = async () => {
    const queueGenreID = topArtistsGenreId;
    if (topArtists && topArtists.length && queueGenreID && !playerIDQueue.has(queueGenreID)) {
      const genreTracks: TopTrack[] = [];
      for (const artist of topArtists) {
        if (!artist.noTopTracks) {
          if (artist.topTracks) {
            for (const track of artist.topTracks) {
              if (track[DEFAULT_PLAYER]) {
                genreTracks.push(track);
                break;
              }
            }
          } else {
            // Shouldn't reach this (every genre top artist has been pre-fetched) but fetches tracks just in case
            console.log(`${artist.name} might have tracks, fetching from web...`);
            const artistTopTracks = await fetchArtistTopTracks(artist.id, artist.name);
            if (artistTopTracks) {
              for (const track of artistTopTracks) {
                if (track[DEFAULT_PLAYER]) {
                  genreTracks.push(track);
                  break;
                }
              }
            }
          }
        }
      }
      playerIDQueue.set(queueGenreID, genreTracks);
    }
  }

  // Add artist play IDs to the playerIDQueue on genre click
  const updateArtistPlayerIDs = async () => {
    if (selectedArtist && !playerIDQueue.has(selectedArtist.id)) {
      const currentSelectedArtist = {
        id: selectedArtist.id,
        name: selectedArtist.name,
        noTopTracks: selectedArtist.noTopTracks,
        topTracks: selectedArtist.topTracks
      };
      if (!currentSelectedArtist.noTopTracks) {
        if (currentSelectedArtist.topTracks) {
          playerIDQueue.set(currentSelectedArtist.id, currentSelectedArtist.topTracks);
        } else {
          const artistTracks = await fetchArtistTopTracks(currentSelectedArtist.id, currentSelectedArtist.name);
          if (artistTracks) {
            playerIDQueue.set(currentSelectedArtist.id, artistTracks);
          }
        }
      }
    }
  }

  // Play handlers using embedded YouTube player
  const onPlayArtist = async (artist: Artist) => {
    const req = ++playRequest.current;
    const artistLoadingKey = `artist:${artist.id}`;
    setPlayerLoading(true);
    setPlayerLoadingKey(artistLoadingKey);
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
      // wait until artist's tracks are done loading
      if (artistsPlayIDsLoading && artistPlayIDLoadingKey === artistLoadingKey) {
        await until(() => !artistsPlayIDsLoadingRef.current || artistPlayIDLoadingKeyRef.current !== artistLoadingKey);
      }
      const playerIDs = getSpecificPlayerIDs(artist.id);
      if (req !== playRequest.current) return; // superseded by a newer request
      if (playerIDs && playerIDs.length > 0) {
        setPlayerVideoIds(playerIDs);
        // title/artwork already set above for instant UI
      } else {
        toast.error('No tracks found for this artist');
        setPlayerLoading(false);
        setPlayerLoadingKey(undefined);
        setPlayerOpen(false);
      }
    } catch (e) {
      if (req === playRequest.current) {
        toast.error('Unable to fetch tracks for artist');
        setPlayerLoading(false);
        setPlayerLoadingKey(undefined);
        setPlayerSource(undefined);
        setPlayerOpen(false);
      }
    }
  };

  const onPlayGenre = async (genre: Genre) => {
    const req = ++playRequest.current;
    const genreLoadingKey = `genre:${genre.id}`;
    setPlayerLoading(true);
    setPlayerLoadingKey(genreLoadingKey);
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
      if (req !== playRequest.current) return; // superseded
      // wait until genre tracks are loaded (shouldn't happen, here for safety)
      if (artistsPlayIDsLoading && genre.topArtists) {
        const loadingIDs = genre.topArtists.map(artist => `artist:${artist.id}`);
        await until(() => !artistsPlayIDsLoadingRef.current || !loadingIDs.includes(artistPlayIDLoadingKeyRef.current));
      }
      const playerIDs = getSpecificPlayerIDs(genre.id);
      if (!playerIDs || playerIDs.length === 0) {
        toast.error('No tracks found for this genre');
        setPlayerLoading(false);
        setPlayerLoadingKey(undefined);
        setPlayerSource(undefined);
        setPlayerOpen(false);
        return;
      }
      setPlayerVideoIds(playerIDs);
      // title/artwork already set for instant UI
    } catch (e) {
      if (req === playRequest.current) {
        toast.error('Unable to fetch tracks for genre');
        setPlayerLoading(false);
        setPlayerLoadingKey(undefined);
        setPlayerSource(undefined);
        setPlayerOpen(false);
      }
    }
  };

  // Returns only the play IDs of the DEFAULT_PLAYER from an artist/genre
  const getSpecificPlayerIDs = (id: string) => {
    let ids: string[] = [];
    const topTracks = playerIDQueue.get(id);
    if (topTracks && topTracks.length > 0) {
      for (const track of topTracks) {
        if (track[DEFAULT_PLAYER]) ids.push(track[DEFAULT_PLAYER]);
      }
    }
    return ids;
  }

  const handlePlayerLoadingChange = (v: boolean) => {
    setPlayerLoading(v);
    if (!v) { setPlayerLoadingKey(undefined); }
  };

  const isPlayerLoadingGenre = () => {
    return playerLoading && !!selectedGenres[0] && playerLoadingKey === `genre:${selectedGenres[0].name}`;
  }

  const isPlayerLoadingArtist = () => {
    return playerLoading && !!selectedArtist && playerLoadingKey === `artist:${selectedArtist.id}`;
  }

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
    const artist = currentArtists.find((a) => a.name === name);
    if (artist) {
      onArtistNodeClick(artist);
    }
  }

  const getArtistImageByName = (name: string) => {
    // Search in all loaded artists, not just current graph
    const a = artists.find((x) => x.name === name);
    const raw = a?.image as string | undefined;
    return raw ? fixWikiImageURL(raw) : undefined;
  }

  const getArtistByName = (name: string) => {
    // Search in all loaded artists, not just current graph
    return artists.find((a) => a.name === name);
  }

  const getGenreNameById = (id: string) => {
    return genres.find((g) => g.id === id)?.name;
  }

  const onGenreNodeClick = (genre: Genre) => {
    if (isBeforeArtistLoad) setIsBeforeArtistLoad(false);
    // Don't set initialGenreFilter here - clicking a genre is just for viewing, not filtering
    setSelectedGenres([genre]);
    setGenreInfoToShow(genre);
    setShowGenreCard(true);
    setShowArtistCard(false); // Hide artist card but preserve selection for tab switching
    setAutoFocusGraph(true); // Enable auto-focus for node clicks
    addRecentSelection(genre);
  }

  // Trigger full artist view for a genre from UI (e.g., GenreInfo "All Artists")
  const onShowAllArtists = (genre: Genre) => {
    // Ensure the artists hook actually fetches data when switching via this path
    if (isBeforeArtistLoad) setIsBeforeArtistLoad(false);

    // Keep the genre info card visible in artist view
    setGenreInfoToShow(genre);
    setShowGenreCard(true);
    setRestoreGenreCardOnArtistDismiss(false); // Genre card is visible, not hidden

    // Set the genre filter and selection
    const filterObj = createInitialGenreFilterObject(genre);
    setInitialGenreFilter(filterObj);
    setSelectedGenres([genre]);

    // Apply artist filter - this is what triggers the artist fetch
    setArtistGenreFilter([genre]);
    setArtistFilterGenres([genre]); // Set the new filter state

    // Switch to artists view (or stay there)
    setGraph('artists');
    setAutoFocusGraph(true); // Enable auto-focus for this navigation
    addRecentSelection(genre);
  }

  // Switch to artists graph and select the clicked artist
  const onTopArtistClick = (artist: Artist) => {
    // Apply genre filter from current context
    const currentGenre = genreInfoToShow || selectedGenres[0];
    if (currentGenre) {
      setArtistGenreFilter([currentGenre]);
      setArtistFilterGenres([currentGenre]); // Set the new filter state
      setSelectedGenres([currentGenre]);
      setInitialGenreFilter(createInitialGenreFilterObject(currentGenre));
    }

    setGraph('artists');
    setSelectedArtistFromSearch(false);
    setArtistPreviewStack([]);
    setSelectedArtist(artist); // For graph focus/dimming
    setArtistInfoToShow(artist); // For drawer display
    setShowArtistCard(true);
    setAutoFocusGraph(true); // Enable auto-focus for top artist clicks
    addRecentSelection(artist);
    // Hide genre card but mark it for restoration when artist card is dismissed
    setShowGenreCard(false);
    setRestoreGenreCardOnArtistDismiss(true);
  }

  const onArtistNodeClick = (artist: Artist) => {
    setSelectedArtistFromSearch(false);
    setArtistPreviewStack([]);
    setRestoreGenreCardOnArtistDismiss(false); // Direct node click, don't restore genre card
    if (graph === 'artists') {
      setSelectedArtist(artist); // For graph focus/dimming
      setArtistInfoToShow(artist); // For drawer display
      setShowArtistCard(true);
      // Hide genre card if there's no active filter (preserve genre selection for tab switching)
      if (artistFilterGenres.length === 0) {
        setShowGenreCard(false);
      }
      setAutoFocusGraph(true); // Enable auto-focus for node clicks
      addRecentSelection(artist);
    }
    if (graph === 'similarArtists') {
      // Just select the artist without changing the similar filter
      // Users can use "View Similar Artist Graph" in ArtistInfo to see similar artists
      setSelectedArtist(artist); // For graph focus/dimming
      setArtistInfoToShow(artist); // For drawer display
      setShowArtistCard(true);
      setShowGenreCard(false); // Hide genre card but preserve selection for tab switching
      setAutoFocusGraph(true); // Enable auto-focus for node clicks
      addRecentSelection(artist);
    }
  }

  const focusArtistInCurrentView = (artist: Artist, opts?: { forceRefocus?: boolean }) => {
    if (isBeforeArtistLoad) setIsBeforeArtistLoad(false);

    const matchesCurrentFilter =
      artistGenreFilter.length === 0 ||
      artist.genres.some((genreId) => artistGenreFilterIDs.includes(genreId));

    if (artistGenreFilter.length && !matchesCurrentFilter) {
      setArtistGenreFilter([]);
      setArtistFilterGenres([]);
      setInitialGenreFilter(EMPTY_GENRE_FILTER_OBJECT);
      setGenreInfoToShow(undefined);
      setShowGenreCard(false);
    } else if (showGenreCard) {
      setShowGenreCard(false);
    }

    let nextArtistList =
      graph === 'similarArtists'
        ? (artists.length ? artists : currentArtists)
        : currentArtists;

    const artistAlreadyPresent = nextArtistList.some((a) => a.id === artist.id);
    if (!artistAlreadyPresent) {
      nextArtistList = [...nextArtistList, artist];
    }

    if (graph === 'similarArtists') {
      if (currentArtistLinks !== artistLinks) {
        setCurrentArtistLinks(artistLinks);
      }
      if (similarArtistAnchor) {
        setSimilarArtistAnchor(undefined);
      }
    }

    let shouldTriggerRefocus = opts?.forceRefocus === true;

    if (graph !== 'artists') {
      setGraph('artists');
      shouldTriggerRefocus = true;
    }

    if (graph === 'similarArtists' || !artistAlreadyPresent) {
      if (currentArtists !== nextArtistList) {
        setCurrentArtists(nextArtistList);
        shouldTriggerRefocus = true;
      }
    }

    setSelectedArtistFromSearch(false);
    setArtistPreviewStack([]);
    setSelectedArtist((prev) => {
      if (prev?.id === artist.id) {
        if (shouldTriggerRefocus) {
          return { ...prev };
        }
        return prev;
      }
      return artist;
    });
    setArtistInfoToShow(artist); // For drawer display
    setShowArtistCard(true);

    if (shouldTriggerRefocus) {
      setAutoFocusGraph(false);
      setTimeout(() => setAutoFocusGraph(true), 16);
    } else {
      setAutoFocusGraph(true);
    }

    addRecentSelection(artist);
  }

  const focusGenreInCurrentView = (genre: Genre, opts?: { forceRefocus?: boolean }) => {
    const fullGenre = genres.find((g) => g.id === genre.id) ?? genre;

    let workingNodes = currentGenres?.nodes ?? [];
    let workingLinks = currentGenres?.links ?? [];
    let shouldTriggerRefocus = opts?.forceRefocus === true || !currentGenres;
    let nodesChanged = false;
    let linksChanged = false;

    if (workingNodes.length === 0 && genres.length > 0) {
      workingNodes = genres;
      workingLinks = filterLinksByClusterMode(genreClusterMode);
      shouldTriggerRefocus = true;
      nodesChanged = true;
      linksChanged = true;
    }

    const nodeMap = new Map(workingNodes.map((node) => [node.id, node]));
    if (!nodeMap.has(fullGenre.id)) {
      nodeMap.set(fullGenre.id, fullGenre);
      shouldTriggerRefocus = true;
      nodesChanged = true;
    }

    const nextNodes = Array.from(nodeMap.values());

    const existingLinkKeys = new Set(workingLinks.map((l) => `${l.source}|${l.target}|${l.linkType}`));
    const allowedIds = new Set(nextNodes.map((n) => n.id));
    const newLinks: NodeLink[] = [];

    genreLinks.forEach((link) => {
      if (!allowedIds.has(link.source) || !allowedIds.has(link.target)) return;
      const key = `${link.source}|${link.target}|${link.linkType}`;
      if (!existingLinkKeys.has(key)) {
        existingLinkKeys.add(key);
        newLinks.push(link);
      }
    });

    if (newLinks.length) {
      workingLinks = [...workingLinks, ...newLinks];
      shouldTriggerRefocus = true;
      linksChanged = true;
    }

    if (!currentGenres || nodesChanged || linksChanged) {
      setCurrentGenres({ nodes: nextNodes, links: workingLinks });
    }

    if (graph !== 'genres') {
      setGraph('genres');
      shouldTriggerRefocus = true;
    }

    setGenreInfoToShow(fullGenre);
    setShowGenreCard(true);
    setShowArtistCard(false); // Hide artist card but preserve selection for tab switching
    setSelectedGenres([fullGenre]);
    // Don't set initialGenreFilter here - focusing a genre is just for viewing, not filtering
    addRecentSelection(fullGenre);

    if (shouldTriggerRefocus) {
      setAutoFocusGraph(false);
      setTimeout(() => setAutoFocusGraph(true), 16);
    } else {
      setAutoFocusGraph(true);
    }
  }

  // Search selection handlers - open info cards without changing graph view or auto-focusing
  const onSearchGenreSelect = (genre: Genre) => {
    setAutoFocusGraph(false); // Disable auto-focus for search selections
    setGenreInfoToShow(genre);
    setShowGenreCard(true);
    setShowArtistCard(false); // Hide artist card while showing genre card
    // Don't clear selectedArtist or selectedArtistFromSearch - preserve focused artist state

    // Don't change graph selection/filters - just show the info card as a preview
    // This prevents unwanted graph dimming during search

    addRecentSelection(genre);
  }

  const onSearchArtistSelect = (artist: Artist) => {
    setAutoFocusGraph(false); // Disable auto-focus for search selections
    setSelectedArtistFromSearch(true);
    setArtistPreviewStack((prev) => {
      if (artistInfoToShow && artistInfoToShow.id !== artist.id) {
        const last = prev[prev.length - 1];
        if (last?.id === artistInfoToShow.id) {
          return prev;
        }
        return [...prev, artistInfoToShow];
      }
      return prev;
    });
    setArtistInfoToShow(artist); // Use drawer state, not selectedArtist (prevents graph dimming)
    setShowArtistCard(true);
    addRecentSelection(artist);
  }

  const handleFindSelect = (option: FindOption) => {
    if (option.entityType === 'artist') {
      const artist = currentArtists.find((a) => a.id === option.id);
      if (!artist) return;
      setSelectedArtistFromSearch(false);
      setArtistPreviewStack([]);
      setSelectedArtist(artist); // For graph focus/dimming
      setArtistInfoToShow(artist); // For drawer display
      setShowArtistCard(true);
      setAutoFocusGraph(true); // Enable auto-focus for find filter selections
      addRecentSelection(artist);
      if (graph === 'similarArtists') {
        setSelectedArtistNoGenre(artist);
      } else if (graph !== 'artists') {
        setGraph('artists');
      }
      setIsFindFilterOpen(false);
      return;
    }

    if (option.entityType === 'genre' && currentGenres) {
      const genre = currentGenres.nodes.find((g) => g.id === option.id);
      if (!genre) return;
      onGenreNodeClick(genre);
      if (graph !== 'genres') {
        setGraph('genres');
      }
      setIsFindFilterOpen(false);
    }
  };

  const handleFindClear = () => {
    if (graph === 'genres' && selectedGenres.length) {
      deselectGenre();
      return;
    }
    if ((graph === 'artists' || graph === 'similarArtists') && selectedArtist) {
      deselectArtist();
    }
  };

  const resetAppState = () => {
    setGraph('genres');
    setCurrentGenres({nodes: genres, links: genreLinks.filter(link => {
        return DEFAULT_CLUSTER_MODE.includes(link.linkType as "subgenre" | "influence" | "fusion")
      })});
    deselectGenre();
    deselectArtist();
    setSimilarArtistAnchor(undefined);
    setGenreClusterMode(DEFAULT_CLUSTER_MODE);
  }

  const deselectGenre = () => {
    setSelectedGenres([]);
    setArtistGenreFilter([]);
    setArtistFilterGenres([]);
    setGenreInfoToShow(undefined);
    setShowGenreCard(false);
    setGraph('genres');
    setCurrentArtists([]);
    setCurrentArtistLinks([]);
    setInitialGenreFilter(EMPTY_GENRE_FILTER_OBJECT);
  }

  const deselectArtist = () => {
    setSelectedArtistFromSearch(false);
    setSelectedArtist(undefined);
    setArtistInfoToShow(undefined);
    setShowArtistCard(false);
    setSelectedArtistNoGenre(undefined);
    setArtistPreviewStack([]);
  }

  // Force the drawer to remount when restoring a previously focused artist without flashing the genre card
  const reopenArtistInfoCard = (artist: Artist, options?: { fromSearch?: boolean }) => {
    setArtistInfoToShow(artist);
    setSelectedArtistFromSearch(!!options?.fromSearch);
    setArtistInfoDrawerVersion((prev) => prev + 1);
    setShowArtistCard(true);
  };

  // Smart dismiss handler for GenreInfo - restores focused genre if showing a search result
  const onGenreInfoDismiss = () => {
    if (selectedGenres.length > 0 && genreInfoToShow?.id !== selectedGenres[0]?.id) {
      // We're showing a search result but have a focused genre - restore focused genre's info
      setGenreInfoToShow(selectedGenres[0]);
    } else if (graph === 'artists' || graph === 'similarArtists') {
      // In artist view: just hide the genre card, preserve selection and filter for tab switching
      // Clear the restore flag - user explicitly dismissed it, so don't restore later
      setShowGenreCard(false);
      setRestoreGenreCardOnArtistDismiss(false);
    } else {
      // In genre view: fully deselect
      deselectGenre();
    }
  }

  // Smart dismiss handler for ArtistInfo - restores focused artist if showing a search result
  const onArtistInfoDismiss = () => {
    if (selectedArtist && artistInfoToShow?.id !== selectedArtist?.id) {
      // Showing search result but have focused artist - restore focused artist info
      reopenArtistInfoCard(selectedArtist);
      setArtistPreviewStack([]);
      return;
    }

    const previousPreview =
      artistPreviewStack.length > 0
        ? artistPreviewStack[artistPreviewStack.length - 1]
        : undefined;
    if (previousPreview) {
      setArtistPreviewStack((prev) => prev.slice(0, -1));
      reopenArtistInfoCard(previousPreview, { fromSearch: true });
      return;
    }

    if (restoreGenreCardOnArtistDismiss) {
      // Genre card should be restored (e.g., after clicking top artist from genre card)
      deselectArtist();
      setShowGenreCard(true);
      setRestoreGenreCardOnArtistDismiss(false); // Reset flag after restoring
      return;
    }

    // No focused artist or showing focused artist - fully deselect
    deselectArtist();
  }

  const similarArtistFilter = (similarArtists: string[]) => {
    // Show all similar artists, not filtered by current view
    return similarArtists;
  }

  const createSimilarArtistGraph = async (artistResult: Artist) => {
    if (!artistResult.similar || artistResult.similar.length === 0) {
      toast.error(`No similar artist data available for ${artistResult.name}`);
      return;
    }

    // Fetch all similar artists using the search endpoint (genre-agnostic, forgiving matching)
    try {
      const similarArtistNames = artistResult.similar;

      const url = serverUrl();

      // Search for each similar artist using the search endpoint (same as Search component)
      // This uses full-text search which handles name variations better than exact matching
      const searchPromises = similarArtistNames.map(name =>
        axios.get(`${url}/search/${encodeURIComponent(name)}`)
          .then(response => ({ name, results: response.data }))
          .catch(err => {
            console.warn(`[createSimilarArtistGraph] Failed to search for "${name}":`, err);
            return { name, results: [] };
          })
      );

      const searchResults = await Promise.all(searchPromises);
      console.log('[createSimilarArtistGraph] Search results:', searchResults);

      // Extract artists from search results (filter out genres)
      const foundArtistsMap = new Map<string, Artist>();

      searchResults.forEach(({ name, results }) => {
        // Find the first artist result (search returns both artists and genres)
        const artistResult = results.find((item: Artist | Genre) =>
          'tags' in item || 'similar' in item // Artists have these properties, genres don't
        ) as Artist | undefined;

        if (artistResult) {
          console.log(`[createSimilarArtistGraph] Found "${name}" as "${artistResult.name}"`);
          foundArtistsMap.set(artistResult.id, artistResult);
        } else {
          console.warn(`[createSimilarArtistGraph] Could not find artist for "${name}"`);
        }
      });

      const similarArtistsData = Array.from(foundArtistsMap.values());
      console.log(`[createSimilarArtistGraph] Found ${similarArtistsData.length} similar artists with full data in database`);

      if (similarArtistsData.length === 0) {
        console.warn(`[createSimilarArtistGraph] No similar artists found in database for ${artistResult.name}, but metadata lists: ${similarArtistNames.join(', ')}`);
        return;
      }

      // Build graph with the selected artist + all fetched similar artists
      const graphArtists = [artistResult, ...similarArtistsData];
      const links = generateSimilarLinks(graphArtists);

      setSelectedArtistFromSearch(false);
      setArtistPreviewStack([]);
      setSelectedArtist(artistResult);
      setSelectedArtistNoGenre(artistResult);
      setSimilarArtistAnchor(artistResult);
      setCurrentArtists(graphArtists);
      setCurrentArtistLinks(links);
      setGraph('similarArtists');
      setShowArtistCard(true);

      const foundCount = similarArtistsData.length;
      const totalCount = similarArtistNames.length;
      if (foundCount < totalCount) {
      } 
    } catch (err) {
    }
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
      // If leaving similarArtists mode, restore the full artist list
      if (graph === 'similarArtists') {
        setCurrentArtists(artists);
        setCurrentArtistLinks(artistLinks);
        setSimilarArtistAnchor(undefined);
      }
      setGraph('genres');
      // Don't clear currentArtists/currentArtistLinks - preserve them like genre graph does
      // Just hide the artist graph with the show prop
      setShowArtistCard(false);
      // Restore genre info card if a genre is selected
      if (selectedGenres.length > 0) {
        setGenreInfoToShow(selectedGenres[0]);
        setShowGenreCard(true);
      }
      // Don't clear selected genres or artist filter - they're preserved for potential return
    } else {
      // Switching to artists view - restore full artist list if coming from similarArtists
      if (graph === 'similarArtists') {
        setCurrentArtists(artists);
        setCurrentArtistLinks(artistLinks);
        setSimilarArtistAnchor(undefined);
      }
      if (isBeforeArtistLoad) setIsBeforeArtistLoad(false);
      setGraph('artists');

      // Restore card visibility based on selections
      if (selectedArtist) {
        // Prioritize showing artist card if an artist was selected
        setArtistInfoToShow(selectedArtist);
        setShowArtistCard(true);
        // Hide genre card unless there's an active filter
        if (artistFilterGenres.length === 0) {
          setShowGenreCard(false);
        }
      } else if (artistFilterGenres.length > 0) {
        // If no artist selected but there's an active filter, show genre card
        setShowArtistCard(false);
        if (genreInfoToShow) {
          setShowGenreCard(true);
        }
      } else {
        // No selections at all, hide both cards
        setShowArtistCard(false);
        setShowGenreCard(false);
      }
    }
  }

  const getGenreRootsFromID = useCallback((genreID: string) => {
    const genre = genres.find((g) => g.id === genreID);
    if (genre) {
      return genre.rootGenres;
    }
    return [];
  }, [genres]);

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

  const getRootGenreFromTags = useCallback((tags: Tag[]) => {
    if (tags && tags.length) {
      const genreTags = tags.filter(t => genres.some((g) => g.name === t.name));
      if (genreTags.length > 0) {
        const bestTag = genreTags.sort((a, b) => b.count - a.count)[0];
        const tagGenre = genres.find((g) => g.name === bestTag.name);
        if (tagGenre) return tagGenre.rootGenres;
      }
    }
    return [];
  }, [genres]);

  const getGenreColorFromRoots = useCallback((roots: string[]) => {
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
  }, [genreColorMap]);

  const colorFallback = useCallback((genreID?: string) => {
    let color;
    if (genreID) color = genreColorMap.get(genreID);
    if (!color) color = resolvedTheme === 'dark' ? DEFAULT_DARK_NODE_COLOR : DEFAULT_LIGHT_NODE_COLOR;
    return color;
  }, [genreColorMap, resolvedTheme]);

  const getGenreColorFromID = useCallback((genreID: string) => {
    const roots = getGenreRootsFromID(genreID);
    let color = getGenreColorFromRoots(roots);
    if (!color) color = colorFallback(genreID);
    return color;
  }, [getGenreRootsFromID, getGenreColorFromRoots, colorFallback]);

  const getArtistColor = useCallback((artist: Artist) => {
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
  }, [getRootGenreFromTags, getGenreColorFromRoots, getGenreColorFromID, colorFallback]);

  const onGenreFilterSelectionChange = useCallback(async (selectedIDs: string[]) => {
    if (graph === 'genres') {
      // filters genres in genre mode; buggy
      // setCurrentGenres({ nodes: genres.filter((g) => selectedIDs.includes(g.id)), links: genreLinks.filter(l => {
      //   return genreClusterMode
      //       .includes(l.linkType as "subgenre" | "influence" | "fusion") && (selectedIDs.includes(l.target) || selectedIDs.includes(l.source));
      //   })
      // });
    } else {
      if (isBeforeArtistLoad) setIsBeforeArtistLoad(false);
      if (selectedIDs.length === 0) {
        // Clear artist filter - do NOT clear selectedGenres (viewing selection is independent)
        if (artistGenreFilter.length !== 0) {
          setArtistGenreFilter([]);
          setArtistFilterGenres([]);
        }
        // Only clear genre card if it was showing filtered content
        if (artistGenreFilter.length > 0) {
          setGenreInfoToShow(undefined);
          setShowGenreCard(false);
        }
      } else {
        // Update artist filter - this triggers the artist fetch
        if (!primitiveArraysEqual(selectedIDs, artistGenreFilter.map(genre => genre.id))) {
          setArtistGenreFilter(selectedIDs.map(s => {
            return { id: s } as Genre
          }));
          setArtistFilterGenres(selectedIDs.map(s => {
            return { id: s } as Genre
          }));
        }
        // Also sync genre selection so switching to genre tab shows the filtered genre highlighted
        if (!primitiveArraysEqual(selectedIDs, selectedGenres.map(genre => genre.id))) {
          setSelectedGenres(selectedIDs.map(s => {
            return { id: s } as Genre
          }));
        }
      }
    }
  }, [graph, isBeforeArtistLoad, selectedGenres, artistGenreFilter]);

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

  const buildInitialGenreFilterFromGenres = (genreList: Genre[]): InitialGenreFilter => {
    if (!genreList.length) {
      return EMPTY_GENRE_FILTER_OBJECT;
    }

    const parents: Record<string, Set<string>> = {};
    const ensureParentSet = (parentId: string) => {
      if (!parents[parentId]) {
        parents[parentId] = new Set<string>();
      }
      return parents[parentId];
    };

    genreList.forEach((genre) => {
      if (isSingletonGenre(genre, GENRE_FILTER_CLUSTER_MODE)) {
        ensureParentSet(SINGLETON_PARENT_GENRE.id).add(genre.id);
        return;
      }

      if (isRootGenre(genre, GENRE_FILTER_CLUSTER_MODE)) {
        ensureParentSet(genre.id);
        return;
      }

      const rootParents = genre.specificRootGenres
        .filter((root) => root.type === GENRE_FILTER_CLUSTER_MODE[0])
        .map((root) => root.id);

      if (!rootParents.length) {
        ensureParentSet(genre.id);
        return;
      }

      rootParents.forEach((rootId) => {
        ensureParentSet(rootId).add(genre.id);
      });
    });

    const firstGenre = genreList[0];
    return {
      genre: firstGenre,
      isRoot: isRootGenre(firstGenre, GENRE_FILTER_CLUSTER_MODE),
      parents,
    };
  };

  const focusArtistRelatedGenres = (artist: Artist) => {
    const genreIds = Array.from(new Set((artist.genres ?? []).filter(Boolean)));

    console.log('[focusArtistRelatedGenres]', {
      artistName: artist.name,
      artistId: artist.id,
      genreIds: genreIds,
      genreCount: genreIds.length
    });

    if (genreIds.length === 0) {
      toast.error(`We don't have genre data for ${artist.name} yet.`);
      return;
    }

    const seen = new Set<string>();
    const matched: Genre[] = [];
    genreIds.forEach((id) => {
      const found = genres.find((g) => g.id === id);
      if (found && !seen.has(found.id)) {
        matched.push(found);
        seen.add(found.id);
      }
    });

    console.log('[focusArtistRelatedGenres] matched genres:', matched.map(g => ({ id: g.id, name: g.name })));

    if (!matched.length) {
      toast.error(`Couldn't find genres for ${artist.name} in the current dataset.`);
      return;
    }

    if (isBeforeArtistLoad) setIsBeforeArtistLoad(false);
    setSelectedArtistFromSearch(false);
    setArtistPreviewStack([]);
    setSelectedArtist(artist);
    setShowArtistCard(true);
    setSelectedGenres(matched);
    // Apply artist filter - this triggers the artist fetch
    setArtistGenreFilter(matched);
    setArtistFilterGenres(matched); // Set the new filter state
    setInitialGenreFilter(buildInitialGenreFilterFromGenres(matched));
    setPendingArtistGenreGraph(artist); // Will trigger graph switch when artists load
  };

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
        accountMenuState={accountMenuState}
      >
        <SidebarLogoTrigger />
        <Toaster />
        <div className="fixed inset-0 z-0 overflow-hidden no-scrollbar">
          <Gradient />
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
                    genres={[...genres, singletonParentGenre]}
                    genreClusterModes={GENRE_FILTER_CLUSTER_MODE}
                    graphType={graph}
                    onGenreSelectionChange={onGenreFilterSelectionChange}
                    initialSelection={initialGenreFilter}
                    selectedGenreIds={selectedGenreIDs}
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
            <Tabs
                value={graph === 'similarArtists' ? 'artists' : graph}
                onValueChange={(val) => onTabChange(val as GraphType)}>
                  <TabsList>
                      <TabsTrigger value="genres">Genres</TabsTrigger>
                    <TabsTrigger value="artists">Artists</TabsTrigger>
                  </TabsList>
                </Tabs>

                {graph === 'similarArtists' && similarArtistAnchor && (
                  <Button
                    size='lg'
                    variant='outline'
                    onClick={() => onTabChange('artists')}
                    className="gap-2"
                  >
                    Similar artists: {similarArtistAnchor.name}
                    <X className="h-4 w-4" />
                  </Button>
                )}

                { graph === 'artists' &&
                <div className='flex flex-col items-start sm:flex-row gap-3'>
                   <GenresFilter
                    genres={[...genres, singletonParentGenre]}
                    genreClusterModes={GENRE_FILTER_CLUSTER_MODE}
                    graphType={graph}
                    onGenreSelectionChange={onGenreFilterSelectionChange}
                    initialSelection={initialGenreFilter}
                    selectedGenreIds={artistGenreFilterIDs}
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
                <FindFilter
                  items={findOptions}
                  onSelect={handleFindSelect}
                  onClear={hasFindSelection ? handleFindClear : undefined}
                  disabled={findPanelDisabled}
                  placeholder={graph === 'genres' ? 'Find genres in view...' : 'Find artists in view...'}
                  emptyText={graph === 'genres' ? 'No genres match this view.' : 'No artists match this view.'}
                  triggerClassName="self-start"
                  open={isFindFilterOpen}
                  onOpenChange={(open) => {
                    if (findPanelDisabled && open) return;
                    setIsFindFilterOpen(open);
                  }}
                />
          </motion.div>
                <GenresForceGraph
                  ref={genresGraphRef}
                  graphData={currentGenres}
                  onNodeClick={onGenreNodeClick}
                  selectedGenreId={selectedGenres[0]?.id}
                  colorMap={genreColorMap}
                  dag={dagMode}
                  clusterModes={genreClusterMode}
                  autoFocus={autoFocusGraph}
                  show={graph === "genres" && !genresError}
                  loading={genresLoading}
                  width={viewport.width || undefined}
                  height={viewport.height || undefined}
                />
                <ArtistsForceGraph
                  ref={artistsGraphRef}
                  artists={currentArtists}
                  artistLinks={currentArtistLinks}
                  onNodeClick={onArtistNodeClick}
                  selectedArtistId={selectedArtist?.id}
                  computeArtistColor={getArtistColor}
                  autoFocus={autoFocusGraph}
                  show={(graph === "artists" || graph === "similarArtists") && !artistsError}
                  loading={artistsLoading}
                  width={viewport.width || undefined}
                  height={viewport.height || undefined}
                />

            <div className='z-20 fixed sm:hidden bottom-[52%] right-3'>
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
          {!isMobile && <div className='z-20 fixed bottom-4 right-3'>
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
          </div>}
          {/* right controls */}
          <div className="fixed flex flex-col h-auto right-3 top-3 justify-end gap-3 z-50">
              {/* <ModeToggle /> */}
              <ClusteringPanel 
                clusterMode={genreClusterMode[0]}
                setClusterMode={onGenreClusterModeChange}
                dagMode={dagMode} 
                setDagMode={setDagMode} />
              <DisplayPanel
                genreArtistCountThreshold={genreSizeThreshold}
                setGenreArtistCountThreshold={setGenreSizeThreshold}
              />
              {/* Bottom positioned Zoomies */}
              <div className='pt-6 hidden sm:block'>
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
                selectedGenre={genreInfoToShow}
                onLinkedGenreClick={onLinkedGenreClick}
                show={showGenreCard && !showArtistCard}
                genreArtistsLoading={topArtistsLoading}
                onTopArtistClick={onTopArtistClick}
                deselectGenre={onGenreInfoDismiss}
                onSelectGenre={onLinkedGenreClick}
                allArtists={onShowAllArtists}
                onBadDataSubmit={onBadDataGenreSubmit}
                topArtists={topArtists}
                getArtistImageByName={getArtistImageByName}
                genreColorMap={genreColorMap}
                getArtistColor={getArtistColor}
                onPlayGenre={onPlayGenre}
                onFocusInGenresView={focusGenreInCurrentView}
                //playLoading={playerLoading && (!!genreInfoToShow ? playerLoadingKey === `genre:${genreInfoToShow.id}` : false)}
                playLoading={isPlayerLoadingGenre()}
              />
              <ArtistInfo
                key={artistInfoDrawerVersion}
                selectedArtist={artistInfoToShow}
                setArtistFromName={setArtistFromName}
                artistLoading={false}
                artistError={false}
                show={showArtistCard}
                deselectArtist={onArtistInfoDismiss}
                similarFilter={similarArtistFilter}
                onBadDataSubmit={onBadDataArtistSubmit}
                onGenreClick={onGenreNameClick}
                getArtistImageByName={getArtistImageByName}
                getArtistByName={getArtistByName}
                genreColorMap={genreColorMap}
                getArtistColor={getArtistColor}
                getGenreNameById={getGenreNameById}
                onPlay={onPlayArtist}
                onFocusInArtistsView={focusArtistInCurrentView}
                onViewArtistGraph={focusArtistRelatedGenres}
                onViewSimilarArtistGraph={createSimilarArtistGraph}
                //playLoading={playerLoading && (!!selectedArtist ? playerLoadingKey === `artist:${selectedArtist.id}` : false)}
                playLoading={isPlayerLoadingArtist()}
                viewRelatedArtistsLoading={!!pendingArtistGenreGraph}
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
                    show={graph === 'artists' && artistGenreFilter.length > 0}
                  />
                <motion.div
                  layout
                  // className={`${graph === 'artists' ? 'flex-grow' : ''}`}
                  className='hidden'
                >
                  <Search
                    onGenreSelect={onSearchGenreSelect}
                    onArtistSelect={onSearchArtistSelect}
                    currentArtists={currentArtists}
                    genres={currentGenres?.nodes}
                    graphState={graph}
                    selectedGenres={selectedGenres}
                    selectedArtist={selectedArtist}
                    open={searchOpen}
                    setOpen={setSearchOpen}
                    genreColorMap={genreColorMap}
                    getArtistColor={getArtistColor}
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
            anchor={isMobile ? "bottom-left" : "bottom-right"}
            artworkUrl={playerArtworkUrl}
            loading={playerLoading}
            onLoadingChange={handlePlayerLoadingChange}
            headerPreferProvidedTitle={playerSource === 'genre'}
            onTitleClick={handlePlayerTitleClick}
          />
        </div>
      </AppSidebar>
      <SettingsOverlay />
      <AuthOverlay />
      <FeedbackOverlay />
    </SidebarProvider>
  );
}

export default App
