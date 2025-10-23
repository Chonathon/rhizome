import {memo, useState, useEffect, useMemo} from "react";
import {Button} from "@/components/ui/button";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {ResponsivePanel} from "@/components/ResponsivePanel";
import {TextSearch} from "lucide-react";
import {cn} from "@/lib/utils";

export interface FindOption {
  id: string;
  name: string;
  entityType: 'artist' | 'genre';
  subtitle?: string;
}

interface FindFilterProps {
  items: FindOption[];
  onSelect: (option: FindOption) => void;
  onClear?: () => void;
  disabled?: boolean;
  placeholder?: string;
  emptyText?: string;
  triggerClassName?: string;
  label?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PANEL_CLASSNAME = "w-72 sm:w-80 p-0 overflow-hidden";
const INITIAL_ITEMS = 50; // Load first 50 items immediately
const LOAD_MORE_THRESHOLD = 100; // Load 100 more when scrolling near bottom

// Memoized item component to prevent unnecessary re-renders
const FindItem = memo(({ item, onSelect }: { item: FindOption; onSelect: (option: FindOption) => void }) => (
  <CommandItem
    value={`${item.name} ${item.subtitle ?? ""}`}
    onSelect={() => onSelect(item)}
    className="flex flex-col items-start gap-0.5"
  >
    <span className="font-medium leading-tight">{item.name}</span>
    {item.subtitle && (
      <span className="text-xs text-muted-foreground leading-tight">
        {item.subtitle}
      </span>
    )}
  </CommandItem>
));

FindItem.displayName = "FindItem";

export default function FindFilter({
  items,
  onSelect,
  onClear,
  disabled,
  placeholder = "Find in view...",
  emptyText = "No matches in the current view.",
  triggerClassName,
  label = "Find",
  open,
  onOpenChange,
}: FindFilterProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_ITEMS);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset visible count when panel opens or items change
  useEffect(() => {
    if (open) {
      setVisibleCount(INITIAL_ITEMS);
      setSearchQuery("");
    }
  }, [open, items]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.subtitle?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // For large lists, only show subset initially. When searching, show all matches.
  const displayItems = useMemo(() => {
    // If user is searching, show all filtered results (search results are typically smaller)
    if (searchQuery) {
      return filteredItems;
    }
    // Otherwise, show limited set for performance
    return items.slice(0, visibleCount);
  }, [items, filteredItems, visibleCount, searchQuery]);

  const hasMore = !searchQuery && visibleCount < items.length;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore) return;

    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    // Load more when scrolled to 80% of the content
    if (scrollHeight - scrollTop <= clientHeight * 1.2) {
      setVisibleCount((prev) => Math.min(prev + LOAD_MORE_THRESHOLD, items.length));
    }
  };

  const groupHeading = searchQuery
    ? `${filteredItems.length} of ${items.length} ${items.length > 0 && items[0].entityType}s`
    : `${items.length} ${items.length > 0 && items[0].entityType}s`;

  const canClear = typeof onClear === "function";

  const trigger = (
    <Button
      size="lg"
      variant="outline"
      disabled={disabled && !canClear}
      className={cn("inline-flex items-center gap-2", triggerClassName)}
    >
      <TextSearch className="size-4" />
      <span className="truncate max-w-[160px]">
        {label}
      </span>
    </Button>
  );

  if (disabled && !canClear) return trigger;

  return (
    <ResponsivePanel
      trigger={trigger}
      className={PANEL_CLASSNAME}
      side="bottom"
      open={open}
      onOpenChange={onOpenChange}
    >
      {open && (
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList onScroll={handleScroll}>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {displayItems.length > 0 && (
              <CommandGroup heading={groupHeading}>
                {displayItems.map((item) => (
                  <FindItem key={item.id} item={item} onSelect={onSelect} />
                ))}
                {hasMore && (
                  <div className="py-2 text-center text-xs text-muted-foreground">
                    Showing {visibleCount} of {items.length} • Scroll for more
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      )}
    </ResponsivePanel>
  );
}
