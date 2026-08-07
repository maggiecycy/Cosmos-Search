import { useState, type FormEvent } from 'react'
import { useUiStore } from '../i18n/uiStore'
import { useCosmosStore } from '../store/cosmosStore'

export function HeroSearch() {
  const phase = useCosmosStore((s) => s.phase)
  const search = useCosmosStore((s) => s.search)
  const error = useCosmosStore((s) => s.error)
  const notice = useCosmosStore((s) => s.notice)
  const clearNotice = useCosmosStore((s) => s.clearNotice)
  const locale = useUiStore((s) => s.locale)
  const t = useUiStore((s) => s.t)
  const [draft, setDraft] = useState('')

  const msg = t()
  const isIdle = phase === 'idle'

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = draft.trim()
    if (!q) return
    void search(q)
    setDraft('')
  }

  const errorText =
    error === 'empty'
      ? locale === 'zh'
        ? '没有找到相关图像'
        : 'No related images found'
      : error === 'searchFailed'
        ? locale === 'zh'
          ? '搜索失败'
          : 'Search failed'
        : error

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-20 flex flex-col items-center px-4 transition-all duration-700 ease-out ${
        isIdle
          ? 'top-[40%] -translate-y-1/2'
          : 'top-0 translate-y-0 pt-3 sm:pt-4'
      }`}
    >
      {isIdle && (
        <div className="mb-9 text-center">
          <p className="mb-1 font-[family-name:var(--font-display)] text-[clamp(0.7rem,2vw,0.85rem)] font-semibold tracking-[0.55em] text-cyan-200/70">
            星索
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.8rem,9vw,5.75rem)] font-extrabold tracking-[0.22em] text-white">
            {msg.brand}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--cosmos-muted)] sm:text-[0.95rem]">
            {msg.tagline}
          </p>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className={`pointer-events-auto w-full ${isIdle ? 'max-w-xl' : 'max-w-md'}`}
      >
        <div
          className={`group relative flex items-center overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-slate-900/80 to-slate-950/90 shadow-[0_0_0_1px_rgba(103,232,249,0.06),0_20px_50px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl transition duration-500 focus-within:border-cyan-300/35 focus-within:shadow-[0_0_0_1px_rgba(103,232,249,0.2),0_0_48px_-12px_var(--cosmos-accent-dim)] ${
            isIdle ? '' : 'rounded-full'
          }`}
        >
          <span
            className="pointer-events-none ml-4 hidden text-cyan-300/50 sm:inline"
            aria-hidden
          >
            ⌕
          </span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              isIdle ? msg.searchPlaceholderIdle : msg.searchPlaceholderActive
            }
            className={`min-w-0 flex-1 bg-transparent px-4 text-white outline-none placeholder:text-slate-500 ${
              isIdle ? 'py-4 text-base sm:text-lg' : 'py-2.5 text-sm'
            }`}
            aria-label={msg.explore}
            autoFocus={isIdle}
          />
          <button
            type="submit"
            className={`m-1.5 shrink-0 rounded-xl bg-gradient-to-br from-cyan-200 to-cyan-400 font-semibold text-slate-950 shadow-[0_4px_20px_-4px_rgba(103,232,249,0.55)] transition hover:brightness-110 active:scale-[0.98] ${
              isIdle ? 'px-5 py-2.5 text-sm' : 'rounded-full px-4 py-1.5 text-xs'
            }`}
          >
            {msg.explore}
          </button>
        </div>
      </form>

      {isIdle && (
        <div className="pointer-events-auto mt-6 flex flex-wrap justify-center gap-2">
          {msg.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void search(s)}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-xs tracking-wide text-slate-300 transition hover:border-cyan-300/35 hover:bg-cyan-400/10 hover:text-cyan-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {errorText && (
        <p className="pointer-events-none mt-3 text-sm text-rose-300/90">{errorText}</p>
      )}

      {notice === 'demoFallback' && (
        <button
          type="button"
          onClick={() => clearNotice()}
          className="pointer-events-auto mt-3 max-w-md rounded-2xl border border-amber-300/25 bg-amber-950/50 px-4 py-2 text-left text-xs leading-relaxed text-amber-100/90 backdrop-blur-md"
        >
          {msg.demoFallback}
        </button>
      )}
    </div>
  )
}
