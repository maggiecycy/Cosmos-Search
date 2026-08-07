import { Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

function glowTexture(
  inner: string,
  mid: string,
  size = 256,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2)
  g.addColorStop(0, inner)
  g.addColorStop(0.35, mid)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

function streakTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 32, 256, 32)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(0.35, 'rgba(186,230,253,0.15)')
  g.addColorStop(0.7, 'rgba(224,242,254,0.85)')
  g.addColorStop(1, 'rgba(255,255,255,0.95)')
  ctx.fillStyle = g
  ctx.fillRect(0, 20, 256, 24)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

function NebulaPatch({
  position,
  scale,
  colorA,
  colorB,
  drift = 0.02,
}: {
  position: [number, number, number]
  scale: [number, number, number]
  colorA: string
  colorB: string
  drift?: number
}) {
  const mat = useRef<THREE.SpriteMaterial>(null)
  const texture = useMemo(() => glowTexture(colorA, colorB, 256), [colorA, colorB])
  useFrame(({ clock }) => {
    if (mat.current) {
      mat.current.opacity = 0.22 + Math.sin(clock.elapsedTime * drift * 20 + position[0]) * 0.06
    }
  })
  return (
    <sprite position={position} scale={scale}>
      <spriteMaterial
        ref={mat}
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.28}
      />
    </sprite>
  )
}

function NebulaGlow() {
  const mat = useRef<THREE.SpriteMaterial>(null)
  const texture = useMemo(
    () => glowTexture('rgba(103,232,249,0.55)', 'rgba(56,189,248,0.2)'),
    [],
  )
  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = 0.3 + Math.sin(clock.elapsedTime * 0.35) * 0.08
  })
  return (
    <sprite scale={[18, 18, 1]}>
      <spriteMaterial
        ref={mat}
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.34}
      />
    </sprite>
  )
}

function WarmCore() {
  const mat = useRef<THREE.SpriteMaterial>(null)
  const texture = useMemo(
    () => glowTexture('rgba(255,240,200,0.95)', 'rgba(251,191,36,0.35)', 128),
    [],
  )
  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = 0.5 + Math.sin(clock.elapsedTime * 1.1) * 0.15
  })
  return (
    <sprite scale={[2.6, 2.6, 1]}>
      <spriteMaterial
        ref={mat}
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  )
}

/** Soft drifting cosmic dust */
function DustField({ count = 700 }: { count?: number }) {
  const points = useRef<THREE.Points>(null)
  const geo = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 6 + Math.random() * 48
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [count])

  useFrame((_, delta) => {
    if (!points.current) return
    points.current.rotation.y += delta * 0.012
    points.current.rotation.x += delta * 0.003
  })

  return (
    <points ref={points} geometry={geo}>
      <pointsMaterial
        size={0.055}
        color="#a5f3fc"
        transparent
        opacity={0.5}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

/** Sparse larger motes — full azimuth belt */
function AsteroidMotes({ count = 80 }: { count?: number }) {
  const group = useRef<THREE.Group>(null)
  const motes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2
      const r = 15 + (i % 7) * 1.2
      return {
        pos: [
          Math.sin(a) * r,
          ((i % 5) - 2) * 1.4,
          Math.cos(a) * r,
        ] as [number, number, number],
        s: 0.04 + (i % 4) * 0.03,
        color: i % 3 === 0 ? '#94a3b8' : '#64748b',
      }
    })
  }, [count])

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.04
  })

  return (
    <group ref={group}>
      {motes.map((m, i) => (
        <mesh key={i} position={m.pos}>
          <dodecahedronGeometry args={[m.s, 0]} />
          <meshStandardMaterial color={m.color} roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
    </group>
  )
}

function DistantPlanet({
  position,
  color,
  size,
  speed = 0.02,
}: {
  position: [number, number, number]
  color: string
  size: number
  speed?: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * speed
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[size, 24, 24]} />
      <meshStandardMaterial
        color={color}
        roughness={0.85}
        metalness={0.05}
        emissive={color}
        emissiveIntensity={0.1}
      />
    </mesh>
  )
}

function RingedPlanet({
  position,
  size,
}: {
  position: [number, number, number]
  size: number
}) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.025
  })
  return (
    <group ref={group} position={position} rotation={[0.4, 0.2, 0.1]}>
      <mesh>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color="#d4a574"
          roughness={0.7}
          emissive="#c4854a"
          emissiveIntensity={0.08}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <ringGeometry args={[size * 1.35, size * 2.1, 64]} />
        <meshBasicMaterial
          color="#e8c9a0"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function Moon({
  position,
  size = 0.55,
}: {
  position: [number, number, number]
  size?: number
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color="#cbd5e1" roughness={1} emissive="#94a3b8" emissiveIntensity={0.05} />
    </mesh>
  )
}

/** Comet with trail */
function Comet({ seed = 0, period = 18 }: { seed?: number; period?: number }) {
  const group = useRef<THREE.Group>(null)
  const trail = useMemo(
    () => glowTexture('rgba(200,240,255,0.95)', 'rgba(103,232,249,0.2)', 64),
    [],
  )

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = ((clock.elapsedTime * 0.14 + seed) % period) / period
    const angle = t * Math.PI * 2
    const r = 20 + seed * 2.5
    group.current.position.set(
      Math.cos(angle) * r,
      Math.sin(angle * 1.35) * 7 + seed * 0.4,
      Math.sin(angle) * r * 0.5 - 6,
    )
    group.current.lookAt(0, 0, 0)
  })

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <sprite scale={[3.4, 0.65, 1]} position={[0, 0, 1]}>
        <spriteMaterial
          map={trail}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.8}
        />
      </sprite>
    </group>
  )
}

