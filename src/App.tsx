import './App.css'
import {useEffect, useMemo, useState} from 'react'
import { GraphControls } from './components/GraphControls'
import { Waypoints, Undo2 } from 'lucide-react'
import { BreadcrumbHeader } from './components/BreadcrumbHeader'
import { Button, buttonVariants } from "@/components/ui/button"
import useGenreArtists from "@/hooks/useGenreArtists";
import useGenres from "@/hooks/useGenres";
import useArtist from "@/hooks/useArtist";
import ArtistsForceGraph from "@/components/ArtistsForceGraph";
import GenresForceGraph from "@/components/GenresForceGraph";
import {
  Artist,
  BasicNode,
  Genre,
  GenreClusterMode, GenreGraphData,
  GraphType,
  LastFMArtistJSON,
  LastFMSearchArtistData,
  NodeLink
} from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { ResetButton } from "@/components/ResetButton";
import { ListViewPanel } from "@/components/ListViewPanel";
import { useMediaQuery } from 'react-responsive';
import { ArtistCard } from './components/ArtistCard'
import { Gradient } from './components/Gradient';
import { Search } from './components/Search';
import {buildGenreTree, generateSimilarLinks, isParentGenre} from "@/lib/utils";
import ClusteringPanel from "@/components/ClusteringPanel";
import { ModeToggle } from './components/ModeToggle';

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
  const [currentGenres, setCurrentGenres] = useState<GenreGraphData>();
  const { genres, genreLinks, genresLoading, genresError } = useGenres();
  const { artists, artistLinks, artistsLoading, artistsError } = useGenreArtists(selectedGenre ? selectedGenre.name : undefined);
  const { artistData, artistLoading, artistError } = useArtist(selectedArtist);

  const isMobile = useMediaQuery({ maxWidth: 640 });
  // const [isLayoutAnimating, setIsLayoutAnimating] = useState(false);

  useEffect(() => {
    setCurrentArtists(artists);
    setCurrentArtistLinks(artistLinks);
  }, [artists]);

  useEffect(() => {
    setCurrentGenres({nodes: genres, links: genreLinks});
  }, [genres]);

  useEffect(() => {
    if (canCreateSimilarArtistGraph && artistData?.similar && selectedArtist && selectedArtist.name === artistData.name) {
      const similarArtists = [selectedArtist];
      artistData.similar.forEach((s, i) => {
        similarArtists.push({ id: Math.floor((Math.random() + i) * 1234567).toString(), name: s, tags: [] });
      });
      if (similarArtists.length > 1) {
        const links = generateSimilarLinks(similarArtists);
        setCurrentArtists(similarArtists);
        setCurrentArtistLinks(links);
        setGraph('similarArtists');
      }
      setCanCreateSimilarArtistGraph(false);
    }
  }, [artistData, canCreateSimilarArtistGraph]);

  const setArtistFromName = (name: string) => {
    const artist = artists.find((artist) => artist.name === name);
    if (artist) {
      setSelectedArtist(artist);
      setShowArtistCard(true);
    }
  }
  const onGenreNodeClick = (genre: Genre) => {
    if (graph === 'genres') {
      if (isParentGenre(genre, genreClusterMode)) {
        setGraph('genreDAG');
        setCurrentGenres(buildGenreTree(genres, genre, genreClusterMode));
      } else {
        setSelectedGenre(genre);
        setGraph('artists');
      }
    } else {
      setSelectedGenre(genre);
      setGraph('artists');
    }
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
    setCurrentGenres({nodes: genres, links: genreLinks});
    setSelectedGenre(undefined);
    setSelectedArtist(undefined);
    setShowArtistCard(false);
    setShowListView(false);
    setCanCreateSimilarArtistGraph(false);
    setCurrentArtists([]);
    setCurrentArtistLinks([]);
  }
  const deselectArtist = () => {
    setSelectedArtist(undefined);
    setShowArtistCard(false);
  }
  const similarArtistFilter = (similarArtists: string[]) => {
    return similarArtists.filter(s => currentArtists.some(a => a.name === s));
  }
  const createSimilarArtistGraph = (artistResult: Artist) => {
    setSelectedArtist(artistResult);
    setShowArtistCard(true);
    setCanCreateSimilarArtistGraph(true);
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
  artistData,
  artistLoading,
  artistError,
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
            <BreadcrumbHeader
                selectedGenre={selectedGenre ? selectedGenre.name : undefined}
                selectedArtist={selectedArtist}
                HomeIcon={Waypoints}
                toggleListView={() => setShowListView(!showListView)}
                showListView={showListView}
                reset={resetAppState}
                hideArtistCard={deselectArtist}
            />
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
          <ModeToggle />

      </div>
        <GenresForceGraph
            genresGraphData={currentGenres}
            onNodeClick={onGenreNodeClick}
            loading={genresLoading}
            show={(graph === 'genres' || graph === 'genreDAG') && !genresError}
            dag={graph === 'genreDAG'}
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
              artistData={artistData}
              artistLoading={artistLoading}
              artistError={artistError}
              show={showArtistCard}
              setShowArtistCard={setShowArtistCard}
              deselectArtist={deselectArtist}
              similarFilter={similarArtistFilter}
            />
            <div className={`flex justify-center gap-3 ${graph !== 'genres' ? 'w-full' : ''}`}>
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
                />
              </motion.div>
            </div>
            <ClusteringPanel clusterMode={genreClusterMode} setClusterMode={setGenreClusterMode} />
          </motion.div>
        </AnimatePresence>
    </div>
  )
}

export default App
