import { controlDefs, Scope } from './controlSchema'
import type { ScopedStore } from './scopedControls'

export type ScopeChange =
  | { type: 'hidden'; label: string; detail?: string }
  | { type: 'added'; label: string; detail?: string }
  | { type: 'fallback'; label: string; detail?: string }
  | { type: 'unavailable'; label: string; detail?: string }

export function computeScopeChanges(
  prevScope: Scope,
  nextScope: Scope,
  store: ScopedStore,
): ScopeChange[] {
  if (prevScope === nextScope) return []

  const changes: ScopeChange[] = []

  for (const def of controlDefs) {
    if (def.kind === 'slider') continue

    const prevOptions = def.optionsByScope?.[prevScope] ?? []
    const nextOptions = def.optionsByScope?.[nextScope] ?? []

    if (nextOptions.length === 0) {
      changes.push({
        type: 'unavailable',
        label: def.label,
        detail: 'Not configured for this view',
      })
      continue
    }

    const gone = prevOptions.filter(
      prev => !nextOptions.some(next => next.value === prev.value),
    )
    gone.forEach(opt =>
      changes.push({
        type: 'hidden',
        label: opt.label,
        detail: `${def.label} only in ${scopeLabel(prevScope)}`,
      }),
    )

    const added = nextOptions.filter(
      next => !prevOptions.some(prev => prev.value === next.value),
    )
    added.forEach(opt =>
      changes.push({
        type: 'added',
        label: opt.label,
        detail: `${def.label} now available`,
      }),
    )

    const prevValue = store[prevScope]?.[def.key]
    if (typeof prevValue === 'string' && prevValue.length) {
      const stillPresent = nextOptions.some(opt => opt.value === prevValue)
      if (!stillPresent) {
        const fallbackValue = def.defaultByScope?.[nextScope]
        const fallbackLabel = fallbackValue
          ? nextOptions.find(opt => opt.value === fallbackValue)?.label
          : undefined
        changes.push({
          type: 'fallback',
          label: def.label,
          detail: fallbackLabel
            ? `Switched to ${fallbackLabel}`
            : 'Reverted to default',
        })
      }
    }
  }

  return changes
}

function scopeLabel(scope: Scope) {
  const [mode, view] = scope.split(':')
  return `${capitalize(mode)} • ${capitalize(view)}`
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