/** Fast shooting star — brief streak across view */
function ShootingStar({ delay = 0, interval = 9 }: { delay?: number; interval?: number }) {
  const ref = useRef<THREE.Sprite>(null)
  const mat = useRef<THREE.SpriteMaterial>(null)
  const map = useMemo(() => streakTexture(), [])
  const state = useRef({ t: delay })

  useFrame((_, delta) => {
    if (!ref.current || !mat.current) return
    state.current.t += delta
    const cycle = state.current.t % interval
    if (cycle > 1.1) {
      mat.current.opacity = 0
      return
    }
    const u = cycle / 1.1
    const x = -28 + u * 56 + delay * 2
    const y = 12 - u * 18 + Math.sin(delay) * 3
    const z = -20
    ref.current.position.set(x, y, z)
    ref.current.scale.set(6 + u * 4, 0.35, 1)
    mat.current.opacity = Math.sin(u * Math.PI) * 0.85
    ref.current.material.rotation = -0.45
  })

  return (
    <sprite ref={ref} scale={[8, 0.4, 1]}>
      <spriteMaterial
        ref={mat}
        map={map}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0}
      />
    </sprite>
  )
}

/** Faint milky-way band across the far sky */
function GalaxyBand() {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, 512, 0)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(0.25, 'rgba(148,163,184,0.08)')
    g.addColorStop(0.5, 'rgba(186,230,253,0.22)')
    g.addColorStop(0.75, 'rgba(148,163,184,0.08)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 512, 128)
    const v = ctx.createRadialGradient(256, 64, 10, 256, 64, 70)
    v.addColorStop(0, 'rgba(255,255,255,0.25)')
    v.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = v
    ctx.fillRect(0, 0, 512, 128)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = 0.35 + Math.sin(clock.elapsedTime * 0.15) * 0.05
  })

  return (
    <mesh position={[0, 8, -55]} rotation={[0.15, 0.4, 0.35]}>
      <planeGeometry args={[90, 18]} />
      <meshBasicMaterial
        ref={mat}
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.35}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/** Twin suns — slow binary orbit */
function BinaryStar({
  position,
}: {
  position: [number, number, number]
}) {
  const group = useRef<THREE.Group>(null)
  const glow = useMemo(
    () => glowTexture('rgba(255,250,220,0.95)', 'rgba(251,191,36,0.25)', 128),
    [],
  )
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.35
  })
  return (
    <group position={position}>
      <group ref={group}>
        <mesh position={[1.1, 0, 0]}>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshBasicMaterial color="#fde68a" />
        </mesh>
        <mesh position={[-1.1, 0.15, 0]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial color="#fdba74" />
        </mesh>
      </group>
      <sprite scale={[6, 6, 1]}>
        <spriteMaterial
          map={glow}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.55}
        />
      </sprite>
    </group>
  )
}

