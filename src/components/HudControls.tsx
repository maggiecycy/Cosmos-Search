import { type ReactNode } from 'react'
import { useUiStore } from '../i18n/uiStore'
import { useCosmosStore } from '../store/cosmosStore'

function IconButton({
  onClick,
  label,
  tip,
  active,
  children,
}: {
  onClick: () => void
  label: string
  tip: string
  active?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`group relative flex h-8 w-8 items-center justify-center rounded-full transition ${
        active
          ? 'bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25'
          : 'text-slate-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 z-50 mt-2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-950/95 px-2.5 py-1.5 text-[10px] text-slate-200 opacity-0 shadow-lg backdrop-blur-md transition duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {tip}
      </span>
    </button>
  )
}

function SpeakerOnIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 10v4h3l4 3V7L7 10H4z" fill="currentColor" />
      <path
        d="M15.5 8.5a5 5 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M17.8 6a8 8 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SpeakerOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 10v4h3l4 3V7L7 10H4z" fill="currentColor" />
      <path
        d="M16 9l5 5M21 9l-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function NextTrackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5 6.5v11l8.5-5.5L5 6.5z" />
      <rect x="16.5" y="6.5" width="2.2" height="11" rx="0.6" />
    </svg>
  )
}

function SpinOnIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4a8 8 0 1 1-7.5 5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.5 4.5v4.2H8.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SpinOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 8l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 11.5L12 5l8 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 10.5V19h10v-8.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Top-right HUD: source badge, spin, music, language */
export function HudControls() {
  const phase = useCosmosStore((s) => s.phase)
  const source = useCosmosStore((s) => s.source)
  const autoRotate = useCosmosStore((s) => s.autoRotate)
  const setAutoRotate = useCosmosStore((s) => s.setAutoRotate)
  const goHome = useCosmosStore((s) => s.goHome)
  const locale = useUiStore((s) => s.locale)
  const toggleLocale = useUiStore((s) => s.toggleLocale)
  const musicOn = useUiStore((s) => s.musicOn)
  const toggleMusic = useUiStore((s) => s.toggleMusic)
  const nextTrack = useUiStore((s) => s.nextTrack)
  const trackTitle = useUiStore((s) => s.trackTitle)
  const tracks = useUiStore((s) => s.tracks)
  const t = useUiStore((s) => s.t)

  const msg = t()
  const idle = phase === 'idle'

  return (
    <div
      className={`pointer-events-auto absolute right-3 z-30 flex flex-col items-end gap-2 sm:right-5 ${
        idle ? 'top-4' : 'top-4 sm:top-5'
      }`}
    >
      <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-slate-950/55 p-1 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        {!idle && (
          <IconButton
            onClick={() => goHome()}
            label={msg.home}
            tip={msg.tipHome}
          >
            <HomeIcon />
          </IconButton>
        )}

        {!idle && (
          <span
            className={`group relative mx-0.5 cursor-help rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide ${
              source === 'wiki'
                ? 'bg-cyan-400/15 text-cyan-100'
                : 'bg-amber-400/15 text-amber-100'
            }`}
          >
            {source === 'wiki' ? msg.wiki : msg.demo}
            <span
              role="tooltip"
              className="pointer-events-none absolute top-full right-0 z-50 mt-2 max-w-[12rem] whitespace-normal rounded-lg border border-white/10 bg-slate-950/95 px-2.5 py-1.5 text-[10px] font-normal leading-snug tracking-normal text-slate-200 opacity-0 shadow-lg backdrop-blur-md transition duration-150 group-hover:opacity-100"
            >
              {source === 'wiki' ? msg.tipSourceWiki : msg.tipSourceDemo}
            </span>
          </span>
        )}

        {!idle && (
          <IconButton
            onClick={() => setAutoRotate(!autoRotate)}
            label={autoRotate ? msg.autoOn : msg.autoOff}
            tip={autoRotate ? msg.tipAutoOn : msg.tipAutoOff}
            active={autoRotate}
          >
            {autoRotate ? <SpinOnIcon /> : <SpinOffIcon />}
          </IconButton>
        )}

        <IconButton
          onClick={() => toggleMusic()}
          label={musicOn ? msg.musicOn : msg.musicOff}
          tip={musicOn ? msg.tipMusicOn : msg.tipMusicOff}
          active={musicOn}
        >
          {musicOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
        </IconButton>

        {tracks.length > 1 && (
          <IconButton
            onClick={() => nextTrack()}
            label={msg.musicNext}
            tip={trackTitle ? `${msg.tipMusicNext} · ${trackTitle}` : msg.tipMusicNext}
            active={musicOn}
          >
            <NextTrackIcon />
          </IconButton>
        )}

        <button
          type="button"
          onClick={() => toggleLocale()}
          className="group relative mx-0.5 flex h-8 min-w-8 items-center justify-center rounded-full bg-white/8 px-2 text-[10px] font-semibold tracking-wider text-white transition hover:bg-white/15"
          aria-label={`Switch language (now ${locale})`}
        >
          {msg.langSwitch}
          <span
            role="tooltip"
            className="pointer-events-none absolute top-full right-0 z-50 mt-2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-950/95 px-2.5 py-1.5 text-[10px] font-normal tracking-normal text-slate-200 opacity-0 shadow-lg backdrop-blur-md transition duration-150 group-hover:opacity-100"
          >
            {msg.tipLang}
          </span>
        </button>
      </div>
      {musicOn && trackTitle && (
        <p className="max-w-[14rem] truncate rounded-full border border-white/8 bg-slate-950/40 px-2.5 py-0.5 text-[10px] text-slate-400 backdrop-blur">
          ♪ {trackTitle}
        </p>
      )}
    </div>
  )
}
