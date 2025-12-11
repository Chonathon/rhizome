import { useEffect, useState } from 'react';

export type UseZoomHotkeysOptions = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onOpenFind?: () => void;
  enabled?: boolean;
};

export type UseHotkeysReturn = {
  isCommandHeld: boolean;
  isOptionHeld: boolean;
};

function isEditableTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = (t.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable === true;
}

export default function useHotkeys(opts: UseZoomHotkeysOptions, deps: any[] = []): UseHotkeysReturn {
  const { onZoomIn, onZoomOut, onOpenFind, enabled = true } = opts;
  const [isCommandHeld, setIsCommandHeld] = useState(false);
  const [isOptionHeld, setIsOptionHeld] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Track command/ctrl key state
      if (e.metaKey || e.ctrlKey) {
        setIsCommandHeld(true);
      }
      // Track option/alt key state
      if (e.altKey) {
        setIsOptionHeld(true);
      }

      if (isEditableTarget(e.target)) return;

      // Avoid clashing with browser zoom
      if (e.ctrlKey || e.metaKey) return;

      const k = e.key;
      const code = e.code;

      if ((k === '/' || k === '?') && onOpenFind) {
        e.preventDefault();
        onOpenFind();
        return;
      }
      if (k === '=' || k === '+' || code === 'NumpadAdd') {
        e.preventDefault();
        onZoomIn();
        return;
      }
      if (k === '-' || k === '_' || code === 'NumpadSubtract') {
        e.preventDefault();
        onZoomOut();
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') {
        setIsCommandHeld(false);
      }
      if (e.key === 'Alt') {
        setIsOptionHeld(false);
      }
    };

    // Handle focus loss - reset state when window loses focus
    const handleBlur = () => {
      setIsCommandHeld(false);
      setIsOptionHeld(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { isCommandHeld, isOptionHeld };
}