/** Pulsing civilization beacon */
function EnergyBeacon({
  position,
}: {
  position: [number, number, number]
}) {
  const beam = useRef<THREE.Mesh>(null)
  const tip = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    const p = 0.55 + Math.sin(clock.elapsedTime * 2.4) * 0.35
    if (beam.current) {
      beam.current.scale.y = 0.8 + p * 0.6
      const mat = beam.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.15 + p * 0.35
    }
    if (tip.current) tip.current.emissiveIntensity = 0.4 + p * 0.8
  })
  return (
    <group position={position}>
      <mesh>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          ref={tip}
          color="#67e8f9"
          emissive="#22d3ee"
          emissiveIntensity={0.6}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
      <mesh ref={beam} position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.04, 0.18, 7, 8]} />
        <meshBasicMaterial color="#a5f3fc" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Orbiting habitat ring (mega-structure silhouette) */
function HabitatRing({
  position,
  radius = 3.2,
}: {
  position: [number, number, number]
  radius?: number
}) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.z += delta * 0.08
  })
  return (
    <group position={position} rotation={[0.6, 0.3, 0.1]}>
      <group ref={group}>
        <mesh>
          <torusGeometry args={[radius, 0.06, 8, 64]} />
          <meshStandardMaterial
            color="#94a3b8"
            emissive="#38bdf8"
            emissiveIntensity={0.25}
            metalness={0.7}
            roughness={0.35}
          />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * radius, Math.sin(a) * radius, 0]}
              rotation={[0, 0, a]}
            >
              <boxGeometry args={[0.35, 0.12, 0.12]} />
              <meshStandardMaterial color="#cbd5e1" emissive="#67e8f9" emissiveIntensity={0.15} />
            </mesh>
          )
        })}
      </group>
      <mesh>
        <sphereGeometry args={[0.55, 20, 20]} />
        <meshStandardMaterial
          color="#1e3a5f"
          emissive="#0ea5e9"
          emissiveIntensity={0.2}
          roughness={0.6}
        />
      </mesh>
    </group>
  )
}

/** Tiny satellites circling a planet */
function SatelliteSwarm({
  center,
  count = 5,
}: {
  center: [number, number, number]
  count?: number
}) {
  const group = useRef<THREE.Group>(null)
  const sats = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        r: 2.2 + (i % 3) * 0.45,
        speed: 0.4 + i * 0.12,
        phase: (i / count) * Math.PI * 2,
        y: ((i % 3) - 1) * 0.35,
      })),
    [count],
  )
  const refs = useRef<(THREE.Mesh | null)[]>([])

  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = clock.elapsedTime * 0.05
    sats.forEach((s, i) => {
      const m = refs.current[i]
      if (!m) return
      const a = clock.elapsedTime * s.speed + s.phase
      m.position.set(Math.cos(a) * s.r, s.y + Math.sin(a * 1.7) * 0.15, Math.sin(a) * s.r)
    })
  })

  return (
    <group ref={group} position={center}>
      {sats.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
        >
          <boxGeometry args={[0.12, 0.06, 0.18]} />
          <meshStandardMaterial color="#e2e8f0" emissive="#38bdf8" emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

/** Drifting light ships / probes — full azimuth orbits */
function ProbeFleet({ seed = 0 }: { seed?: number }) {
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime * 0.08 + seed
    // Orbit in XZ around origin so every side sees traffic
    group.current.position.set(
      Math.sin(t) * 20,
      3 + Math.sin(t * 1.3) * 4,
      Math.cos(t) * 20,
    )
    group.current.rotation.y = t + Math.PI / 2
  })
  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.55 - 0.55, (i % 2) * 0.15, 0]}>
          <coneGeometry args={[0.08, 0.35, 5]} />
          <meshBasicMaterial color="#bae6fd" />
        </mesh>
      ))}
    </group>
  )
}

/** Soft orbital light rings around center */
function OrbitHalos() {
  const a = useRef<THREE.Mesh>(null)
  const b = useRef<THREE.Mesh>(null)
  const c = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (a.current) a.current.rotation.z += delta * 0.04
    if (b.current) b.current.rotation.z -= delta * 0.025
    if (c.current) c.current.rotation.y += delta * 0.03
  })
  return (
    <group>
      <mesh ref={a} rotation={[Math.PI / 2.6, 0.2, 0]}>
        <ringGeometry args={[11.5, 11.65, 96]} />
        <meshBasicMaterial
          color="#67e8f9"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={b} rotation={[Math.PI / 3.2, -0.4, 0.3]}>
        <ringGeometry args={[14.2, 14.35, 96]} />
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.09}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={c} rotation={[1.1, 0.5, 0.2]}>
        <ringGeometry args={[17.5, 17.62, 96]} />
        <meshBasicMaterial
          color="#f0abfc"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/** Distant space station silhouette */
