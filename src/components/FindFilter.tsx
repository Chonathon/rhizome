import {memo, useState, useEffect, useMemo} from "react";
import {Button} from "@/components/ui/button";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {ResponsivePanel} from "@/components/ResponsivePanel";
import {TextSearch} from "lucide-react";
import {cn} from "@/lib/utils";
import {FindOption} from "@/types";

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
  iconOnly?: boolean;
  title?: string;
}

type KeyedFindOption = {
  item: FindOption;
  uniqueKey: string;
  commandValue: string;
};

const INITIAL_ITEMS = 50; // Load first 50 items immediately
const LOAD_MORE_THRESHOLD = 100; // Load 100 more when scrolling near bottom

// Memoized item component to prevent unnecessary re-renders
const FindItem = memo((
  {
    item,
    onSelect,
    commandValue,
  }: {
    item: FindOption;
    onSelect: (option: FindOption) => void;
    commandValue: string;
  }) => (
  <CommandItem
    value={commandValue}
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
  iconOnly = false,
  title = "Find in view",
}: FindFilterProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_ITEMS);
  const [searchQuery, setSearchQuery] = useState("");

  const keyedItems = useMemo<KeyedFindOption[]>(() => {
    return items.map((item, index) => {
      const uniqueKey = `${item.entityType}:${item.id}:${index}`;
      const searchParts = [item.name, item.subtitle ?? ""].filter(
        (part) => part.length > 0
      );
      const commandValue = `${searchParts.join(" ")} ${uniqueKey}`.trim();
      return {
        item,
        uniqueKey,
        commandValue,
      };
    });
  }, [items]);

  // Reset visible count when panel opens or items change
  useEffect(() => {
    if (open) {
      setVisibleCount(INITIAL_ITEMS);
      setSearchQuery("");
    }
  }, [open, items]);

  // Filter items based on search query
  const filteredItems = useMemo<KeyedFindOption[]>(() => {
    if (!searchQuery) return keyedItems;
    const query = searchQuery.toLowerCase();
    return keyedItems.filter(
      ({ item }) =>
        item.name.toLowerCase().includes(query) ||
        item.subtitle?.toLowerCase().includes(query)
    );
  }, [keyedItems, searchQuery]);

  // For large lists, only show subset initially. When searching, show all matches.
  const displayItems = useMemo<KeyedFindOption[]>(() => {
    // If user is searching, show all filtered results (search results are typically smaller)
    if (searchQuery) {
      return filteredItems;
    }
    // Otherwise, show limited set for performance
    return keyedItems.slice(0, visibleCount);
  }, [keyedItems, filteredItems, visibleCount, searchQuery]);

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

  const entityLabel =
    items.length > 0 ? `${items[0].entityType}s` : "results";

  const groupHeading = searchQuery
    ? `${filteredItems.length} of ${items.length} ${entityLabel}`
    : `${items.length} ${entityLabel}`;

  const canClear = typeof onClear === "function";

  const trigger = iconOnly ? (
    <Button
      size="icon"
      variant="outline"
      disabled={disabled && !canClear}
      className={cn("h-10 w-10", triggerClassName)}
      title={title}
    >
      <TextSearch className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">{label}</span>
    </Button>
  ) : (
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
      className="w-72 sm:w-80 p-0 overflow-hidden"
      side="left"
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
                {displayItems.map(({ item, uniqueKey, commandValue }) => (
                  <FindItem
                    key={uniqueKey}
                    item={item}
                    onSelect={onSelect}
                    commandValue={commandValue}
                  />
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
