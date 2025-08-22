import type { ReactNode } from 'react'
import {Artist, BasicNode} from '@/types'
import { LastFMArtistJSON } from '@/types';
import { motion, AnimatePresence } from "framer-motion";
import { dummyLastFMArtistData } from '@/DummyDataForDummies'
import { Button, buttonVariants } from "@/components/ui/button";
import {formatDate, formatNumber} from '@/lib/utils'
import {Loading} from "@/components/Loading";
import ExpandingPanel from "@/components/ExpandingPanel";
import {AxiosError} from "axios";
import { useState, useLayoutEffect, useEffect } from "react"
import { useMediaQuery } from 'react-responsive';
import { Skeleton } from './ui/skeleton';
import { SquarePlus, CirclePlay } from 'lucide-react';
// committment issues



function ArtistInfo({
  variant,
  artistError,
  artistLoading,
  artistData,
  selectedArtist,
  isExpanded,
  isMobile,
  setArtistFromName,
  similarFilter,
  slots,
  classes,
}: {
  variant: "summary" | "expanded";
  artistError?: AxiosError;
  artistLoading: boolean;
  artistData?: LastFMArtistJSON;
  selectedArtist?: Artist;
  isExpanded: boolean;
  isMobile: boolean;
  setArtistFromName: (artist: string) => void;
  similarFilter: (artists: string[]) => string[];
  slots?: {
    image?: (ctx: {
      artistData?: LastFMArtistJSON;
      selectedArtist?: Artist;
      isExpanded: boolean;
    }) => ReactNode;
    header?: (ctx: {
      artistData?: LastFMArtistJSON;
      selectedArtist?: Artist;
    }) => ReactNode;
    meta?: (ctx: {
      artistData?: LastFMArtistJSON;
      selectedArtist?: Artist;
      setArtistFromName: (artist: string) => void;
      similarFilter: (artists: string[]) => string[];
    }) => ReactNode;
    bio?: (ctx: {
      artistData?: LastFMArtistJSON;
      selectedArtist?: Artist;
      isExpanded: boolean;
    }) => ReactNode;
    after?: (ctx: {
      artistData?: LastFMArtistJSON;
      selectedArtist?: Artist;
      isExpanded: boolean;
    }) => ReactNode;
  };
  classes?: {
    container?: string;
    imageWrapper?: string;
    image?: string;
    title?: string;
    meta?: string;
    bio?: string;
  };
}) {
  const ctxBase = { artistData, selectedArtist, isExpanded } as const;
  return (
    <motion.div
      key={selectedArtist?.name}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        layout: { duration: 0, ease: "easeOut" },
        opacity: { delay: 0.3, duration: 0.3, ease: "easeOut" },
      }}
      layout
      className={`
        ${variant === "summary" ? "w-[420px]" : "w-full"}
        flex flex-colitems-start gap-3
        ${isMobile ? "w-full" : ""}
        ${isExpanded ? "flex-col" : ""}
        ${classes?.container ?? ""}
      `}
    >
        {artistError ? (
          <div className="w-full h-full flex justify-center p-4 min-w-0">
            <p>Can't find {selectedArtist && selectedArtist.name} 🤔</p>
          </div>
        ) : (
          <>
            {artistLoading ? (
              <></>
            ) : (
              <>
                {/* IMAGE */}
                {slots?.image ? (
                  slots.image(ctxBase)
                ) : (
                  artistData?.image && (
                    <div
                      className={`
                        w-auto h-full shrink-0 overflow-hidden
                        rounded-xl border border-border
                        ${isExpanded ? "w-full h-[200px]" : ""}
                        ${classes?.imageWrapper ?? ""}
                        `}
                    >
                      <img
                        className={`w-full h-[160px] object-cover ${isExpanded ? "w-auto h-full" : ""} ${classes?.image ?? ""}`}
                        src={artistData.image}
                        alt={artistData.name}
                      />
                    </div>
                  )
                )}
                        
                <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
                  {/* HEADER / TITLE */}
                  {slots?.header ? (
                    slots.header(ctxBase)
                  ) : (
                    <h2 className={`w-full text-md font-semibold ${classes?.title ?? ""}`}>
                      {artistData && artistData.name}
                    </h2>
                  )}
                  {/* META */}
                  {slots?.meta ? (
                    slots.meta({ ...ctxBase, setArtistFromName, similarFilter })
                  ) : (
                    <div className={`text-sm ${classes?.meta ?? ""}`}>
                      {artistData && artistData.stats.listeners && (
                        <h3>
                          <span className="font-medium">Listeners:</span>{" "}
                          {formatNumber(artistData.stats.listeners)}
                        </h3>
                      )}
                      <h3>
                        <span className="font-medium">Founded:</span>{" "}
                        {selectedArtist && selectedArtist.startDate ? formatDate(selectedArtist.startDate) : "Unknown"}{" "}
                      </h3>
                      {artistData && artistData.similar && (
                        <h3>
                          <span className="font-medium">Similar:</span>{" "}
                          {similarFilter(artistData.similar)
                            .slice(0, 3)
                            .map((name, index, array) => (
                              <>
                                <button key={index + name} onClick={() => setArtistFromName(name)}>
                                  {name}
                                </button>
                                {index < array.length - 1 ? ", " : ""}
                              </>
                            ))}
                        </h3>
                      )}
                    </div>
                  )}
                  {/* BIO */}
                  {/* {slots?.bio ? (
                    slots.bio(ctxBase)
                  ) : (
                    <div className="w-full flex flex-col text-sm">
                      <p
                        className={`break-words text-muted-foreground ${
                          variant === "summary"
                            ? "cursor-pointer hover:text-gray-400 " + (isExpanded ? "text-muted-foreground" : "line-clamp-3 overflow-hidden")
                            : ""
                        } ${classes?.bio ?? ""}`}
                      >
                        {artistData && artistData.bio ? artistData.bio.summary : "No bio"}
                      </p>
                    </div>
                  )} */}
                  <div className="flex gap-3 mt-2 -mx-3">
                    <Button
                      variant={`${isExpanded ? "outline" : "ghost"}`}
                      size={`${isExpanded ? "lg" : "default"}`}
                      onClick={() => console.log("Add to Collection")}>
                        <CirclePlay /> Play
                    </Button>
                    <Button
                      variant={`${isExpanded ? "outline" : "ghost"}`}
                      size={`${isExpanded ? "lg" : "default"}`}
                      onClick={() => console.log("Add to Collection")}>
                        <SquarePlus /> Add
                    </Button>
                  </div>
                  {/* AFTER SLOT */}
                  {slots?.after ? slots.after(ctxBase) : null}
                </div>
              </>
            )}
          </>
        )}
        
    </motion.div>
  );
}

