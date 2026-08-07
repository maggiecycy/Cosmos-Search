import { useUiStore } from '../i18n/uiStore'
import { useCosmosStore } from '../store/cosmosStore'

export function Breadcrumb() {
  const phase = useCosmosStore((s) => s.phase)
  const query = useCosmosStore((s) => s.query)
  const stack = useCosmosStore((s) => s.centerStack)
  const goBack = useCosmosStore((s) => s.goBack)
  const jumpToHistory = useCosmosStore((s) => s.jumpToHistory)
  const t = useUiStore((s) => s.t)

  if (phase === 'idle') return null

  const msg = t()
  const path = [...stack.map((s) => s.query), query]
  const busy =
    phase === 'loading' ||
    phase === 'focusing' ||
    phase === 'collapsing'

  return (
    <div className="pointer-events-none absolute left-0 right-24 top-[4.25rem] z-20 px-4 sm:right-40 sm:top-[4.5rem] sm:px-6">
      <div className="pointer-events-auto min-w-0">
        {stack.length > 0 && (
          <button
            type="button"
            onClick={() => void goBack()}
            disabled={busy}
            title={msg.tipBack}
            className="group relative mb-2 rounded-full border border-white/10 bg-slate-950/55 px-3 py-1.5 text-[11px] text-cyan-100/90 backdrop-blur-md transition hover:border-cyan-300/35 hover:bg-slate-900/70 disabled:opacity-40"
          >
            {msg.back}
            <span
              role="tooltip"
              className="pointer-events-none absolute top-full left-0 z-50 mt-2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-950/95 px-2.5 py-1.5 text-[10px] text-slate-200 opacity-0 shadow-lg backdrop-blur-md transition duration-150 group-hover:opacity-100"
            >
              {msg.tipBack}
            </span>
          </button>
        )}
        <nav
          aria-label={msg.pathAria}
          className="flex max-w-[min(72vw,40rem)] flex-wrap items-center gap-1 text-[11px] text-slate-500"
        >
          {path.map((segment, i) => {
            const isCurrent = i === path.length - 1
            const stackIndex = i // path[i] for i < stack.length lives in centerStack[i]
            const canJump = !isCurrent && !busy && stackIndex < stack.length

            return (
              <span key={`${segment}-${i}`} className="flex min-w-0 items-center gap-1">
                {i > 0 && <span className="opacity-30">/</span>}
                {canJump ? (
                  <button
                    type="button"
                    onClick={() => jumpToHistory(stackIndex)}
                    title={`${msg.tipJump}: ${segment}`}
                    className="truncate rounded px-1 py-0.5 text-slate-400 transition hover:bg-cyan-400/10 hover:text-cyan-200"
                  >
                    {segment.length > 22 ? `${segment.slice(0, 20)}…` : segment}
                  </button>
                ) : (
                  <span
                    className={
                      isCurrent
                        ? 'truncate font-medium text-cyan-200/90'
                        : 'truncate text-slate-500'
                    }
                    title={segment}
                  >
                    {segment.length > 22 ? `${segment.slice(0, 20)}…` : segment}
                  </span>
                )}
              </span>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
