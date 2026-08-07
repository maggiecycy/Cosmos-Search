import { create } from 'zustand'
import type {
  CenterSnapshot,
  CosmosItem,
  CosmosPhase,
  SearchResult,
  WorldPos,
} from '../lib/types'
import { sanitizeExploreQuery } from '../lib/proxy'
import { loadItemTextures } from '../lib/textures'
import { searchCosmos } from '../lib/wiki'
import { prefersReducedMotion } from '../lib/layout'

interface CosmosState {
  phase: CosmosPhase
  query: string
  items: CosmosItem[]
  source: 'wiki' | 'demo' | null
  selectedId: string | null
  centerStack: CenterSnapshot[]
  autoRotate: boolean
  reducedMotion: boolean
  error: string | null
  notice: string | null
  explosionEpoch: number
  itemPositions: Record<string, WorldPos>
  focusTarget: WorldPos | null
  texturesReady: boolean

  initFromUrl: () => void
  setAutoRotate: (v: boolean) => void
  setItemPositions: (map: Record<string, WorldPos>) => void
  setTexturesReady: (v: boolean) => void
  clearNotice: () => void
  search: (q: string, opts?: { pushHistory?: boolean }) => Promise<void>
  select: (id: string | null) => void
  exploreFrom: (item: CosmosItem) => Promise<void>
  goBack: () => Promise<void>
  jumpToHistory: (stackIndex: number) => void
  goHome: () => void
  setPhase: (phase: CosmosPhase) => void
}

function syncUrl(query: string) {
  const url = new URL(window.location.href)
  if (query) url.searchParams.set('q', query)
  else url.searchParams.delete('q')
  window.history.replaceState({}, '', url.toString())
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

async function preloadTextures(items: CosmosItem[]) {
  try {
    await loadItemTextures(
      items.map((item) => ({
        id: item.id,
        title: item.title,
        thumbUrl: item.thumbUrl,
        hue: item.hue,
      })),
      8,
    )
  } catch {
    /* ImageSphere will retry */
  }
}

export const useCosmosStore = create<CosmosState>((set, get) => ({
  phase: 'idle',
  query: '',
  items: [],
  source: null,
  selectedId: null,
  centerStack: [],
  autoRotate: true,
  reducedMotion: prefersReducedMotion(),
  error: null,
  notice: null,
  explosionEpoch: 0,
  itemPositions: {},
  focusTarget: null,
  texturesReady: true,

  initFromUrl: () => {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) void get().search(q)
  },

  setAutoRotate: (v) => set({ autoRotate: v }),

  setPhase: (phase) => set({ phase }),

  setItemPositions: (map) => set({ itemPositions: map }),

  setTexturesReady: (v) => set({ texturesReady: v }),

  clearNotice: () => set({ notice: null }),

  select: (id) => set({ selectedId: id }),

  search: async (q, opts) => {
    const query = q.trim()
    if (!query) return

    const { query: prevQuery, items, source, centerStack } = get()
    const pushHistory = opts?.pushHistory ?? false

    set({
      phase: 'loading',
      selectedId: null,
      focusTarget: null,
      texturesReady: false,
      error: null,
      notice: null,
      query,
    })

    try {
      const result = await searchCosmos(query)
      await applyResult(result, {
        pushHistory,
        prevQuery,
        prevItems: items,
        prevSource: source,
        centerStack,
      })
    } catch (e) {
      set({
        phase: 'idle',
        error: e instanceof Error ? e.message : 'searchFailed',
      })
    }
  },

  exploreFrom: async (item) => {
    const raw = item.exploreQuery ?? item.title
    const next = sanitizeExploreQuery(raw, item.title)
    const reduced = get().reducedMotion

    const {
      query: prevQuery,
      items: prevItems,
      source: prevSource,
      centerStack,
    } = get()

    // Prefetch in parallel with a single smooth collapse (no focusing → collapsing hitch)
    const searchPromise = searchCosmos(next).then(async (result) => {
      await preloadTextures(result.items)
      return result
    })

    set({
      selectedId: item.id,
      focusTarget: null,
      phase: 'collapsing',
      notice: null,
      error: null,
    })

    const collapseMs = reduced ? 120 : 680

    try {
      const [result] = await Promise.all([searchPromise, wait(collapseMs)])
      set({ selectedId: null })
      await applyResult(result, {
        pushHistory: true,
        prevQuery,
        prevItems,
        prevSource,
        centerStack,
        displayQuery: next,
      })
    } catch (e) {
      set({
        phase: 'orbiting',
        error: e instanceof Error ? e.message : 'searchFailed',
        selectedId: null,
        focusTarget: null,
      })
    }
  },

  goBack: async () => {
    const { centerStack } = get()
    if (centerStack.length === 0) return
    get().jumpToHistory(centerStack.length - 1)
  },

  /** Jump to a past center by index in centerStack (0 = oldest). */
  jumpToHistory: (stackIndex: number) => {
    const { centerStack } = get()
    if (stackIndex < 0 || stackIndex >= centerStack.length) return
    const target = centerStack[stackIndex]
    const rest = centerStack.slice(0, stackIndex)

    set({
      phase: get().reducedMotion ? 'orbiting' : 'exploding',
      query: target.query,
      items: target.items,
      source: target.source,
      centerStack: rest,
      selectedId: null,
      focusTarget: null,
      explosionEpoch: get().explosionEpoch + 1,
      error: null,
      notice: null,
      texturesReady: true,
    })
    syncUrl(target.query)
  },

  goHome: () => {
    set({
      phase: 'idle',
      query: '',
      items: [],
      source: null,
      selectedId: null,
      focusTarget: null,
      centerStack: [],
      error: null,
      notice: null,
      texturesReady: true,
      itemPositions: {},
    })
    syncUrl('')
  },
}))

async function applyResult(
  result: SearchResult,
  opts: {
    pushHistory: boolean
    prevQuery: string
    prevItems: CosmosItem[]
    prevSource: 'wiki' | 'demo' | null
    centerStack: CenterSnapshot[]
    displayQuery?: string
  },
) {
  const query = opts.displayQuery ?? result.query
  const nextStack =
    opts.pushHistory && opts.prevQuery && opts.prevItems.length > 0
      ? [
          ...opts.centerStack,
          {
            query: opts.prevQuery,
            items: opts.prevItems,
            source: opts.prevSource ?? 'demo',
          },
        ]
      : opts.centerStack

  const nextPhase = useCosmosStore.getState().reducedMotion ? 'orbiting' : 'exploding'
  useCosmosStore.setState({
    items: result.items,
    source: result.source,
    centerStack: nextStack,
    phase: nextPhase,
    query,
    explosionEpoch: useCosmosStore.getState().explosionEpoch + 1,
    itemPositions: {},
    selectedId: null,
    focusTarget: null,
    texturesReady: true,
    error: result.items.length === 0 ? 'empty' : null,
    notice: result.usedFallback ? 'demoFallback' : null,
  })
  syncUrl(query)

  if (nextPhase === 'exploding') {
    window.setTimeout(() => {
      if (useCosmosStore.getState().phase === 'exploding') {
        useCosmosStore.setState({ phase: 'orbiting' })
      }
    }, 12000)
  }

  if (result.usedFallback) {
    window.setTimeout(() => {
      if (useCosmosStore.getState().notice === 'demoFallback') {
        useCosmosStore.setState({ notice: null })
      }
    }, 8000)
  }
}

if (typeof window !== 'undefined') {
  ;(window as unknown as { __COSMOS__: typeof useCosmosStore }).__COSMOS__ =
    useCosmosStore
}