function SpaceStation({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.12
  })
  return (
    <group ref={group} position={position}>
      <mesh>
        <cylinderGeometry args={[0.25, 0.25, 2.2, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.4} emissive="#38bdf8" emissiveIntensity={0.15} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 3.2, 6]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[0.7, 0.35, 0.5]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#67e8f9" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[1.5, 0.2, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.9]} />
        <meshStandardMaterial color="#1e293b" emissive="#22d3ee" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[-1.5, 0.2, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.9]} />
        <meshStandardMaterial color="#1e293b" emissive="#22d3ee" emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}

/** Pulsing wormhole disc */
function Wormhole({ position }: { position: [number, number, number] }) {
  const disc = useRef<THREE.Mesh>(null)
  const glow = useMemo(
    () => glowTexture('rgba(167,139,250,0.9)', 'rgba(91,33,182,0.2)', 128),
    [],
  )
  useFrame(({ clock }) => {
    if (!disc.current) return
    disc.current.rotation.z = clock.elapsedTime * 0.6
    const s = 1 + Math.sin(clock.elapsedTime * 1.8) * 0.08
    disc.current.scale.set(s, s, 1)
  })
  return (
    <group position={position} rotation={[0.5, 0.2, 0]}>
      <mesh ref={disc}>
        <torusGeometry args={[1.6, 0.12, 12, 48]} />
        <meshBasicMaterial color="#c4b5fd" transparent opacity={0.7} />
      </mesh>
      <sprite scale={[5.5, 5.5, 1]}>
        <spriteMaterial
          map={glow}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.45}
        />
      </sprite>
    </group>
  )
}

