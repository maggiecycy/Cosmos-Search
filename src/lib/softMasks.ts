import * as THREE from 'three'

/** Soft circular alpha — feathers photo edges like a sticker glow */
let softAlpha: THREE.CanvasTexture | null = null
export function getSoftCircleAlpha(): THREE.CanvasTexture {
  if (softAlpha) return softAlpha
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(128, 128, 78, 128, 128, 126)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.62, 'rgba(255,255,255,1)')
  g.addColorStop(0.82, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.94, 'rgba(255,255,255,0.12)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  softAlpha = new THREE.CanvasTexture(canvas)
  softAlpha.needsUpdate = true
  return softAlpha
}

/** Soft annular glow for water ripples — visible but not hard-edged */
let softRipple: THREE.CanvasTexture | null = null
export function getSoftRippleTexture(): THREE.CanvasTexture {
  if (softRipple) return softRipple
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 256, 256)

  // Soft bright band with feathered inner/outer falloff
  const ring = ctx.createRadialGradient(128, 128, 55, 128, 128, 118)
  ring.addColorStop(0, 'rgba(255,255,255,0)')
  ring.addColorStop(0.38, 'rgba(255,255,255,0)')
  ring.addColorStop(0.52, 'rgba(255,255,255,0.15)')
  ring.addColorStop(0.64, 'rgba(255,255,255,0.85)')
  ring.addColorStop(0.74, 'rgba(255,255,255,0.35)')
  ring.addColorStop(0.88, 'rgba(255,255,255,0.08)')
  ring.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = ring
  ctx.fillRect(0, 0, 256, 256)

  softRipple = new THREE.CanvasTexture(canvas)
  softRipple.needsUpdate = true
  return softRipple
}
