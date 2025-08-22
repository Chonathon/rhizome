import './App.css'
import {useEffect, useMemo, useState} from 'react'
import { GraphControls } from './components/GraphControls'
import { Waypoints, Undo2 } from 'lucide-react'
import { BreadcrumbHeader } from './components/BreadcrumbHeader'
import { Button, buttonVariants } from "@/components/ui/button"
import useGenreArtists from "@/hooks/useGenreArtists";
import useGenres from "@/hooks/useGenres";
import ArtistsForceGraph from "@/components/ArtistsForceGraph";
import GenresForceGraph from "@/components/GenresForceGraph";
import {
  Artist,
  Genre,
  GenreClusterMode, GenreGraphData,
  GraphType,
  NodeLink
} from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { ResetButton } from "@/components/ResetButton";
import { ListViewPanel } from "@/components/ListViewPanel";
import { useMediaQuery } from 'react-responsive';
import { ArtistCard } from './components/ArtistCard'
import { Gradient } from './components/Gradient';
import { Search } from './components/Search';
import { buildGenreTree, filterOutGenreTree, generateSimilarLinks } from "@/lib/utils";
import ClusteringPanel from "@/components/ClusteringPanel";
import { ModeToggle } from './components/ModeToggle';
import DisplayPanel from './components/DisplayPanel';
import GenrePanel from './components/GenrePanel'
import useSimilarArtists from "@/hooks/useSimilarArtists";

