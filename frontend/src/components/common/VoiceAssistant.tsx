import { useState, useRef, useEffect, useCallback } from 'react'
import {
    Mic,
    MicOff,
    VolumeX,
    Bot,
    Loader2,
    X,
    Settings,
    Globe
} from 'lucide-react'

interface VoiceAssistantButtonProps {
    onResult: (text: string) => void
    onSubmit: () => void
    language?: string
    className?: string
}

export function VoiceAssistantButton({ onResult, onSubmit, language = 'en-IN', className = '' }: VoiceAssistantButtonProps) {
    const [isListening, setIsListening] = useState(false)
    const [, setTranscript] = useState('')
    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = true
            recognitionRef.current.interimResults = true
            recognitionRef.current.lang = language

            recognitionRef.current.onresult = (event: any) => {
                const current = event.resultIndex
                const result = event.results[current]
                const transcriptText = result[0].transcript
                
                setTranscript(transcriptText)
                onResult(transcriptText)

                if (result.isFinal) {
                    setTimeout(() => {
                        setIsListening(false)
                        onSubmit()
                    }, 500)
                }
            }

            recognitionRef.current.onerror = () => {
                setIsListening(false)
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort()
            }
        }
    }, [language, onResult, onSubmit])

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition not supported')
            return
        }

        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        } else {
            setTranscript('')
            recognitionRef.current.start()
            setIsListening(true)
        }
    }

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={toggleListening}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isListening 
                        ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-xl shadow-red-500/30 scale-110' 
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg hover:shadow-xl hover:scale-105'
                }`}
            >
                {/* Pulse animation when listening */}
                {isListening && (
                    <>
                        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
                        <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50" />
                    </>
                )}
                
                {isListening ? (
                    <MicOff className="w-7 h-7 text-white relative z-10" />
                ) : (
                    <Mic className="w-7 h-7 text-white relative z-10" />
                )}
            </button>
            
            {isListening && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-sm text-red-500 font-medium animate-pulse">
                        Listening...
                    </span>
                </div>
            )}
        </div>
    )
}

interface FloatingVoiceAssistantProps {
    isOpen: boolean
    onClose: () => void
    onAsk: (question: string) => Promise<string>
    title?: string
}

export function FloatingVoiceAssistant({
    isOpen,
    onClose,
    onAsk,
    title = 'Voice Assistant',
}: FloatingVoiceAssistantProps) {
    const [isListening, setIsListening] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [response, setResponse] = useState('')
    const [language, setLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN')
    const [autoSpeak, setAutoSpeak] = useState(true)
    const [showSettings, setShowSettings] = useState(false)
    
    const recognitionRef = useRef<any>(null)
    const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = false
            recognitionRef.current.interimResults = true
            recognitionRef.current.lang = language

            recognitionRef.current.onresult = (event: any) => {
                const transcriptText = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result: any) => result.transcript)
                    .join('')
                
                setTranscript(transcriptText)

                if (event.results[0].isFinal) {
                    setIsListening(false)
                    handleAsk(transcriptText)
                }
            }

            recognitionRef.current.onerror = () => {
                setIsListening(false)
            }

            recognitionRef.current.onend = () => {
                setIsListening(false)
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort()
            }
            window.speechSynthesis.cancel()
        }
    }, [language])

    // Update recognition language when it changes
    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = language
        }
    }, [language])

    const speakText = useCallback((text: string) => {
        if (!autoSpeak) return

        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.lang = language

        // Try to find appropriate voice
        const voices = window.speechSynthesis.getVoices()
        const voice = voices.find(v => v.lang.startsWith(language.split('-')[0]))
        if (voice) utterance.voice = voice

        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)

        synthRef.current = utterance
        window.speechSynthesis.speak(utterance)
    }, [autoSpeak, language])

    const stopSpeaking = () => {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
    }

    const handleAsk = async (question: string) => {
        if (!question.trim()) return

        setIsProcessing(true)
        setResponse('')

        try {
            const answer = await onAsk(question)
            setResponse(answer)
            speakText(answer)
        } catch (error) {
            const errorMsg = "Sorry, I couldn't process that. Please try again."
            setResponse(errorMsg)
            speakText(errorMsg)
        } finally {
            setIsProcessing(false)
        }
    }

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition not supported in your browser')
            return
        }

        if (isSpeaking) {
            stopSpeaking()
        }

        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        } else {
            setTranscript('')
            setResponse('')
            recognitionRef.current.start()
            setIsListening(true)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-purple-900/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Assistant Card */}
            <div className="relative w-full max-w-md">
                {/* Close & Settings */}
                <div className="absolute -top-12 right-0 flex items-center gap-2">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="absolute -top-32 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 w-64">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Settings</h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Auto-speak</span>
                                <button
                                    onClick={() => setAutoSpeak(!autoSpeak)}
                                    className={`w-10 h-5 rounded-full transition-colors ${autoSpeak ? 'bg-blue-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${autoSpeak ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Language</span>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as 'en-IN' | 'hi-IN')}
                                    className="text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                                >
                                    <option value="en-IN">English</option>
                                    <option value="hi-IN">हिन्दी</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center">
                    {/* Animated Avatar */}
                    <div className="relative w-32 h-32 mx-auto mb-6">
                        {/* Outer rings */}
                        <div className={`absolute inset-0 rounded-full border-4 border-white/20 ${isListening || isSpeaking ? 'animate-ping' : ''}`} />
                        <div className={`absolute inset-2 rounded-full border-2 border-white/30 ${isProcessing ? 'animate-spin' : ''}`} />
                        
                        {/* Core avatar */}
                        <div className={`absolute inset-4 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-2xl ${
                            isSpeaking ? 'animate-pulse' : ''
                        }`}>
                            <Bot className={`w-12 h-12 text-white ${isListening ? 'animate-bounce' : ''}`} />
                        </div>

                        {/* Voice waves when speaking */}
                        {isSpeaking && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                    <div 
                                        key={i}
                                        className="w-1.5 bg-white rounded-full animate-pulse"
                                        style={{ 
                                            height: `${Math.random() * 20 + 8}px`,
                                            animationDelay: `${i * 0.1}s`,
                                            animationDuration: '0.5s'
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {title}
                    </h2>

                    {/* Status */}
                    <p className="text-white/70 mb-6">
                        {isListening && '🎤 I\'m listening...'}
                        {isProcessing && '🤔 Let me think...'}
                        {isSpeaking && '🔊 Speaking...'}
                        {!isListening && !isProcessing && !isSpeaking && '👋 Tap the mic to ask'}
                    </p>

                    {/* Transcript */}
                    {transcript && (
                        <div className="bg-white/10 rounded-xl p-4 mb-4 text-left">
                            <p className="text-xs text-white/50 mb-1">You said:</p>
                            <p className="text-white">{transcript}</p>
                        </div>
                    )}

                    {/* Response */}
                    {response && (
                        <div className="bg-white/10 rounded-xl p-4 mb-4 text-left max-h-40 overflow-y-auto">
                            <p className="text-xs text-white/50 mb-1">Assistant:</p>
                            <p className="text-white text-sm leading-relaxed">{response}</p>
                        </div>
                    )}

                    {/* Mic Button */}
                    <button
                        onClick={toggleListening}
                        disabled={isProcessing}
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all mx-auto ${
                            isListening 
                                ? 'bg-gradient-to-br from-red-500 to-pink-600 scale-110 shadow-2xl shadow-red-500/50' 
                                : isProcessing
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:scale-105 shadow-xl'
                        }`}
                    >
                        {isProcessing ? (
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        ) : isListening ? (
                            <>
                                <span className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-30" />
                                <MicOff className="w-8 h-8 text-white relative z-10" />
                            </>
                        ) : (
                            <Mic className="w-8 h-8 text-white" />
                        )}
                    </button>

                    {/* Language Indicator */}
                    <div className="mt-4 flex items-center justify-center gap-2 text-white/50 text-sm">
                        <Globe className="w-4 h-4" />
                        {language === 'en-IN' ? 'English' : 'हिन्दी'}
                    </div>

                    {/* Stop Speaking Button */}
                    {isSpeaking && (
                        <button
                            onClick={stopSpeaking}
                            className="mt-4 px-4 py-2 rounded-full bg-white/20 text-white text-sm hover:bg-white/30 transition-colors"
                        >
                            <VolumeX className="w-4 h-4 inline mr-2" />
                            Stop Speaking
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
