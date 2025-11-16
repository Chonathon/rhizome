import { useCallback, useEffect, useState } from 'react';
import { Scene, ActiveScenesPerMode, GraphType } from '@/types';

const SCENES_STORAGE_KEY = 'userScenes';
const ACTIVE_SCENES_STORAGE_KEY = 'activeScenesPerMode';

type Mode = 'explore' | 'collection';

interface CurrentFilters {
  genres: string[];
  decades: string[];
}

// Type guards
const isScene = (value: unknown): value is Scene => {
  if (!value || typeof value !== 'object') return false;
  const scene = value as Scene;
  return (
    typeof scene.id === 'string' &&
    typeof scene.name === 'string' &&
    typeof scene.createdAt === 'string' &&
    typeof scene.updatedAt === 'string' &&
    typeof scene.graphType === 'string' &&
    scene.filters &&
    typeof scene.filters === 'object' &&
    Array.isArray(scene.filters.genres) &&
    Array.isArray(scene.filters.decades)
  );
};

const isActiveScenesPerMode = (value: unknown): value is ActiveScenesPerMode => {
  if (!value || typeof value !== 'object') return false;
  const active = value as ActiveScenesPerMode;
  return (
    (active.explore === null || typeof active.explore === 'string') &&
    (active.collection === null || typeof active.collection === 'string')
  );
};

// Parse helpers
const parseStoredScenes = (raw: string | null): Scene[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isScene);
  } catch (error) {
    console.error('Failed to parse scenes from localStorage', error);
    return [];
  }
};

const parseActiveScenesPerMode = (raw: string | null): ActiveScenesPerMode => {
  if (!raw) return { explore: null, collection: null };
  try {
    const parsed = JSON.parse(raw);
    if (isActiveScenesPerMode(parsed)) return parsed;
    return { explore: null, collection: null };
  } catch (error) {
    console.error('Failed to parse active scenes from localStorage', error);
    return { explore: null, collection: null };
  }
};

// Deep equality check for filter arrays
const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
};

const filtersEqual = (a: CurrentFilters, b: CurrentFilters): boolean => {
  return arraysEqual(a.genres, b.genres) && arraysEqual(a.decades, b.decades);
};

/**
 * Hook for managing saved filter scenes with localStorage persistence.
 * Scenes are universal across modes, but active scene state is tracked per mode.
 *
 * @param currentMode - Current mode ('explore' | 'collection')
 * @param currentFilters - Current filter state (genres, decades)
 * @param currentGraphType - Current graph type
 *
 * @returns Scene management functions and state
 */
export function useScenes(
  currentMode: Mode,
  currentFilters: CurrentFilters,
  currentGraphType: GraphType
) {
  const [scenes, setScenes] = useState<Scene[]>(() => {
    if (typeof window === 'undefined') return [];
    return parseStoredScenes(localStorage.getItem(SCENES_STORAGE_KEY));
  });

  const [activeScenesPerMode, setActiveScenesPerMode] = useState<ActiveScenesPerMode>(() => {
    if (typeof window === 'undefined') return { explore: null, collection: null };
    return parseActiveScenesPerMode(localStorage.getItem(ACTIVE_SCENES_STORAGE_KEY));
  });

  // Sync scenes to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SCENES_STORAGE_KEY, JSON.stringify(scenes));
    } catch (error) {
      console.error('Failed to save scenes to localStorage', error);
    }
  }, [scenes]);

  // Sync active scenes to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACTIVE_SCENES_STORAGE_KEY, JSON.stringify(activeScenesPerMode));
    } catch (error) {
      console.error('Failed to save active scenes to localStorage', error);
    }
  }, [activeScenesPerMode]);

  // Cross-tab sync for scenes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SCENES_STORAGE_KEY) {
        setScenes(parseStoredScenes(event.newValue));
      } else if (event.key === ACTIVE_SCENES_STORAGE_KEY) {
        setActiveScenesPerMode(parseActiveScenesPerMode(event.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Get active scene ID for current mode
  const activeSceneId = activeScenesPerMode[currentMode];

  // Get active scene object
  const activeScene = scenes.find((s) => s.id === activeSceneId) || null;

  // Save a new scene
  const saveScene = useCallback(
    async (name: string): Promise<Scene> => {
      const newScene: Scene = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        graphType: currentGraphType,
        filters: {
          genres: [...currentFilters.genres],
          decades: [...currentFilters.decades],
        },
      };

      setScenes((prev) => [...prev, newScene]);

      // Set as active for current mode
      setActiveScenesPerMode((prev) => ({
        ...prev,
        [currentMode]: newScene.id,
      }));

      return newScene;
    },
    [currentMode, currentFilters, currentGraphType]
  );

  // Update an existing scene
  const updateScene = useCallback(
    async (sceneId: string, updates: { name?: string; updateFilters?: boolean }): Promise<void> => {
      setScenes((prev) =>
        prev.map((scene) => {
          if (scene.id !== sceneId) return scene;

          const updatedScene: Scene = {
            ...scene,
            name: updates.name ?? scene.name,
            updatedAt: new Date().toISOString(),
          };

          if (updates.updateFilters) {
            updatedScene.filters = {
              genres: [...currentFilters.genres],
              decades: [...currentFilters.decades],
            };
            updatedScene.graphType = currentGraphType;
          }

          return updatedScene;
        })
      );
    },
    [currentFilters, currentGraphType]
  );

  // Delete a scene
  const deleteScene = useCallback(async (sceneId: string): Promise<void> => {
    setScenes((prev) => prev.filter((scene) => scene.id !== sceneId));

    // If this was the active scene in any mode, deactivate it
    setActiveScenesPerMode((prev) => ({
      explore: prev.explore === sceneId ? null : prev.explore,
      collection: prev.collection === sceneId ? null : prev.collection,
    }));
  }, []);

  // Load a scene (apply its filters and set as active for current mode)
  const loadScene = useCallback(
    (sceneId: string): Scene | null => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (!scene) return null;

      // Set as active for current mode
      setActiveScenesPerMode((prev) => ({
        ...prev,
        [currentMode]: sceneId,
      }));

      return scene;
    },
    [scenes, currentMode]
  );

  // Deactivate scene for current mode
  const deactivateScene = useCallback(() => {
    setActiveScenesPerMode((prev) => ({
      ...prev,
      [currentMode]: null,
    }));
  }, [currentMode]);

  // Check if current filters match the active scene
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!activeScene) return false;
    return !filtersEqual(currentFilters, activeScene.filters);
  }, [activeScene, currentFilters]);

  return {
    scenes,
    activeSceneId,
    activeScene,
    saveScene,
    updateScene,
    deleteScene,
    loadScene,
    deactivateScene,
    hasUnsavedChanges,
  };
}
