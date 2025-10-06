export type Mode = 'explore' | 'collection'
export type View = 'artists' | 'genres'
export type Scope = `${Mode}:${View}`

export const scopes: Scope[] = [
  'explore:artists',
  'explore:genres',
  'collection:artists',
  'collection:genres',
]

export type ControlKey = 'clusterMode' | 'sizeBy' | 'layoutStrength' | 'samplingMode' | 'sortBy' | 'sortDirection'

export type ControlOption = {
  value: string
  label: string
  hint?: string
}

export type SelectControlDef = {
  kind: 'select'
  key: Exclude<ControlKey, 'layoutStrength'>
  label: string
  optionsByScope: Partial<Record<Scope, ControlOption[]>>
  defaultByScope: Partial<Record<Scope, string>>
}

export type SliderControlDef = {
  kind: 'slider'
  key: 'layoutStrength'
  label: string
  min: number
  max: number
  step: number
  defaultByScope: Partial<Record<Scope, number>>
}

export type ControlDef = SelectControlDef | SliderControlDef

export const controlDefs: ControlDef[] = [
  {
    kind: 'select',
    key: 'clusterMode',
    label: 'Cluster By',
    optionsByScope: {
      'explore:artists': [
        { value: 'genre', label: 'Genre families' },
        { value: 'community', label: 'Community detection' },
      ],
      'explore:genres': [
        { value: 'hierarchy', label: 'Genre hierarchy' },
        { value: 'modularity', label: 'Modularity' },
      ],
      'collection:artists': [
        { value: 'taste-zones', label: 'Taste zones' },
        { value: 'similar', label: 'Similar listeners' },
      ],
      'collection:genres': [
        { value: 'taste-zones', label: 'Taste zones' },
        { value: 'modularity', label: 'Modularity' },
      ],
    },
    defaultByScope: {
      'explore:artists': 'community',
      'explore:genres': 'hierarchy',
      'collection:artists': 'taste-zones',
      'collection:genres': 'taste-zones',
    },
  },
  {
    kind: 'select',
    key: 'sizeBy',
    label: 'Node Size',
    optionsByScope: {
      'explore:artists': [
        { value: 'popularity', label: 'Popularity score' },
        { value: 'followers', label: 'Followers' },
      ],
      'explore:genres': [
        { value: 'artist-count', label: 'Artist count' },
      ],
      'collection:artists': [
        { value: 'affinity', label: 'Affinity weight' },
        { value: 'recentness', label: 'Recent plays' },
      ],
      'collection:genres': [
        { value: 'affinity', label: 'Affinity weight' },
      ],
    },
    defaultByScope: {
      'explore:artists': 'popularity',
      'explore:genres': 'artist-count',
      'collection:artists': 'affinity',
      'collection:genres': 'affinity',
    },
  },
  {
    kind: 'select',
    key: 'samplingMode',
    label: 'Sampling Mode',
    optionsByScope: {
      'explore:artists': [
        { value: 'balanced', label: 'Balanced sampling' },
        { value: 'aggressive-depth', label: 'Aggressive depth' },
        { value: 'conservative', label: 'Conservative breadth' },
      ],
      'explore:genres': [
        { value: 'breadth', label: 'Breadth first' },
        { value: 'root-focused', label: 'Root-focused' },
      ],
      'collection:artists': [
        { value: 'taste-weighted', label: 'Taste weighted' },
        { value: 'discovery-heavy', label: 'Discovery heavy' },
        { value: 'recent-adds', label: 'Recent additions' },
      ],
      'collection:genres': [
        { value: 'taste-weighted', label: 'Taste weighted' },
        { value: 'influence-trails', label: 'Influence trails' },
      ],
    },
    defaultByScope: {
      'explore:artists': 'balanced',
      'explore:genres': 'breadth',
      'collection:artists': 'taste-weighted',
      'collection:genres': 'taste-weighted',
    },
  },
  {
    kind: 'select',
    key: 'sortBy',
    label: 'Sort Nodes By',
    optionsByScope: {
      'explore:artists': [
        { value: 'popularity', label: 'Popularity' },
        { value: 'followers', label: 'Followers' },
        { value: 'recent', label: 'Recent activity' },
        { value: 'alphabetical', label: 'A → Z' },
      ],
      'explore:genres': [
        { value: 'artist-count', label: 'Artist count' },
        { value: 'popularity', label: 'Popularity' },
        { value: 'alphabetical', label: 'A → Z' },
      ],
      'collection:artists': [
        { value: 'affinity', label: 'Affinity score' },
        { value: 'similarity', label: 'Similarity boost' },
        { value: 'recent', label: 'Recently saved' },
      ],
      'collection:genres': [
        { value: 'affinity', label: 'Affinity score' },
        { value: 'listeners', label: 'Listener share' },
      ],
    },
    defaultByScope: {
      'explore:artists': 'popularity',
      'explore:genres': 'artist-count',
      'collection:artists': 'affinity',
      'collection:genres': 'affinity',
    },
  },
  {
    kind: 'select',
    key: 'sortDirection',
    label: 'Sort Order',
    optionsByScope: {
      'explore:artists': [
        { value: 'desc', label: 'Descending' },
        { value: 'asc', label: 'Ascending' },
      ],
      'explore:genres': [
        { value: 'desc', label: 'Descending' },
        { value: 'asc', label: 'Ascending' },
      ],
      'collection:artists': [
        { value: 'desc', label: 'Descending' },
        { value: 'asc', label: 'Ascending' },
      ],
      'collection:genres': [
        { value: 'desc', label: 'Descending' },
        { value: 'asc', label: 'Ascending' },
      ],
    },
    defaultByScope: {
      'explore:artists': 'desc',
      'explore:genres': 'desc',
      'collection:artists': 'desc',
      'collection:genres': 'desc',
    },
  },
  {
    kind: 'slider',
    key: 'layoutStrength',
    label: 'Layout strength',
    min: -200,
    max: 200,
    step: 10,
    defaultByScope: {
      'explore:artists': 30,
      'explore:genres': 10,
      'collection:artists': 20,
      'collection:genres': 15,
    },
  },
]

export function getControlDef(key: ControlKey) {
  return controlDefs.find(def => def.key === key)
}
