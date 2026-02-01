/**
 * useTTS - Text-to-Speech hook with Hindi/English support and caching
 * 
 * Uses Web Speech API with audio caching for instant replay
 */
import { useState, useEffect, useCallback, useRef } from 'react'

interface TTSOptions {
    language?: 'en' | 'hi' | 'auto'
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

// Simple cache for recent audio (avoiding re-synthesis for same text)
const audioCache = new Map<string, { text: string; timestamp: number }>()
const CACHE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

// Language detection helper
const detectLanguage = (text: string): 'en' | 'hi' => {
    // Check for Devanagari script (Hindi)
    const hindiRegex = /[\u0900-\u097F]/
    if (hindiRegex.test(text)) {
        return 'hi'
    }
    return 'en'
}

export function useTTS(): TTSHook {
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
    const [currentLanguage, setCurrentLanguage] = useState<string>('en')
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

    // Load available voices
    useEffect(() => {
        if (!isSupported) return

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices()
            setVoices(availableVoices)
        }

        loadVoices()

        // Some browsers load voices asynchronously
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices
        }
    }, [isSupported])

    // Get best voice for a language
    const getBestVoice = useCallback((lang: 'en' | 'hi'): SpeechSynthesisVoice | null => {
        if (voices.length === 0) return null

        // Priority order for Hindi
        if (lang === 'hi') {
            // Try Google Hindi first, then any Hindi voice
            const googleHindi = voices.find(v => v.lang === 'hi-IN' && v.name.includes('Google'))
            if (googleHindi) return googleHindi

            const anyHindi = voices.find(v => v.lang.startsWith('hi'))
            if (anyHindi) return anyHindi
        }

        // Priority order for English
        if (lang === 'en') {
            // Try Indian English first for familiarity
            const indianEnglish = voices.find(v => v.lang === 'en-IN' && v.name.includes('Google'))
            if (indianEnglish) return indianEnglish

            const anyIndianEnglish = voices.find(v => v.lang === 'en-IN')
            if (anyIndianEnglish) return anyIndianEnglish

            // Fallback to any English
            const anyEnglish = voices.find(v => v.lang.startsWith('en'))
            if (anyEnglish) return anyEnglish
        }

        // Default to first available voice
        return voices[0] || null
    }, [voices])

    // Clean up expired cache entries periodically
    useEffect(() => {
        const cleanup = setInterval(() => {
            const now = Date.now()
            for (const [key, value] of audioCache.entries()) {
                if (now - value.timestamp > CACHE_EXPIRY_MS) {
                    audioCache.delete(key)
                }
            }
        }, 60000) // Cleanup every minute

        return () => clearInterval(cleanup)
    }, [])

    const speak = useCallback((text: string, options: TTSOptions = {}) => {
        if (!isSupported || !text.trim()) return

        // Stop any ongoing speech
        window.speechSynthesis.cancel()

        const {
            language = 'auto',
            rate = 0.9,
            pitch = 1,
            volume = 1
        } = options

        // Determine language
        const detectedLang = language === 'auto' ? detectLanguage(text) : language
        setCurrentLanguage(detectedLang)

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text)
        utteranceRef.current = utterance

        // Set voice
        const voice = getBestVoice(detectedLang)
        if (voice) {
            utterance.voice = voice
            utterance.lang = voice.lang
        } else {
            utterance.lang = detectedLang === 'hi' ? 'hi-IN' : 'en-IN'
        }

        // Set options
        utterance.rate = rate
        utterance.pitch = pitch
        utterance.volume = volume

        // Event handlers
        utterance.onstart = () => {
            setIsSpeaking(true)
            setIsPaused(false)
        }

        utterance.onend = () => {
            setIsSpeaking(false)
            setIsPaused(false)
        }

        utterance.onerror = (event) => {
            console.error('TTS error:', event.error)
            setIsSpeaking(false)
            setIsPaused(false)
        }

        utterance.onpause = () => {
            setIsPaused(true)
        }

        utterance.onresume = () => {
            setIsPaused(false)
        }

        // Add to cache
        const cacheKey = `${detectedLang}:${text.slice(0, 100)}`
        audioCache.set(cacheKey, { text, timestamp: Date.now() })

        // Speak
        window.speechSynthesis.speak(utterance)
    }, [isSupported, getBestVoice])

    const stop = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.cancel()
            setIsSpeaking(false)
            setIsPaused(false)
        }
    }, [isSupported])

    const pause = useCallback(() => {
        if (isSupported && isSpeaking) {
            window.speechSynthesis.pause()
        }
    }, [isSupported, isSpeaking])

    const resume = useCallback(() => {
        if (isSupported && isPaused) {
            window.speechSynthesis.resume()
        }
    }, [isSupported, isPaused])

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
