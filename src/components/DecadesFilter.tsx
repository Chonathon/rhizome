// DecadesFilter renders a searchable, collapsible list of decades
// with multi-selection capability. Users can select multiple decades.
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, X } from "lucide-react";
import { ResponsivePanel } from "@/components/ResponsivePanel";
import { useEffect, useMemo, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";

// Dummy data: decades from 1930s to 2020s
const DECADES = [
  { id: '1930s', name: '1930s' },
  { id: '1940s', name: '1940s' },
  { id: '1950s', name: '1950s' },
  { id: '1960s', name: '1960s' },
  { id: '1970s', name: '1970s' },
  { id: '1980s', name: '1980s' },
  { id: '1990s', name: '1990s' },
  { id: '2000s', name: '2000s' },
  { id: '2010s', name: '2010s' },
  { id: '2020s', name: '2020s' },
];

interface DecadesFilterProps {
  onDecadeSelectionChange: (selectedIds: string[]) => void;
}

export default function DecadesFilter({
  onDecadeSelectionChange,
}: DecadesFilterProps) {
  // Track selected decades using a Set
  const [selectedDecades, setSelectedDecades] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  // Get selected decades as array for display
  const selectedDecadesArray = useMemo(
    () => DECADES.filter((d) => selectedDecades.has(d.id)),
    [selectedDecades]
  );

  // Notify parent component when selection changes
  useEffect(() => {
    const ids = selectedDecadesArray.map(d => d.id);
    onDecadeSelectionChange(ids);
  }, [selectedDecadesArray]);

  // Toggle a decade selection
  const toggleDecade = (decadeId: string) => {
    setSelectedDecades((prev) => {
      const next = new Set(prev);
      if (next.has(decadeId)) {
        next.delete(decadeId);
      } else {
        next.add(decadeId);
      }
      return next;
    });
  };

  // Clear all selections
  const clearAll = () => {
    setSelectedDecades(new Set());
  };

  // Check if a decade is selected
  const isDecadeSelected = (decadeId: string) => {
    return selectedDecades.has(decadeId);
  };

  // Total selected count
  const totalSelected = selectedDecades.size;

  // Filter decades based on search query
  const filteredDecades = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DECADES;
    return DECADES.filter((d) => d.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <ResponsivePanel
      trigger={
        <Button size="lg" variant="outline" className={`${totalSelected > 0 ? "px-4" : ""}`}>
          {totalSelected === 1
            ? selectedDecadesArray[0]?.name
            : "Decades"}
          {totalSelected > 0 ? (
            <Button
              asChild
              size="icon"
              variant="secondary"
              className="-m-1 w-6 h-6 group"
            >
              <span
                role="button"
                className="group"
                tabIndex={-1}
                aria-label="Clear all filters"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                title="Clear all decade selections"
              >
                {totalSelected > 1 ? (
                  <>
                    <span className="group-hover:opacity-0 text-xs leading-none">{totalSelected}</span>
                    <X className="group-hover:opacity-100 absolute opacity-0 h-4 w-4" />
                  </>
                ) : (
                  <X className="h-4 w-4" />
                )}
              </span>
            </Button>
          ) : (
            <ChevronDown />
          )}
        </Button>
      }
      className="p-0 overflow-hidden"
      side="bottom"
    >
      <Command>
        <CommandInput
          placeholder="Filter decades..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No decades found.</CommandEmpty>

          {/* Selected Group - shown only when there are selections */}
          {selectedDecadesArray.length > 0 && (
            <CommandGroup className="bg-accent/40 border-b" aria-labelledby="Selected Decades">
              {selectedDecadesArray.map((decade) => (
                <CommandItem
                  key={`sel-${decade.id}`}
                  value={`selected:${decade.id} ${decade.name}`}
                  onSelect={() => {
                    toggleDecade(decade.id);
                  }}
                  className="flex items-center gap-2"
                >
                  <Check className="opacity-100" />
                  <span>{decade.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* All Decades Group */}
          <CommandGroup>
            {filteredDecades.map((decade) => {
              const isSelected = isDecadeSelected(decade.id);
              return (
                <CommandItem
                  key={decade.id}
                  value={decade.name}
                  onSelect={() => {
                    toggleDecade(decade.id)
                    toast(`You selected the ${decade.name} decade but's the feature isn't implemented yet 🙃`);
                  }}
                  className="flex items-center gap-2"
                >
                  <Check className={isSelected ? "opacity-100" : "hidden"} />
                  <span>{decade.name}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </ResponsivePanel>
  );
}
