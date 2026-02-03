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
  Artist, ArtistNodeLimitType, BadDataReport, ContextAction, FindOption,
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
import GenrePreview from './components/GenrePreview';
import ArtistPreview from './components/ArtistPreview';
import Player from "@/components/Player";
import { Search } from './components/Search';
import FindFilter from "@/components/FindFilter";
import {
  buildGenreColorMap,
  generateSimilarLinks,
  isRootGenre,
  isSingletonGenre,
  mixColors,
  primitiveArraysEqual,
  fixWikiImageURL,
  assignDegreesToArtists,
  formatNumber,
  until,
  isOnPage,
} from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ClusteringPanel from "@/components/ClusteringPanel";
import { ModeToggle } from './components/ModeToggle';
import { useRecentSelections } from './hooks/useRecentSelections';
import DisplayPanel from './components/DisplayPanel';
import SharePanel from './components/SharePanel';
import NodeLimiter from './components/NodeLimiter'
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSideBar"
import { GenreInfo } from './components/GenreInfo';
import GenresFilter from './components/GenresFilter';
import DecadesFilter from './components/DecadesFilter';
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
  MAX_YTID_QUEUE_SIZE,
  DEFAULT_PLAYER,
  ALPHA_SURVEY_TIME_MS,
  DEFAULT_PREFERENCES,
  ALPHA_SURVEY_ADDED_ARTISTS,
  NODE_AMOUNT_PRESETS,
  PHASE_VERSION,
} from "@/constants";
import {FixedOrderedMap} from "@/lib/fixedOrderedMap";
import RhizomeLogo from "@/components/RhizomeLogo";
import AuthOverlay from '@/components/AuthOverlay';
import AlphaAccessDialog from '@/components/AlphaAccessDialog';
import { useAlphaAccess } from '@/hooks/useAlphaAccess';
import FeedbackOverlay from '@/components/FeedbackOverlay';
import ZoomButtons from '@/components/ZoomButtons';
import useHotkeys from '@/hooks/useHotkeys';
import { showNotiToast } from '@/components/NotiToast';
import useAuth from "@/hooks/useAuth";
import SettingsOverlay, {ChangePasswordDialog} from '@/components/SettingsOverlay';
import {submitFeedback} from "@/apis/feedbackApi";
import {useNavigate} from "react-router";
import { exportGraphAsImage } from "@/utils/exportGraph";

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
  type GraphHandle = { zoomIn: () => void; zoomOut: () => void; zoomTo: (k: number, ms?: number) => void; getZoom: () => number; getCanvas: () => HTMLCanvasElement | null }
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
  const [selectedDecades, setSelectedDecades] = useState<string[]>([]);
  // Unified collection filter state for all filter types
  const [collectionFilters, setCollectionFilters] = useState<{
    genres: string[];
    decades: string[];
  }>({
    genres: [],
    decades: [],
  });
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
  const [cursorHoveredGenre, setCursorHoveredGenre] = useState<{ id: string; position: { x: number; y: number } } | null>(null);
  const [cursorHoveredArtist, setCursorHoveredArtist] = useState<{ id: string; position: { x: number; y: number } } | null>(null);
  const [previewGenre, setPreviewGenre] = useState<{ id: string; position: { x: number; y: number } } | null>(null);
  const [previewArtist, setPreviewArtist] = useState<{ id: string; position: { x: number; y: number } } | null>(null);
  const [optionHoverSelectedId, setOptionHoverSelectedId] = useState<string | null>(null);
  const [previewModeActive, setPreviewModeActive] = useState(false);
  const previewModeTimeoutRef = useRef<number | null>(null);
  const [genreInfoToShow, setGenreInfoToShow] = useState<Genre | undefined>(undefined);
  const [showGenreCard, setShowGenreCard] = useState(false);
  const [restoreGenreCardOnArtistDismiss, setRestoreGenreCardOnArtistDismiss] = useState(false);
  const [isGenreDrawerAtMinSnap, setIsGenreDrawerAtMinSnap] = useState(false);
  const [isArtistDrawerAtMinSnap, setIsArtistDrawerAtMinSnap] = useState(false);
  const [isUserDraggingGenreCanvas, setIsUserDraggingGenreCanvas] = useState(false);
  const [isUserDraggingArtistCanvas, setIsUserDraggingArtistCanvas] = useState(false);
  const [genreDrawerExpandTrigger, setGenreDrawerExpandTrigger] = useState(0);
  const [artistDrawerExpandTrigger, setArtistDrawerExpandTrigger] = useState(0);
  const [graph, setGraph] = useState<GraphType>('genres');
  const [currentArtists, setCurrentArtists] = useState<Artist[]>([]);
  const [currentArtistLinks, setCurrentArtistLinks] = useState<NodeLink[]>([]);
  const [pendingArtistGenreGraph, setPendingArtistGenreGraph] = useState<Artist | undefined>(undefined);
  const [genreTopArtistsCache, setGenreTopArtistsCache] = useState<Map<string, Artist[]>>(new Map());
  const [canCreateSimilarArtistGraph, setCanCreateSimilarArtistGraph] = useState<boolean>(false);
  const [genreClusterMode, setGenreClusterMode] = useState<GenreClusterMode[]>(DEFAULT_CLUSTER_MODE);
  const [dagMode, setDagMode] = useState<boolean>(() => {
    const storedDagMode = localStorage.getItem('dagMode');
    return storedDagMode ? JSON.parse(storedDagMode) : false;
  });
  const [currentGenres, setCurrentGenres] = useState<GenreGraphData>();
  const [similarArtistAnchor, setSimilarArtistAnchor] = useState<Artist | undefined>();
  const [genreSizeThreshold, setGenreSizeThreshold] = useState<number>(0);

  // Default display control states
  const [nodeSize, setNodeSize] = useState<number>(() => {
    const stored = localStorage.getItem('nodeSize');
    return stored ? JSON.parse(stored) : 50;
  });
  const [linkThickness, setLinkThickness] = useState<number>(() => {
    const stored = localStorage.getItem('linkThickness');
    return stored ? JSON.parse(stored) : 50;
  });
  const [linkCurvature, setLinkCurvature] = useState<number>(() => {
    const stored = localStorage.getItem('linkCurvature');
    return stored ? JSON.parse(stored) : 50;
  });
  const [textFadeThreshold, setTextFadeThreshold] = useState<number>(() => {
    const stored = localStorage.getItem('textFadeThreshold');
    return stored ? JSON.parse(stored) : 50;
  });
  const [showLabels, setShowLabels] = useState<boolean>(() => {
    const stored = localStorage.getItem('showLabels');
    return stored ? JSON.parse(stored) : true;
  });
  const [labelSize, setLabelSize] = useState<'Small' | 'Default' | 'Large'>(() => {
    const stored = localStorage.getItem('labelSize');
    return stored ? JSON.parse(stored) : 'Default';
  });
  const [showNodes, setShowNodes] = useState<boolean>(() => {
    const stored = localStorage.getItem('showNodes');
    return stored ? JSON.parse(stored) : true;
  });
  const [showLinks, setShowLinks] = useState<boolean>(() => {
    const stored = localStorage.getItem('showLinks');
    return stored ? JSON.parse(stored) : true;
  });

  // Reset display controls to defaults
  const handleResetDisplayControls = useCallback(() => {
    setNodeSize(50);
    setLinkThickness(50);
    setLinkCurvature(50);
    setTextFadeThreshold(50);
    setShowLabels(true);
    setLabelSize('Default');
    setShowNodes(true);
    setShowLinks(true);
    // Clear from localStorage
    localStorage.removeItem('nodeSize');
    localStorage.removeItem('linkThickness');
    localStorage.removeItem('linkCurvature');
    localStorage.removeItem('textFadeThreshold');
    localStorage.removeItem('showLabels');
    localStorage.removeItem('labelSize');
    localStorage.removeItem('showNodes');
    localStorage.removeItem('showLinks');
  }, []);

  const [searchOpen, setSearchOpen] = useState(false);
  const [isFindFilterOpen, setIsFindFilterOpen] = useState(false);
  const [genreNodeLimitType, setGenreNodeLimitType] = useState<GenreNodeLimitType>(DEFAULT_GENRE_LIMIT_TYPE);
  const [artistNodeLimitType, setArtistNodeLimitType] = useState<ArtistNodeLimitType>(DEFAULT_ARTIST_LIMIT_TYPE);
  const [genreNodeCount, setGenreNodeCount] = useState<number>(DEFAULT_NODE_COUNT);
  const [artistNodeCount, setArtistNodeCount] = useState<number>(DEFAULT_NODE_COUNT);
  const [isBeforeArtistLoad, setIsBeforeArtistLoad] = useState<boolean>(true);
  const [collectionMode, setCollectionMode] = useState<boolean>(false);
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
    fetchLikedArtists,
    fetchArtistTopTracks,
    artistsPlayIDsLoading,
    artistPlayIDLoadingKey,
    fetchSingleArtist,
    similarArtists,
    fetchSimilarArtists,
  } = useArtists(artistQueryGenreIDs, TOP_ARTISTS_TO_FETCH, artistNodeLimitType, artistNodeCount, isBeforeArtistLoad, collectionMode);

  // Fetch top artists for the currently displayed genre info or the active filter
  const [topArtistsGenreId, setTopArtistsGenreId] = useState<string | undefined>(undefined);
  const { topArtists, loading: topArtistsLoading, getTopArtistsFromApi } = useGenreTopArtists(topArtistsGenreId);
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
  const [playerStartIndex, setPlayerStartIndex] = useState<number>(0);
  // TODO: prob need to make playerIDQueue an array or update state differently as it sometimes is out of sync with the ui
  const [playerIDQueue, setPlayerIDQueue] = useState<FixedOrderedMap<string, TopTrack[]>>(new FixedOrderedMap(MAX_YTID_QUEUE_SIZE));
  const [autoFocusGraph, setAutoFocusGraph] = useState<boolean>(true);
  const [separationDegrees, setSeparationDegrees] = useState<number>(0);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState<boolean>(isOnPage('reset-password'));
  const [showArtistGoTo, setShowArtistGoTo] = useState<boolean>(false);
  const {
    userID,
    userName,
    userEmail,
    userImage,
    preferences,
    likedArtists,
    isSocialUser,
    userAccess,
    signIn,
    signInSocial,
    signUp,
    signOut,
    changeEmail,
    changePassword,
    deleteUser,
    updateUser,
    likeArtist,
    unlikeArtist,
    updatePreferences,
    validSession,
    forgotPassword,
    resetPassword,
    authError,
    authLoading,
  } = useAuth();

  const { isAlphaValidated, setAlphaValidated, validatePassword } = useAlphaAccess(userAccess);
  const [alphaOpen, setAlphaOpen] = useState<boolean>(() => !isAlphaValidated);

  // Keep alpha dialog open state in sync with validation
  useEffect(() => {
    setAlphaOpen(!isAlphaValidated);
  }, [isAlphaValidated]);

  // Manual trigger for testing - listen for both alpha:open and alpha:trigger
  useEffect(() => {
    const handleOpen = () => setAlphaOpen(true);
    const handleTrigger = () => window.dispatchEvent(new Event('alpha:open'));

    window.addEventListener('alpha:open', handleOpen as any);
    window.addEventListener('alpha:trigger', handleTrigger);

    return () => {
      window.removeEventListener('alpha:open', handleOpen as any);
      window.removeEventListener('alpha:trigger', handleTrigger);
    };
  }, []);
  const navigate = useNavigate();

  const artistsAddedRef = useRef(0);

  // Get hovered artist data for preview
  const hoveredArtistData = useMemo(() => {
    if (!previewArtist) return null;
    return currentArtists.find((a) => a.id === previewArtist.id) || null;
  }, [previewArtist, currentArtists]);

  // Track window size and pass to ForceGraph for reliable resizing
  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Setup alpha feedback timer on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localStorage.getItem('showAlphaSurvey') !== 'false') {
        showNotiToast('alpha-feedback');
        localStorage.setItem('showAlphaSurvey', 'false');
      }
    }, ALPHA_SURVEY_TIME_MS)
    return () => {
      clearTimeout(timer);
    }
  }, []);

  // Show release notes notification, set in localStorage to avoid repeats
  useEffect(() => {
    if (
        userAccess !== PHASE_VERSION
        && localStorage.getItem('versionLastAccessed')
        && localStorage.getItem('versionLastAccessed') !== PHASE_VERSION
    ) {
      showNotiToast('release-notes');
      localStorage.setItem('versionLastAccessed', PHASE_VERSION);
    }
  }, [userAccess]);

  // Do any actions requested before login
  useEffect(() => {
    if (userID) {
      doContextAction();
    }
  }, [userID]);

  const singletonParentGenre = useMemo(() => {
    return {
      ...SINGLETON_PARENT_GENRE,
      subgenres: genres ? genres.filter(g => isSingletonGenre(g, GENRE_FILTER_CLUSTER_MODE)).map(s => {
        return {id: s.id, name: s.name}
      }) : []
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

  // Persist display settings to localStorage
  useEffect(() => {
    localStorage.setItem('nodeSize', JSON.stringify(nodeSize));
  }, [nodeSize]);

  useEffect(() => {
    localStorage.setItem('linkThickness', JSON.stringify(linkThickness));
  }, [linkThickness]);

  useEffect(() => {
    localStorage.setItem('linkCurvature', JSON.stringify(linkCurvature));
  }, [linkCurvature]);

  useEffect(() => {
    localStorage.setItem('textFadeThreshold', JSON.stringify(textFadeThreshold));
  }, [textFadeThreshold]);

  useEffect(() => {
    localStorage.setItem('showLabels', JSON.stringify(showLabels));
  }, [showLabels]);

  useEffect(() => {
    localStorage.setItem('labelSize', JSON.stringify(labelSize));
  }, [labelSize]);

  useEffect(() => {
    localStorage.setItem('showNodes', JSON.stringify(showNodes));
  }, [showNodes]);

  useEffect(() => {
    localStorage.setItem('showLinks', JSON.stringify(showLinks));
  }, [showLinks]);

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

  // Global hotkeys (+, -, /) and command key tracking
  const { isCommandHeld, isOptionHeld } = useHotkeys({
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

  // Export graph handler
  const handleExportGraph = useCallback(() => {
    const ref = graph === 'genres' ? genresGraphRef.current : artistsGraphRef.current;
    const canvas = ref?.getCanvas?.() ?? null;
    const graphType = graph === 'genres' ? 'genre' : 'artist';
    exportGraphAsImage(canvas, { graphType, theme: resolvedTheme });
  }, [graph, resolvedTheme]);

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

  // Computes the artists/links to display - applies collection filters when in collection mode
  const displayedArtistsData = useMemo(() => {
    if (!collectionMode) {
      return { artists, links: artistLinks };
    }

    let filtered = artists;

    // Apply genre filter (if any genres selected)
    if (collectionFilters.genres.length > 0) {
      filtered = filtered.filter(artist =>
        artist.genres.some(genreId => collectionFilters.genres.includes(genreId))
      );
    }

    // Apply decade filter (if any decades selected)
    // TODO: Implement when decade data is available on artists
    // if (collectionFilters.decades.length > 0) {
    //   filtered = filtered.filter(artist => {
    //     const decade = getArtistDecade(artist);
    //     return collectionFilters.decades.includes(decade);
    //   });
    // }

    // Filter links to only include connections between filtered artists
    const filteredArtistIds = new Set(filtered.map(a => a.id));
    const filteredLinks = artistLinks.filter(link =>
      filteredArtistIds.has(link.source) && filteredArtistIds.has(link.target)
    );

    return { artists: filtered, links: filteredLinks };
  }, [collectionMode, artists, artistLinks, collectionFilters]);

  // Sets current artists/links shown in the graph
  useEffect(() => {
    setCurrentArtists(displayedArtistsData.artists);
    setCurrentArtistLinks(displayedArtistsData.links);
  }, [displayedArtistsData]);

  const findLabel = useMemo(() => {
    if (graph === 'genres' && selectedGenres.length) {
      return selectedGenres[0].name;
    }
    if ((graph === 'artists' || graph === 'similarArtists') && selectedArtist) {
      return selectedArtist.name;
    }
    return null;
  }, [graph, selectedGenres, selectedArtist]);

  // Compute genres available in the collection (only includes genres from liked artists)
  const collectionGenres = useMemo(() => {
    if (!collectionMode || !artists.length) return genres;

    // Extract unique genre IDs from all liked artists (use 'artists' not 'currentArtists' to avoid loops)
    const genreIdsInCollection = new Set<string>();
    artists.forEach(artist => {
      artist.genres.forEach(genreId => genreIdsInCollection.add(genreId));
    });

    // Filter genres list to only include genres present in collection
    return genres.filter(genre => genreIdsInCollection.has(genre.id));
  }, [collectionMode, artists, genres]);

  // Memoize the full genre list with singleton parent for collection mode
  const collectionGenresWithParent = useMemo(() => {
    return [...collectionGenres, singletonParentGenre];
  }, [collectionGenres, singletonParentGenre]);

  // Initializes the genre graph data after fetching genres from DB
  useEffect(() => {
    if (genres) {
      const nodeCount = genres.length;
      onGenreNodeCountChange(nodeCount);
      const colorMap = buildGenreColorMap(genres, genreRoots);
      // console.log('[App Debug] Building genreColorMap');
      // console.log('  genres.length:', genres.length);
      // console.log('  genreRoots:', genreRoots);
      // console.log('  colorMap.size:', colorMap.size);
      // console.log('  first 5 colorMap entries:', Array.from(colorMap.entries()).slice(0, 5));
      setGenreColorMap(colorMap);
    }
  }, [genres, genreLinks, genreRoots]);

  // Fetches top tracks of selected genre player ids in the background
  useEffect(() => {
    if (topArtistsGenreId && topArtists.length) {
      setGenreTopArtistsCache(prev => new Map(prev).set(topArtistsGenreId, topArtists));
    }
    updateGenrePlayerIDs();
  }, [topArtists, topArtistsGenreId]);

  // Sets the genre ID for which to fetch top artists
  useEffect(() => {
    if (genreInfoToShow) {
      setTopArtistsGenreId(genreInfoToShow.id);
    }
  }, [genreInfoToShow]);

  // Sets the genre ID for which to fetch top artists
  useEffect(() => {
    if (artistFilterGenres.length) {
      setTopArtistsGenreId(artistFilterGenres[0]?.id);
    }
  }, [artistFilterGenres]);

  // Fetches top tracks of selected artist player ids in the background
  useEffect(() => {
    if (selectedArtist) updateArtistPlayerIDs(selectedArtist)
  }, [selectedArtist]);

  // Fetches top tracks of hovered artist player ids in the background
  useEffect(() => {
    if (hoveredArtistData) updateArtistPlayerIDs(hoveredArtistData)
  }, [hoveredArtistData]);

  // Switches to the similar artists view once similar artist data is loaded
  useEffect(() => {
    if (canCreateSimilarArtistGraph) {
      if (similarArtists.length > 1) {
        const links = generateSimilarLinks(similarArtists);
        setCurrentArtists(similarArtists);
        setCurrentArtistLinks(links);
        setGraph('similarArtists');
        setShowArtistCard(true);
      }
      setCanCreateSimilarArtistGraph(false);
    }
  }, [similarArtists]);

  // Switch to artist graph after genres' artists are loaded
  // TODO: I suspect this causes "no genre selected" top 2000 artists to always be fetched, wasteful if clicking "All Artists"
  useEffect(() => {
    if (pendingArtistGenreGraph && artists.length > 0 && !artistsLoading) {
      //console.log('[useEffect pendingArtistGenreGraph] Artists loaded, switching to artists graph');
      setGraph('artists');
      setPendingArtistGenreGraph(undefined);
    }
  }, [pendingArtistGenreGraph, artists, artistsLoading]);

  // Whether or not to show the chevron/focusing action on the artists info
  useEffect(() => {
    let show = false;
    if (graph === 'similarArtists') {
      show = !!artistInfoToShow && similarArtists.map(s => s.id).includes(artistInfoToShow.id);
    } else {
      show = !!artistInfoToShow && currentArtists.map(c => c.id).includes(artistInfoToShow.id);
    }
    setShowArtistGoTo(show);
  }, [graph, artistInfoToShow, currentArtists, similarArtists]);

  // Add genre play IDs to the playerIDQueue on genre click
  // Allows for manual fetching of top artists if passed a genre (i.e. search)
  // Only pass a genre if needed to play outside of the graph or info drawer
  const updateGenrePlayerIDs = async (genre?: Genre) => {
    const queueGenreID = genre? genre.id : topArtistsGenreId;
    let genreTopArtists: Artist[] = [];
    if (genre) {
      genreTopArtists = await getTopArtistsFromApi(queueGenreID);
    } else {
      genreTopArtists = topArtists
    }
    if (genreTopArtists && genreTopArtists.length && queueGenreID && !playerIDQueue.has(queueGenreID)) {
      const genreTracks: TopTrack[] = [];
      for (const artist of genreTopArtists) {
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
  const updateArtistPlayerIDs = async (artist: Artist) => {
    if (artist && !playerIDQueue.has(artist.id)) {
      const currentSelectedArtist = {
        id: artist.id,
        name: artist.name,
        noTopTracks: artist.noTopTracks,
        topTracks: artist.topTracks
      };
      // If we haven't already tried and failed to fetch tracks for this artist
      if (!currentSelectedArtist.noTopTracks) {
        if (currentSelectedArtist.topTracks) {
          playerIDQueue.set(currentSelectedArtist.id, currentSelectedArtist.topTracks);
        } else {
          const artistTracks = await fetchArtistTopTracks(currentSelectedArtist.id, currentSelectedArtist.name);
          if (artistTracks) {
            playerIDQueue.set(currentSelectedArtist.id, artistTracks);
            // Update the selectedArtist state so the UI reflects the newly fetched tracks
            setSelectedArtist(prev => {
              if (prev && prev.id === currentSelectedArtist.id) {
                return { ...prev, topTracks: artistTracks };
              }
              return prev;
            });
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
    setPlayerStartIndex(0); // reset start index when playing full artist
    setPlayerOpen(true);
    try {
      // wait until artist's tracks are done loading
      if (artistsPlayIDsLoading && artistPlayIDLoadingKey === artistLoadingKey) {
        await until(() => !artistsPlayIDsLoadingRef.current || artistPlayIDLoadingKeyRef.current !== artistLoadingKey);
      }
      let playerIDs = getSpecificPlayerIDs(artist.id);
      if (!playerIDs.length) {
        await updateArtistPlayerIDs(artist);
        playerIDs = getSpecificPlayerIDs(artist.id);
      }
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
    setPlayerStartIndex(0); // reset start index when playing genre
    setPlayerOpen(true);
    try {
      if (req !== playRequest.current) return; // superseded
      // wait until genre tracks are loaded (shouldn't happen, here for safety)
      if (artistsPlayIDsLoading && genre.topArtists) {
        const loadingIDs = genre.topArtists.map(artist => `artist:${artist.id}`);
        await until(() => !artistsPlayIDsLoadingRef.current || !loadingIDs.includes(artistPlayIDLoadingKeyRef.current));
      }
      let playerIDs = getSpecificPlayerIDs(genre.id);
      if (!playerIDs.length) {
        await updateGenrePlayerIDs(genre);
        playerIDs = getSpecificPlayerIDs(genre.id);
      }
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

  const onPlayArtistTrack = async (tracks: TopTrack[], startIndex: number) => {
    if (!tracks || tracks.length === 0) {
      toast.error('No tracks available');
      return;
    }
    const req = ++playRequest.current;
    setPlayerLoading(true);
    setPlayerSource('artist');
    // Extract video IDs based on DEFAULT_PLAYER preference
    const videoIds: string[] = [];
    for (const track of tracks) {
      const videoId = track[DEFAULT_PLAYER];
      if (videoId) {
        videoIds.push(videoId);
      }
    }
    if (videoIds.length === 0) {
      toast.error('No playable tracks found');
      setPlayerLoading(false);
      return;
    }
    // Use the selected artist's metadata if available
    if (selectedArtist) {
      setPlayerTitle(selectedArtist.name);
      setPlayerEntityName(selectedArtist.name);
      const imgEarly = typeof selectedArtist.image === 'string' && selectedArtist.image.trim()
        ? fixWikiImageURL(selectedArtist.image as string)
        : undefined;
      setPlayerArtworkUrl(imgEarly);
    }
    setPlayerVideoIds(videoIds);
    setPlayerStartIndex(startIndex);
    setPlayerOpen(true);
    try {
      // Player will handle loading
      if (req === playRequest.current) {
        setPlayerLoading(false);
      }
    } catch (e) {
      if (req === playRequest.current) {
        toast.error('Unable to play track');
        setPlayerLoading(false);
        setPlayerSource(undefined);
        setPlayerOpen(false);
      }
    }
  };

  const onPlayGenreTrack = async (tracks: TopTrack[], startIndex: number) => {
    if (!tracks || tracks.length === 0) {
      toast.error('No tracks available');
      return;
    }
    const req = ++playRequest.current;
    setPlayerLoading(true);
    setPlayerSource('genre');
    // Extract video IDs based on DEFAULT_PLAYER preference
    const videoIds: string[] = [];
    for (const track of tracks) {
      const videoId = track[DEFAULT_PLAYER];
      if (videoId) {
        videoIds.push(videoId);
      }
    }
    if (videoIds.length === 0) {
      toast.error('No playable tracks found');
      setPlayerLoading(false);
      return;
    }
    // Use the selected genre's metadata if available
    if (selectedGenres.length > 0) {
      const genre = selectedGenres[0];
      setPlayerTitle(genre.name);
      setPlayerEntityName(genre.name);
      // Use artwork from first top artist with an image
      const source = topArtists && topArtists.length ? topArtists : currentArtists;
      const coverArtist = source.find(a => typeof a.image === 'string' && (a.image as string).trim());
      const img = coverArtist ? fixWikiImageURL(coverArtist.image as string) : undefined;
      setPlayerArtworkUrl(img);
    }
    setPlayerVideoIds(videoIds);
    setPlayerStartIndex(startIndex);
    setPlayerOpen(true);
    try {
      // Player will handle loading
      if (req === playRequest.current) {
        setPlayerLoading(false);
      }
    } catch (e) {
      if (req === playRequest.current) {
        toast.error('Unable to play track');
        setPlayerLoading(false);
        setPlayerSource(undefined);
        setPlayerOpen(false);
      }
    }
  };

  const onPlayGenreFromPreview = () => {

  }

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
    const a = currentArtists.find((x) => x.name === name);
    const raw = a?.image as string | undefined;
    return raw ? fixWikiImageURL(raw) : undefined;
  }

  const getArtistByName = (name: string) => {
    return currentArtists.find((a) => a.name === name);
  }

  const getGenreNameById = (id: string) => {
    return genres.find((g) => g.id === id)?.name;
  }

  // Fetch top artists for a genre
  const fetchGenreTopArtists = async (genreID: string) => {
    // Check if already in cache
    if (genreTopArtistsCache.has(genreID)) return;
    setTopArtistsGenreId(genreID);
  };

  // Update preview states based on cursor hover + command key or delay
  useEffect(() => {
    const triggerMode = preferences?.previewTrigger || 'modifier';
    const shouldShowPreview = preferences?.enableGraphCards && !showGenreCard && !showArtistCard;

    if (!shouldShowPreview || !cursorHoveredGenre) {
      setPreviewGenre(null);
      return;
    }

    // If trigger mode is 'delay', show immediately (GraphCard handles the delay)
    // If trigger mode is 'modifier', only show when command key is held
    if (triggerMode === 'delay' || (triggerMode === 'modifier' && isCommandHeld)) {
      setPreviewGenre(cursorHoveredGenre);
      if (cursorHoveredGenre.id) {
        fetchGenreTopArtists(cursorHoveredGenre.id);
      }
    } else {
      setPreviewGenre(null);
    }
  }, [isCommandHeld, cursorHoveredGenre, preferences?.enableGraphCards, preferences?.previewTrigger, showGenreCard, showArtistCard]);

  useEffect(() => {
    const triggerMode = preferences?.previewTrigger || 'modifier';
    const shouldShowPreview = preferences?.enableGraphCards;

    if (!shouldShowPreview || !cursorHoveredArtist) {
      setPreviewArtist(null);
      return;
    }

    // If trigger mode is 'delay', show immediately (GraphCard handles the delay)
    // If trigger mode is 'modifier', only show when command key is held
    if (triggerMode === 'delay' || (triggerMode === 'modifier' && isCommandHeld)) {
      setPreviewArtist(cursorHoveredArtist);
    } else {
      setPreviewArtist(null);
    }
  }, [isCommandHeld, cursorHoveredArtist, preferences?.enableGraphCards, preferences?.previewTrigger]);

  // Option + hover: temporarily select hovered node to show its connections
  useEffect(() => {
    if (isOptionHeld && cursorHoveredArtist) {
      setOptionHoverSelectedId(cursorHoveredArtist.id);
    } else if (isOptionHeld && cursorHoveredGenre) {
      setOptionHoverSelectedId(cursorHoveredGenre.id);
    } else {
      setOptionHoverSelectedId(null);
    }
  }, [isOptionHeld, cursorHoveredArtist, cursorHoveredGenre]);

  // Activate preview mode when a card is shown
  const handlePreviewShown = () => {
    setPreviewModeActive(true);

    // Clear existing timeout
    if (previewModeTimeoutRef.current) {
      clearTimeout(previewModeTimeoutRef.current);
    }

    // Reset after 1s of inactivity
    previewModeTimeoutRef.current = setTimeout(() => {
      setPreviewModeActive(false);
    }, 1000);
  };

  // Handle genre hover - track cursor hover state
  const handleGenreHover = (id: string | null, position: { x: number; y: number } | null) => {
    // Always track what's being hovered, regardless of command key
    setCursorHoveredGenre(id && position ? { id, position } : null);
  };

  // Get hovered genre data for preview
  const hoveredGenreData = useMemo(() => {
    if (!previewGenre || !currentGenres) return null;
    const genre = currentGenres.nodes.find((g) => g.id === previewGenre.id);
    if (!genre) return null;

    // If the preview genre is the selected genre, use the loaded topArtists data
    // Otherwise, use cached artist data (fetched on hover)
    const isSelectedGenre = selectedGenres.some(g => g.id === genre.id);
    const cachedArtists = genreTopArtistsCache.get(genre.id) || [];
    const artists = isSelectedGenre ? topArtists : cachedArtists;

    return { genre, topArtists: artists };
  }, [previewGenre, currentGenres, selectedGenres, topArtists, genreTopArtistsCache]);

  const onGenreNodeClick = (genre: Genre) => {
    if (isBeforeArtistLoad) setIsBeforeArtistLoad(false);
    setIsUserDraggingGenreCanvas(false); // Re-enable dimming when selecting a new node
    setGenreDrawerExpandTrigger(prev => prev + 1); // Expand drawer to middle position
    // Don't set initialGenreFilter here - clicking a genre is just for viewing, not filtering
    setSelectedGenres([genre]);
    setGenreInfoToShow(genre);
    setShowGenreCard(true);
    setShowArtistCard(false); // Hide artist card but preserve selection for tab switching
    setAutoFocusGraph(true); // Enable auto-focus for node clicks
    addRecentSelection(genre);
  };

  // Trigger full artist view for a genre from UI (e.g., GenreInfo "All Artists")
  const onShowAllArtists = (genre: Genre) => {
    // Ensure the artists hook actually fetches data when switching via this path
    if (isBeforeArtistLoad) setIsBeforeArtistLoad(false);

    // Clear any previously selected artist - we're viewing "all artists" for this genre
    setSelectedArtist(undefined);
    setArtistInfoToShow(undefined);
    setShowArtistCard(false);
    setSelectedArtistFromSearch(false);
    setArtistPreviewStack([]);
    setRestoreGenreCardOnArtistDismiss(false);

    // Keep the genre info card visible in artist view
    setGenreInfoToShow(genre);
    setShowGenreCard(true);

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
    // Don't refetch genre if artist is already in node selection
    if (!currentArtists.map(a => a.id).includes(artist.id)) {
      // Apply genre filter from current context
      const currentGenre = genreInfoToShow || selectedGenres[0];
      if (currentGenre) {
        setArtistGenreFilter([currentGenre]);
        setArtistFilterGenres([currentGenre]); // Set the new filter state
        setSelectedGenres([currentGenre]);
        setInitialGenreFilter(createInitialGenreFilterObject(currentGenre));
        setGraph('artists');
      }
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

  const handleGenreCanvasDragStart = () => {
    setIsUserDraggingGenreCanvas(true);
  };

  const handleArtistCanvasDragStart = () => {
    setIsUserDraggingArtistCanvas(true);
  };

  const handleGenreHeaderRefocus = () => {
    setIsUserDraggingGenreCanvas(false);
    setGenreDrawerExpandTrigger(prev => prev + 1);
  };

  const handleArtistHeaderRefocus = () => {
    setIsUserDraggingArtistCanvas(false);
    setArtistDrawerExpandTrigger(prev => prev + 1);
  };

  const onArtistNodeClick = (artist: Artist) => {
    setIsUserDraggingArtistCanvas(false); // Re-enable dimming when selecting a new node
    setArtistDrawerExpandTrigger(prev => prev + 1); // Expand drawer to middle position
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
  };

  const focusArtistInCurrentView = (artist: Artist, opts?: { forceRefocus?: boolean }) => {
    if (isBeforeArtistLoad) setIsBeforeArtistLoad(false);
    // const matchesCurrentFilter =
    //   artistGenreFilter.length === 0 ||
    //   artist.genres.some((genreId) => artistGenreFilterIDs.includes(genreId));
    setSelectedArtist(artist);
    let shouldTriggerRefocus = opts?.forceRefocus === true;
    if (graph !== 'artists' && graph !== 'similarArtists') {
      setGraph('artists');
      shouldTriggerRefocus = true;
    }
    setSelectedArtistFromSearch(false);
    if (shouldTriggerRefocus) {
      setAutoFocusGraph(false);
      setTimeout(() => setAutoFocusGraph(true), 16);
    } else {
      setAutoFocusGraph(true);
    }
    addRecentSelection(artist);
  }

  const focusGenreInCurrentView = (genre: Genre, opts?: { forceRefocus?: boolean }) => {
    let shouldTriggerRefocus = opts?.forceRefocus === true || !currentGenres;
    if (graph !== 'genres') {
      setGraph('genres');
      shouldTriggerRefocus = true;
    }
    setGenreInfoToShow(genre);
    setShowGenreCard(true);
    setShowArtistCard(false); // Hide artist card but preserve selection for tab switching
    setSelectedGenres([genre]);
    // Don't set initialGenreFilter here - focusing a genre is just for viewing, not filtering
    addRecentSelection(genre);
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
      if (graph !== 'artists' && graph !== 'similarArtists') {
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
    setCollectionMode(false);
    // Clear collection mode filters when exiting to explore mode
    setCollectionFilters({ genres: [], decades: [] });
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
    setArtistPreviewStack([]);
  }

  // Force the drawer to remount when restoring a previously focused artist without flashing the genre card
  const reopenArtistInfoCard = (artist: Artist, options?: { fromSearch?: boolean }) => {
    setArtistInfoToShow(artist);
    setSelectedArtist(artist);
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
      reopenArtistInfoCard(previousPreview, { fromSearch: true });
      setArtistPreviewStack((prev) => prev.slice(0, -1));
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
    setCanCreateSimilarArtistGraph(true);
    await fetchSimilarArtists(artistResult);
    setSelectedArtistFromSearch(false);
    setArtistPreviewStack([]);
    setSelectedArtist(artistResult);
    setSimilarArtistAnchor(artistResult);
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
    const genre = genres ? genres.find((g) => g.id === genreID) : undefined;
    if (genre) {
      return genre.rootGenres;
    }
    return [];
  }, [genres]);

  const onBadDataGenreSubmit = async (itemID: string, reason: string, type: 'genre' | 'artist', hasFlag: boolean, details?: string) => {
    const user = userID ? userID : 'unregistered';
    const report: BadDataReport = {
      userID: user,
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
    const user = userID ? userID : 'unregistered';
    const report: BadDataReport = {
      userID: user,
      itemID,
      reason,
      type,
      resolved: false,
      details,
    }
    const success = await flagBadArtistData(report);
    if (success && !hasFlag) {
      if (selectedArtist) {
        const updatedSelected = {...selectedArtist, badDataFlag: !selectedArtist.badDataFlag};
        setCurrentArtists([...currentArtists.filter(a => a.id !== selectedArtist.id), updatedSelected]);
        setSelectedArtist(updatedSelected);
      }
    }
    return success;
  }

  const getRootGenreFromTags = useCallback((tags: Tag[]) => {
    if (tags && tags.length && genres) {
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
      //console.log('gf selection change: ' + selectedIDs.length)
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

  const onDecadeSelectionChange = (selectedIDs: string[]) => {
    setSelectedDecades(selectedIDs);
    // TODO: Implement decade filtering logic
  }

  // Generic collection filter handler - works for any filter type
  const onCollectionFilterChange = useCallback((filterType: 'genres' | 'decades', selectedIDs: string[]) => {
    setCollectionFilters(prev => ({
      ...prev,
      [filterType]: selectedIDs,
    }));
  }, []);

  // Just filter the current nodes if selection is less than the current node count
  const artistNodeCountSelection = (value: number) => {
    if (value === artistNodeCount) return;
    setArtistNodeCount(value);
    if (value < artistNodeCount) {
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

  // TODO: create backend endpoint specifically for this; smaller artists don't show up if they're in big genres
  const focusArtistRelatedGenres = (artist: Artist) => {
    const genreIds = Array.from(new Set((artist.genres ?? []).filter(Boolean)));

    // console.log('[focusArtistRelatedGenres]', {
    //   artistName: artist.name,
    //   artistId: artist.id,
    //   genreIds: genreIds,
    //   genreCount: genreIds.length
    // });

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

    //console.log('[focusArtistRelatedGenres] matched genres:', matched.map(g => ({ id: g.id, name: g.name })));

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
    setCollectionMode(false);
  };

  const onAddArtistButtonToggle = async (artistID?: string) => {
    if (userID) {
      if (!artistID) return;
      if (likedArtists && isInCollection(artistID)) {
        await unlikeArtist(artistID);
      } else {
        await likeArtist(artistID);
        // Logic for alpha survey triggering
        artistsAddedRef.current++;
        if (localStorage.getItem('showAlphaSurvey') !== 'false' && artistsAddedRef.current >= ALPHA_SURVEY_ADDED_ARTISTS) {
          showNotiToast('alpha-feedback');
          localStorage.setItem('showAlphaSurvey', 'false');
        }
      }
    } else {
      const action: ContextAction = {type: 'addArtist', artistID};
      localStorage.setItem('unregisteredAction', JSON.stringify(action));
      window.dispatchEvent(new Event('auth:open'));
    }
  }

  const isInCollection = (artistID?: string) => {
    return artistID ? likedArtists.includes(artistID) : false;
  }

  // temporary functionality to just show liked artists if logged in
  const onCollectionClick = async () => {
    if (userID) {
      setCollectionMode(true);
      // Clear explore mode filters when entering collection mode
      setArtistGenreFilter([]);
      setArtistFilterGenres([]);
      setSelectedDecades([]);
      if (likedArtists.length) {
        await fetchLikedArtists(likedArtists);
        setGraph('artists');
      } else {
        toast.info("You haven't added any artists yet!");
      }
    } else {
      const action: ContextAction = {type: 'viewCollection'};
      localStorage.setItem('unregisteredAction', JSON.stringify(action));
      window.dispatchEvent(new Event('auth:open'));
    }
  }

  const onExploreClick = () => {
    resetAppState();
  }

  const setDegrees = (value: number) => {
    if (currentArtists && likedArtists && likedArtists.length) {
      const degreeArtists = assignDegreesToArtists(currentArtists, likedArtists).filter(da => da.degree === 0 || (da.degree && da.degree <= value));
      const artistSet = new Set(degreeArtists.map(a => a.id));
      const newLinks = currentArtistLinks.filter(l => {
        return artistSet.has(l.source) && artistSet.has(l.target);
      })
      setCurrentArtists(degreeArtists);
      setCurrentArtistLinks(newLinks);
    }
  }

  // Uses useNavigate to navigate to a path, accepts optional functions to run before and after navigation
  const navigateAnd = (pathname: string, beforeFn?: () => void, afterFn?: () => void) => {
    if (beforeFn) beforeFn();
    navigate(pathname);
    if (afterFn) afterFn();
  }

  // Does the previous action requested before logging in
  const doContextAction = async () => {
    const actionString = localStorage.getItem('unregisteredAction');
    if (actionString && actionString.length) {
      const action = JSON.parse(actionString) as ContextAction;
      switch (action.type) {
        case 'addArtist':
          // Don't remove artist if already added
          if (action.artistID && !isInCollection(action.artistID)) {
            // If the app is reset (OAuth), select the artist with the similar artist graph
            if (!selectedArtist) {
              let artist = artists.find(a => a.id === action.artistID);
              if (!artist) artist = await fetchSingleArtist(action.artistID);
              if (artist) {
                setGraph('similarArtists');
                createSimilarArtistGraph(artist);
              }
            }
            await onAddArtistButtonToggle(action.artistID);
          }
          break;
        case 'viewCollection':
          await onCollectionClick();
          break;
        default:
      }
    }
    localStorage.removeItem('unregisteredAction');
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
        onCollectionClick={onCollectionClick}
        onExploreClick={onExploreClick}
        signedInUser={!!userID}
        isCollectionMode={collectionMode}
        searchOpen={searchOpen}
      >
        <SidebarLogoTrigger />
        <Toaster />
        <div className="fixed inset-0 z-0 overflow-hidden no-scrollbar">
          <Gradient />
          <AnimatePresence>
            <motion.div
              layout
              transition={{ layout: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
              className={
                "fixed top-0 left-0 z-70 pt-3 pl-3 flex justify-left flex-col items-start md:flex-row gap-3"
              }
              style={{ left: "var(--sidebar-gap)" }}
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
                      genreColorMap={genreColorMap}
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
              <AnimatePresence initial={false} mode="popLayout">
                {!collectionMode && (
                  <motion.div
                    key="tabs"
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Tabs
                      value={graph === 'similarArtists' ? 'artists' : graph}
                      onValueChange={(val) => onTabChange(val as GraphType)}>
                        <TabsList>
                          <TabsTrigger value="genres">Genres</TabsTrigger>
                          <TabsTrigger value="artists">Artists</TabsTrigger>
                        </TabsList>
                    </Tabs>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence initial={false} mode="popLayout">
                {graph === 'similarArtists' && similarArtistAnchor && (
                  <motion.div
                    key="similar-banner"
                    layout
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <Button
                      size='lg'
                      variant='outline'
                      onClick={() => onTabChange('artists')}
                      className="gap-2"
                    >
                      Similar artists: {similarArtistAnchor.name}
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence initial={false} mode="popLayout">
                {collectionMode && graph === 'artists' && (
                  <motion.div
                    key="collection-filters"
                    layout
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden" }}
                    className='flex flex-col items-start sm:flex-row gap-3'
                  >
                    <GenresFilter
                      genres={collectionGenresWithParent}
                      genreClusterModes={GENRE_FILTER_CLUSTER_MODE}
                      graphType={graph}
                      onGenreSelectionChange={(ids) => onCollectionFilterChange('genres', ids)}
                      initialSelection={{ genre: undefined, isRoot: false, parents: {} }}
                      selectedGenreIds={collectionFilters.genres}
                      genreColorMap={genreColorMap}
                    />
                    {/* TODO: Add DecadesFilter when ready
                    <DecadesFilter
                      onDecadeSelectionChange={(ids) => onCollectionFilterChange('decades', ids)}
                      selectedDecadeIds={collectionFilters.decades}
                    />
                    */}
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence initial={false} mode="popLayout">
                {!collectionMode && graph === 'artists' && (
                  <motion.div
                    key="artist-filters"
                    layout
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden" }}
                    className='flex flex-col items-start sm:flex-row gap-3'
                  >
                    <GenresFilter
                      //key={initialGenreFilter.genre ? initialGenreFilter.genre.id : "none_selected"}
                      genres={[...genres, singletonParentGenre]}
                      genreClusterModes={GENRE_FILTER_CLUSTER_MODE}
                      graphType={graph}
                      onGenreSelectionChange={onGenreFilterSelectionChange}
                      initialSelection={initialGenreFilter}
                      selectedGenreIds={artistGenreFilterIDs}
                      genreColorMap={genreColorMap}
                    />
                    <DecadesFilter
                      onDecadeSelectionChange={onDecadeSelectionChange}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div layout>
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
          </motion.div>
          </AnimatePresence>
                <GenresForceGraph
                  ref={genresGraphRef}
                  graphData={currentGenres}
                  onNodeClick={onGenreNodeClick}
                  onNodeHover={handleGenreHover}
                  selectedGenreId={selectedGenres[0]?.id}
                  hoverSelectedId={optionHoverSelectedId}
                  colorMap={genreColorMap}
                  dag={dagMode}
                  clusterModes={genreClusterMode}
                  autoFocus={autoFocusGraph}
                  show={graph === "genres" && !genresError}
                  loading={genresLoading}
                  width={viewport.width || undefined}
                  height={viewport.height || undefined}
                  nodeSize={nodeSize}
                  linkThickness={linkThickness}
                  linkCurvature={linkCurvature}
                  showLabels={showLabels}
                  labelSize={labelSize}
                  textFadeThreshold={textFadeThreshold}
                  showNodes={showNodes}
                  showLinks={showLinks}
                  disableDimming={isUserDraggingGenreCanvas || isGenreDrawerAtMinSnap}
                />
                <ArtistsForceGraph
                  ref={artistsGraphRef}
                  artists={currentArtists}
                  artistLinks={currentArtistLinks}
                  onNodeClick={onArtistNodeClick}
                  onNodeHover={(id, position) => {
                      // Always track what's being hovered, regardless of command key
                      setCursorHoveredArtist(id && position ? { id, position } : null);
                  }}
                  selectedArtistId={selectedArtist?.id}
                  hoverSelectedId={optionHoverSelectedId}
                  computeArtistColor={getArtistColor}
                  autoFocus={autoFocusGraph}
                  show={(graph === "artists" || graph === "similarArtists") && !artistsError}
                  //loading={graph === 'similarArtists' ? similarArtistsLoading : artistsLoading}
                  loading={artistsLoading}
                  width={viewport.width || undefined}
                  height={viewport.height || undefined}
                  nodeSize={nodeSize}
                  linkThickness={linkThickness}
                  linkCurvature={linkCurvature}
                  showLabels={showLabels}
                  labelSize={labelSize}
                  textFadeThreshold={textFadeThreshold}
                  showNodes={showNodes}
                  showLinks={showLinks}
                  disableDimming={isUserDraggingArtistCanvas || isArtistDrawerAtMinSnap}
                />

          {/* Genre hover preview */}
          {preferences?.enableGraphCards && hoveredGenreData && previewGenre && graph === 'genres' && !showGenreCard && (
              <GenrePreview
                  genre={hoveredGenreData.genre}
                  topArtists={hoveredGenreData.topArtists}
                  genreColorMap={genreColorMap}
                  onNavigate={(genre) => onGenreNodeClick(genre)}
                  onAllArtists={(genre) => onShowAllArtists(genre)}
                  onPlay={onPlayGenre}
                  playLoading={playerLoading}
                  position={previewGenre.position}
                  visible={!isMobile}
                  previewModeActive={preferences?.previewTrigger === 'modifier' ? true : previewModeActive}
                  onShow={handlePreviewShown}
              />
          )}

          {/* Artist hover preview */}
          {preferences?.enableGraphCards && hoveredArtistData && previewArtist
              && (graph === 'artists' || graph === 'similarArtists') && !showArtistCard && (
                  <ArtistPreview
                      artist={hoveredArtistData}
                      genreColorMap={genreColorMap}
                      getGenreNameById={getGenreNameById}
                      onNavigate={(artist) => onArtistNodeClick(artist)}
                      onPlay={onPlayArtist}
                      onToggle={onAddArtistButtonToggle}
                      playLoading={playerLoading}
                      isInCollection={isInCollection(hoveredArtistData.id)}
                      position={previewArtist.position}
                      visible={!isMobile}
                      getArtistImageByName={getArtistImageByName}
                      getArtistByName={getArtistByName}
                      setArtistFromName={setArtistFromName}
                      getArtistColor={getArtistColor}
                      previewModeActive={preferences?.previewTrigger === 'modifier' ? true : previewModeActive}
                      onShow={handlePreviewShown}
                  />
              )}

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
            {/*Genre Node Limiter*/}
            <NodeLimiter
              totalNodes={genres ? genres.length : 0}
              nodeType={'genres'}
              initialValue={genreNodeCount}
              onChange={onGenreNodeCountChange}
              show={showGenreNodeLimiter()}
              nodeAmountPresets={NODE_AMOUNT_PRESETS}
            />
            {/*Artist Node Limiter*/}
            <NodeLimiter
              totalNodes={totalArtistsInDB}
              nodeType={'artists'}
              initialValue={currentArtists.length}
              onChange={artistNodeCountSelection}
              show={showArtistNodeLimiter()}
              nodeAmountPresets={NODE_AMOUNT_PRESETS}
            />
            {/*For testing node degrees*/}
            {/*<NodeLimiter*/}
            {/*    totalNodes={6}*/}
            {/*    nodeType={'collection'}*/}
            {/*    initialValue={Infinity}*/}
            {/*    onChange={(value) => setDegrees(value)}*/}
            {/*    show={graph === 'artists' && collectionMode}*/}
            {/*/>*/}
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
                nodeSize={nodeSize}
                setNodeSize={setNodeSize}
                linkThickness={linkThickness}
                setLinkThickness={setLinkThickness}
                linkCurvature={linkCurvature}
                setLinkCurvature={setLinkCurvature}
                textFadeThreshold={textFadeThreshold}
                setTextFadeThreshold={setTextFadeThreshold}
                showLabels={showLabels}
                setShowLabels={setShowLabels}
                labelSize={labelSize}
                setLabelSize={setLabelSize}
                showNodes={showNodes}
                setShowNodes={setShowNodes}
                showLinks={showLinks}
                setShowLinks={setShowLinks}
                onReset={handleResetDisplayControls}
                defaults={{
                  nodeSize: 50,
                  linkThickness: 50,
                  linkCurvature: 50,
                  textFadeThreshold: 50,
                  showLabels: true,
                  labelSize: 'Default',
                  showNodes: true,
                  showLinks: true,
                }}
              />
              <SharePanel onExport={handleExportGraph} />
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
                playLoading={isPlayerLoadingGenre()}
                genreTracks={selectedGenres.length > 0 ? playerIDQueue.get(selectedGenres[0].id) : undefined}
                onPlayTrack={onPlayGenreTrack}
                onDrawerSnapChange={setIsGenreDrawerAtMinSnap}
                onCanvasDragStart={handleGenreCanvasDragStart}
                onHeaderRefocus={handleGenreHeaderRefocus}
                expandToMiddleTrigger={genreDrawerExpandTrigger}
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
                playLoading={isPlayerLoadingArtist()}
                viewRelatedArtistsLoading={!!pendingArtistGenreGraph}
                onArtistToggle={onAddArtistButtonToggle}
                isInCollection={isInCollection(artistInfoToShow?.id)}
                onPlayTrack={onPlayArtistTrack}
                shouldShowChevron={showArtistGoTo}
                onDrawerSnapChange={setIsArtistDrawerAtMinSnap}
                onCanvasDragStart={handleArtistCanvasDragStart}
                onHeaderRefocus={handleArtistHeaderRefocus}
                expandToMiddleTrigger={artistDrawerExpandTrigger}
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
                    onArtistPlay={onPlayArtist}
                    onGenrePlay={onPlayGenre}
                    onArtistGoTo={(artist) => {
                      // For artists: Explore Related Genres (since artist might not be in current view)
                      focusArtistRelatedGenres(artist);
                      setArtistInfoToShow(artist);
                      setShowArtistCard(true);
                    }}
                    onGenreGoTo={(genre) => {
                      // For genres: Go To (switches to genres view and focuses the genre)
                      focusGenreInCurrentView(genre, { forceRefocus: true });
                    }}
                    onArtistViewSimilar={async (artist) => {
                      await createSimilarArtistGraph(artist);
                      setArtistInfoToShow(artist);
                      setShowArtistCard(true);
                    }}
                    onGenreViewSimilar={(genre) => {
                      // For genres: View Similar also navigates to genres view
                      focusGenreInCurrentView(genre, { forceRefocus: true });
                    }}
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
            startIndex={playerStartIndex}
          />
        </div>
      </AppSidebar>
      <SettingsOverlay
        name={userName || ''}
        email={userEmail || ''}
        preferences={preferences || DEFAULT_PREFERENCES}
        socialUser={isSocialUser || false}
        onLogout={signOut}
        onChangeEmail={changeEmail}
        onChangePassword={changePassword}
        onDeleteAccount={deleteUser}
        onChangeName={updateUser}
        onChangePreferences={updatePreferences}
      />
      <AuthOverlay
          onSignUp={signUp}
          onSignInSocial={signInSocial}
          onSignIn={signIn}
          onForgotPassword={forgotPassword}
      />
      <AlphaAccessDialog
        open={!isAlphaValidated && !authLoading}
        onValidPassword={() => {
          setAlphaValidated();
          setAlphaOpen(false);
        }}
        onValidatePassword={validatePassword}
      />
      <FeedbackOverlay
        onSubmit={submitFeedback}
        userID={userID}
        userEmail={userEmail}
      />
      <ChangePasswordDialog
          open={isResetPasswordOpen}
          onOpenChange={setIsResetPasswordOpen}
          onSubmitChange={changePassword}
          onSubmitReset={resetPassword}
          navigateOnReset={() => navigateAnd('/', undefined, () => window.dispatchEvent(
              new CustomEvent("auth:open", {detail: { mode: "login" }}
            )))}
          forgot={true}
      />
    </SidebarProvider>
  );
}

export default App
