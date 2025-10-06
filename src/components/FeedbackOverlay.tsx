import { useEffect } from 'react'
import type { Scope } from '@/state/controlSchema'
import type { ScopeChange } from '@/state/scopeChanges'

const SYMBOL: Record<ScopeChange['type'], string> = {
  hidden: '⚠︎',
  added: '＋',
  fallback: '↺',
  unavailable: 'ⓘ',
}

export function FeedbackOverlay({
  scope,
  changes,
  visible,
  onClose,
  timeout = 2200,
}: {
  scope: Scope
  changes: ScopeChange[]
  visible: boolean
  onClose: () => void
  timeout?: number
}) {
  useEffect(() => {
    if (!visible) return
    if (!changes.length) return

    const id = window.setTimeout(onClose, timeout)
    return () => window.clearTimeout(id)
  }, [visible, timeout, onClose, changes.length])

  if (!visible || !changes.length) return null

  const [mode, view] = scope.split(':')

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[min(320px,90vw)] -translate-x-1/2 rounded-lg bg-zinc-900/95 px-4 py-3 text-sm text-zinc-50 shadow-lg ring-1 ring-black/40">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
        <span>Scope updated</span>
        <span>{capitalize(mode)} • {capitalize(view)}</span>
      </div>
      <ul className="mt-2 space-y-1">
        {changes.slice(0, 3).map((change, idx) => (
          <li key={`${change.type}-${idx}`} className="flex items-start gap-2">
            <span aria-hidden className="mt-0.5 text-lg leading-none">{SYMBOL[change.type]}</span>
            <span>
              {change.label}
              {change.detail ? <span className="text-zinc-400"> — {change.detail}</span> : null}
            </span>
          </li>
        ))}
      </ul>
      {changes.length > 3 ? (
        <div className="mt-2 text-xs text-zinc-400">+{changes.length - 3} more adjustments</div>
      ) : null}
    </div>
  )
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
