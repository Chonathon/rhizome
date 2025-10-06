import { Fragment } from 'react'
import { controlDefs, Scope } from '@/state/controlSchema'
import { useScopedControl } from '@/state/scopedControls'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

export function ScopeControlPanel({ scope }: { scope: Scope }) {
  return (
    <div className="w-full space-y-5">
      {controlDefs.map(def => (
        <Fragment key={def.key}>
          {def.kind === 'select' ? (
            <SelectField scope={scope} definition={def} />
          ) : (
            <SliderField scope={scope} />
          )}
        </Fragment>
      ))}
    </div>
  )
}

function SelectField({
  scope,
  definition,
}: {
  scope: Scope
  definition: Extract<typeof controlDefs[number], { kind: 'select' }>
}) {
  const { value, setValue, options, isUnavailable, isFallback, fallbackLabel } =
    useScopedControl(scope, definition.key)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          {definition.label}
        </Label>
        {isFallback && fallbackLabel ? (
          <span className="text-xs text-muted-foreground">Fallback to {fallbackLabel}</span>
        ) : null}
      </div>
      {isUnavailable || !options?.length ? (
        <div className="rounded-md border border-dashed border-muted-foreground/30 px-3 py-2 text-xs text-muted-foreground">
          Not available for this scope
        </div>
      ) : (
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger size="sm" className="w-full justify-between">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
      )}
    </div>
  )
}

function SliderField({ scope }: { scope: Scope }) {
  const { value, setValue, def } = useScopedControl(scope, 'layoutStrength')

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          {def.label}
        </Label>
        <span className="text-xs text-muted-foreground">{value}</span>
      </div>
      <Slider
        value={[value]}
        min={def.min}
        max={def.max}
        step={def.step}
        onValueChange={values => {
          const next = Array.isArray(values) && values.length ? values[0] : value
          setValue(next)
        }}
      />
    </div>
  )
}
