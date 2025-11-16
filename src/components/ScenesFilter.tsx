// ScenesFilter allows users to save and load filter configurations ("scenes")
// Scenes are universal across modes, but active state is tracked per mode
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, X, Layers, Plus, Pencil } from 'lucide-react';
import { ResponsivePanel } from '@/components/ResponsivePanel';
import { useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Scene, Genre, GraphType } from '@/types';
import SaveSceneDialog from '@/components/SaveSceneDialog';

interface ScenesFilterProps {
  scenes: Scene[];
  activeSceneId: string | null;
  currentFilters: {
    genres: string[];
    decades: string[];
  };
  genreLookup: Map<string, Genre>;
  graphType: GraphType;
  mode: 'explore' | 'collection';
  isAuthenticated: boolean;
  onLoadScene: (scene: Scene) => void;
  onDeactivateScene: () => void;
  onSaveScene: (name: string) => Promise<void>;
  onUpdateScene: (sceneId: string, name: string, updateFilters?: boolean) => Promise<void>;
  onDeleteScene: (sceneId: string) => Promise<void>;
  onAuthRequired: () => void;
  hasUnsavedChanges: boolean;
}

export default function ScenesFilter({
  scenes,
  activeSceneId,
  currentFilters,
  genreLookup,
  graphType,
  mode,
  isAuthenticated,
  onLoadScene,
  onDeactivateScene,
  onSaveScene,
  onUpdateScene,
  onDeleteScene,
  onAuthRequired,
  hasUnsavedChanges,
}: ScenesFilterProps) {
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

  // Handle loading a scene
  const handleLoadScene = (scene: Scene) => {
    onLoadScene(scene);
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

  // Button text
  const buttonText = activeScene ? activeScene.name : 'Scenes';
  const hasActiveScene = !!activeScene;

  return (
    <>
      <ResponsivePanel
        trigger={
          <Button
            size="lg"
            variant="outline"
            className={`${hasActiveScene ? 'px-4' : ''}`}
          >
            <Layers className={hasActiveScene ? 'hidden' : ''} />
            <span className={hasActiveScene ? '' : 'sr-only'}>
              {buttonText}
            </span>
            {hasActiveScene ? (
              <Button
                asChild
                size="icon"
                variant="secondary"
                className="-m-1 w-6 h-6 group"
              >
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label="Clear active scene"
                  className="group"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeactivateScene();
                  }}
                  title="Clear active scene"
                >
                  <X className="h-4 w-4" />
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
            placeholder="Search scenes..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No scenes found.</CommandEmpty>

            {/* Save Current View Button */}
            <CommandGroup>
              <CommandItem
                onSelect={handleOpenCreateDialog}
                className="flex items-center gap-2 font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Save Current View</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            {/* Active Scene (if any) */}
            {activeScene && (
              <>
                <CommandGroup
                  className="bg-accent/40 border-b"
                  aria-labelledby="Active Scene"
                >
                  <CommandItem
                    key={`active-${activeScene.id}`}
                    value={`active:${activeScene.id} ${activeScene.name}`}
                    onSelect={() => handleLoadScene(activeScene)}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="opacity-100" />
                      <span>{activeScene.name}</span>
                      {hasUnsavedChanges && (
                        <span className="text-xs text-muted-foreground italic">
                          (modified)
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="-mr-2 -my-2"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => handleOpenEditDialog(activeScene, e)}
                      aria-label="Edit scene"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </CommandItem>
                </CommandGroup>
              </>
            )}

            {/* All Scenes */}
            <CommandGroup>
              {filteredScenes.map((scene) => {
                const isActive = scene.id === activeSceneId;
                // Don't show in this group if it's already shown in active group
                if (isActive) return null;

                return (
                  <CommandItem
                    key={scene.id}
                    value={scene.name}
                    onSelect={() => handleLoadScene(scene)}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="hidden" />
                      <span>{scene.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="-mr-2 -my-2"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => handleOpenEditDialog(scene, e)}
                      aria-label="Edit scene"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </ResponsivePanel>

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
