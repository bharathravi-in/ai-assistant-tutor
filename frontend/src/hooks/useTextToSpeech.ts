import { useState, useEffect, useCallback, useRef } from 'react'

interface UseTextToSpeechOptions {
    language?: string
    rate?: number
    pitch?: number
    volume?: number
    onStart?: () => void
    onEnd?: () => void
    onError?: (error: string) => void
}

interface UseTextToSpeechReturn {
    isSpeaking: boolean
    isPaused: boolean
    isSupported: boolean
    voices: SpeechSynthesisVoice[]
    speak: (text: string) => void
    pause: () => void
    resume: () => void
    stop: () => void
}

// Map language codes to preferred voice names
const VOICE_PREFERENCES: Record<string, string[]> = {
    en: ['Google UK English Female', 'Microsoft Zira', 'Samantha', 'English'],
    hi: ['Google हिन्दी', 'Microsoft Hemant', 'Hindi'],
    ta: ['Google தமிழ்', 'Tamil'],
    te: ['Google తెలుగు', 'Telugu'],
    kn: ['Google ಕನ್ನಡ', 'Kannada'],
    mr: ['Google मराठी', 'Marathi'],
}

export function useTextToSpeech(
    options: UseTextToSpeechOptions = {}
): UseTextToSpeechReturn {
    const {
        language = 'en',
        rate = 1,
        pitch = 1,
        volume = 1,
        onStart,
        onEnd,
        onError,
    } = options

    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

    const isSupported = !!synth

    // Load available voices
    useEffect(() => {
        if (!synth) return

        const loadVoices = () => {
            const availableVoices = synth.getVoices()
            setVoices(availableVoices)
        }

        loadVoices()
        synth.onvoiceschanged = loadVoices

        return () => {
            synth.onvoiceschanged = null
        }
    }, [synth])

    // Get best voice for language
    const getVoiceForLanguage = useCallback((lang: string): SpeechSynthesisVoice | null => {
        if (voices.length === 0) return null

        const preferences = VOICE_PREFERENCES[lang] || VOICE_PREFERENCES.en
        const langCode = lang === 'en' ? 'en' : `${lang}-IN`

        // Try preferred voices first
        for (const pref of preferences) {
            const voice = voices.find(v =>
                v.name.includes(pref) || v.lang.startsWith(langCode)
            )
            if (voice) return voice
        }

        // Fallback to any matching language
        const langVoice = voices.find(v => v.lang.startsWith(lang))
        if (langVoice) return langVoice

        // Ultimate fallback to default
        return voices.find(v => v.default) || voices[0]
    }, [voices])

    const speak = useCallback((text: string) => {
        if (!synth || !text.trim()) return

        // Cancel any ongoing speech
        synth.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utteranceRef.current = utterance

        // Set voice for language
        const voice = getVoiceForLanguage(language)
        if (voice) {
            utterance.voice = voice
            utterance.lang = voice.lang
        }

        utterance.rate = rate
        utterance.pitch = pitch
        utterance.volume = volume

        utterance.onstart = () => {
            setIsSpeaking(true)
            setIsPaused(false)
            onStart?.()
        }

        utterance.onend = () => {
            setIsSpeaking(false)
            setIsPaused(false)
            onEnd?.()
        }

        utterance.onerror = (event) => {
            setIsSpeaking(false)
            setIsPaused(false)
            onError?.(event.error)
        }

        // Chrome bug workaround: speech synthesis stops after ~15 seconds
        // Split long text into chunks
        if (text.length > 200) {
            speakLongText(text, utterance)
        } else {
            synth.speak(utterance)
        }
    }, [synth, language, rate, pitch, volume, getVoiceForLanguage, onStart, onEnd, onError])

    // Handle long text by splitting into sentences
    const speakLongText = useCallback((text: string, baseUtterance: SpeechSynthesisUtterance) => {
        if (!synth) return

        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

        sentences.forEach((sentence, index) => {
            const utterance = new SpeechSynthesisUtterance(sentence.trim())
            utterance.voice = baseUtterance.voice
            utterance.lang = baseUtterance.lang
            utterance.rate = baseUtterance.rate
            utterance.pitch = baseUtterance.pitch
            utterance.volume = baseUtterance.volume

            if (index === 0) {
                utterance.onstart = () => {
                    setIsSpeaking(true)
                    setIsPaused(false)
                    onStart?.()
                }
            }

            if (index === sentences.length - 1) {
                utterance.onend = () => {
                    setIsSpeaking(false)
                    setIsPaused(false)
                    onEnd?.()
                }
            }

            utterance.onerror = (event) => {
                setIsSpeaking(false)
                onError?.(event.error)
            }

            synth.speak(utterance)
        })
    }, [synth, onStart, onEnd, onError])

    const pause = useCallback(() => {
        if (synth && isSpeaking) {
            synth.pause()
            setIsPaused(true)
        }
    }, [synth, isSpeaking])

    const resume = useCallback(() => {
        if (synth && isPaused) {
            synth.resume()
            setIsPaused(false)
        }
    }, [synth, isPaused])

    const stop = useCallback(() => {
        if (synth) {
            synth.cancel()
            setIsSpeaking(false)
            setIsPaused(false)
        }
    }, [synth])

    return {
        isSpeaking,
        isPaused,
        isSupported,
        voices,
        speak,
        pause,
        resume,
        stop,
    }
}
