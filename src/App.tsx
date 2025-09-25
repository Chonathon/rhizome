import './App.css'
import {useEffect, useMemo, useState} from 'react'
import { ChevronDown } from 'lucide-react'
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
  NodeLink, Tag
} from "@/types";
import { Header } from "@/components/Header"
import { motion, AnimatePresence } from "framer-motion";
import { ResetButton } from "@/components/ResetButton";
import { Toaster, toast } from 'sonner'
import { useMediaQuery } from 'react-responsive';
import { ArtistInfo } from './components/ArtistInfo'
import { Gradient } from './components/Gradient';
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
  fixWikiImageURL
} from "@/lib/utils";
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
  } = useArtists(selectedGenreIDs, TOP_ARTISTS_TO_FETCH, artistNodeLimitType, artistNodeCount, isBeforeArtistLoad);
  const { similarArtists, similarArtistsLoading, similarArtistsError } = useSimilarArtists(selectedArtistNoGenre);
  const { theme } = useTheme();

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

  // Custom escape key functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Prefer logical selection state over UI visibility flags
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedArtist, selectedGenres]);

  // Custom command-K key functionality for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down)
  }, []);

  // Sets current artists/links shown in the graph when artists are fetched from the DB
  useEffect(() => {
    setCurrentArtists(artists);
    setCurrentArtistLinks(artistLinks);
  }, [artists]);

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
      >
        <SidebarLogoTrigger />
        <Toaster />
        <Gradient />
        <div className="relative h-screen w-screen overflow-hidden no-scrollbar">
          <div
            className={
              "fixed top-0 right-0 z-50 flex justify-center flex-col items-start lg:flex-row gap-3"
            }
            style={{
              left: "var(--sidebar-gap)",
            }}
          >
            <Header 
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
              
              
              
            
            />
          {/* <div className='fixed top-0 left-0'>
          </div> */}
               
                {/* { graph === 'artists' &&
                <div className='flex flex-col items-start sm:flex-row gap-3'>
                   <GenresFilter
                    key={initialGenreFilter.genre ? initialGenreFilter.genre.id : "none_selected"}
                    genres={[...genres, singletonParentGenre]}
                    genreClusterModes={GENRE_FILTER_CLUSTER_MODE}
                    graphType={graph}
                    onGenreSelectionChange={onGenreFilterSelectionChange}
                    initialSelection={initialGenreFilter}
                   />

                  <Button size='lg' variant='outline'>Mood & Activity
                    <ChevronDown />
                  </Button>
                  <Button size='lg' className='self-start' variant='outline'>Decade
                    <ChevronDown />
                  </Button>
                </div>
                } */}
          </div>
                <GenresForceGraph
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
                    artists={currentArtists}
                    artistLinks={currentArtistLinks}
                    loading={artistsLoading}
                    onNodeClick={onArtistNodeClick}
                    selectedArtistId={selectedArtist?.id}
                    show={
                        (graph === "artists" || graph === "similarArtists") && !artistsError
                    }
                    computeArtistColor={getArtistColor}
                />

          {!isMobile && <div className='z-20 fixed bottom-4 right-4'>
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
              <ModeToggle />
              <ClusteringPanel 
                clusterMode={genreClusterMode[0]}
                setClusterMode={onGenreClusterModeChange}
                dagMode={dagMode} 
                setDagMode={setDagMode} />
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
              />

            {/* Show reset button in desktop header when Artists view is pre-filtered by a selected genre */}
            {/* TODO: Consider replace with dismissible toast and adding reference to selected genre */}
              <div
                className={`flex justify-center gap-3 ${graph !== "genres" ? "w-full" : ""}`}>
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
        </div>
      </AppSidebar>
    </SidebarProvider>
  );
}

export default App
