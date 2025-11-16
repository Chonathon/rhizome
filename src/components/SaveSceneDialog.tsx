import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Scene, Genre, GraphType } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

interface SaveSceneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  currentScene?: Scene;
  currentFilters: {
    genres: string[];
    decades: string[];
  };
  genreLookup: Map<string, Genre>;
  graphType: GraphType;
  onSave: (name: string, updateFilters?: boolean) => void;
  onDelete?: () => void;
}

export function SaveSceneDialog({
  open,
  onOpenChange,
  mode,
  currentScene,
  currentFilters,
  genreLookup,
  graphType,
  onSave,
  onDelete,
}: SaveSceneDialogProps) {
  const [name, setName] = useState('');
  const [updateFilters, setUpdateFilters] = useState(false);

  // Initialize name when dialog opens or mode/scene changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && currentScene) {
        setName(currentScene.name);
        setUpdateFilters(false);
      } else {
        setName('');
        setUpdateFilters(false);
      }
    }
  }, [open, mode, currentScene]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), mode === 'edit' ? updateFilters : undefined);
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onOpenChange(false);
    }
  };

  // Get filter summary to display
  const filtersToDisplay = mode === 'edit' && !updateFilters && currentScene
    ? currentScene.filters
    : currentFilters;

  const graphTypeToDisplay = mode === 'edit' && !updateFilters && currentScene
    ? currentScene.graphType
    : graphType;

  // Get genre names from IDs
  const genreNames = filtersToDisplay.genres
    .map((id) => genreLookup.get(id)?.name || id)
    .filter(Boolean);

  const decadeNames = filtersToDisplay.decades;

  const hasFilters = genreNames.length > 0 || decadeNames.length > 0;

  const title = mode === 'create' ? 'Save Current View as Scene' : 'Edit Scene';
  const submitLabel = mode === 'create' ? 'Save Scene' : 'Update Scene';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sidebar backdrop-blur-sm max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Give your scene a memorable name. You can load it anytime to restore these filters.'
              : 'Update the scene name or sync it with your current filter selections.'}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="grid gap-2">
            <Label htmlFor="scene-name" className="text-sm font-medium">
              Scene Name
            </Label>
            <Input
              id="scene-name"
              placeholder="e.g., My Jazz Collection"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Update Filters Checkbox (Edit Mode Only) */}
          {mode === 'edit' && (
            <div className="flex items-start gap-3 rounded-lg border border-border p-3 bg-accent/20">
              <Checkbox
                id="update-filters"
                checked={updateFilters}
                onCheckedChange={(checked) => setUpdateFilters(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="update-filters"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Update filters to current view
                </Label>
                <p className="text-sm text-muted-foreground">
                  Replace saved filters with your current selections
                </p>
              </div>
            </div>
          )}

          {/* Filter Summary */}
          <div className="grid gap-2 rounded-lg border border-border p-4 bg-muted/30">
            <h4 className="text-sm font-semibold">
              {mode === 'edit' && updateFilters ? 'New Filter Selection' : 'Filter Selection'}
            </h4>

            {!hasFilters && (
              <p className="text-sm text-muted-foreground italic">No filters selected</p>
            )}

            {/* Genres */}
            {genreNames.length > 0 && (
              <div className="grid gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Genres ({genreNames.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {genreNames.slice(0, 10).map((name, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20"
                    >
                      {name}
                    </span>
                  ))}
                  {genreNames.length > 10 && (
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      +{genreNames.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Decades */}
            {decadeNames.length > 0 && (
              <div className="grid gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Decades ({decadeNames.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {decadeNames.map((name, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Graph Type */}
            <div className="grid gap-1">
              <span className="text-xs font-semibold text-muted-foreground">Graph Type</span>
              <span className="text-sm capitalize">{graphTypeToDisplay}</span>
            </div>
          </div>
        </form>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Delete button (edit mode only) */}
          {mode === 'edit' && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="sm:mr-auto"
            >
              Delete Scene
            </Button>
          )}

          <div className="flex gap-2 w-full sm:w-auto">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-1 sm:flex-none">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="flex-1 sm:flex-none"
            >
              {submitLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SaveSceneDialog;
