/**
 * useVoiceInput - Web Speech API hook for voice-to-text
 * Provides cross-browser voice recognition with fallback handling
 */
import { useState, useCallback, useRef, useEffect } from 'react'

interface UseVoiceInputOptions {
    language?: string
    continuous?: boolean
    interimResults?: boolean
    onResult?: (transcript: string) => void
    onError?: (error: string) => void
}

interface UseVoiceInputReturn {
    isListening: boolean
    isSupported: boolean
    transcript: string
    error: string | null
    startListening: () => void
    stopListening: () => void
    resetTranscript: () => void
}

// Extend Window interface for Speech Recognition
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message?: string
}

type SpeechRecognition = {
    continuous: boolean
    interimResults: boolean
    lang: string
    start: () => void
    stop: () => void
    abort: () => void
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
    onstart: (() => void) | null
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition
        webkitSpeechRecognition: new () => SpeechRecognition
    }
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
    const {
        language = 'en-IN',
        continuous = false,
        interimResults = true,
        onResult,
        onError,
    } = options

    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [error, setError] = useState<string | null>(null)

    const recognitionRef = useRef<SpeechRecognition | null>(null)

    // Use refs for callbacks to avoid recreating recognition on callback changes
    const onResultRef = useRef(onResult)
    const onErrorRef = useRef(onError)

    // Keep refs updated
    useEffect(() => {
        onResultRef.current = onResult
        onErrorRef.current = onError
    }, [onResult, onError])

    // Check browser support
    const isSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

    // Initialize recognition instance - only recreate when language/continuous/interimResults change
    useEffect(() => {
        if (!isSupported) return

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.continuous = continuous
        recognition.interimResults = interimResults
        recognition.lang = language

        recognition.onstart = () => {
            setIsListening(true)
            setError(null)
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = ''
            let interimTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i]
                if (result.isFinal) {
                    finalTranscript += result[0].transcript
                } else {
                    interimTranscript += result[0].transcript
                }
            }

            const fullTranscript = finalTranscript || interimTranscript
            setTranscript(prev => continuous ? prev + fullTranscript : fullTranscript)

            if (finalTranscript && onResultRef.current) {
                onResultRef.current(finalTranscript)
            }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            // Ignore 'aborted' error as it happens during cleanup
            if (event.error === 'aborted') {
                setIsListening(false)
                return
            }

            const errorMessage = getErrorMessage(event.error)
            setError(errorMessage)
            setIsListening(false)

            if (onErrorRef.current) {
                onErrorRef.current(errorMessage)
            }
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort()
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        }
    }, [language, continuous, interimResults, isSupported])

    const startListening = useCallback(() => {
        if (!isSupported) {
            setError('Voice input is not supported in this browser')
            return
        }

        setError(null) // Clear any previous errors

        if (recognitionRef.current && !isListening) {
            setTranscript('')
            try {
                recognitionRef.current.start()
            } catch (e: any) {
                // Handle "already started" error
                if (e.message?.includes('already started')) {
                    setIsListening(true)
                } else {
                    setError('Failed to start voice recognition. Please try again.')
                }
            }
        }
    }, [isSupported, isListening])

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
        }
    }, [isListening])

    const resetTranscript = useCallback(() => {
        setTranscript('')
    }, [])

    return {
        isListening,
        isSupported,
        transcript,
        error,
        startListening,
        stopListening,
        resetTranscript,
    }
}

function getErrorMessage(error: string): string {
    switch (error) {
        case 'no-speech':
            return 'No speech detected. Please try again.'
        case 'audio-capture':
            return 'Microphone not available. Please check permissions.'
        case 'not-allowed':
            return 'Microphone permission denied. Please allow access.'
        case 'network':
            return 'Network error occurred. Please check your connection.'
        case 'aborted':
            return 'Voice input was cancelled.'
        default:
            return `Voice input error: ${error}`
    }
}

export default useVoiceInput
