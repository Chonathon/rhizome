import { useState, useEffect, useCallback } from 'react';
import {BasicNode} from "@/types";

const LOCAL_STORAGE_KEY = 'recentSelections';
const MAX_RECENT_SELECTIONS = 5;

export function useRecentSelections() {
  const [recentSelections, setRecentSelections] = useState<BasicNode[]>([]);

  useEffect(() => {
    // Load asynchronously to avoid blocking initial render
    const loadRecentSelections = async () => {
      try {
        const storedSelections = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedSelections) {
          setRecentSelections(JSON.parse(storedSelections));
        }
      } catch (error) {
        console.error("Failed to load recent selections from localStorage", error);
      }
    };

    loadRecentSelections();
  }, []);

  const saveToStorage = useCallback(async (selections: BasicNode[]) => {
    // Use setTimeout to make localStorage write async
    setTimeout(() => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(selections));
      } catch (error) {
        console.error("Failed to save recent selections to localStorage", error);
      }
    }, 0);
  }, []);

  const addRecentSelection = useCallback((selection: BasicNode) => {
    console.log("Adding recent selection:", selection);
    setRecentSelections((prevSelections) => {
      const newSelections = [selection, ...prevSelections.filter(s => s.id !== selection.id)];
      const limitedSelections = newSelections.slice(0, MAX_RECENT_SELECTIONS);
      saveToStorage(limitedSelections);
      return limitedSelections;
    });
  }, [saveToStorage]);

  const removeRecentSelection = useCallback((id: string) => {
    setRecentSelections((prevSelections) => {
      const newSelections = prevSelections.filter(s => s.id !== id);
      saveToStorage(newSelections);
      return newSelections;
    });
  }, [saveToStorage]);

  return { recentSelections, addRecentSelection, removeRecentSelection };
}