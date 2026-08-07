import { useEffect, useState } from 'react'
import { useUiStore } from '../i18n/uiStore'
import { useCosmosStore } from '../store/cosmosStore'

export function DetailCard() {
  const selectedId = useCosmosStore((s) => s.selectedId)
  const items = useCosmosStore((s) => s.items)
  const select = useCosmosStore((s) => s.select)
  const exploreFrom = useCosmosStore((s) => s.exploreFrom)
  const phase = useCosmosStore((s) => s.phase)
  const t = useUiStore((s) => s.t)
  const [imgFailed, setImgFailed] = useState(false)

  const msg = t()
  const item = items.find((i) => i.id === selectedId) ?? null

  useEffect(() => {
    setImgFailed(false)
  }, [selectedId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') select(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [select])

  if (!item || phase === 'idle' || phase === 'collapsing' || phase === 'focusing') return null

  return (
    <aside
      className="pointer-events-auto absolute bottom-4 right-4 z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-slate-900/85 to-slate-950/90 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl"
      role="dialog"
      aria-label={item.title}
    >
      <div className="flex gap-3 p-4">
        {!imgFailed ? (
          <img
            src={item.thumbUrl}
            alt=""
            onError={() => setImgFailed(true)}
            className="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-cyan-300/25"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-400 ring-1 ring-white/10">
            {msg.noImage}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold leading-tight text-white">
              {item.title}
            </h2>
            <button
              type="button"
              onClick={() => select(null)}
              className="text-slate-400 transition hover:text-white"
              aria-label={msg.close}
            >
              ✕
            </button>
          </div>
          <p className="mt-1 line-clamp-4 text-sm leading-relaxed text-slate-300">
            {item.description?.trim() || msg.noDesc}
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t border-white/8 px-4 py-3 text-xs text-slate-400">
        <p>
          <span className="text-slate-500">{msg.license}</span> {item.license}
          {item.author ? ` · ${item.author}` : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={item.sourcePageUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/12 px-3 py-1.5 text-cyan-100 transition hover:border-cyan-300/40"
          >
            {msg.openSource}
          </a>
          <button
            type="button"
            onClick={() => void exploreFrom(item)}
            className="rounded-full bg-gradient-to-br from-cyan-200 to-cyan-400 px-3 py-1.5 font-semibold text-slate-950 transition hover:brightness-110"
          >
            {msg.exploreFrom}
          </button>
        </div>
      </div>
    </aside>
  )
}
