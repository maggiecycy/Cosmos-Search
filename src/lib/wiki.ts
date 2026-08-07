import type { CosmosItem, SearchResult } from './types'
import { searchDemo } from './demo'
import { maxItemCount } from './layout'
import {
  buildQueryCandidates,
  commonsApiBase,
  detectWikiLang,
  normalizeImageUrl,
  sanitizeExploreQuery,
  wikiApiBase,
  type WikiLang,
} from './proxy'

interface WikiPage {
  pageid: number
  title: string
  index?: number
  extract?: string
  fullurl?: string
  thumbnail?: { source?: string; width?: number; height?: number }
  original?: { source?: string }
  imageinfo?: Array<{
    thumburl?: string
    url?: string
    user?: string
    extmetadata?: Record<string, { value?: string }>
    mime?: string
  }>
}

interface WikiQueryResponse {
  query?: { pages?: Record<string, WikiPage> }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Wikipedia timeout')), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function wikiFetch(url: string): Promise<WikiQueryResponse> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Wiki HTTP ${res.status}`)
  return (await res.json()) as WikiQueryResponse
}

/** MediaWiki only returns ~20 extracts per request — fetch in chunks. */
async function fetchExtracts(
  pageids: number[],
  lang: WikiLang,
): Promise<Map<number, string>> {
  const map = new Map<number, string>()
  const chunkSize = 20

  for (let i = 0; i < pageids.length; i += chunkSize) {
    const chunk = pageids.slice(i, i + chunkSize)
    const params = new URLSearchParams({
      action: 'query',
      pageids: chunk.join('|'),
      prop: 'extracts',
      exintro: '1',
      explaintext: '1',
      exlimit: 'max',
      format: 'json',
      origin: '*',
    })
    try {
      const data = await wikiFetch(`${wikiApiBase(lang)}/w/api.php?${params}`)
      for (const p of Object.values(data.query?.pages ?? {})) {
        if (p.extract) map.set(p.pageid, p.extract.slice(0, 320))
      }
    } catch {
      /* keep going */
    }
  }

  return map
}

function pageToItem(
  page: WikiPage,
  score: number,
  lang: WikiLang,
  extract?: string,
): CosmosItem | null {
  const rawThumb = page.thumbnail?.source ?? page.original?.source
  if (!rawThumb) return null

  const thumbUrl = normalizeImageUrl(rawThumb)
  const fullUrl = normalizeImageUrl(page.original?.source ?? rawThumb)

  return {
    id: `wiki-${lang}-${page.pageid}`,
    title: page.title,
    thumbUrl,
    fullUrl,
    description: (extract ?? page.extract ?? '').slice(0, 320),
    sourcePageUrl:
      page.fullurl ??
      `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
    author: 'Wikipedia contributors',
    license: 'CC BY-SA 4.0',
    score,
    exploreQuery: sanitizeExploreQuery(page.title, page.title),
  }
}

async function searchWikipediaPages(
  query: string,
  limit: number,
  lang: WikiLang,
): Promise<CosmosItem[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: String(Math.min(Math.max(limit * 2, 40), 50)),
    gsrnamespace: '0',
    prop: 'pageimages|info',
    piprop: 'thumbnail|original',
    pithumbsize: '400',
    inprop: 'url',
    format: 'json',
    origin: '*',
  })

  const data = await wikiFetch(`${wikiApiBase(lang)}/w/api.php?${params}`)
  const pages = Object.values(data.query?.pages ?? {})
  pages.sort((a, b) => (a.index ?? 999) - (b.index ?? 999))

  const withThumbs = pages.filter((p) => p.thumbnail?.source)
  const extracts = await fetchExtracts(
    withThumbs.map((p) => p.pageid),
    lang,
  )

  return withThumbs
    .map((p, i) =>
      pageToItem(p, 1 - i / Math.max(withThumbs.length, 1), lang, extracts.get(p.pageid)),
    )
    .filter((x): x is CosmosItem => x !== null)
    .slice(0, limit)
}

/** Commons file search — denser real photos when article pageimages are sparse. */
async function searchCommonsFiles(
  query: string,
  limit: number,
): Promise<CosmosItem[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(Math.min(limit, 40)),
    prop: 'imageinfo',
    iiprop: 'url|user|extmetadata|size|mime',
    iiurlwidth: '400',
    format: 'json',
    origin: '*',
  })

  const data = await wikiFetch(`${commonsApiBase()}/w/api.php?${params}`)
  const pages = Object.values(data.query?.pages ?? {})
  pages.sort((a, b) => (a.index ?? 999) - (b.index ?? 999))

  const items: CosmosItem[] = []
  for (const [i, page] of pages.entries()) {
    const info = page.imageinfo?.[0]
    const thumb = info?.thumburl ?? info?.url
    if (!thumb) continue
    const mime = info?.mime ?? ''
    if (mime && !mime.startsWith('image/')) continue

    const meta = info?.extmetadata ?? {}
    const license =
      meta.LicenseShortName?.value?.replace(/<[^>]+>/g, '') ?? 'Wikimedia'
    const artist =
      meta.Artist?.value?.replace(/<[^>]+>/g, '').slice(0, 80) ??
      info?.user ??
      'Wikimedia Commons'
    const desc =
      meta.ImageDescription?.value?.replace(/<[^>]+>/g, '').slice(0, 320) ??
      page.title.replace(/^File:/, '')

    const rawTitle = page.title.replace(/^File:/, '').replace(/\.[^.]+$/, '')
    items.push({
      id: `commons-${page.pageid}`,
      title: rawTitle,
      thumbUrl: normalizeImageUrl(thumb),
      fullUrl: normalizeImageUrl(info?.url ?? thumb),
      description: desc,
      sourcePageUrl:
        page.fullurl ??
        `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
      author: artist,
      license,
      score: 0.85 - (i / Math.max(pages.length, 1)) * 0.4,
      exploreQuery: sanitizeExploreQuery(rawTitle, query),
    })
    if (items.length >= limit) break
  }
  return items
}

