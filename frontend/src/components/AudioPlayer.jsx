import { useEffect, useRef, useState } from 'react'

const localeFor = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  bn: 'bn-IN',
}

export default function AudioPlayer({ segments, language = 'en' }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const segment = segments?.[0]
  const hasAudio = Boolean(segment?.audio_url)
  const hasBrowserVoice = typeof window !== 'undefined' && 'speechSynthesis' in window && Boolean(segment?.text)

  useEffect(() => {
    const player = audioRef.current
    if (!player) return undefined
    const done = () => setPlaying(false)
    player.addEventListener('ended', done)
    return () => player.removeEventListener('ended', done)
  }, [hasAudio])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  async function toggle() {
    const player = audioRef.current
    if (hasAudio && player) {
      if (player.paused) {
        await player.play()
        setPlaying(true)
      } else {
        player.pause()
        setPlaying(false)
      }
      return
    }

    if (!hasBrowserVoice) return
    if (playing) {
      window.speechSynthesis.cancel()
      setPlaying(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(segment.text)
    const locale = localeFor[language] ?? localeFor.en
    const voices = window.speechSynthesis.getVoices()
    utterance.lang = locale
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase())
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith(locale.slice(0, 2)))
      ?? null
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(utterance)
    setPlaying(true)
  }

  return (
    <section className="audio-panel" aria-labelledby="audio-title">
      <div>
        <p className="eyebrow">Listen</p>
        <h2 id="audio-title">Hear this in your language</h2>
        <p>{hasAudio ? 'Audio is ready when you are.' : hasBrowserVoice ? 'Free browser voice is ready when you are. Your full text is always available above.' : 'Voice is unavailable in this browser. Your full text is always available above.'}</p>
      </div>
      <button className="audio-button" onClick={toggle} disabled={!hasAudio && !hasBrowserVoice} aria-label={playing ? 'Stop explanation audio' : 'Play explanation audio'}>
        <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>{playing ? 'Pause' : 'Play audio'}
      </button>
      {hasAudio && <audio ref={audioRef} src={segment.audio_url} preload="metadata" />}
    </section>
  )
}
