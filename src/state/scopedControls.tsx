import { createContext, useContext, useMemo, useState } from 'react'
import {
  controlDefs,
  ControlDef,
  ControlKey,
  ControlOption,
  Scope,
  scopes,
} from './controlSchema'

type ControlValueMap = {
  clusterMode: string
  sizeBy: string
  layoutStrength: number
  samplingMode: string
  sortBy: string
  sortDirection: string
}

type ControlStore = Partial<Record<ControlKey, unknown>>
export type ScopedStore = Record<Scope, ControlStore>

type ScopedControlsContextValue = {
  store: ScopedStore
  setStore: React.Dispatch<React.SetStateAction<ScopedStore>>
}

const defaultStore = scopes.reduce<ScopedStore>((acc, scope) => {
  acc[scope] = {}
  return acc
}, {} as ScopedStore)

const ScopedControlsContext = createContext<ScopedControlsContextValue | null>(null)

export function ScopedControlsProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<ScopedStore>(defaultStore)

  return (
    <ScopedControlsContext.Provider value={{ store, setStore }}>
      {children}
    </ScopedControlsContext.Provider>
  )
}

function useScopedControlsContext() {
  const ctx = useContext(ScopedControlsContext)
  if (!ctx) {
    throw new Error('ScopedControlsProvider is missing in the component tree')
  }
  return ctx
}

export function useScopedStore() {
  return useScopedControlsContext().store
}

export function useScopedControlsState() {
  return useScopedControlsContext()
}

type ControlValue<K extends ControlKey> = ControlValueMap[K]

type ScopedControlResult<K extends ControlKey> = {
  value: ControlValue<K>
  setValue: (next: ControlValue<K>) => void
  def: ControlDef
  options?: ControlOption[]
  isUnavailable: boolean
  isFallback: boolean
  fallbackLabel?: string
}

export function useScopedControl<K extends ControlKey>(
  scope: Scope,
  key: K,
): ScopedControlResult<K> {
  const { store, setStore } = useScopedControlsContext()

  const def = useMemo(() => controlDefs.find(item => item.key === key), [key])
  if (!def) {
    throw new Error(`Unknown control key: ${key}`)
  }

  const currentScopeStore = store[scope] ?? {}
  const storedValue = currentScopeStore[key]

  if (def.kind === 'slider') {
    const defaultValue = def.defaultByScope?.[scope] ?? 0
    const value = typeof storedValue === 'number' ? storedValue : defaultValue

    const setValue = (next: ControlValue<K>) => {
      setStore(prev => ({
        ...prev,
        [scope]: {
          ...prev[scope],
          [key]: next,
        },
      }))
    }

    return {
      value: value as ControlValue<K>,
      setValue,
      def,
      isUnavailable: false,
      isFallback: false,
    }
  }

  const options = def.optionsByScope?.[scope] ?? []
  const defaultValue = def.defaultByScope?.[scope] ?? options[0]?.value
  const storedString = typeof storedValue === 'string' ? storedValue : undefined
  const isValid = storedString ? options.some(opt => opt.value === storedString) : false
  const value = (isValid ? storedString : defaultValue) as ControlValue<K>

  const setValue = (next: ControlValue<K>) => {
    setStore(prev => ({
      ...prev,
      [scope]: {
        ...prev[scope],
        [key]: next,
      },
    }))
  }

  const fallbackLabel = !isValid && storedString && options.length
    ? options.find(opt => opt.value === defaultValue)?.label
    : undefined

  return {
    value,
    setValue,
    def,
    options,
    isUnavailable: options.length === 0,
    isFallback: Boolean(storedString && !isValid),
    fallbackLabel,
  }
}