function App() {
  const [selectedGenre, setSelectedGenre] = useState<Genre | undefined>(undefined);
  const [selectedArtist, setSelectedArtist] = useState<Artist | undefined>(undefined);
  const [showListView, setShowListView] = useState(false);
  const [showArtistCard, setShowArtistCard] = useState(false);
  const [graph, setGraph] = useState<GraphType>('genres');
  const [currentArtists, setCurrentArtists] = useState<Artist[]>([]);
  const [currentArtistLinks, setCurrentArtistLinks] = useState<NodeLink[]>([]);
  const [canCreateSimilarArtistGraph, setCanCreateSimilarArtistGraph] = useState<boolean>(false);
  const [genreClusterMode, setGenreClusterMode] = useState<GenreClusterMode>('subgenre');
  const [dagMode, setDagMode] = useState<boolean>(() => {
    const storedDagMode = localStorage.getItem('dagMode');
    return storedDagMode ? JSON.parse(storedDagMode) : false;
  });
  const [currentGenres, setCurrentGenres] = useState<GenreGraphData>();
  const [genreMiniView, setGenreMiniView] = useState<boolean>(false);
  const [selectedArtistNoGenre, setSelectedArtistNoGenre] = useState<Artist | undefined>();
  const [genreSizeThreshold, setGenreSizeThreshold] = useState<number>(0);
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
    setCurrentArtists(artists);
    setCurrentArtistLinks(artistLinks);
  }, [artists]);

  useEffect(() => {
    // Genre node filtering logic (by artistCount)
    // if (genreSizeThreshold > 0) {
    //   const filteredGenres = genres.filter(g => g.artistCount >= genreSizeThreshold);
    //   const genreSet = new Set(filteredGenres.map(genre => genre.id));
    //   const filteredLinks = genreLinks.filter((nodeLink) => {
    //     return nodeLink.linkType === genreClusterMode && genreSet.has(nodeLink.source) && genreSet.has(nodeLink.target)
    //   });
    //   console.log(filteredLinks.length)
    //   setCurrentGenres({
    //     nodes: filteredGenres,
    //     links: filteredLinks,
    //   });
    // }
    // else {
    //   setCurrentGenres({ nodes: genres, links: genreLinks.filter(l => l.linkType === genreClusterMode) });
    // }
    setCurrentGenres({
      nodes: genres,
      links: genreClusterMode === 'all' ? genreLinks : genreLinks.filter(l => l.linkType === genreClusterMode),
    });

  }, [genres, genreLinks, genreClusterMode, genreSizeThreshold]);

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
  const onGenreNodeClick = (genre: Genre) => {
    // this code makes the mini genre graph
    // if (genreHasChildren(genre, genreClusterMode)) {
    //   setGenreMiniView(true);
    //   setCurrentGenres(buildGenreTree(genres, genre, genreClusterMode));
    // }
    setSelectedGenre(genre);
    setGraph('artists');
  }
  const onArtistNodeClick = (artist: Artist) => {
    if (graph === 'artists') {
      setSelectedArtist(artist);
      setShowArtistCard(true);
    }
    if (graph === 'similarArtists') {
      createSimilarArtistGraph(artist);
    }
  }
  const resetAppState = () => {
    setGraph('genres');
    setCurrentGenres({nodes: genres, links: genreLinks.filter(link => link.linkType === genreClusterMode)});
    setSelectedGenre(undefined);
    deselectArtist();
    setShowListView(false);
    setGenreMiniView(false);
    setCanCreateSimilarArtistGraph(false);
    setCurrentArtists([]);
    setCurrentArtistLinks([]);
    setGenreClusterMode('subgenre');
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

  console.log("App render", {
  selectedGenre,
  selectedArtist,
  genres,
  genresLoading,
  genresError,
  artists,
  artistsLoading,
  artistsError,
  graph,
  currentGenres
});
  return (
    <div className="relative min-h-screen min-w-screen">
       <Gradient/>
       {/* Top Bar */}
      <div className={
        'fixed top-0 left-0 flex w-full justify-between items-center p-4 z-50'}>
        {/* Breadcrumb & ListViewPanel Container */}
        <div className={
          isMobile
            ? "max-w-[calc(100vw-32px)]  inline-flex flex-col gap-2 items-start"
            : " inline-flex flex-col gap-2 items-start"
        }>
          <div className={`md:flex hidden justify-center gap-3 ${graph !== 'genres' ? 'w-full' : ''}`}>
              <ResetButton
                onClick={() => resetAppState()}
                show={graph !== 'genres'}
              />
              <motion.div
                layout
                // className={`${graph === 'artists' ? 'flex-grow' : ''}`}
              >
                <Search
                    onGenreSelect={onGenreNodeClick}
                    onArtistSelect={createSimilarArtistGraph}
                    currentArtists={currentArtists}
                    genres={genres}
                    graphState={graph}
                    selectedGenre={selectedGenre}
                    selectedArtist={selectedArtist}
                />
              </motion.div>
            </div>
            {/* <BreadcrumbHeader
                selectedGenre={selectedGenre ? selectedGenre.name : undefined}
                selectedArtist={selectedArtist}
                HomeIcon={Waypoints}
                toggleListView={() => setShowListView(!showListView)}
                showListView={showListView}
                reset={resetAppState}
                hideArtistCard={deselectArtist}
            /> */}
            {/* <ListViewPanel
                genres={genres}
                onGenreClick={onGenreNodeClick}
                setSelectedArtist={setSelectedArtist}
                genreLinksCount={genreLinks.length}
                show={showListView && !genresError}
                genresLoading={genresLoading}
                artistsLoading={artistsLoading}
                currentGraph={graph}
                isMobile={isMobile}
            /> */}
            </div>
      </div>
          <div className="fixed flex flex-col h-auto right-4 top-4 justify-end gap-3 z-50">
              <ModeToggle />
              <ClusteringPanel 
                clusterMode={genreClusterMode} 
                setClusterMode={setGenreClusterMode} 
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
                show={graph === 'genres' && !genresLoading}
              />
          </div>
        <GenresForceGraph
            graphData={currentGenres}
            onNodeClick={onGenreNodeClick}
            loading={genresLoading}
            show={(graph === 'genres') && !genresError}
            dag={dagMode}
            clusterMode={genreClusterMode}
        />
        <ArtistsForceGraph
            artists={currentArtists}
            artistLinks={currentArtistLinks}
            loading={artistsLoading}
            onNodeClick={onArtistNodeClick}
            show={(graph === 'artists' || graph === 'similarArtists') && !artistsError}
        />
        <AnimatePresence mode="popLayout">
          <motion.div
            className={`
              fixed left-1/2 transform -translate-x-1/2 z-50
              flex flex-col gap-4
              ${isMobile
                ? "w-full px-4 items-center bottom-4"
                : "bottom-4 items-end"}
            `}
          >
            <ArtistCard
              selectedArtist={selectedArtist}
              setArtistFromName={setArtistFromName}
              setSelectedArtist={setSelectedArtist}
              show={showArtistCard}
              setShowArtistCard={setShowArtistCard}
              deselectArtist={deselectArtist}
              similarFilter={similarArtistFilter}
              artistLoading={false}
              artistError={false}
            />
            <div className={`flex md:hidden justify-center gap-3 ${graph !== 'genres' ? 'w-full' : ''}`}>
              <ResetButton
                onClick={() => resetAppState()}
                show={graph !== 'genres'}
              />
              <motion.div
                layout
                // className={`${graph === 'artists' ? 'flex-grow' : ''}`}
              >
                <Search
                    onGenreSelect={onGenreNodeClick}
                    onArtistSelect={createSimilarArtistGraph}
                    currentArtists={currentArtists}
                    genres={genres}
                    graphState={graph}
                    selectedGenre={selectedGenre}
                    selectedArtist={selectedArtist}
                />
              </motion.div>
            </div>
            
          </motion.div>
        </AnimatePresence>
    </div>
  )
}

export default App
