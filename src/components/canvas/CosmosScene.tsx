import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useCosmosStore } from '../../store/cosmosStore'
import { CameraRig } from './CameraRig'
import { ImageSphere } from './ImageSphere'
import { SearchRitual } from './SearchRitual'
import { SpaceBackground } from './SpaceBackground'

function SceneContents() {
  const phase = useCosmosStore((s) => s.phase)
  const autoRotate = useCosmosStore((s) => s.autoRotate)
  const active =
    phase === 'orbiting' || phase === 'exploding'

  return (
    <>
      <SpaceBackground />
      <SearchRitual />
      <ImageSphere />
      <CameraRig />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.85}
        zoomSpeed={0.85}
        minDistance={6}
        maxDistance={22}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI - 0.25}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
        autoRotate={active && autoRotate && phase === 'orbiting'}
        autoRotateSpeed={0.45}
        enabled={active}
      />
    </>
  )
}

export function CosmosScene() {
  return (
    <div className="absolute inset-0 z-0 touch-none">
      <Canvas
        frameloop="always"
        camera={{ position: [0, 0.6, 14], fov: 48, near: 0.1, far: 220 }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#01040c')
        }}
      >
        <SceneContents />
      </Canvas>
    </div>
  )
}