function mergeItems(primary: CosmosItem[], extra: CosmosItem[], limit: number): CosmosItem[] {
  const seen = new Set(primary.map((i) => i.thumbUrl))
  const titles = new Set(primary.map((i) => i.title.toLowerCase()))
  const out = [...primary]
  for (const item of extra) {
    if (out.length >= limit) break
    if (seen.has(item.thumbUrl)) continue
    if (titles.has(item.title.toLowerCase())) continue
    out.push(item)
    seen.add(item.thumbUrl)
    titles.add(item.title.toLowerCase())
  }
  return out.slice(0, limit)
}

function wikiLangFallbackOrder(primary: WikiLang): WikiLang[] {
  if (primary === 'en') return ['en']
  if (primary === 'ja') return ['ja', 'en']
  // CJK (incl. kanji-only Japanese titles like 富嶽三十六景)
  return ['zh', 'ja', 'en']
}

async function searchLive(query: string, limit: number): Promise<SearchResult> {
  const primary = detectWikiLang(query)
  const langs = wikiLangFallbackOrder(primary)

  const commonsPromise = withTimeout(
    searchCommonsFiles(query, Math.ceil(limit * 0.75)),
    8000,
  ).catch(() => [] as CosmosItem[])

  let wikiItems: CosmosItem[] = []
  for (const lang of langs) {
    wikiItems = await withTimeout(
      searchWikipediaPages(query, limit, lang),
      8000,
    ).catch(() => [] as CosmosItem[])
    if (wikiItems.length >= 6) break
  }

  const commonsItems = await commonsPromise

  let items = mergeItems(wikiItems, commonsItems, limit)

  if (wikiItems.length < 8 && commonsItems.length > wikiItems.length) {
    items = mergeItems(commonsItems, wikiItems, limit)
  }

  if (items.length < 4) throw new Error('Too few images')

  return { query, items, source: 'wiki' }
}

export async function searchCosmos(query: string): Promise<SearchResult> {
  const q = query.trim()
  if (!q) {
    const demo = await searchDemo('cosmos')
    return { ...demo, usedFallback: true }
  }

  const limit = maxItemCount()
  const candidates = buildQueryCandidates(q)

  for (const candidate of candidates) {
    try {
      const result = await searchLive(candidate, limit)
      // Keep the user-facing breadcrumb as the original explore term when possible,
      // but search used the successful candidate.
      return { ...result, query: candidate }
    } catch {
      /* try next shorter candidate */
    }
  }

  const demo = await searchDemo(q)
  return { ...demo, usedFallback: true }
}
