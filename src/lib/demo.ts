import type { CosmosItem, SearchResult } from './types'
import { maxItemCount } from './layout'

interface DemoCatalog {
  catalogs: Record<string, CosmosItem[]>
  aliases: Record<string, string>
}

let cache: DemoCatalog | null = null

async function loadCatalog(): Promise<DemoCatalog> {
  if (cache) return cache
  const res = await fetch('/demo/items.json')
  if (!res.ok) throw new Error('Demo catalog unavailable')
  cache = (await res.json()) as DemoCatalog
  return cache
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase()
}

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function shuffleSeeded<T>(arr: T[], seed: number): T[] {
  const out = [...arr]
  let s = seed || 1
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export async function searchDemo(query: string): Promise<SearchResult> {
  const catalog = await loadCatalog()
  const key = normalizeQuery(query)
  const mapped = catalog.aliases[key] ?? key
  const limit = maxItemCount()

  let items = catalog.catalogs[mapped]
  if (!items) {
    // fuzzy: pick catalog whose key is contained in query, else default pool
    const hit = Object.keys(catalog.catalogs).find(
      (k) => key.includes(k) || k.includes(key),
    )
    items = hit ? catalog.catalogs[hit] : catalog.catalogs.default
  }

  const seeded = shuffleSeeded(items, hashSeed(key || 'cosmos'))
  return {
    query: query.trim() || 'cosmos',
    items: seeded.slice(0, limit).map((item, i) => ({
      ...item,
      id: `${item.id}-${hashSeed(key + i).toString(36)}`,
      score: item.score ?? Math.max(0.2, 1 - i / Math.max(seeded.length, 1)),
    })),
    source: 'demo',
  }
}
