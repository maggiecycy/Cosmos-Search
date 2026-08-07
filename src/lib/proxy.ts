/** Wikimedia URL helpers — prefer direct CORS; proxy only when explicitly enabled. */

const UPLOAD_HOST = 'upload.wikimedia.org'

export type WikiLang = 'en' | 'zh' | 'ja'

/**
 * Proxy is OFF by default.
 * Set VITE_USE_PROXY=true only if you have working vercel/local rewrites.
 */
export function useProxy(): boolean {
  return import.meta.env.VITE_USE_PROXY === 'true'
}

export function detectWikiLang(query: string): WikiLang {
  // Hiragana / Katakana → Japanese Wikipedia
  if (/[\u3040-\u30ff]/.test(query)) return 'ja'
  if (/[\u4e00-\u9fff]/.test(query)) return 'zh'
  return 'en'
}

export function wikiApiBase(lang: WikiLang = 'en'): string {
  if (useProxy()) return `/api/wiki/${lang}`
  return `https://${lang}.wikipedia.org`
}

export function commonsApiBase(): string {
  if (useProxy()) return '/api/wiki/commons'
  return 'https://commons.wikimedia.org'
}

/** Strip utm_* tracking; optionally rewrite through /api/img. */
export function normalizeImageUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl)
    ;[...u.searchParams.keys()].forEach((k) => {
      if (k.startsWith('utm_')) u.searchParams.delete(k)
    })

    if (u.hostname !== UPLOAD_HOST) return u.toString()
    if (!useProxy()) return u.toString()
    return `/api/img${u.pathname}${u.search}`
  } catch {
    return rawUrl
  }
}

/** Keep explore queries short / searchable so the next search stays on-topic. */
export function sanitizeExploreQuery(raw: string, fallback: string): string {
  let q = raw
    .replace(/^File:/i, '')
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const candidates = buildQueryCandidates(q)
  // Prefer a compact entity name (e.g. "Bob Marley") over concert-specific titles
  const preferred =
    candidates.find((c) => c.split(' ').length === 2 && c.length <= 36) ??
    candidates.find((c) => {
      const words = c.split(' ').length
      return words >= 1 && words <= 3 && c.length <= 36
    }) ??
    candidates[0]

  q = preferred ?? q
  if (q.length > 40) q = q.slice(0, 40).trim()
  return q || fallback
}

/**
 * Progressive query shortenings — specific titles often have few pageimages;
 * broader entity names (e.g. "Bob Marley") usually have many.
 * Order: full → no year → 3 words → 2 words → 1 word
 */
export function buildQueryCandidates(query: string): string[] {
  const raw = query.replace(/\s+/g, ' ').trim()
  if (!raw) return []

  const out: string[] = []
  const push = (s: string) => {
    const t = s.replace(/\s+/g, ' ').trim()
    if (t && !out.includes(t)) out.push(t)
  }

  push(raw)

  const noYear = raw.replace(/\b(19|20)\d{2}\b/g, ' ').replace(/\s+/g, ' ').trim()
  push(noYear)

  const words = noYear.split(' ').filter(Boolean)
  if (words.length > 3) push(words.slice(0, 3).join(' '))
  if (words.length > 2) push(words.slice(0, 2).join(' '))
  if (words.length > 1) push(words[0])

  return out
}

