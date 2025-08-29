import './App.css'
import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import useGenreArtists from "@/hooks/useGenreArtists";
import useGenres from "@/hooks/useGenres";
import ArtistsForceGraph from "@/components/ArtistsForceGraph";
import GenresForceGraph from "@/components/GenresForceGraph";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Artist, ArtistNodeLimitType,
  Genre,
  GenreClusterMode,
  GenreGraphData, GenreNodeLimitType,
  GraphType,
  NodeLink
} from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { ResetButton } from "@/components/ResetButton";
import { useMediaQuery } from 'react-responsive';
import { ArtistCard } from './components/ArtistCard'
import { Gradient } from './components/Gradient';
import { Search } from './components/Search';
import { buildGenreTree, filterOutGenreTree, generateSimilarLinks } from "@/lib/utils";
import ClusteringPanel from "@/components/ClusteringPanel";
import { ModeToggle } from './components/ModeToggle';
import { useRecentSelections } from './hooks/useRecentSelections';
import DisplayPanel from './components/DisplayPanel';
import GenrePanel from './components/GenrePanel'
import NodeLimiter from './components/NodeLimiter'
import useSimilarArtists from "@/hooks/useSimilarArtists";
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSideBar"

const DEFAULT_NODE_COUNT = 2000;
const DEFAULT_CLUSTER_MODE = 'subgenre';

