import { useState, useEffect, useCallback, useRef } from 'react'
import { useSettingsStore } from '../stores/settingsStore'

interface TTSOptions {
    language?: 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'mr' | 'auto'
    voiceId?: string
    rate?: number
    pitch?: number
    volume?: number
}

interface TTSHook {
    speak: (text: string, options?: TTSOptions) => void
    stop: () => void
    pause: () => void
    resume: () => void
    isSpeaking: boolean
    isPaused: boolean
    isSupported: boolean
    voices: SpeechSynthesisVoice[]
    currentLanguage: string
}

// Unused cache variables removed

const detectLanguage = (text: string): string => {
    // Check for Devanagari script (Hindi/Marathi)
    if (/[\u0900-\u097F]/.test(text)) return 'hi'
    // Tamil
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'
    // Telugu
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te'
    // Kannada
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'

    return 'en'
}

export function useTTS(): TTSHook {
    const {
        selectedVoice: storeVoice,
        voiceRate: storeRate,
        voicePitch: storePitch,
        customVoices
    } = useSettingsStore()

    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
    const [currentLanguage, setCurrentLanguage] = useState<string>('en')

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const isSupported = typeof window !== 'undefined' && ('speechSynthesis' in window || 'Audio' in window)

    useEffect(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices()
            setVoices(availableVoices)
        }

        loadVoices()
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices
        }
    }, [])

    const stop = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel()
        }
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
        setIsSpeaking(false)
        setIsPaused(false)
    }, [])

    const speak = useCallback((text: string, options: TTSOptions = {}) => {
        if (!isSupported || !text.trim()) return

        stop()

        const activeVoiceId = options.voiceId || storeVoice

        const detectedLang = options.language === 'auto' || !options.language
            ? detectLanguage(text)
            : options.language
        setCurrentLanguage(detectedLang)

        // Check if active voice is custom
        const customVoice = customVoices.find(v => v.id === activeVoiceId)

        if (customVoice) {
            // Play custom voice audio sample
            const audioUrl = customVoice.audioUrl.startsWith('http')
                ? customVoice.audioUrl
                : `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'}${customVoice.audioUrl}`

            const audio = new Audio(audioUrl)
            audioRef.current = audio

            audio.onplay = () => {
                setIsSpeaking(true)
                setIsPaused(false)
            }
            audio.onended = () => {
                setIsSpeaking(false)
                setIsPaused(false)
            }
            audio.onerror = () => {
                setIsSpeaking(false)
                console.error("Custom voice playback failed")
            }

            audio.play().catch(console.error)
            return
        }

        // Web Speech API fallback
        const utterance = new SpeechSynthesisUtterance(text)
        utteranceRef.current = utterance

        const rate = options.rate ?? storeRate
        const pitch = options.pitch ?? storePitch

        // Standard voice mapping with metadata hints
        const VOICE_MAP: Record<string, { lang: string, gender: string, nameHint: string }> = {
            'voice-1': { lang: 'hi-IN', gender: 'female', nameHint: 'Priya' },
            'voice-2': { lang: 'hi-IN', gender: 'male', nameHint: 'Arjun' },
            'voice-3': { lang: 'en-IN', gender: 'female', nameHint: 'Divya' },
            'voice-4': { lang: 'en-IN', gender: 'male', nameHint: 'Ravi' },
            'voice-5': { lang: 'ta-IN', gender: 'female', nameHint: 'Ananya' },
        }

        const voiceMeta = VOICE_MAP[activeVoiceId]
        const targetLang = voiceMeta?.lang || detectedLang

        const availableVoices = window.speechSynthesis.getVoices()

        // Advanced selection logic:
        // 1. Try to match exact language and name hint
        // 2. Try to match language and gender
        // 3. Fallback to any voice for the language

        let voice: SpeechSynthesisVoice | undefined

        if (voiceMeta) {
            // Priority 1: Match lang and name hint
            voice = availableVoices.find(v =>
                v.lang.startsWith(targetLang) &&
                v.name.toLowerCase().includes(voiceMeta.nameHint.toLowerCase())
            )

            // Priority 2: Match lang and gender hint
            if (!voice) {
                voice = availableVoices.find(v => {
                    const name = v.name.toLowerCase()
                    const isLangMatch = v.lang.startsWith(targetLang)
                    if (!isLangMatch) return false

                    if (voiceMeta.gender === 'female') {
                        return name.includes('female') || name.includes('samantha') || name.includes('victoria') || name.includes('google')
                    } else {
                        return name.includes('male') || name.includes('alex') || name.includes('daniel')
                    }
                })
            }
        }

        // Priority 3: Fallback to any voice for the target language
        if (!voice) {
            voice = availableVoices.find(v => v.lang.startsWith(targetLang))
        }

        // Last resort fallback
        if (!voice && targetLang.includes('-')) {
            voice = availableVoices.find(v => v.lang.startsWith(targetLang.split('-')[0]))
        }

        if (voice) {
            utterance.voice = voice
            utterance.lang = voice.lang
        } else {
            utterance.lang = targetLang
        }

        utterance.rate = rate
        utterance.pitch = pitch
        utterance.volume = options.volume ?? 1

        utterance.onstart = () => {
            setIsSpeaking(true)
            setIsPaused(false)
        }
        utterance.onend = () => {
            setIsSpeaking(false)
            setIsPaused(false)
        }
        utterance.onerror = () => {
            setIsSpeaking(false)
        }

        window.speechSynthesis.speak(utterance)
    }, [isSupported, stop, storeVoice, storeRate, storePitch, customVoices])

    const pause = useCallback(() => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause()
            setIsPaused(true)
        } else if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause()
            setIsPaused(true)
        }
    }, [])

    const resume = useCallback(() => {
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume()
            setIsPaused(false)
        } else if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(console.error)
            setIsPaused(false)
        }
    }, [])

    return {
        speak,
        stop,
        pause,
        resume,
        isSpeaking,
        isPaused,
        isSupported,
        voices,
        currentLanguage
    }
}

export default useTTS
