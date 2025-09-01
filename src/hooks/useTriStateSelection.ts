import { useEffect, useMemo, useState } from "react";

export type TriState = "unchecked" | "indeterminate" | "checked";

interface Options<T extends { id: string }>
  extends Partial<{
    bulkToggleChildren: boolean;
    onParentSelect: (parent: T) => void;
    onParentDeselect: (parent: T) => void;
    onChildClick: (child: T, parent: T) => void;
    initialParentSelected: Record<string, boolean>;
    initialSelectedChildren: Record<string, Set<string>>;
  }> {}

export function useTriStateSelection<T extends { id: string }>(
  parents: T[],
  getChildren: (parent: T) => T[],
  options: Options<T> = {}
) {
  const {
    bulkToggleChildren = true,
    onParentSelect,
    onParentDeselect,
    onChildClick,
    initialParentSelected,
    initialSelectedChildren,
  } = options;

  const [parentSelected, setParentSelected] = useState<Record<string, boolean>>(
    () => initialParentSelected ?? {}
  );
  const [selectedChildren, setSelectedChildren] = useState<
    Record<string, Set<string>>
  >(() => initialSelectedChildren ?? {});

  // Keep state keys in sync with incoming parents, preserving existing picks
  useEffect(() => {
    setParentSelected((prev) => {
      const next: Record<string, boolean> = {};
      for (const p of parents) next[p.id] = prev[p.id] ?? false;
      return next;
    });
    setSelectedChildren((prev) => {
      const next: Record<string, Set<string>> = {};
      for (const p of parents) next[p.id] = prev[p.id] ?? new Set<string>();
      return next;
    });
  }, [parents]);

  const getParentState = (parent: T): TriState => {
    const children = getChildren(parent);
    const sel = selectedChildren[parent.id] ?? new Set<string>();
    const isParent = parentSelected[parent.id] ?? false;
    if (!isParent) return "unchecked";
    if (sel.size === children.length || sel.size === 0) return "checked";
    return "indeterminate";
  };

  const toggleParent = (parent: T) => {
    const children = getChildren(parent);
    const currentlySelected = parentSelected[parent.id] ?? false;
    const nextSelected = !currentlySelected;

    setParentSelected((prev) => ({ ...prev, [parent.id]: nextSelected }));

    // Optionally bulk select/deselect children when parent toggles
    if (bulkToggleChildren) {
      setSelectedChildren((prev) => {
        const copy = { ...prev };
        copy[parent.id] = new Set<string>(
          nextSelected ? children.map((c) => c.id) : []
        );
        return copy;
      });
    }

    if (nextSelected) onParentSelect?.(parent);
    else onParentDeselect?.(parent);
  };

  const toggleChild = (parent: T, child: T) => {
    let newSize = 0;
    setSelectedChildren((prev) => {
      const copy = { ...prev };
      const set = new Set<string>(copy[parent.id] ?? []);
      if (set.has(child.id)) set.delete(child.id);
      else set.add(child.id);
      copy[parent.id] = set;
      newSize = set.size;
      return copy;
    });

    // If any child is selected, ensure the parent is marked selected.
    if (newSize > 0) {
      setParentSelected((prev) => ({ ...prev, [parent.id]: true }));
    }

    onChildClick?.(child, parent);
  };

  return {
    parentSelected,
    selectedChildren,
    setParentSelected,
    setSelectedChildren,
    getParentState,
    toggleParent,
    toggleChild,
  } as const;
}