function App() {
  const [selectedGenre, setSelectedGenre] = useState<Genre | undefined>(undefined);
  const [selectedArtist, setSelectedArtist] = useState<Artist | undefined>(undefined);
  const [showArtistCard, setShowArtistCard] = useState(false);
  const [graph, setGraph] = useState<GraphType>('genres');
  const [currentArtists, setCurrentArtists] = useState<Artist[]>([]);
  const [currentArtistLinks, setCurrentArtistLinks] = useState<NodeLink[]>([]);
  const [canCreateSimilarArtistGraph, setCanCreateSimilarArtistGraph] = useState<boolean>(false);
  const [genreClusterMode, setGenreClusterMode] = useState<GenreClusterMode>(DEFAULT_CLUSTER_MODE);
  const [dagMode, setDagMode] = useState<boolean>(() => {
    const storedDagMode = localStorage.getItem('dagMode');
    return storedDagMode ? JSON.parse(storedDagMode) : false;
  });
  const { addRecentSelection } = useRecentSelections();
  const [currentGenres, setCurrentGenres] = useState<GenreGraphData>();
  const [genreMiniView, setGenreMiniView] = useState<boolean>(false);
  const [selectedArtistNoGenre, setSelectedArtistNoGenre] = useState<Artist | undefined>();
  const [genreSizeThreshold, setGenreSizeThreshold] = useState<number>(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [genreNodeLimitType, setGenreNodeLimitType] = useState<GenreNodeLimitType>('artistCount');
  const [artistNodeLimitType, setArtistNodeLimitType] = useState<ArtistNodeLimitType>('listeners');
  const [genreNodeCount, setGenreNodeCount] = useState<number>(0);
  const [artistNodeCount, setArtistNodeCount] = useState<number>(0);
  const { genres, genreLinks, genresLoading, genresError } = useGenres();
  const { artists, artistLinks, artistsLoading, artistsError } = useGenreArtists(selectedGenre ? selectedGenre.id : undefined);
  const { similarArtists, similarArtistsLoading, similarArtistsError } = useSimilarArtists(selectedArtistNoGenre);

  const isMobile = useMediaQuery({ maxWidth: 640 });
  // const [isLayoutAnimating, setIsLayoutAnimating] = useState(false);

  useEffect(() => {
    localStorage.setItem('dagMode', JSON.stringify(dagMode));
  }, [dagMode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showArtistCard) {
          deselectArtist();
        } else {
          resetAppState();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showArtistCard]);

  useEffect(() => {
    const nodeCount = Math.min(artists.length, DEFAULT_NODE_COUNT);
    onArtistNodeCountChange(nodeCount);
  }, [artists]);

  useEffect(() => {
    const nodeCount = genres.length;
    onGenreNodeCountChange(nodeCount);
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

  useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setSearchOpen((prev) => !prev);
    }
  }
  document.addEventListener("keydown", down);
  return () => document.removeEventListener("keydown", down)
}, [])

  const setArtistFromName = (name: string) => {
    const artist = currentArtists.find((a) => a.name === name);
    if (artist) {
      onArtistNodeClick(artist);
    }
  }
  const onGenreNodeClick = (genre: Genre) => {
    // this code makes the mini genre graph
    // if (genreHasChildren(genre, genreClusterMode)) {
    //   setGenreMiniView(true);
    //   setCurrentGenres(buildGenreTree(genres, genre, genreClusterMode));
    // }
    setSelectedGenre(genre);
    setGraph('artists');
    addRecentSelection(genre);
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
    setCurrentGenres({nodes: genres, links: genreLinks.filter(link => link.linkType === DEFAULT_CLUSTER_MODE)});
    setSelectedGenre(undefined);
    deselectArtist();
    setGenreMiniView(false);
    setCanCreateSimilarArtistGraph(false);
    setCurrentArtists([]);
    setCurrentArtistLinks([]);
    setGenreClusterMode(DEFAULT_CLUSTER_MODE);
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
  const onParentGenreClick = (genre: Genre) => {
    setCurrentGenres(buildGenreTree(genres, genre, genreClusterMode));
  }
  const onParentGenreDeselect = (genre: Genre) => {
    if (currentGenres){
      setCurrentGenres(filterOutGenreTree(currentGenres, genre, genreClusterMode));
    }
  }
  const onParentGenreReselect = (genre: Genre) => {
    if (currentGenres){
      const reselectedGenreData = buildGenreTree(genres, genre, genreClusterMode);
      setCurrentGenres({
        nodes: [...currentGenres.nodes, ...reselectedGenreData.nodes],
        links: [...currentGenres.links, ...reselectedGenreData.links],
      });
    }
  }
  const onGenreClusterModeChange = (newMode: GenreClusterMode) => {
    setGenreClusterMode(newMode);
    if (currentGenres) {
      setCurrentGenres({ nodes: currentGenres.nodes, links: filterLinksByClusterMode(newMode) });
    }
  }
  const filterLinksByClusterMode = (newMode: GenreClusterMode) => {
    return genreLinks && genreLinks.length
        ? newMode === 'all'
            ? genreLinks
            : genreLinks.filter(l => l.linkType === newMode)
        : [];
  }
  const onGenreNodeCountChange = (count: number) => {
    setGenreNodeCount(count);
    if (genres && genres.length && count < genres.length) {
      const filteredGenres = genres
          .toSorted((a, b) => b[genreNodeLimitType] - a[genreNodeLimitType])
          .slice(0, count);
      const genreSet = new Set(filteredGenres.map(genre => genre.id));
      const filteredLinks = genreLinks.filter(l => {
        return genreSet.has(l.source) && genreSet.has(l.target) && l.linkType === genreClusterMode;
      });
      setCurrentGenres({
        nodes: filteredGenres,
        links: filteredLinks,
      });
    } else {
      setCurrentGenres({ nodes: genres, links: filterLinksByClusterMode(genreClusterMode) });
    }
  }
  const onArtistNodeCountChange = (count: number) => {
    setArtistNodeCount(count);
    if (artists && artists.length && count < artists.length) {
      const filteredArtists = artists
          .toSorted((a, b) => b[artistNodeLimitType] - a[artistNodeLimitType])
          .slice(0, count);
      const artistSet = new Set(filteredArtists.map(artist => artist.id));
      const filteredLinks = artistLinks.filter(l => {
        return artistSet.has(l.source) && artistSet.has(l.target);
      });
      setCurrentArtists(filteredArtists);
      setCurrentArtistLinks(filteredLinks);
    } else {
      setCurrentArtists(artists);
      setCurrentArtistLinks(artistLinks);
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


  return (
    <SidebarProvider>
      <AppSidebar
          onLinkedGenreClick={onLinkedGenreClick}
        setSearchOpen={setSearchOpen}
        onClick={resetAppState}
        selectedGenre={selectedGenre}>
          <Gradient />
        <div className="relative min-h-screen min-w-screen">

          <div className={
            "fixed w-auto top-0 ml-(--sidebar-width) flex items-center gap-3 p-3 z-50"
          }
          >
               <Tabs
                value={graph}
                onValueChange={(val) => setGraph(val as GraphType)}>
                  <TabsList>
                      <TabsTrigger
                      onClick={() => setGraph('genres')} value="genres">Genres</TabsTrigger>
                    <TabsTrigger
                    onClick={() => setGraph('artists')} value="artists">Artists</TabsTrigger>
                  </TabsList>
                </Tabs>
                { graph === 'artists' &&
                <div className='flex gap-3'>
                  <Button size='lg' variant='outline'>Genre
                    <ChevronDown />
                  </Button>
                  <Button size='lg' variant='outline'>Mood & Activity
                    <ChevronDown />
                  </Button>
                  <Button size='lg' variant='outline'>Decade
                    <ChevronDown />
                  </Button>
                </div>
                }
          </div>
                <GenresForceGraph
                  graphData={currentGenres}
                  onNodeClick={onGenreNodeClick}
                  loading={genresLoading}
                  show={graph === "genres" && !genresError}
                  dag={dagMode}
                  clusterMode={genreClusterMode}
                />
                <ArtistsForceGraph
                  artists={currentArtists}
                  artistLinks={currentArtistLinks}
                  loading={artistsLoading}
                  onNodeClick={onArtistNodeClick}
                  show={
                    (graph === "artists" || graph === "similarArtists") && !artistsError
                  }
                />
          <div className="fixed flex flex-col h-auto right-4 top-4 justify-end gap-3 z-50">
              <ModeToggle />
              <ClusteringPanel 
                clusterMode={genreClusterMode} 
                setClusterMode={onGenreClusterModeChange}
                dagMode={dagMode} 
                setDagMode={setDagMode} />
              <DisplayPanel
                genreArtistCountThreshold={genreSizeThreshold}
                setGenreArtistCountThreshold={setGenreSizeThreshold}
              />
              <GenrePanel
                genres={genres}
                onParentClick={onParentGenreClick}
                genreClusterMode={genreClusterMode}
                onParentDeselect={onParentGenreDeselect}
                onParentSelect={onParentGenreReselect}
                show={graph === 'genres' && !genresLoading && !genresError}
              />
          </div>

          <AnimatePresence mode="popLayout">
            <motion.div
              className={`
                  fixed left-1/2 transform -translate-x-1/2 z-50
                  flex flex-col gap-4
                  ${
                    isMobile
                      ? "w-full px-4 items-center bottom-4"
                      : "bottom-4 items-end"
                  }
                `}
            >
              <ArtistCard
                selectedArtist={selectedArtist}
                setArtistFromName={setArtistFromName}
                setSelectedArtist={setSelectedArtist}
                artistLoading={false}
                artistError={false}
                show={showArtistCard}
                setShowArtistCard={setShowArtistCard}
                deselectArtist={deselectArtist}
                similarFilter={similarArtistFilter}
              />
              <div
                className={`flex md:hidden justify-center gap-3 ${graph !== "genres" ? "w-full" : ""}`}>
                <ResetButton
                  onClick={() => resetAppState()}
                  show={graph !== "genres"}
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
                    selectedGenre={selectedGenre}
                    selectedArtist={selectedArtist}
                    open={searchOpen}
                    setOpen={setSearchOpen}
                  />

                </motion.div>
              </div>
              <NodeLimiter
                  totalNodes={genres.length}
                  nodeType={'genres'}
                  initialValue={genreNodeCount}
                  onChange={onGenreNodeCountChange}
                  show={showGenreNodeLimiter()}
              />
              <NodeLimiter
                totalNodes={artists.length}
                nodeType={'artists'}
                initialValue={artistNodeCount}
                onChange={onArtistNodeCountChange}
                show={showArtistNodeLimiter()}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </AppSidebar>
    </SidebarProvider>
  );
}

export default App
