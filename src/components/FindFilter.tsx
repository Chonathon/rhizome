import {useMemo} from "react";
import {Button} from "@/components/ui/button";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {ResponsivePanel} from "@/components/ResponsivePanel";
import {ChevronDown, TextSearch, X} from "lucide-react";
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
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const groupHeading = `${sortedItems.length} ${sortedItems.length > 0 && sortedItems[0].entityType}s`

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
      {/* {canClear ? (
        <Button
          asChild
          size="icon"
          variant="secondary"
          className="-m-1.5 h-6 w-6"
        >
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear find selection"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              onClear?.();
            }}
          >
            <X className="h-4 w-4" />
          </span>
        </Button>
      ) : (
        <ChevronDown className="size-4 opacity-70" />
      )} */}
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
      <Command>
        <CommandInput placeholder={placeholder} />
        <CommandList>
          <CommandEmpty>{emptyText}</CommandEmpty>
          {sortedItems.length > 0 && (
            <CommandGroup heading={groupHeading}>
              {sortedItems.map((item) => (
                <CommandItem
                  key={item.id}
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
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </ResponsivePanel>
  );
}
