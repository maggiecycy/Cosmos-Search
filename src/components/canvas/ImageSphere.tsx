import { Billboard } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import gsap from 'gsap'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react'
import * as THREE from 'three'
import { layoutSphereItems } from '../../lib/layout'
import { getSoftCircleAlpha, getSoftRippleTexture } from '../../lib/softMasks'
import { loadItemTextures } from '../../lib/textures'
import type { CosmosItem } from '../../lib/types'
import { useCosmosStore } from '../../store/cosmosStore'

/**
 * Soft water ripples — selected = stronger pulse; burst = click splash.
 */
function SoftRipples({
  radius,
  intense = false,
  burstRef,
}: {
  radius: number
  intense?: boolean
  /** 0–1 click splash; mutated by parent each frame */
  burstRef: MutableRefObject<number>
}) {
  const sprites = useRef<(THREE.Sprite | null)[]>([])
  const mats = useRef<(THREE.SpriteMaterial | null)[]>([])
  const map = useMemo(() => getSoftRippleTexture(), [])
  const count = 4

  useFrame(({ clock }) => {
    const burst = burstRef.current
    const speed = intense ? 0.42 : 0.2
    const maxBoost = intense ? 1.85 : 1.15
    const peakOp = intense ? 0.52 : 0.26
    const burstBoost = burst * 1.4
    const burstOp = burst * 0.55

    for (let i = 0; i < count; i++) {
      const sp = sprites.current[i]
      const mat = mats.current[i]
      if (!sp || !mat) continue
      const t = (clock.elapsedTime * speed + i / count) % 1
      const ease = 1 - (1 - t) * (1 - t)
      const s = radius * 2.15 * (1 + ease * (maxBoost + burstBoost))
      sp.scale.set(s, s, 1)
      mat.opacity = Math.pow(1 - ease, 1.2) * (peakOp + burstOp)
      if (mat.color) {
        mat.color.set(intense || burst > 0.15 ? '#a5f3fc' : '#7dd3fc')
      }
    }
  })

  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            sprites.current[i] = el
          }}
          scale={[radius * 2.2, radius * 2.2, 1]}
        >
          <spriteMaterial
            ref={(el) => {
              mats.current[i] = el
            }}
            map={map}
            color="#7dd3fc"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  )
}

interface ImageNodeProps {
  item: CosmosItem
  target: THREE.Vector3
  baseScale: number
  selected: boolean
  reducedMotion: boolean
  epoch: number
  collapsing: boolean
  focusing: boolean
  focusTarget: { x: number; y: number; z: number } | null
  index: number
  total: number
  texture: THREE.Texture
  onSelect: (id: string) => void
}

