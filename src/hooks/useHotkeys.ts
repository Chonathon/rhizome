import { useEffect } from 'react';

export type UseZoomHotkeysOptions = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  enabled?: boolean;
};

function isEditableTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = (t.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable === true;
}

export default function useHotkeys(opts: UseZoomHotkeysOptions, deps: any[] = []) {
  const { onZoomIn, onZoomOut, enabled = true } = opts;
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      // Avoid clashing with browser zoom
      if (e.ctrlKey || e.metaKey) return;

      const k = e.key;
      const code = e.code;

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
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
