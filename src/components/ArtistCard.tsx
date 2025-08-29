import {Artist} from '@/types'
import {fixWikiImageURL, formatDate, formatNumber} from '@/lib/utils'
import { useState } from "react"
import GraphCard from "./GraphCard";
// committment issues

interface ArtistCardProps {
    selectedArtist?: Artist;
    setArtistFromName: (artist: string) => void;
    setSelectedArtist: (artist: Artist | undefined) => void;
    artistLoading: boolean;
    artistError?: boolean;
    show: boolean;
    setShowArtistCard: (show: boolean) => void;
    deselectArtist: () => void;
    similarFilter: (artists: string[]) => string[];
}

export function ArtistCard({
    selectedArtist,
    setArtistFromName,
    setSelectedArtist,
    artistLoading,
    artistError,
    show,
    setShowArtistCard,
    deselectArtist,
    similarFilter,
}: ArtistCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    // Card expansion is toggled via description click

    const onDeselectArtist = () => {
        setIsExpanded(false);
        deselectArtist();
    }

    return (
      <GraphCard
        show={!!show}
        loading={artistLoading}
        error={
          artistError && (
            <p>Can't find {selectedArtist && selectedArtist.name} 🤔</p>
          )
        }
        dismissible
        onDismiss={onDeselectArtist}
        contentKey={selectedArtist?.name}
      
        thumbnail={
          selectedArtist?.image && selectedArtist ? (
            <div
              className={`w-24 h-24 shrink-0 overflow-hidden rounded-xl border border-border ${
                isExpanded ? "w-full h-[200px]" : ""
              }`}
            >
              <img
                className={`w-24 h-24 object-cover ${isExpanded ? "w-full h-full" : ""}`}
                src={fixWikiImageURL(selectedArtist.image)}
                alt={selectedArtist.name}
              />
            </div>
          ) : undefined
        }
        title={
          <h2 className="w-full text-md font-semibold">
            {selectedArtist && selectedArtist.name}
          </h2>
        }
        meta={
          <>
            {selectedArtist && selectedArtist.listeners && (
              <h3>
                <span className="font-medium">Listeners:</span>{" "}
                {formatNumber(selectedArtist.listeners)}
              </h3>
            )}
            <h3>
              <span className="font-medium">Founded:</span>{" "}
              {selectedArtist && selectedArtist.startDate
                ? formatDate(selectedArtist.startDate)
                : "Unknown"}{" "}
            </h3>
            {selectedArtist && selectedArtist.similar && (
              <h3>
                <span className="font-medium">Similar:</span>{" "}
                {similarFilter(selectedArtist.similar).map((name, index, array) => (
                  <>
                    <button key={index + name} onClick={() => setArtistFromName(name)}>
                      {name}
                    </button>
                    {index < array.length - 1 ? ", " : ""}
                  </>
                ))}
              </h3>
            )}
          </>
        }
        description={
          <p
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`break-words text-muted-foreground cursor-pointer hover:text-gray-400 ${
              isExpanded ? "text-muted-foreground" : "line-clamp-3 overflow-hidden"
            }`}
          >
            {selectedArtist && selectedArtist.bio ? selectedArtist.bio.summary : "No bio"}
          </p>
        }
        // actions can be provided later (e.g., Play/Add/More)
      />
    );
}
