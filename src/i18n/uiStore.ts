import { create } from 'zustand'
import { messages, type Locale, type Messages } from './messages'

export interface PlaylistTrack {
  src: string
  title: string
  titleZh: string
}

interface UiState {
  locale: Locale
  musicOn: boolean
  trackIndex: number
  tracks: PlaylistTrack[]
  trackTitle: string
  /** Bumped on user gesture so AmbientAudio can call play() in-gesture */
  playNonce: number
  setLocale: (l: Locale) => void
  toggleLocale: () => void
  setMusicOn: (v: boolean) => void
  toggleMusic: () => void
  requestPlay: () => void
  setTracks: (tracks: PlaylistTrack[]) => void
  setTrackIndex: (i: number) => void
  nextTrack: () => void
  t: () => Messages
}

function loadLocale(): Locale {
  try {
    const v = localStorage.getItem('cosmos-locale')
    if (v === 'en' || v === 'zh') return v
  } catch {
    /* ignore */
  }
  return 'zh'
}

function loadMusic(): boolean {
  try {
    const v = localStorage.getItem('cosmos-music')
    if (v === null) return true
    return v === '1'
  } catch {
    return true
  }
}

function loadTrackIndex(): number {
  try {
    const n = Number(localStorage.getItem('cosmos-track') ?? '0')
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

function resolveTitle(tracks: PlaylistTrack[], index: number, locale: Locale): string {
  const t = tracks[index]
  if (!t) return ''
  return locale === 'zh' ? t.titleZh : t.title
}

export const useUiStore = create<UiState>((set, get) => ({
  locale: typeof window !== 'undefined' ? loadLocale() : 'zh',
  musicOn: typeof window !== 'undefined' ? loadMusic() : false,
  trackIndex: typeof window !== 'undefined' ? loadTrackIndex() : 0,
  tracks: [],
  trackTitle: '',
  playNonce: 0,

  setLocale: (locale) => {
    try {
      localStorage.setItem('cosmos-locale', locale)
    } catch {
      /* ignore */
    }
    const { tracks, trackIndex } = get()
    set({ locale, trackTitle: resolveTitle(tracks, trackIndex, locale) })
  },

  toggleLocale: () => {
    const next = get().locale === 'zh' ? 'en' : 'zh'
    get().setLocale(next)
  },

  setMusicOn: (musicOn) => {
    try {
      localStorage.setItem('cosmos-music', musicOn ? '1' : '0')
    } catch {
      /* ignore */
    }
    set({ musicOn })
  },

  requestPlay: () => set((s) => ({ playNonce: s.playNonce + 1 })),

  toggleMusic: () => {
    const next = !get().musicOn
    get().setMusicOn(next)
    if (next) get().requestPlay()
  },

  setTracks: (tracks) => {
    const { trackIndex, locale } = get()
    const safe = tracks.length === 0 ? 0 : trackIndex % tracks.length
    set({
      tracks,
      trackIndex: safe,
      trackTitle: resolveTitle(tracks, safe, locale),
    })
  },

  setTrackIndex: (i) => {
    const { tracks, locale, musicOn } = get()
    if (tracks.length === 0) return
    const next = ((i % tracks.length) + tracks.length) % tracks.length
    try {
      localStorage.setItem('cosmos-track', String(next))
    } catch {
      /* ignore */
    }
    set({ trackIndex: next, trackTitle: resolveTitle(tracks, next, locale) })
    if (musicOn) get().requestPlay()
  },

  nextTrack: () => {
    const { trackIndex, tracks } = get()
    if (tracks.length === 0) return
    get().setTrackIndex(trackIndex + 1)
  },

  t: () => messages[get().locale],
}))
