import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useEffect } from 'react'
import { useCosmosStore } from '../../store/cosmosStore'

type OrbitLike = {
  enabled: boolean
  target: { set: (x: number, y: number, z: number) => void; x: number; y: number; z: number }
  update: () => void
}

/** Camera eases home during collapse/explode — no separate focusing zoom. */
export function CameraRig() {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls) as OrbitLike | null
  const phase = useCosmosStore((s) => s.phase)

  useEffect(() => {
    if (!controls) return
    if (phase !== 'collapsing' && phase !== 'exploding' && phase !== 'orbiting') return

    const tweens: gsap.core.Tween[] = []
    const homeZ = Math.sign(camera.position.z || 1) * 14

    if (phase === 'collapsing' || phase === 'exploding') {
      controls.enabled = false
      const proxy = {
        tx: controls.target.x,
        ty: controls.target.y,
        tz: controls.target.z,
        cx: camera.position.x,
        cy: camera.position.y,
        cz: camera.position.z,
      }
      const dur = phase === 'collapsing' ? 0.65 : 0.95
      tweens.push(
        gsap.to(proxy, {
          tx: 0,
          ty: 0,
          tz: 0,
          cx: phase === 'collapsing' ? camera.position.x * 0.75 : 0,
          cy: phase === 'collapsing' ? THREE_lerp(camera.position.y, 0.6, 0.35) : 0.6,
          cz: phase === 'collapsing' ? THREE_lerp(camera.position.z, homeZ, 0.35) : homeZ,
          duration: dur,
          ease: phase === 'collapsing' ? 'power2.in' : 'power3.out',
          onUpdate: () => {
            camera.position.set(proxy.cx, proxy.cy, proxy.cz)
            camera.lookAt(proxy.tx, proxy.ty, proxy.tz)
            controls.target.set(proxy.tx, proxy.ty, proxy.tz)
            controls.update()
          },
        }),
      )
    }

    if (phase === 'orbiting') {
      tweens.push(
        gsap.to(controls.target, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.3,
          ease: 'power2.out',
          onUpdate: () => controls.update(),
          onComplete: () => {
            controls.enabled = true
          },
        }),
      )
    }

    return () => {
      tweens.forEach((t) => t.kill())
    }
  }, [phase, controls, camera])

  return null
}

function THREE_lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}
