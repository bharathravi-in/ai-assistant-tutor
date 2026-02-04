import { useState, useEffect, useCallback, useRef } from 'react'

interface UseVoiceRecognitionOptions {
    language?: string
    continuous?: boolean
    interimResults?: boolean
    onResult?: (transcript: string, isFinal: boolean) => void
    onError?: (error: string) => void
    onStart?: () => void
    onEnd?: () => void
}

interface UseVoiceRecognitionReturn {
    isListening: boolean
    transcript: string
    interimTranscript: string
    error: string | null
    isSupported: boolean
    startListening: () => void
    stopListening: () => void
    resetTranscript: () => void
}

// Language codes for Web Speech API
export const SPEECH_LANGUAGES: Record<string, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    mr: 'mr-IN',
}

export function useVoiceRecognition(
    options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
    const {
        language = 'en',
        continuous = true,
        interimResults = true,
        onResult,
        onError,
        onStart,
        onEnd,
    } = options

    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [error, setError] = useState<string | null>(null)

    const recognitionRef = useRef<SpeechRecognition | null>(null)
    const optionsRef = useRef(options)

    // Update options ref
    useEffect(() => {
        optionsRef.current = options
    }, [options])

    // Check if speech recognition is supported
    const isSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

    // Initialize recognition only once
    useEffect(() => {
        if (!isSupported) return

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognition) return
        const recognition = new SpeechRecognition()
        recognitionRef.current = recognition

        recognition.continuous = continuous
        recognition.interimResults = interimResults
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
            console.log('🎤 Speech recognition started')
            setIsListening(true)
            setError(null)
            optionsRef.current.onStart?.()
        }

        recognition.onresult = (event: any) => {
            let finalTranscript = ''
            let currentInterim = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i]
                const text = result[0].transcript

                if (result.isFinal) {
                    finalTranscript += text
                } else {
                    currentInterim += text
                }
            }

            // Update interim transcript for CC display
            setInterimTranscript(currentInterim)

            if (finalTranscript) {
                console.log('🎯 Final transcript:', finalTranscript)
                setTranscript(finalTranscript)
                setInterimTranscript('')
                optionsRef.current.onResult?.(finalTranscript.trim(), true)
            } else if (currentInterim) {
                console.log('💭 Interim:', currentInterim)
                optionsRef.current.onResult?.(currentInterim, false)
            }
        }

        recognition.onerror = (event: any) => {
            console.error('❌ Speech recognition error:', event.error)
            const errorMessage = getErrorMessage(event.error)
            setError(errorMessage)
            setIsListening(false)
            optionsRef.current.onError?.(errorMessage)
        }

        recognition.onend = () => {
            console.log('🛑 Speech recognition ended')
            setIsListening(false)
            optionsRef.current.onEnd?.()
        }

        return () => {
            recognition.abort()
        }
    }, [isSupported, continuous, interimResults])

    // Update language when it changes
    useEffect(() => {
        if (recognitionRef.current) {
            const langCode = SPEECH_LANGUAGES[language] || 'en-IN'
            recognitionRef.current.lang = langCode
            // Removed noisy console log
            // console.log('🌐 Language set to:', langCode)
        }
    }, [language])

    const startListening = useCallback(() => {
        const recognition = recognitionRef.current

        if (!recognition) {
            console.error('Recognition not available')
            setError('Speech recognition not available')
            return
        }

        if (!isSupported) {
            setError('Speech recognition not supported in this browser')
            return
        }

        // Reset state
        setError(null)
        setTranscript('')
        setInterimTranscript('')

        // Set language before starting
        const langCode = SPEECH_LANGUAGES[optionsRef.current.language || 'en'] || 'en-IN'
        recognition.lang = langCode

        try {
            recognition.start()
            // Removed noisy console log
            // console.log('🎤 Starting recognition with lang:', langCode)
        } catch (err) {
            const error = err as Error
            console.error('Start error:', error.message)

            if (error.message?.includes('already started')) {
                // Already started, just update state
                setIsListening(true)
            } else {
                setError('Failed to start voice recognition')
            }
        }
    }, [isSupported])

    const stopListening = useCallback(() => {
        const recognition = recognitionRef.current
        if (recognition) {
            try {
                recognition.stop()
                console.log('🛑 Stopping recognition')
            } catch (err) {
                console.error('Stop error:', err)
            }
            setIsListening(false)
        }
    }, [])

    const resetTranscript = useCallback(() => {
        setTranscript('')
        setInterimTranscript('')
    }, [])

    return {
        isListening,
        transcript,
        interimTranscript,
        error,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
    }
}

function getErrorMessage(error: string): string {
    switch (error) {
        case 'no-speech':
            return 'No speech detected. Please speak louder or check your microphone.'
        case 'audio-capture':
            return 'Microphone not available. Please check your microphone settings.'
        case 'not-allowed':
            return 'Microphone access denied. Please allow microphone access in your browser.'
        case 'network':
            return 'Network error. Please check your internet connection.'
        case 'aborted':
            return 'Listening was stopped.'
        case 'service-not-allowed':
            return 'Speech service not allowed. Please try using Chrome browser.'
        default:
            return `Voice error: ${error}`
    }
}

// Type declarations for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: typeof SpeechRecognition
        webkitSpeechRecognition: typeof SpeechRecognition
    }
}
