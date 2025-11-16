// ScenesDrawer displays saved scenes in a ResponsiveDrawer
// Users can view, load, edit, and delete scenes
import { useState } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { Scene, Genre, GraphType } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Check } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import SaveSceneDialog from '@/components/SaveSceneDialog';

interface ScenesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenes: Scene[];
  activeSceneId: string | null;
  currentFilters: {
    genres: string[];
    decades: string[];
  };
  genreLookup: Map<string, Genre>;
  graphType: GraphType;
  isAuthenticated: boolean;
  onLoadScene: (scene: Scene) => void;
  onSaveScene: (name: string) => Promise<void>;
  onUpdateScene: (sceneId: string, name: string, updateFilters?: boolean) => Promise<void>;
  onDeleteScene: (sceneId: string) => Promise<void>;
  onAuthRequired: () => void;
  hasUnsavedChanges: boolean;
}

export default function ScenesDrawer({
  open,
  onOpenChange,
  scenes,
  activeSceneId,
  currentFilters,
  genreLookup,
  graphType,
  isAuthenticated,
  onLoadScene,
  onSaveScene,
  onUpdateScene,
  onDeleteScene,
  onAuthRequired,
  hasUnsavedChanges,
}: ScenesDrawerProps) {
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [sceneToEdit, setSceneToEdit] = useState<Scene | undefined>(undefined);

  // Get active scene object
  const activeScene = scenes.find((s) => s.id === activeSceneId);

  // Filter scenes based on search query
  const filteredScenes = query.trim()
    ? scenes.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()))
    : scenes;

  // Separate active scene from others for display
  const otherScenes = filteredScenes.filter((s) => s.id !== activeSceneId);

  // Handle creating new scene
  const handleOpenCreateDialog = () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    setDialogMode('create');
    setSceneToEdit(undefined);
    setDialogOpen(true);
  };

  // Handle editing existing scene
  const handleOpenEditDialog = (scene: Scene, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    setDialogMode('edit');
    setSceneToEdit(scene);
    setDialogOpen(true);
  };

  // Handle saving from dialog
  const handleSave = async (name: string, updateFilters?: boolean) => {
    if (dialogMode === 'create') {
      await onSaveScene(name);
    } else if (sceneToEdit) {
      await onUpdateScene(sceneToEdit.id, name, updateFilters);
    }
  };

  // Handle deleting from dialog
  const handleDelete = async () => {
    if (sceneToEdit) {
      await onDeleteScene(sceneToEdit.id);
    }
  };

  // Get filter counts for display
  const getFilterSummary = (scene: Scene) => {
    const genreCount = scene.filters.genres.length;
    const decadeCount = scene.filters.decades.length;
    const parts: string[] = [];
    if (genreCount > 0) parts.push(`${genreCount} ${genreCount === 1 ? 'genre' : 'genres'}`);
    if (decadeCount > 0) parts.push(`${decadeCount} ${decadeCount === 1 ? 'decade' : 'decades'}`);
    return parts.length > 0 ? parts.join(' · ') : 'No filters';
  };

  return (
    <>
      <ResponsiveDrawer
        show={open}
        onDismiss={() => onOpenChange(false)}
        headerTitle="Scenes"
        headerSubtitle={scenes.length > 0 ? `${scenes.length} saved` : undefined}
        snapPoints={[0.5, 0.9]}
        directionDesktop="left"
      >
        {({ isDesktop }) => (
          <div
            data-drawer-scroll
            className="w-full flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto no-scrollbar pb-16 md:pb-8"
          >
            <Command className="rounded-lg border-none">
              {/* Save Current View Button */}
              <div className="p-2 border-b border-border">
                <Button
                  onClick={handleOpenCreateDialog}
                  className="w-full"
                  size="lg"
                  variant="default"
                >
                  <Plus className="h-5 w-5" />
                  Save Current View
                </Button>
              </div>

              {/* Search */}
              <CommandInput
                placeholder="Search scenes..."
                value={query}
                onValueChange={setQuery}
              />

              <CommandList>
                <CommandEmpty>
                  {scenes.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        No scenes saved yet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Save your current filter selections to quickly restore them later
                      </p>
                    </div>
                  ) : (
                    <p className="py-4 text-sm text-muted-foreground">No scenes found</p>
                  )}
                </CommandEmpty>

                {/* Active Scene */}
                {activeScene && filteredScenes.includes(activeScene) && (
                  <>
                    <CommandGroup
                      className="bg-accent/40 border-b"
                      heading="Active Scene"
                    >
                      <CommandItem
                        key={`active-${activeScene.id}`}
                        value={`active:${activeScene.id} ${activeScene.name}`}
                        onSelect={() => onLoadScene(activeScene)}
                        className="flex items-center gap-3 py-3"
                      >
                        <Check className="h-5 w-5 shrink-0 opacity-100" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {activeScene.name}
                            {hasUnsavedChanges && (
                              <span className="ml-2 text-xs text-muted-foreground italic">
                                (modified)
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {getFilterSummary(activeScene)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => handleOpenEditDialog(activeScene, e)}
                          aria-label="Edit scene"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </CommandItem>
                    </CommandGroup>
                    {otherScenes.length > 0 && <CommandSeparator />}
                  </>
                )}

                {/* All Other Scenes */}
                {otherScenes.length > 0 && (
                  <CommandGroup>
                    {otherScenes.map((scene) => (
                      <CommandItem
                        key={scene.id}
                        value={scene.name}
                        onSelect={() => onLoadScene(scene)}
                        className="flex items-center gap-3 py-3"
                      >
                        <Check className="h-5 w-5 shrink-0 opacity-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{scene.name}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {getFilterSummary(scene)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => handleOpenEditDialog(scene, e)}
                          aria-label="Edit scene"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        )}
      </ResponsiveDrawer>

      {/* Save/Edit Scene Dialog */}
      <SaveSceneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        currentScene={sceneToEdit}
        currentFilters={currentFilters}
        genreLookup={genreLookup}
        graphType={graphType}
        onSave={handleSave}
        onDelete={dialogMode === 'edit' ? handleDelete : undefined}
      />
    </>
  );
}