function ImageNode({
  item,
  target,
  baseScale,
  selected,
  reducedMotion,
  epoch,
  collapsing,
  focusing,
  focusTarget,
  index,
  total,
  texture,
  onSelect,
}: ImageNodeProps) {
  const group = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const selectedRef = useRef(selected)
  const radius = 0.78 * baseScale
  const softAlpha = useMemo(() => getSoftCircleAlpha(), [])
  const burstRef = useRef(0)

  selectedRef.current = selected

  useLayoutEffect(() => {
    const g = group.current
    if (!g || collapsing || focusing) return
    if (reducedMotion) {
      g.position.copy(target)
      g.scale.setScalar(1)
    }
  }, [target, reducedMotion, collapsing, focusing, epoch])

  // Explosion / focus / collapse — MUST NOT depend on `selected` alone,
  // or a single click re-runs the explode path (snap to origin → fly out).
  useEffect(() => {
    const g = group.current
    if (!g) return

    gsap.killTweensOf(g.position)
    gsap.killTweensOf(g.scale)
    if (matRef.current) gsap.killTweensOf(matRef.current)

    const markOrbiting = () => {
      if (index === total - 1 && useCosmosStore.getState().phase === 'exploding') {
        useCosmosStore.getState().setPhase('orbiting')
      }
    }

    const isSelected = selectedRef.current

    // Single smooth collapse — no mid waypoint (avoids the double hitch)
    if (collapsing) {
      const dur = 0.62
      const delay = Math.min(index * 0.004, 0.08)
      gsap.to(g.position, {
        x: 0,
        y: 0,
        z: 0,
        duration: dur,
        delay,
        ease: 'power2.in',
      })
      gsap.to(g.scale, {
        x: isSelected ? 0.06 : 0.02,
        y: isSelected ? 0.06 : 0.02,
        z: isSelected ? 0.06 : 0.02,
        duration: dur,
        delay,
        ease: 'power2.in',
      })
      if (matRef.current) {
        gsap.to(matRef.current, {
          opacity: 0,
          duration: dur * 0.85,
          delay: delay + 0.1,
          ease: 'power1.in',
        })
      }
      return
    }

    // focusing kept for compatibility but explore no longer uses it
    if (focusing) {
      if (isSelected) {
        gsap.to(g.scale, { x: 1.12, y: 1.12, z: 1.12, duration: 0.5, ease: 'power2.out' })
      } else {
        gsap.to(g.scale, { x: 0.85, y: 0.85, z: 0.85, duration: 0.5, ease: 'power2.out' })
        if (matRef.current) gsap.to(matRef.current, { opacity: 0.55, duration: 0.4 })
      }
      return
    }

    if (reducedMotion) {
      g.position.copy(target)
      g.scale.setScalar(1)
      if (matRef.current) matRef.current.opacity = 1
      markOrbiting()
      return
    }

    g.position.set(0, 0, 0)
    g.scale.setScalar(0.04)
    if (matRef.current) matRef.current.opacity = 1

    const delay = index * 0.012 + (index % 7) * 0.006
    gsap.to(g.position, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: 1.55,
      delay,
      ease: 'power3.out',
      onComplete: markOrbiting,
    })
    gsap.to(g.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.35,
      delay,
      ease: 'power2.out',
    })
  }, [
    epoch,
    collapsing,
    focusing,
    focusTarget,
    reducedMotion,
    target,
    index,
    total,
  ])

  // Click / select: ripple burst only — stay in place
  useEffect(() => {
    burstRef.current = selected ? 1 : 0
  }, [selected])

  useFrame(({ clock }, delta) => {
    if (burstRef.current > 0) {
      burstRef.current = Math.max(0, burstRef.current - delta * 0.85)
    }

    const g = group.current
    if (!g || !selected || collapsing || focusing) return
    // Gentle breathe — never rewrite position
    const s = 1 + Math.sin(clock.elapsedTime * 2.2) * 0.025
    g.scale.setScalar(s)
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect(item.id)
  }

  const onDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    void useCosmosStore.getState().exploreFrom(item)
  }

  return (
    <group ref={group} position={reducedMotion ? target.toArray() : undefined}>
      <Billboard follow>
        <mesh
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onPointerOver={() => {
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          <circleGeometry args={[radius, 64]} />
          <meshBasicMaterial
            ref={matRef}
            map={texture}
            alphaMap={softAlpha}
            transparent
            toneMapped={false}
            depthWrite={false}
            opacity={1}
            color={selected ? '#f0fdff' : '#ffffff'}
          />
        </mesh>
        <SoftRipples radius={radius} intense={selected} burstRef={burstRef} />
      </Billboard>
    </group>
  )
}

export function ImageSphere() {
  const items = useCosmosStore((s) => s.items)
  const phase = useCosmosStore((s) => s.phase)
  const selectedId = useCosmosStore((s) => s.selectedId)
  const select = useCosmosStore((s) => s.select)
  const reducedMotion = useCosmosStore((s) => s.reducedMotion)
  const epoch = useCosmosStore((s) => s.explosionEpoch)
  const focusTarget = useCosmosStore((s) => s.focusTarget)
  const setItemPositions = useCosmosStore((s) => s.setItemPositions)
  const setTexturesReady = useCosmosStore((s) => s.setTexturesReady)

  /** Committed frame — keep last sphere until new textures are ready (no blank hitch). */
  const [pack, setPack] = useState<{
    items: CosmosItem[]
    textures: Map<string, THREE.Texture>
    epoch: number
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!items.length) {
      setPack(null)
      setTexturesReady(true)
      return
    }

    if (phase === 'loading') setTexturesReady(false)

    void loadItemTextures(
      items.map((item) => ({
        id: item.id,
        title: item.title,
        thumbUrl: item.thumbUrl,
        hue: item.hue,
      })),
      8,
    ).then((map) => {
      if (cancelled) return
      setPack({ items, textures: map, epoch })
      setTexturesReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [items, epoch, phase, setTexturesReady])

  const layout = useMemo(
    () => layoutSphereItems(pack?.items ?? []),
    [pack],
  )

  const targets = useMemo(() => {
    const map = new Map<string, { pos: THREE.Vector3; scale: number }>()
    const posRecord: Record<string, { x: number; y: number; z: number }> = {}
    for (const item of pack?.items ?? []) {
      const p = layout.get(item.id)
      if (p) {
        map.set(item.id, {
          pos: new THREE.Vector3(p.x, p.y, p.z),
          scale: p.scale,
        })
        posRecord[item.id] = { x: p.x, y: p.y, z: p.z }
      }
    }
    return { map, posRecord }
  }, [pack, layout])

  useEffect(() => {
    // Publish positions for the currently displayed pack
    if (pack && pack.epoch === epoch) setItemPositions(targets.posRecord)
  }, [targets, setItemPositions, pack, epoch])

  const waiting = phase === 'loading' && !pack
  if (waiting) return null
  if (!pack || phase === 'idle') return null

  const collapsing = phase === 'collapsing'
  const focusing = phase === 'focusing'
  // While new center textures load, freeze on previous pack (still collapsing visually)
  const live = pack.epoch === epoch
  const showCollapsing = collapsing || (!live && phase === 'exploding')
  const showFocusing = focusing && live

  return (
    <group
      onPointerMissed={() => {
        if (selectedId) select(null)
      }}
    >
      {pack.items.map((item, i) => {
        const entry = targets.map.get(item.id)
        const texture = pack.textures.get(item.id)
        if (!entry || !texture) return null
        return (
          <ImageNode
            key={`${item.id}-${pack.epoch}`}
            item={item}
            target={entry.pos}
            baseScale={entry.scale}
            selected={live && selectedId === item.id}
            reducedMotion={reducedMotion}
            epoch={pack.epoch}
            collapsing={showCollapsing}
            focusing={showFocusing}
            focusTarget={focusTarget}
            index={i}
            total={pack.items.length}
            texture={texture}
            onSelect={select}
          />
        )
      })}
    </group>
  )
}
