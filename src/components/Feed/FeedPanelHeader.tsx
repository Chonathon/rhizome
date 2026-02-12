import { useMemo, useRef, useState } from "react";
import { RefreshCw, ChevronDown, Check, X, Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsivePanel } from "@/components/ResponsivePanel";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandSeparator,
} from "@/components/ui/command";
import { FeedSource } from "@/types";
import { FEED_CATEGORIES } from "@/constants";

interface FeedPanelHeaderDropdown {
  feeds: FeedSource[];
  groupByCategory?: boolean;
  checkedIds: string[];
  onToggle: (feedId: string) => void;
  showClear?: boolean;
  confirmUnfollow?: boolean;
  onAddFeed?: (url: string) => Promise<{ success: boolean; error?: string }>;
  onRemoveFeed?: (id: string) => void;
  addingFeed?: boolean;
}

interface FeedPanelHeaderProps {
  title: string;
  onRefresh: () => void;
  loading: boolean;
  badge?: React.ReactNode;
  dropdown?: FeedPanelHeaderDropdown;
}

export function FeedPanelHeader({
  title,
  onRefresh,
  loading,
  badge,
  dropdown,
}: FeedPanelHeaderProps) {
  const [query, setQuery] = useState("");
  const [pendingUnfollowId, setPendingUnfollowId] = useState<string | null>(null);
  const [showAddInput, setShowAddInput] = useState(false);
  const [feedUrl, setFeedUrl] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const checkedCount = dropdown?.checkedIds.length ?? 0;
  const showClear = dropdown?.showClear ?? true;
  const confirmUnfollow = dropdown?.confirmUnfollow ?? false;

  const label = useMemo(() => {
    if (!dropdown || checkedCount === 0) return title;
    if (showClear && checkedCount === 1) {
      const feed = dropdown.feeds.find((f) => dropdown.checkedIds.includes(f.id));
      return feed?.name ?? title;
    }
    return title;
  }, [title, dropdown, checkedCount, showClear]);

  const clearAll = () => {
    if (!dropdown) return;
    dropdown.checkedIds.forEach((id) => dropdown.onToggle(id));
  };

  const handleAddFeed = async () => {
    if (!dropdown?.onAddFeed || !feedUrl.trim()) return;
    setAddError(null);
    const result = await dropdown.onAddFeed(feedUrl.trim());
    if (result.success) {
      setFeedUrl("");
      setShowAddInput(false);
    } else {
      setAddError(result.error ?? "Failed to add feed");
    }
  };

  // Plain mode (Trending)
  if (!dropdown) {
    return (
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold leading-tight">
          {title}
          {badge}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
    );
  }

  // Dropdown mode (Following / Everything)
  return (
    <div className="p-4 flex items-center justify-between">
      <ResponsivePanel
        side="bottom"
        className="p-0 overflow-hidden"
        onOpenChange={(open) => {
          if (open) {
            setQuery("");
            setPendingUnfollowId(null);
            setShowAddInput(false);
            setFeedUrl("");
            setAddError(null);
          }
        }}
        trigger={
          <Button
            variant="ghost"
            className={`-ml-2 text-xl font-semibold leading-tight gap-1 ${checkedCount > 0 ? "pr-2" : ""}`}
          >
            {label}
            {showClear && checkedCount > 0 ? (
              <Button
                asChild
                size="icon"
                variant="secondary"
                className="-m-1 w-6 h-6 group"
              >
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label="Clear all filters"
                  className="group"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAll();
                  }}
                >
                  {checkedCount > 1 ? (
                    <>
                      <span className="group-hover:opacity-0 group-hover:scale-0 transition-all text-xs leading-none">
                        {checkedCount}
                      </span>
                      <X className="transition-all group-hover:opacity-100 absolute scale-0 group-hover:scale-100 opacity-0 h-4 w-4 group-hover:-rotate-90" />
                    </>
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </span>
              </Button>
            ) : (
              <>
                {!showClear && checkedCount > 0 && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                    {checkedCount}
                  </span>
                )}
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        }
      >
        <Command>
          <CommandInput
            placeholder="Filter feeds..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No feeds found.</CommandEmpty>
            {dropdown.groupByCategory ? (
              FEED_CATEGORIES.map((cat) => {
                const categoryFeeds = dropdown.feeds.filter(
                  (f) => f.category === cat.id
                );
                if (categoryFeeds.length === 0) return null;
                return (
                  <CommandGroup key={cat.id} heading={cat.label}>
                    {categoryFeeds.map((feed) => {
                      const checked = dropdown.checkedIds.includes(feed.id);
                      const isCustom = feed.category === "custom";
                      return (
                        <CommandItem
                          key={feed.id}
                          value={feed.name}
                          onSelect={() => dropdown.onToggle(feed.id)}
                          className="flex items-center gap-2"
                        >
                          <Check className={checked ? "opacity-100" : "opacity-0"} />
                          <span className="flex-1 truncate">{feed.name}</span>
                          {isCustom && dropdown.onRemoveFeed && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                dropdown.onRemoveFeed!(feed.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                );
              })
            ) : (
              <CommandGroup>
                {dropdown.feeds.map((feed) => {
                  const checked = dropdown.checkedIds.includes(feed.id);
                  const isPending = confirmUnfollow && pendingUnfollowId === feed.id;
                  return (
                    <CommandItem
                      key={feed.id}
                      value={feed.name}
                      onSelect={() => {
                        if (confirmUnfollow && checked) {
                          setPendingUnfollowId(isPending ? null : feed.id);
                        } else {
                          dropdown.onToggle(feed.id);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      {isPending ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm text-muted-foreground">Unfollow {feed.name}?</span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                dropdown.onToggle(feed.id);
                                setPendingUnfollowId(null);
                              }}
                            >
                              Unfollow
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingUnfollowId(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Check className={checked ? "opacity-100" : "opacity-0"} />
                          <span>{feed.name}</span>
                        </>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
          {dropdown.onAddFeed && (
            <>
              <CommandSeparator />
              <div className="p-2">
                {showAddInput ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                      <input
                        ref={addInputRef}
                        type="url"
                        placeholder="https://example.com/feed.xml"
                        value={feedUrl}
                        onChange={(e) => {
                          setFeedUrl(e.target.value);
                          setAddError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddFeed();
                          if (e.key === "Escape") {
                            setShowAddInput(false);
                            setFeedUrl("");
                            setAddError(null);
                          }
                        }}
                        className="flex-1 min-w-0 h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        className="h-8 px-3"
                        onClick={handleAddFeed}
                        disabled={!feedUrl.trim() || dropdown.addingFeed}
                      >
                        {dropdown.addingFeed ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Add"
                        )}
                      </Button>
                    </div>
                    {addError && (
                      <p className="text-xs text-destructive px-1">{addError}</p>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-muted-foreground"
                    onClick={() => {
                      setShowAddInput(true);
                      setTimeout(() => addInputRef.current?.focus(), 0);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add custom feed
                  </Button>
                )}
              </div>
            </>
          )}
        </Command>
      </ResponsivePanel>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={loading}
        className="h-8 w-8"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
