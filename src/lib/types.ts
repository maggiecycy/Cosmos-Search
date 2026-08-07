export interface CosmosItem {
  id: string
  title: string
  thumbUrl: string
  fullUrl?: string
  description?: string
  sourcePageUrl: string
  author?: string
  license: string
  score?: number
  /** Used in demo mode to pick the next catalog when re-exploring */
  exploreQuery?: string
  hue?: number
}

export interface SearchResult {
  query: string
  items: CosmosItem[]
  source: 'wiki' | 'demo'
  /** True when live Wiki/Commons failed or returned too few images */
  usedFallback?: boolean
}

export interface CenterSnapshot {
  query: string
  items: CosmosItem[]
  source: 'wiki' | 'demo'
}

export type CosmosPhase =
  | 'idle'
  | 'loading'
  | 'exploding'
  | 'orbiting'
  | 'focusing'
  | 'collapsing'

export interface WorldPos {
  x: number
  y: number
  z: number
}
