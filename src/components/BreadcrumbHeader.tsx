import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb'
import { ChevronDown, ChevronUp, Tag, MicVocal } from 'lucide-react'
import {Artist, GraphType} from '@/types'
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

interface BreadcrumbHeaderProps {
    selectedGenre: string | undefined;
    selectedArtist: Artist | undefined;
    graph: GraphType;
    toggleListView: () => void;
    showListView: boolean;
    hideArtistCard: () => void;
}

export function BreadcrumbHeader({
    selectedGenre,
    selectedArtist,
    graph,
    toggleListView,
    showListView,
    hideArtistCard
}: BreadcrumbHeaderProps) {
    const { toggleSidebar } = useSidebar();
    const isArtists = graph === 'artists' || graph === 'similarArtists';
    const ActiveIcon = isArtists ? MicVocal : Tag;
    const activeLabel = isArtists ? 'Artists' : 'Genres';

    return (
        <div>
            <div

                >
                    <Breadcrumb
                    className="
                    inline-flex items-center gap-2
                    transition-all 
                    '
                    ">
                        <BreadcrumbList>
                            {/* Active app sidebar menu button (icon + label) */}
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <button className="inline-flex items-center gap-2">
                                        <ActiveIcon size={20} />
                                        <span className="hidden sm:inline">{activeLabel}</span>
                                    </button>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {/* Show selected genre if available */}
                            {selectedGenre && (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        {selectedArtist ? (
                                            // Clickable link that sets selectedArtist to undefined
                                            <BreadcrumbLink onClick={() => hideArtistCard()}>
                                                {selectedGenre}
                                            </BreadcrumbLink>
                                        ) : (
                                            <BreadcrumbPage>{selectedGenre}</BreadcrumbPage>
                                        )}
                                    </BreadcrumbItem>
                                </>
                            )}
                            {/* Show selected artist if available */}
                            {/* {selectedGenre && selectedArtist && (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>{selectedArtist.name}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </>
                            )} */}
                        </BreadcrumbList>
                    </Breadcrumb>
                    {/* show to have access to ListViewPanel */}
                    {/*<Button*/}
                    {/*variant="secondary"*/}
                    {/*size="sm"*/}
                    {/*className='rounded-full'*/}
                    {/*onClick={toggleListView}>*/}
                    {/*    {showListView ? <ChevronUp /> : <ChevronDown />}*/}
                    {/*</Button>*/}
            </div>
        </div>
    )
}
