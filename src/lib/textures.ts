import * as THREE from 'three'

const cache = new Map<string, THREE.Texture>()
const inflight = new Map<string, Promise<THREE.Texture>>()

function drawOrb(
  ctx: CanvasRenderingContext2D,
  hue: number,
  label: string,
) {
  const g = ctx.createRadialGradient(100, 90, 8, 128, 128, 118)
  g.addColorStop(0, `hsl(${hue} 85% 72%)`)
  g.addColorStop(0.45, `hsl(${hue} 70% 46%)`)
  g.addColorStop(1, `hsl(${(hue + 40) % 360} 55% 16%)`)
  ctx.clearRect(0, 0, 256, 256)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(128, 128, 118, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.beginPath()
  ctx.arc(96, 90, 28, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.font = '700 22px Outfit, Syne, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const text = label.length > 12 ? `${label.slice(0, 11)}…` : label
  ctx.fillText(text, 128, 138)
}

function proceduralTexture(title: string, hue: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  drawOrb(ctx, hue, title)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function hashHue(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function loadWithTextureLoader(url: string, timeoutMs: number): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')

    const timer = window.setTimeout(() => {
      reject(new Error('texture timeout'))
    }, timeoutMs)

    loader.load(
      url,
      (tex) => {
        window.clearTimeout(timer)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.generateMipmaps = false
        tex.needsUpdate = true
        resolve(tex)
      },
      undefined,
      () => {
        window.clearTimeout(timer)
        reject(new Error('texture error'))
      },
    )
  })
}

async function resolveTexture(opts: {
  id: string
  title: string
  thumbUrl: string
  hue?: number
}): Promise<THREE.Texture> {
  const hue = opts.hue ?? hashHue(opts.title) % 360
  const url = opts.thumbUrl

  if (!url || url.startsWith('/demo/')) {
    // Demo SVGs: TextureLoader handles SVG unevenly — procedural is fine for demo
    if (url.startsWith('/demo/')) {
      try {
        return await loadWithTextureLoader(url, 3000)
      } catch {
        return proceduralTexture(opts.title, hue)
      }
    }
    return proceduralTexture(opts.title, hue)
  }

  // Try primary URL, then one retry (Wikimedia can be flaky)
  const attempts = [url]
  if (url.startsWith('/api/img/')) {
    attempts.push(`https://upload.wikimedia.org${url.slice('/api/img'.length)}`)
  }

  for (const attempt of attempts) {
    for (let n = 0; n < 2; n++) {
      try {
        return await loadWithTextureLoader(attempt, 12000)
      } catch {
        /* retry / next candidate */
      }
    }
  }

  return proceduralTexture(opts.title, hue)
}

export function loadItemTexture(opts: {
  id: string
  title: string
  thumbUrl: string
  hue?: number
}): Promise<THREE.Texture> {
  const key = `${opts.id}::${opts.thumbUrl}`
  const hit = cache.get(key)
  if (hit) return Promise.resolve(hit)

  const pending = inflight.get(key)
  if (pending) return pending

  const promise = resolveTexture(opts)
    .then((tex) => {
      cache.set(key, tex)
      return tex
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}

export async function loadItemTextures(
  items: { id: string; title: string; thumbUrl: string; hue?: number }[],
  concurrency = 6,
): Promise<Map<string, THREE.Texture>> {
  const map = new Map<string, THREE.Texture>()
  let i = 0

  async function worker() {
    while (i < items.length) {
      const idx = i++
      const item = items[idx]
      const tex = await loadItemTexture(item)
      map.set(item.id, tex)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, () =>
      worker(),
    ),
  )
  return map
}

export function clearTextureCache() {
  for (const tex of cache.values()) tex.dispose()
  cache.clear()
  inflight.clear()
}