/** Constellation — faint starlets with soft links */
function Constellation({
  seed = 0,
  position = [8, 6, 0],
}: {
  seed?: number
  position?: [number, number, number]
}) {
  const group = useRef<THREE.Group>(null)
  const pts = useMemo(() => {
    const arr: [number, number, number][] = []
    for (let i = 0; i < 7; i++) {
      const a = seed + i * 0.9
      arr.push([
        Math.cos(a) * (4 + (i % 3)),
        Math.sin(a * 1.3) * 2.5 + i * 0.3,
        -32 - (i % 4),
      ])
    }
    return arr
  }, [seed])

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.008
  })

  return (
    <group ref={group} position={position}>
      {pts.map((p, i) => {
        const next = pts[(i + 1) % pts.length]
        const mid: [number, number, number] = [
          (p[0] + next[0]) / 2,
          (p[1] + next[1]) / 2,
          (p[2] + next[2]) / 2,
        ]
        const len = Math.hypot(next[0] - p[0], next[1] - p[1], next[2] - p[2])
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(next[0] - p[0], next[1] - p[1], next[2] - p[2]).normalize(),
        )
        return (
          <group key={`link-${i}`}>
            <mesh position={mid} quaternion={quat}>
              <cylinderGeometry args={[0.012, 0.012, len, 4]} />
              <meshBasicMaterial color="#94a3b8" transparent opacity={0.28} />
            </mesh>
            <mesh position={p}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshBasicMaterial color="#e0f2fe" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/** Ice giant with thin rings */
function IceGiant({ position, size = 1.6 }: { position: [number, number, number]; size?: number }) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.03
  })
  return (
    <group ref={group} position={position} rotation={[0.25, 0, 0.15]}>
      <mesh>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color="#7dd3fc"
          roughness={0.7}
          emissive="#0ea5e9"
          emissiveIntensity={0.12}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2.2, 0, 0]}>
        <ringGeometry args={[size * 1.25, size * 1.55, 48]} />
        <meshBasicMaterial
          color="#bae6fd"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/** Soft aurora curtains */
function AuroraRibbon({
  position,
  color,
  seed = 0,
}: {
  position: [number, number, number]
  color: string
  seed?: number
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    if (!mesh.current || !mat.current) return
    const t = clock.elapsedTime * 0.25 + seed
    mesh.current.rotation.z = Math.sin(t) * 0.15
    mesh.current.position.y = position[1] + Math.sin(t * 1.3) * 1.2
    mat.current.opacity = 0.08 + Math.sin(t * 2) * 0.04
  })
  return (
    <mesh ref={mesh} position={position} rotation={[0.2, 0.4, 0]}>
      <planeGeometry args={[36, 8]} />
      <meshBasicMaterial
        ref={mat}
        color={color}
        transparent
        opacity={0.1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/** Pulsing distant beacon */
function Pulsar({
  position,
  color = '#67e8f9',
}: {
  position: [number, number, number]
  color?: string
}) {
  const core = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const p = (Math.sin(clock.elapsedTime * 3.2) + 1) * 0.5
    if (core.current) core.current.scale.setScalar(0.7 + p * 0.6)
    if (ring.current) {
      const mat = ring.current.material as THREE.MeshBasicMaterial
      ring.current.scale.setScalar(1 + p * 1.8)
      mat.opacity = 0.35 * (1 - p)
    }
  })
  return (
    <group position={position}>
      <mesh ref={core}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.42, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/** Expanding energy ripples */
function SpacePulse({
  position,
  color,
  period = 5,
  delay = 0,
}: {
  position: [number, number, number]
  color: string
  period?: number
  delay?: number
}) {
  const ring = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ring.current) return
    const t = ((clock.elapsedTime + delay) % period) / period
    ring.current.scale.setScalar(0.5 + t * 8)
    const mat = ring.current.material as THREE.MeshBasicMaterial
    mat.opacity = Math.pow(1 - t, 1.6) * 0.28
  })
  return (
    <mesh ref={ring} position={position} rotation={[0.4, 0.2, 0.1]}>
      <ringGeometry args={[1, 1.08, 48]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

/** Tiny glowing embers */
function EmberField({ count = 40 }: { count?: number }) {
  const group = useRef<THREE.Group>(null)
  const embers = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2
        return {
          x: Math.sin(a) * (12 + (i % 5)),
          y: ((i % 7) - 3) * 2.2,
          z: Math.cos(a) * (12 + (i % 4)),
          speed: 0.15 + (i % 5) * 0.05,
          phase: i * 0.7,
        }
      }),
    [count],
  )
  const refs = useRef<(THREE.Mesh | null)[]>([])

  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = clock.elapsedTime * 0.02
    embers.forEach((e, i) => {
      const m = refs.current[i]
      if (!m) return
      m.position.y = e.y + Math.sin(clock.elapsedTime * e.speed + e.phase) * 1.5
      const mat = m.material as THREE.MeshBasicMaterial
      mat.opacity = 0.25 + Math.sin(clock.elapsedTime * 2 + e.phase) * 0.2
    })
  })

  return (
    <group ref={group}>
      {embers.map((e, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          position={[e.x, e.y, e.z]}
        >
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial color="#a5f3fc" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

/** Moon orbiting a world position */
function OrbitingMoon({
  center,
  radius = 3.2,
  speed = 0.4,
  size = 0.35,
}: {
  center: [number, number, number]
  radius?: number
  speed?: number
  size?: number
}) {
  const moon = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!moon.current) return
    const a = clock.elapsedTime * speed
    moon.current.position.set(
      center[0] + Math.cos(a) * radius,
      center[1] + Math.sin(a * 0.7) * 0.4,
      center[2] + Math.sin(a) * radius,
    )
  })
  return (
    <mesh ref={moon}>
      <sphereGeometry args={[size, 12, 12]} />
      <meshStandardMaterial
        color="#cbd5e1"
        roughness={1}
        emissive="#94a3b8"
        emissiveIntensity={0.08}
      />
    </mesh>
  )
}

/** Even azimuth around Y — fills every camera orbit angle (not just -Z hemisphere). */
function aroundY(
  angleDeg: number,
  radius: number,
  y: number,
): [number, number, number] {
  const a = (angleDeg * Math.PI) / 180
  return [Math.sin(a) * radius, y, Math.cos(a) * radius]
}

const PLANET_RING: Array<{
  angle: number
  r: number
  y: number
  color: string
  size: number
  speed: number
}> = [
  { angle: 0, r: 18, y: 6, color: '#3b82f6', size: 1.8, speed: 0.015 },
  { angle: 30, r: 20, y: -5, color: '#a78bfa', size: 1.5, speed: 0.02 },
  { angle: 60, r: 17, y: 10, color: '#f87171', size: 1.2, speed: 0.03 },
  { angle: 90, r: 19, y: -8, color: '#34d399', size: 1.6, speed: 0.018 },
  { angle: 120, r: 21, y: 4, color: '#fbbf24', size: 1.1, speed: 0.04 },
  { angle: 150, r: 16, y: -11, color: '#fb7185', size: 1.3, speed: 0.025 },
  { angle: 180, r: 18, y: 8, color: '#2dd4bf', size: 1.7, speed: 0.022 },
  { angle: 210, r: 20, y: -3, color: '#c084fc', size: 1.4, speed: 0.028 },
  { angle: 240, r: 17, y: 12, color: '#60a5fa', size: 1.2, speed: 0.016 },
  { angle: 270, r: 19, y: -9, color: '#f472b6', size: 1.5, speed: 0.021 },
  { angle: 300, r: 16, y: 5, color: '#a3e635', size: 1.1, speed: 0.027 },
  { angle: 330, r: 21, y: -6, color: '#38bdf8', size: 1.6, speed: 0.019 },
]

/**
 * Full-screen cosmic stage — décor rings every azimuth so left/right stay filled as camera orbits.
 */
export function SpaceBackground() {
  const stars = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!stars.current) return
    stars.current.rotation.y += delta * 0.01
    stars.current.rotation.x += delta * 0.0025
  })

  return (
    <>
      <color attach="background" args={['#01040c']} />
      {/* Softer fog so mid-ring planets stay readable on both sides */}
      <fog attach="fog" args={['#01040c', 36, 95]} />

      <group ref={stars}>
        <Stars radius={140} depth={100} count={8000} factor={5} saturation={0} fade speed={0.45} />
        <Stars radius={80} depth={50} count={2500} factor={3.4} saturation={0.45} fade speed={0.2} />
      </group>

      <GalaxyBand />
      <DustField count={900} />
      <AsteroidMotes count={110} />
      <NebulaGlow />
      <WarmCore />
      <OrbitHalos />
      <EmberField count={48} />

      <AuroraRibbon position={aroundY(30, 34, 14)} color="#67e8f9" seed={0} />
      <AuroraRibbon position={aroundY(150, 36, -12)} color="#a78bfa" seed={1.5} />
      <AuroraRibbon position={aroundY(270, 35, 8)} color="#34d399" seed={3} />

      <Pulsar position={aroundY(55, 22, 9)} color="#67e8f9" />
      <Pulsar position={aroundY(175, 23, -7)} color="#f0abfc" />
      <Pulsar position={aroundY(295, 21, 5)} color="#fde68a" />

      <SpacePulse position={aroundY(90, 12, 0)} color="#67e8f9" period={6} delay={0} />
      <SpacePulse position={aroundY(210, 12, 0)} color="#a78bfa" period={7} delay={2} />
      <SpacePulse position={aroundY(330, 12, 0)} color="#34d399" period={5.5} delay={3.5} />

      <OrbitingMoon center={aroundY(0, 18, 6)} radius={3.4} speed={0.35} />
      <OrbitingMoon center={aroundY(180, 18, 8)} radius={2.8} speed={0.5} size={0.28} />
      <OrbitingMoon center={aroundY(90, 19, -5)} radius={3.0} speed={0.42} size={0.3} />

      {/* Constellations — 4 corners of the ring */}
      <Constellation seed={0.4} position={aroundY(45, 14, 7)} />
      <Constellation seed={2.1} position={aroundY(135, 14, 4)} />
      <Constellation seed={3.6} position={aroundY(225, 14, -6)} />
      <Constellation seed={5.2} position={aroundY(315, 14, -4)} />

      {/* Nebulae — every 60° */}
      <NebulaPatch
        position={aroundY(0, 28, 8)}
        scale={[20, 12, 1]}
        colorA="rgba(167,139,250,0.45)"
        colorB="rgba(91,33,182,0.12)"
      />
      <NebulaPatch
        position={aroundY(60, 30, -6)}
        scale={[18, 11, 1]}
        colorA="rgba(248,113,113,0.35)"
        colorB="rgba(127,29,29,0.1)"
        drift={0.015}
      />
      <NebulaPatch
        position={aroundY(120, 32, 12)}
        scale={[24, 10, 1]}
        colorA="rgba(56,189,248,0.35)"
        colorB="rgba(12,74,110,0.1)"
        drift={0.01}
      />
      <NebulaPatch
        position={aroundY(180, 28, -10)}
        scale={[20, 12, 1]}
        colorA="rgba(52,211,153,0.28)"
        colorB="rgba(6,78,59,0.08)"
        drift={0.012}
      />
      <NebulaPatch
        position={aroundY(240, 30, 6)}
        scale={[18, 11, 1]}
        colorA="rgba(251,191,36,0.28)"
        colorB="rgba(146,64,14,0.08)"
        drift={0.014}
      />
      <NebulaPatch
        position={aroundY(300, 29, -8)}
        scale={[19, 10, 1]}
        colorA="rgba(244,114,182,0.3)"
        colorB="rgba(131,24,67,0.08)"
        drift={0.011}
      />

      {/* Planets — full 360° ring (fixes one-side-empty when OrbitControls rotates) */}
      {PLANET_RING.map((p) => (
        <DistantPlanet
          key={`p-${p.angle}`}
          position={aroundY(p.angle, p.r, p.y)}
          color={p.color}
          size={p.size}
          speed={p.speed}
        />
      ))}

      <RingedPlanet position={aroundY(40, 17, -9)} size={1.9} />
      <RingedPlanet position={aroundY(220, 18, 9)} size={1.5} />
      <IceGiant position={aroundY(100, 16, -10)} size={1.4} />
      <IceGiant position={aroundY(280, 17, 7)} size={1.3} />

      <Moon position={aroundY(15, 15, 8)} size={0.4} />
      <Moon position={aroundY(95, 16, -4)} size={0.35} />
      <Moon position={aroundY(185, 15, 5)} size={0.45} />
      <Moon position={aroundY(275, 16, -7)} size={0.38} />

      <BinaryStar position={aroundY(70, 26, 11)} />
      <BinaryStar position={aroundY(250, 26, -9)} />

      <HabitatRing position={aroundY(20, 15, -2)} radius={2.4} />
      <HabitatRing position={aroundY(140, 16, 6)} radius={2.0} />
      <HabitatRing position={aroundY(260, 15, -5)} radius={2.2} />

      <EnergyBeacon position={aroundY(50, 14, -7)} />
      <EnergyBeacon position={aroundY(130, 14, 8)} />
      <EnergyBeacon position={aroundY(210, 14, -6)} />
      <EnergyBeacon position={aroundY(310, 14, 5)} />

      <SpaceStation position={aroundY(80, 13, 3)} />
      <SpaceStation position={aroundY(200, 13, -4)} />
      <SpaceStation position={aroundY(340, 12, 2)} />

      <Wormhole position={aroundY(110, 22, -12)} />
      <Wormhole position={aroundY(290, 22, 10)} />

      <SatelliteSwarm center={aroundY(0, 18, 6)} count={5} />
      <SatelliteSwarm center={aroundY(90, 19, -5)} count={5} />
      <SatelliteSwarm center={aroundY(180, 18, 8)} count={5} />
      <SatelliteSwarm center={aroundY(270, 19, -6)} count={5} />

      <ProbeFleet seed={0} />
      <ProbeFleet seed={3.1} />
      <ProbeFleet seed={6.2} />
      <ProbeFleet seed={9.4} />

      <Comet seed={0} period={20} />
      <Comet seed={2.5} period={28} />
      <Comet seed={5} period={24} />
      <Comet seed={7.2} period={36} />
      <Comet seed={9.5} period={22} />

      <ShootingStar delay={0} interval={8} />
      <ShootingStar delay={2.5} interval={11} />
      <ShootingStar delay={5} interval={9.5} />
      <ShootingStar delay={7.2} interval={13} />
      <ShootingStar delay={9} interval={10} />

      <ambientLight intensity={0.8} />
      <pointLight position={[0, 0, 0]} intensity={1.5} distance={36} color="#67e8f9" />
      <pointLight position={aroundY(70, 26, 11)} intensity={0.5} distance={40} color="#fde68a" />
      <pointLight position={aroundY(250, 26, -9)} intensity={0.45} distance={40} color="#fcd34d" />
      <directionalLight position={[-20, 10, -10]} intensity={0.28} color="#93c5fd" />
      <directionalLight position={[18, -8, 12]} intensity={0.2} color="#fda4af" />
    </>
  )
}
