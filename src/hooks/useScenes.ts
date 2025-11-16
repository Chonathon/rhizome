import { useCallback, useEffect, useState } from 'react';
import { Scene, GraphType } from '@/types';

const SCENES_STORAGE_KEY = 'userScenes';
const ACTIVE_SCENE_STORAGE_KEY = 'activeSceneId';

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

const parseActiveSceneId = (raw: string | null): string | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : null;
  } catch (error) {
    console.error('Failed to parse active scene ID from localStorage', error);
    return null;
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
 * Scenes capture filter state and can be loaded to restore those filters.
 * Only one scene can be active at a time (for explore mode).
 *
 * @param currentFilters - Current filter state (genres, decades)
 * @param currentGraphType - Current graph type
 *
 * @returns Scene management functions and state
 */
export function useScenes(
  currentFilters: CurrentFilters,
  currentGraphType: GraphType
) {
  const [scenes, setScenes] = useState<Scene[]>(() => {
    if (typeof window === 'undefined') return [];
    return parseStoredScenes(localStorage.getItem(SCENES_STORAGE_KEY));
  });

  const [activeSceneId, setActiveSceneId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return parseActiveSceneId(localStorage.getItem(ACTIVE_SCENE_STORAGE_KEY));
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

  // Sync active scene to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACTIVE_SCENE_STORAGE_KEY, JSON.stringify(activeSceneId));
    } catch (error) {
      console.error('Failed to save active scene to localStorage', error);
    }
  }, [activeSceneId]);

  // Cross-tab sync for scenes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SCENES_STORAGE_KEY) {
        setScenes(parseStoredScenes(event.newValue));
      } else if (event.key === ACTIVE_SCENE_STORAGE_KEY) {
        setActiveSceneId(parseActiveSceneId(event.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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

      // Set as active scene
      setActiveSceneId(newScene.id);

      return newScene;
    },
    [currentFilters, currentGraphType]
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

    // If this was the active scene, deactivate it
    setActiveSceneId((prev) => (prev === sceneId ? null : prev));
  }, []);

  // Load a scene (apply its filters and set as active)
  const loadScene = useCallback(
    (sceneId: string): Scene | null => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (!scene) return null;

      // Set as active scene
      setActiveSceneId(sceneId);

      return scene;
    },
    [scenes]
  );

  // Deactivate the current scene
  const deactivateScene = useCallback(() => {
    setActiveSceneId(null);
  }, []);

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
