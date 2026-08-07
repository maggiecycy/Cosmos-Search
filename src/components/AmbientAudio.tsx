import { useEffect, useRef, useState } from 'react'
import { useUiStore, type PlaylistTrack } from '../i18n/uiStore'

interface PlaylistFile {
  volume?: number
  tracks: PlaylistTrack[]
}

const FADE_MS = 480

/**
 * Dual-deck ambient player.
 * Critical: never clear src via load() (fires error); play() must run inside user-gesture
 * when unlocking autoplay (toggle / first click).
 */
export function AmbientAudio() {
  const musicOn = useUiStore((s) => s.musicOn)
  const setMusicOn = useUiStore((s) => s.setMusicOn)
  const trackIndex = useUiStore((s) => s.trackIndex)
  const tracks = useUiStore((s) => s.tracks)
  const setTracks = useUiStore((s) => s.setTracks)
  const nextTrack = useUiStore((s) => s.nextTrack)
  const playNonce = useUiStore((s) => s.playNonce)
  const t = useUiStore((s) => s.t)

  const deckA = useRef<HTMLAudioElement | null>(null)
  const deckB = useRef<HTMLAudioElement | null>(null)
  const activeIsA = useRef(true)
  const volumeRef = useRef(0.32)
  const currentSrcRef = useRef('')
  const fadeRaf = useRef(0)
  const [ready, setReady] = useState(false)
  const [missing, setMissing] = useState(false)
  const [blocked, setBlocked] = useState(false)

  const getActive = () => (activeIsA.current ? deckA.current : deckB.current)
  const getIdle = () => (activeIsA.current ? deckB.current : deckA.current)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/audio/playlist.json')
        if (!res.ok) throw new Error('playlist missing')
        const data = (await res.json()) as PlaylistFile
        if (cancelled) return
        if (typeof data.volume === 'number') volumeRef.current = data.volume
        setTracks(data.tracks ?? [])
        setReady(true)
      } catch {
        if (!cancelled) {
          setMissing(true)
          setReady(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setTracks])

  useEffect(() => {
    const a = new Audio()
    const b = new Audio()
    a.preload = 'auto'
    b.preload = 'auto'
    deckA.current = a
    deckB.current = b

    const onEnded = (ev: Event) => {
      if (ev.target === getActive()) nextTrack()
    }
    a.addEventListener('ended', onEnded)
    b.addEventListener('ended', onEnded)

    return () => {
      cancelAnimationFrame(fadeRaf.current)
      a.pause()
      b.pause()
      a.removeEventListener('ended', onEnded)
      b.removeEventListener('ended', onEnded)
      deckA.current = null
      deckB.current = null
    }
  }, [nextTrack])

  const tryPlay = (el: HTMLAudioElement) => {
    el.volume = volumeRef.current
    return el.play().then(
      () => {
        setBlocked(false)
        setMissing(false)
        return true
      },
      () => {
        setBlocked(true)
        return false
      },
    )
  }

  const switchTo = (src: string, shouldPlay: boolean) => {
    const active = getActive()
    const idle = getIdle()
    if (!active || !idle) return

    cancelAnimationFrame(fadeRaf.current)

    // Same source — just resume / pause
    if (currentSrcRef.current === src && active.src.includes(src.replace(/^\//, ''))) {
      if (shouldPlay) void tryPlay(active)
      else active.pause()
      return
    }

    // First ever play: use active deck directly (no crossfade needed)
    if (!currentSrcRef.current) {
      currentSrcRef.current = src
      active.src = src
      active.volume = volumeRef.current
      if (shouldPlay) void tryPlay(active)
      return
    }

    idle.onerror = () => setMissing(true)
    idle.src = src
    idle.volume = 0

    const begin = () => {
      currentSrcRef.current = src
      const from = active
      const to = idle
      activeIsA.current = !activeIsA.current
      const target = volumeRef.current
      const t0 = performance.now()

      if (shouldPlay) void tryPlay(to)

      const tick = (now: number) => {
        const u = Math.min(1, (now - t0) / FADE_MS)
        const e = u * u * (3 - 2 * u)
        to.volume = target * e
        from.volume = target * (1 - e)
        if (u < 1) {
          fadeRaf.current = requestAnimationFrame(tick)
        } else {
          from.pause()
          from.volume = 0
          // Keep src on idle deck — do NOT clear (empty load() → spurious error)
        }
      }
      fadeRaf.current = requestAnimationFrame(tick)
    }

    if (idle.readyState >= 2) begin()
    else {
      const onReady = () => {
        idle.removeEventListener('canplaythrough', onReady)
        idle.removeEventListener('canplay', onReady)
        begin()
      }
      idle.addEventListener('canplaythrough', onReady)
      idle.addEventListener('canplay', onReady)
      idle.load()
    }
  }

  // Track / mute changes
  useEffect(() => {
    if (!ready || tracks.length === 0) return
    const track = tracks[trackIndex % tracks.length]
    if (!track) return

    if (!musicOn) {
      cancelAnimationFrame(fadeRaf.current)
      deckA.current?.pause()
      deckB.current?.pause()
      setBlocked(false)
      return
    }

    switchTo(track.src, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIndex, tracks, ready, musicOn])

  // Explicit user-gesture play (music button / unlock banner)
  useEffect(() => {
    if (!musicOn || !ready || playNonce === 0) return
    const el = getActive()
    if (!el) return
    if (!el.src && tracks.length > 0) {
      const track = tracks[trackIndex % tracks.length]
      if (track) {
        currentSrcRef.current = track.src
        el.src = track.src
      }
    }
    void tryPlay(el)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playNonce])

  // Fallback: any pointer interaction unlocks autoplay
  useEffect(() => {
    if (!musicOn || !blocked) return
    const unlock = () => {
      const el = getActive()
      if (el) void tryPlay(el)
    }
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [musicOn, blocked])

  if (musicOn && missing) {
    return (
      <div className="pointer-events-auto absolute bottom-14 left-1/2 z-30 flex max-w-[min(22rem,90vw)] -translate-x-1/2 flex-col items-center gap-2 rounded-2xl border border-amber-300/25 bg-slate-950/85 px-4 py-3 text-center text-xs text-amber-100/90 backdrop-blur-md">
        <p>{t().musicHint}</p>
        <button
          type="button"
          className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-slate-300 hover:border-cyan-300/40"
          onClick={() => setMusicOn(false)}
        >
          OK
        </button>
      </div>
    )
  }

  if (musicOn && blocked) {
    return (
      <button
        type="button"
        className="pointer-events-auto absolute bottom-14 left-1/2 z-30 -translate-x-1/2 rounded-full border border-cyan-300/30 bg-slate-950/85 px-4 py-2 text-xs text-cyan-100 backdrop-blur-md transition hover:border-cyan-300/50"
        onClick={() => {
          const el = getActive()
          if (el) void tryPlay(el)
          useUiStore.getState().requestPlay()
        }}
      >
        {t().musicTapToPlay}
      </button>
    )
  }

  return null
}
