import { useEffect, useState } from 'react'
import { AmbientAudio } from './components/AmbientAudio'
import { Breadcrumb } from './components/Breadcrumb'
import { CosmosScene } from './components/canvas/CosmosScene'
import { DetailCard } from './components/DetailCard'
import { HeroSearch } from './components/HeroSearch'
import { HudControls } from './components/HudControls'
import { useUiStore } from './i18n/uiStore'
import { useCosmosStore } from './store/cosmosStore'

export default function App() {
  const initFromUrl = useCosmosStore((s) => s.initFromUrl)
  const phase = useCosmosStore((s) => s.phase)
  const texturesReady = useCosmosStore((s) => s.texturesReady)
  const locale = useUiStore((s) => s.locale)
  const t = useUiStore((s) => s.t)
  const active = phase !== 'idle'
  const [hintIdx, setHintIdx] = useState(0)

  const msg = t()
  const waiting =
    phase === 'loading' ||
    phase === 'focusing' ||
    (active && !texturesReady && phase !== 'collapsing')

  useEffect(() => {
    initFromUrl()
  }, [initFromUrl])

  useEffect(() => {
    if (!waiting) return
    const id = window.setInterval(() => {
      setHintIdx((i) => (i + 1) % msg.loadingHints.length)
    }, 1600)
    return () => window.clearInterval(id)
  }, [waiting, msg.loadingHints.length, locale])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#01040c]">
      <CosmosScene />
      <AmbientAudio />

      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 48%, rgba(1,4,12,0.4) 100%)',
        }}
      />

      <HudControls />
      <HeroSearch />
      <Breadcrumb />
      <DetailCard />

      {waiting && (
        <p className="pointer-events-none absolute bottom-10 left-1/2 z-20 -translate-x-1/2 animate-pulse text-xs tracking-widest text-cyan-200/85">
          {phase === 'focusing' ? msg.focusing : msg.loadingHints[hintIdx]}
        </p>
      )}

      {active && !waiting && phase === 'orbiting' && (
        <p className="pointer-events-none absolute bottom-9 left-1/2 z-10 -translate-x-1/2 text-[11px] tracking-wide text-slate-500">
          {msg.dragHint}
        </p>
      )}

      <footer className="pointer-events-auto absolute bottom-3 left-4 z-20 max-w-[14rem] text-[10px] leading-relaxed text-slate-500 sm:bottom-4">
        {msg.footer}
      </footer>
    </div>
  )
}