// function ArtistActions(){

//   return (
//   );
// }

interface ArtistCardv2Props {
    selectedArtist?: Artist;
    setArtistFromName: (artist: string) => void;
    setSelectedArtist: (artist: Artist | undefined) => void;
    artistData?: LastFMArtistJSON;
    artistLoading: boolean;
    artistError?: AxiosError;
    show: boolean;
    setShowArtistCard: (show: boolean) => void;
    deselectArtist: () => void;
    similarFilter: (artists: string[]) => string[];
}

export default function ArtistCardv2({
    selectedArtist,
    setArtistFromName,
    setSelectedArtist,
    artistData,
    artistLoading,
    artistError,
    show,
    setShowArtistCard,
    deselectArtist,
    similarFilter,
}: ArtistCardv2Props) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const isMobile = useMediaQuery({ maxWidth: 640 });
    const [cardEl, setCardEl] = useState<HTMLDivElement | null>(null);
    const [measuredSize, setMeasuredSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [lockSize, setLockSize] = useState(false);
    useLayoutEffect(() => {
      if (!cardEl) return;
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          // round to whole pixels to prevent sub-pixel churn
          setMeasuredSize({ width: Math.ceil(width), height: Math.ceil(height) });
        }
      });
      ro.observe(cardEl);
      return () => ro.disconnect();
    }, [cardEl]);
    useEffect(() => {
      if (!selectedArtist) return;
      // lock to the last measured size while content swaps
      setLockSize(true);
    }, [selectedArtist?.name]);
    useEffect(() => {
      if (!lockSize) return;
      if (artistLoading) return; // keep locked while loading
      if (measuredSize.width === 0 || measuredSize.height === 0) return; // wait until we have a real measurement
      const id = requestAnimationFrame(() => setLockSize(false));
      return () => cancelAnimationFrame(id);
    }, [artistLoading, lockSize, measuredSize.width, measuredSize.height]);

    const onDeselectArtist = () => {
        setIsHovered(false);
        setIsExpanded(false);
        deselectArtist();
    }
    return !show ? null : (
      <AnimatePresence mode="wait">
        <ExpandingPanel
          sidebarWidth="0"
          desktopPadding={16}
          defaultExpanded={false}
          onOpenChange={(open) => console.log("expanded:", open)}
          handleDismiss={() => {
            onDeselectArtist();
            setIsExpanded(false);
          }}
          
          summary={
            <motion.div
              ref={setCardEl}
              style={
                lockSize && measuredSize.width > 0 && measuredSize.height > 0
                  ? { width: `${measuredSize.width}px`, height: `${measuredSize.height}px`, willChange: "width, height, transform" }
                  : { willChange: "transform" }
              }
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 250, damping: 24, mass: 0.8 }}
              className={`max-w-full`}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >

              <ArtistInfo
                variant="summary"
                artistError={artistError}
                artistLoading={artistLoading}
                artistData={artistData}
                selectedArtist={selectedArtist}
                isExpanded={isExpanded}
                isMobile={isMobile}
                setArtistFromName={setArtistFromName}
                similarFilter={similarFilter}
              />
              {/* <ArtistActions /> */}
            </motion.div>
          }
        >
          <div className="p-4 w-full">
            <ArtistInfo
              variant="expanded"
              artistError={artistError}
              artistLoading={artistLoading}
              artistData={artistData}
              selectedArtist={selectedArtist}
              isExpanded={true}
              isMobile={isMobile}
              setArtistFromName={setArtistFromName}
              similarFilter={similarFilter}
              classes={{
                container: "gap-4",            // a little more breathing room in expanded
                imageWrapper: "h-[260px] max-w-[540]",     // taller banner image in expanded
                title: "text-xl",              // larger title in expanded
                bio: "text-base"               // slightly larger body copy
              }}
            />
            {/* <ArtistActions /> */}
          </div>
        </ExpandingPanel>
      </AnimatePresence>
    );
}