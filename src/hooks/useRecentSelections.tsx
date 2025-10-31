import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BasicNode } from "@/types";

const LOCAL_STORAGE_KEY = 'recentSelections';
const MAX_RECENT_SELECTIONS = 10;

type RecentSelectionsContextValue = {
  recentSelections: BasicNode[];
  addRecentSelection: (selection: BasicNode) => void;
  removeRecentSelection: (id: string) => void;
};

const RecentSelectionsContext = createContext<RecentSelectionsContextValue | undefined>(undefined);

const isBasicNode = (value: unknown): value is BasicNode => {
  if (!value || typeof value !== 'object') return false;
  const node = value as BasicNode;
  return typeof node.id === 'string' && typeof node.name === 'string';
};

const parseStoredSelections = (raw: string | null): BasicNode[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBasicNode);
  } catch (error) {
    console.error("Failed to parse recent selections from localStorage", error);
    return [];
  }
};

export function RecentSelectionsProvider({ children }: { children: ReactNode }) {
  const [recentSelections, setRecentSelections] = useState<BasicNode[]>(() => {
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

  const addRecentSelection = useCallback((selection: BasicNode) => {
    setRecentSelections((prevSelections) => {
      const merged = [selection, ...prevSelections.filter((item) => item.id !== selection.id)];
      return merged.slice(0, MAX_RECENT_SELECTIONS);
    });
  }, []);

  const removeRecentSelection = useCallback((id: string) => {
    setRecentSelections((prevSelections) => prevSelections.filter((item) => item.id !== id));
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
