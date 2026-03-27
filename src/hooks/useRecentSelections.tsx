import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BasicNode } from "@/types";

const LOCAL_STORAGE_KEY = 'recentSelections';
export const MAX_RECENT_SELECTIONS = 100;

export type RecentSelectionItem = BasicNode & {
  nodeType: 'artist' | 'genre';
  timestamp: number;
};

type RecentSelectionsContextValue = {
  recentSelections: RecentSelectionItem[];
  addRecentSelection: (selection: BasicNode, nodeType: 'artist' | 'genre') => void;
  removeRecentSelection: (id: string) => void;
};

const RecentSelectionsContext = createContext<RecentSelectionsContextValue | undefined>(undefined);

const isRecentSelectionItem = (value: unknown): value is RecentSelectionItem => {
  if (!value || typeof value !== 'object') return false;
  const node = value as RecentSelectionItem;
  return typeof node.id === 'string' && typeof node.name === 'string';
};

const migrateItem = (value: unknown): RecentSelectionItem | null => {
  if (!isRecentSelectionItem(value)) return null;
  const item = value as RecentSelectionItem;
  return {
    ...item,
    nodeType: item.nodeType ?? 'artist',
    timestamp: item.timestamp ?? Date.now(),
  };
};

const parseStoredSelections = (raw: string | null): RecentSelectionItem[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateItem).filter((x): x is RecentSelectionItem => x !== null);
  } catch (error) {
    console.error("Failed to parse recent selections from localStorage", error);
    return [];
  }
};

export function RecentSelectionsProvider({ children }: { children: ReactNode }) {
  const [recentSelections, setRecentSelections] = useState<RecentSelectionItem[]>(() => {
    if (typeof window === 'undefined') return [];
    return parseStoredSelections(localStorage.getItem(LOCAL_STORAGE_KEY));
  });
  const isHydrated = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isHydrated.current) return;
    isHydrated.current = true;
    setRecentSelections(parseStoredSelections(localStorage.getItem(LOCAL_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recentSelections));
    } catch (error) {
      console.error("Failed to save recent selections to localStorage", error);
    }
  }, [recentSelections]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LOCAL_STORAGE_KEY) return;
      setRecentSelections(parseStoredSelections(event.newValue));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const addRecentSelection = useCallback((selection: BasicNode, nodeType: 'artist' | 'genre') => {
    setRecentSelections((prev) => {
      const item: RecentSelectionItem = { ...selection, nodeType, timestamp: Date.now() };
      const merged = [item, ...prev.filter((s) => s.id !== selection.id)];
      return merged.slice(0, MAX_RECENT_SELECTIONS);
    });
  }, []);

  const removeRecentSelection = useCallback((id: string) => {
    setRecentSelections((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({ recentSelections, addRecentSelection, removeRecentSelection }),
    [recentSelections, addRecentSelection, removeRecentSelection]
  );

  return (
    <RecentSelectionsContext.Provider value={value}>
      {children}
    </RecentSelectionsContext.Provider>
  );
}

export function useRecentSelections() {
  const context = useContext(RecentSelectionsContext);
  if (!context) {
    throw new Error('useRecentSelections must be used within a RecentSelectionsProvider');
  }
  return context;
}
