import type { CosmosItem } from './types'

export interface SpherePoint {
  x: number
  y: number
  z: number
  ring: number
  scale: number
}

/** Fibonacci sphere — nearly uniform points on a unit sphere. */
export function fibonacciSphere(index: number, total: number): {
  x: number
  y: number
  z: number
} {
  const n = Math.max(total, 1)
  const i = index
  const phi = Math.acos(1 - (2 * (i + 0.5)) / n)
  const theta = Math.PI * (1 + Math.sqrt(5)) * i
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.sin(phi) * Math.sin(theta),
    z: Math.cos(phi),
  }
}

/**
 * Dense spherical cloud: one fibonacci shell + slight radial jitter.
 * Higher score → slightly closer + larger billboard.
 */
export function layoutSphereItems(
  items: CosmosItem[],
  baseRadius = 5.4,
): Map<string, SpherePoint> {
  const sorted = [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const n = sorted.length
  const result = new Map<string, SpherePoint>()

  sorted.forEach((item, i) => {
    const dir = fibonacciSphere(i, n)
    const score = item.score ?? 1 - i / Math.max(n, 1)
    // Inner bias for high score, outer shell for the rest — still one readable ball
    const radial = baseRadius * (0.72 + (1 - score) * 0.45)
    const jitter = 1 + 0.06 * Math.sin(i * 12.9898 + 78.233)
    const r = radial * jitter
    const scale = 0.85 + score * 0.55

    result.set(item.id, {
      x: dir.x * r,
      y: dir.y * r,
      z: dir.z * r,
      ring: score > 0.65 ? 0 : 1,
      scale,
    })
  })

  return result
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function maxItemCount(): number {
  if (typeof window === 'undefined') return 40
  const mobile = window.matchMedia('(max-width: 768px)').matches
  return mobile ? 28 : 40
}
