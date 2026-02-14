import { Artist, BasicNode, GraphType } from "@/types";
import { Genre, NodeLink } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowUpNarrowWide, UsersRound, Link } from "lucide-react";
import { useMediaQuery } from "react-responsive";
import { formatNumber, formatDate } from "@/lib/utils";
import { dummyLastFMArtistData, dummyGenres } from "@/DummyDataForDummies";
import { Loading } from "@/components/Loading";

interface ListViewPanelProps {
  genres: Genre[];
  onGenreClick: (genreName: string) => void;
  setSelectedArtist: (artist: Artist) => void;
  genreLinksCount: number;
  show: boolean;
  isMobile: boolean;
  genresLoading: boolean;
  artistsLoading: boolean;
  currentGraph: GraphType;
}

// placeholder for genre count
const genreCount = "20,341"; // Example count

// placeholder for ai-generated emojis
const emojiPool = [
  "🎸",
  "🎧",
  "🎷",
  "🥁",
  "🎤",
  "🎹",
  "🎻",
  "🪕",
  "📻",
  "🎶",
  "💿",
  "🕺",
  "👟",
  "💥",
  "☁️",
  "🌀",
];

function getRandomEmoji() {
  return emojiPool[Math.floor(Math.random() * emojiPool.length)];
}

export function ListViewPanel({
  genres, onGenreClick,
  setSelectedArtist,
  genreLinksCount,
  show,
  isMobile,
  genresLoading,
  artistsLoading,
  currentGraph,
}: ListViewPanelProps) {
  return !show ? null : (
    <div
      className={`
        w-[320px] 
        flex flex-col
       ${
         isMobile
           ? ""
           : `h-[calc(100vh-104px)] 
       bg-card border border-border shadow-md rounded-3xl overflow-hidden`
   }
    `}
    >
      {/* list controls */}
      {genresLoading || artistsLoading ? (
        <Loading />
      ) : (
        <>
          <div
            className="
              flex
              items-center
              justify-between
              pl-4
              pr-2
              pt-3
              "
          >
            <span className="text-muted-foreground text-sm font-normal">
              {formatNumber(genreLinksCount)} Genres
            </span>
            <Button variant="ghost" size="sm">
              <ArrowUpNarrowWide /> Sort
            </Button>
          </div>
          {/* List */}

          <div
            className="
          overflow-y-auto no-scrollbar pb-40
          "
          >
            {currentGraph === "genres" && (
              <ul
                className="
                  flex
                  flex-col
                  gap-1px
                  p-1
                  "
              >
                {genres.map((genre) => (
                  <li
                    key={genre.id}
                    className="
                      hover:bg-muted
                      rounded-md
                     "
                    onClick={() => onGenreClick(genre.name)}
                  >
                    {/* List item contents */}
                    <button className="w-full text-left">
                      <div
                        className="
                          flex
                          items-start
                          py-1 px-3
                          gap-2
                          "
                      >
                        <span className="text-xl">{getRandomEmoji()}</span>
                        <div className="flex flex-col items-start">
                          <span className="text-md font-medium">
                            {genre.name}
                          </span>
                          <div
                            className="
                              flex items-center gap-1
                              text-sm text-muted-foreground"
                          >
                            <div className="flex items-center gap-1">
                              <UsersRound size={16} />
                              {genre.artistCount}
                            </div>
                            ·
                            <div className="flex items-center gap-1">
                              <Link size={16} />
                              {genreLinksCount}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {currentGraph === "artists" && (
              <ul
                className="
                  flex
                  flex-col
                  gap-3
                  p-1
                  overflow-y-auto
                  no-scrollbar
                  "
              >
                {dummyLastFMArtistData.map((artist) => (
                  <li key={artist.mbid}>
                    {/* List item contents */}
                    <button
                      className="
                        w-full text-left
                        rounded-md
                        "
                    >
                      <div
                        className="
                          flex flex-col items-start gap-1
                          py-1 px-3
                          "
                      >
                        <div className="w-full aspect-[2/1] overflow-hidden rounded-md border border-border">
                          <img
                            src={artist.image[0].link}
                            alt={artist.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col items-start">
                          <div>
                            <h2 className="text-md font-semibold m-0">
                              {artist.name}
                            </h2>
                            {/* <h3 className="text-sm"> {formatNumber(artist.stats.listeners)} listeners
                          </h3> */}
                          </div>
                          <div>
                            {/* <div className="text-sm text-foreground">
                              <span className='font-medium text-foreground'>Founded:</span> {formatDate(artist.date)}
                            </div> */}
                            <div className="text-sm text-muted-foreground">
                              Similar to <button>{artist.similar[0]}</button>,{" "}
                              <button>{artist.similar[1]}</button>,{" "}
                              <button>{artist.similar[2]}</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* overflow gradient */}
      {/* <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent" /> */}
    </div>
  );
}
