import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useCosmosStore } from '../../store/cosmosStore'

function ExpandingRipple({
  delay,
  color,
  maxScale = 6,
}: {
  delay: number
  color: string
  maxScale?: number
}) {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const mesh = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!mesh.current || !mat.current) return
    const t = (clock.elapsedTime * 0.55 + delay) % 1
    mesh.current.scale.setScalar(0.4 + t * maxScale)
    mat.current.opacity = (1 - t) * 0.55
  })

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.85, 0.98, 64]} />
      <meshBasicMaterial
        ref={mat}
        color={color}
        transparent
        opacity={0.4}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function OrbitSparks({ count = 28 }: { count?: number }) {
  const group = useRef<THREE.Group>(null)
  const offsets = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        a: (i / count) * Math.PI * 2,
        r: 1.5 + (i % 5) * 0.4,
        y: ((i % 3) - 1) * 0.45,
        s: 0.045 + (i % 4) * 0.012,
      })),
    [count],
  )

  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.rotation.y = clock.elapsedTime * 1.05
    group.current.rotation.x = Math.sin(clock.elapsedTime * 0.45) * 0.3
  })

  return (
    <group ref={group}>
      {offsets.map((o, i) => (
        <mesh key={i} position={[Math.cos(o.a) * o.r, o.y, Math.sin(o.a) * o.r]}>
          <sphereGeometry args={[o.s, 8, 8]} />
          <meshBasicMaterial
            color={i % 2 ? '#67e8f9' : '#fde68a'}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  )
}

/** Keeps the center alive while searching / focusing / preloading textures. */
export function SearchRitual() {
  const phase = useCosmosStore((s) => s.phase)
  const texturesReady = useCosmosStore((s) => s.texturesReady)
  const items = useCosmosStore((s) => s.items)

  const waitingTextures =
    items.length > 0 &&
    !texturesReady &&
    (phase === 'exploding' || phase === 'orbiting')

  const show =
    phase === 'loading' ||
    phase === 'focusing' ||
    phase === 'collapsing' ||
    waitingTextures

  const core = useRef<THREE.Mesh>(null)
  const labelPulse = useRef(0)

  useFrame(({ clock }) => {
    labelPulse.current = clock.elapsedTime
    if (!core.current) return
    const pulse = 1 + Math.sin(clock.elapsedTime * 3.4) * 0.14
    core.current.scale.setScalar(pulse)
  })

  if (!show) return null

  return (
    <group>
      <mesh ref={core}>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshBasicMaterial color="#fef3c7" transparent opacity={0.92} />
      </mesh>
      <ExpandingRipple delay={0} color="#67e8f9" maxScale={8} />
      <ExpandingRipple delay={0.33} color="#a5f3fc" maxScale={8} />
      <ExpandingRipple delay={0.66} color="#fbbf24" maxScale={7} />
      <OrbitSparks count={32} />
    </group>
  )
}
