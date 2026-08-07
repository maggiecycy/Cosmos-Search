import { useEffect, useRef, useState } from 'react'
import { assetUrl } from '../lib/assetUrl'
import { useUiStore, type PlaylistTrack } from '../i18n/uiStore'

interface PlaylistFile {
  volume?: number
  tracks: PlaylistTrack[]
}

const FADE_MS = 480

function resolveSrc(src: string) {
  return assetUrl(src)
}

/**
 * Dual-deck ambient player with BASE_URL-aware paths (GitHub Pages safe).
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
  const volumeRef = useRef(0.3)
  const currentSrcRef = useRef('')
  const fadeRaf = useRef(0)
  const [ready, setReady] = useState(false)
  const [blocked, setBlocked] = useState(false)

  const getActive = () => (activeIsA.current ? deckA.current : deckB.current)
  const getIdle = () => (activeIsA.current ? deckB.current : deckA.current)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(assetUrl('audio/playlist.json'))
        if (!res.ok) throw new Error('playlist missing')
        const data = (await res.json()) as PlaylistFile
        if (cancelled) return
        if (typeof data.volume === 'number') volumeRef.current = data.volume

        const listed = data.tracks ?? []
        // Keep only tracks that actually exist (HEAD / GET probe)
        const available: PlaylistTrack[] = []
        for (const track of listed) {
          const url = resolveSrc(track.src)
          try {
            const probe = await fetch(url, { method: 'HEAD' })
            if (probe.ok) {
              available.push({ ...track, src: url })
              continue
            }
          } catch {
            /* fall through to GET range */
          }
          try {
            const get = await fetch(url, { headers: { Range: 'bytes=0-1' } })
            if (get.ok || get.status === 206) available.push({ ...track, src: url })
          } catch {
            /* skip missing */
          }
        }

        if (cancelled) return
        setTracks(available)
        setReady(true)
        if (available.length === 0 && useUiStore.getState().musicOn) {
          setMusicOn(false)
        }
      } catch {
        if (!cancelled) {
          setTracks([])
          setReady(true)
          if (useUiStore.getState().musicOn) setMusicOn(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setTracks, setMusicOn])

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

    if (currentSrcRef.current === src) {
      if (shouldPlay) void tryPlay(active)
      else active.pause()
      return
    }

    if (!currentSrcRef.current) {
      currentSrcRef.current = src
      active.src = src
      active.volume = volumeRef.current
      if (shouldPlay) void tryPlay(active)
      return
    }

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
        if (u < 1) fadeRaf.current = requestAnimationFrame(tick)
        else {
          from.pause()
          from.volume = 0
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

  useEffect(() => {
    if (!ready) return
    if (tracks.length === 0) {
      if (musicOn) setMusicOn(false)
      return
    }
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

  useEffect(() => {
    if (!musicOn || !ready || playNonce === 0 || tracks.length === 0) return
    const el = getActive()
    if (!el) return
    if (!el.src) {
      const track = tracks[trackIndex % tracks.length]
      if (track) {
        currentSrcRef.current = track.src
        el.src = track.src
      }
    }
    void tryPlay(el)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playNonce])

  useEffect(() => {
    if (!musicOn || !blocked) return
    const unlock = () => {
      const el = getActive()
      if (el) void tryPlay(el)
    }
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [musicOn, blocked])

  if (musicOn && blocked && tracks.length > 0) {
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
