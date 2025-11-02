import './App.css'
import {useEffect, useMemo, useRef, useState} from 'react'
import { ChevronDown, Divide, Settings } from 'lucide-react'
import { Button } from "@/components/ui/button"
import useArtists from "@/hooks/useArtists";
import useGenres from "@/hooks/useGenres";
import ArtistsForceGraph from "@/components/ArtistsForceGraph";
import GenresForceGraph from "@/components/GenresForceGraph";
import {
  Artist, ArtistNodeLimitType, BadDataReport, ContextAction,
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
import FindFilter, { FindOption } from "@/components/FindFilter";

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
  until, isOnPage
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
  MAX_YTID_QUEUE_SIZE, DEFAULT_PLAYER, ALPHA_SURVEY_TIME_MS, DEFAULT_PREFERENCES, ALPHA_SURVEY_ADDED_ARTISTS
} from "@/constants";
import {FixedOrderedMap} from "@/lib/fixedOrderedMap";
import RhizomeLogo from "@/components/RhizomeLogo";
import AuthOverlay from '@/components/AuthOverlay';
import FeedbackOverlay from '@/components/FeedbackOverlay';
import ZoomButtons from '@/components/ZoomButtons';
import useHotkeys from '@/hooks/useHotkeys';
import { showNotiToast } from '@/components/NotiToast';
import useAuth from "@/hooks/useAuth";
import SettingsOverlay, {ChangePasswordDialog} from '@/components/SettingsOverlay';
import {submitFeedback} from "@/apis/feedbackApi";
import {useNavigate} from "react-router";

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
  type GraphHandle = { zoomIn: () => void; zoomOut: () => void; zoomTo: (k: number, ms?: number) => void; getZoom: () => number }
  const genresGraphRef = useRef<GraphHandle | null>(null);
  const artistsGraphRef = useRef<GraphHandle | null>(null);
  const [viewport, setViewport] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const selectedGenreIDs = useMemo(() => {
    return selectedGenres.map(genre => genre.id);
  }, [selectedGenres]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | undefined>(undefined);
  const [showArtistCard, setShowArtistCard] = useState(false);
  const [hoveredGenre, setHoveredGenre] = useState<{ id: string; position: { x: number; y: number } } | null>(null);
  const [hoveredArtist, setHoveredArtist] = useState<{ id: string; position: { x: number; y: number } } | null>(null);
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
  const [isFindFilterOpen, setIsFindFilterOpen] = useState(false);
  const [genreNodeLimitType, setGenreNodeLimitType] = useState<GenreNodeLimitType>(DEFAULT_GENRE_LIMIT_TYPE);
  const [artistNodeLimitType, setArtistNodeLimitType] = useState<ArtistNodeLimitType>(DEFAULT_ARTIST_LIMIT_TYPE);
  const [genreNodeCount, setGenreNodeCount] = useState<number>(DEFAULT_NODE_COUNT);
  const [artistNodeCount, setArtistNodeCount] = useState<number>(DEFAULT_NODE_COUNT);
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
    fetchLikedArtists,
    fetchArtistTopTracks,
    artistsPlayIDsLoading,
    artistPlayIDLoadingKey,
    fetchSingleArtist,
  } = useArtists(selectedGenreIDs, TOP_ARTISTS_TO_FETCH, artistNodeLimitType, artistNodeCount, isBeforeArtistLoad);
  const { similarArtists, similarArtistsLoading, similarArtistsError } = useSimilarArtists(selectedArtistNoGenre);
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
  const [collectionMode, setCollectionMode] = useState<boolean>(false);
  const [separationDegrees, setSeparationDegrees] = useState<number>(0);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState<boolean>(isOnPage('reset-password'));
  const {
    userID,
    userName,
    userEmail,
    userImage,
    preferences,
    likedArtists,
    isSocialUser,
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
  const navigate = useNavigate();

  const artistsAddedRef = useRef(0);

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
    setCurrentArtists(artists);
    setCurrentArtistLinks(artistLinks);
  }, [artists]);

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
    if (genres) {
      const nodeCount = genres.length;
      onGenreNodeCountChange(nodeCount);
      setGenreColorMap(buildGenreColorMap(genres, genreRoots));
    }
  }, [genres, genreLinks]);

  // Fetches top tracks of selected genre player ids in the background
  useEffect(() => {
    updateGenrePlayerIDs();
  }, [topArtists]);

  // Fetches top tracks of selected artist player ids in the background
  useEffect(() => {
    updateArtistPlayerIDs();
  }, [selectedArtist]);

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

  // Add genre play IDs to the playerIDQueue on genre click
  const updateGenrePlayerIDs = async () => {
    if (topArtists && topArtists.length && !playerIDQueue.has(selectedGenreIDs[0])) {
      const currentGenreID = selectedGenreIDs[0];
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
      playerIDQueue.set(currentGenreID, genreTracks);
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

  // Get hovered genre data for preview
  const hoveredGenreData = useMemo(() => {
    if (!hoveredGenre || !currentGenres) return null;
    const genre = currentGenres.nodes.find((g) => g.id === hoveredGenre.id);
    if (!genre) return null;

    return { genre, topArtists: [] };
  }, [hoveredGenre, currentGenres]);

  // Get hovered artist data for preview
  const hoveredArtistData = useMemo(() => {
    if (!hoveredArtist) return null;
    return currentArtists.find((a) => a.id === hoveredArtist.id) || null;
  }, [hoveredArtist, currentArtists]);

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
    if (graph === 'artists') {
      setSelectedArtist(artist);
      setShowArtistCard(true);
      addRecentSelection(artist);
    }
    if (graph === 'similarArtists') {
      createSimilarArtistGraph(artist);
    }
  }

  const handleFindSelect = (option: FindOption) => {
    if (option.entityType === 'artist') {
      const artist = currentArtists.find((a) => a.id === option.id);
      if (!artist) return;
      setSelectedArtist(artist);
      setShowArtistCard(true);
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
    setCanCreateSimilarArtistGraph(false);
    setGenreClusterMode(DEFAULT_CLUSTER_MODE);
    setCollectionMode(false);
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
    return similarArtists.filter(s => currentArtists.some(a => a.name === s));
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
    } else {
      if (isBeforeArtistLoad) setIsBeforeArtistLoad(false);
      setGraph('artists');
    }
  }

  const getGenreRootsFromID = (genreID: string) => {
    const genre = genres ? genres.find((g) => g.id === genreID) : undefined;
    if (genre) {
      return genre.rootGenres;
    }
    return [];
  }

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
    if (tags && tags.length && genres) {
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
    if (!color) color = resolvedTheme === 'dark' ? DEFAULT_DARK_NODE_COLOR : DEFAULT_LIGHT_NODE_COLOR;
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
                  ref={genresGraphRef as any}
                  graphData={currentGenres}
                  onNodeClick={onGenreNodeClick}
                  onNodeHover={(id, position) => setHoveredGenre(id && position ? { id, position } : null)}
                  loading={genresLoading}
                  show={graph === "genres" && !genresError}
                  dag={dagMode}
                  clusterModes={genreClusterMode}
                  colorMap={genreColorMap}
                  selectedGenreId={selectedGenres[0]?.id}
                  width={viewport.width || undefined}
                  height={viewport.height || undefined}
                />
                <ArtistsForceGraph
                    ref={artistsGraphRef as any}
                    artists={currentArtists}
                    artistLinks={currentArtistLinks}
                    loading={graph === 'similarArtists' ? similarArtistsLoading : artistsLoading}
                    onNodeClick={onArtistNodeClick}
                    onNodeHover={(id, position) => setHoveredArtist(id && position ? { id, position } : null)}
                    selectedArtistId={selectedArtist?.id}
                    show={
                        (graph === "artists" || graph === "similarArtists") && !artistsError
                    }
                    computeArtistColor={getArtistColor}
                    width={viewport.width || undefined}
                    height={viewport.height || undefined}
                />

                {/* Genre hover preview */}
                {hoveredGenreData && hoveredGenre && graph === 'genres' && (
                  <GenrePreview
                    genre={hoveredGenreData.genre}
                    topArtists={hoveredGenreData.topArtists}
                    genreColorMap={genreColorMap}
                    onNavigate={(genre) => onGenreNodeClick(genre)}
                    onPlay={undefined}
                    playLoading={false}
                    position={hoveredGenre.position}
                    visible={true}
                  />
                )}

                {/* Artist hover preview */}
                {hoveredArtistData && hoveredArtist && (graph === 'artists' || graph === 'similarArtists') && (
                  <ArtistPreview
                    artist={hoveredArtistData}
                    genreColorMap={genreColorMap}
                    getGenreNameById={getGenreNameById}
                    onNavigate={(artist) => onArtistNodeClick(artist)}
                    onPlay={undefined}
                    onToggle={toggleLikedArtist}
                    playLoading={false}
                    isInCollection={liked.has(hoveredArtistData.id)}
                    position={hoveredArtist.position}
                    visible={true}
                    getArtistImageByName={getArtistImageByName}
                    getArtistByName={getArtistByName}
                    setArtistFromName={setArtistFromName}
                    getArtistColor={getArtistColor}
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
            <NodeLimiter
                totalNodes={genres ? genres.length : 0}
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
                playLoading={isPlayerLoadingGenre()}
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
                playLoading={isPlayerLoadingArtist()}
                onArtistToggle={onAddArtistButtonToggle}
                isInCollection={isInCollection(selectedArtist?.id)}
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
