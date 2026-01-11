import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    Send,
    Globe,
    ArrowLeft,
    Loader2,
    Sparkles,
    AlertCircle
} from 'lucide-react'
import { useVoiceRecognition, SPEECH_LANGUAGES } from '../../hooks/useVoiceRecognition'
import { useTextToSpeech } from '../../hooks/useTextToSpeech'
import { useChatStore } from '../../stores/chatStore'
import { aiApi } from '../../services/api'

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
]

interface VoiceAssistantProps {
    isOpen: boolean
    onClose: () => void
}

export default function VoiceAssistant({ isOpen, onClose }: VoiceAssistantProps) {
    const { t, i18n } = useTranslation()
    const { mode, setLoading, setResponse, setError } = useChatStore()

    const [textInput, setTextInput] = useState('')
    const [showLanguages, setShowLanguages] = useState(false)
    const [currentQuery, setCurrentQuery] = useState('')
    const [liveTranscript, setLiveTranscript] = useState('')
    const [aiResponse, setAiResponse] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [autoSpeak, setAutoSpeak] = useState(true)
    const inputRef = useRef<HTMLInputElement>(null)

    // Voice recognition hook - MUST be called before any conditional returns
    const {
        isListening,
        transcript,
        interimTranscript,
        error: voiceError,
        isSupported: voiceSupported,
        startListening,
        stopListening,
        resetTranscript
    } = useVoiceRecognition({
        language: i18n.language,
        continuous: true,
        interimResults: true,
    })

    // Text-to-speech hook - MUST be called before any conditional returns
    const {
        isSpeaking,
        isSupported: ttsSupported,
        speak,
        stop: stopSpeaking
    } = useTextToSpeech({
        language: i18n.language,
        rate: 0.95,
    })

    // Update live transcript display
    useEffect(() => {
        if (interimTranscript) {
            setLiveTranscript(interimTranscript)
        }
    }, [interimTranscript])

    // Handle final transcript
    useEffect(() => {
        if (transcript && !isListening) {
            handleVoiceInput(transcript)
        }
    }, [transcript, isListening])

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    // Handle voice input
    const handleVoiceInput = useCallback(async (text: string) => {
        if (!text.trim()) return

        // Check for language change commands
        const languageCommand = detectLanguageCommand(text.toLowerCase())
        if (languageCommand) {
            changeLanguage(languageCommand)
            return
        }

        await processQuery(text)
    }, [])

    // Detect language change commands
    const detectLanguageCommand = (text: string): string | null => {
        const patterns = [
            { regex: /change.*language.*to\s*(hindi|हिंदी)/i, lang: 'hi' },
            { regex: /change.*language.*to\s*(english)/i, lang: 'en' },
            { regex: /change.*language.*to\s*(tamil|தமிழ்)/i, lang: 'ta' },
            { regex: /change.*language.*to\s*(telugu|తెలుగు)/i, lang: 'te' },
            { regex: /change.*language.*to\s*(kannada|ಕನ್ನಡ)/i, lang: 'kn' },
            { regex: /change.*language.*to\s*(marathi|मराठी)/i, lang: 'mr' },
            { regex: /भाषा.*बदलो|भाषा.*बदलें|हिंदी में बोलो/i, lang: 'hi' },
        ]

        for (const { regex, lang } of patterns) {
            if (regex.test(text)) return lang
        }
        return null
    }

    // Change language
    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang)
        const langName = SUPPORTED_LANGUAGES.find(l => l.code === lang)?.nativeName || lang
        const message = lang === 'en'
            ? `Language changed to English`
            : `भाषा ${langName} में बदल गई`

        setAiResponse(message)
        setCurrentQuery('')
        setLiveTranscript('')
        if (autoSpeak) {
            setTimeout(() => speak(message), 300)
        }
    }

    // Process query to AI
    const processQuery = async (text: string) => {
        setCurrentQuery(text)
        setLiveTranscript('')
        setIsProcessing(true)
        setAiResponse('')

        try {
            const response = await aiApi.ask({
                mode,
                input_text: text,
                language: i18n.language,
            })

            const content = extractMainContent(response)
            setAiResponse(content)
            setResponse(response)

            if (autoSpeak && content) {
                setTimeout(() => speak(content), 300)
            }
        } catch (err) {
            const errorMsg = 'Sorry, I could not process your request. Please try again.'
            setAiResponse(errorMsg)
            setError(errorMsg)
            if (autoSpeak) {
                speak(errorMsg)
            }
        } finally {
            setIsProcessing(false)
            setLoading(false)
        }
    }

    // Extract main content from AI response for speaking
    const extractMainContent = (response: any): string => {
        if (!response?.structured) {
            return response?.content || ''
        }

        const structured = response.structured

        if (structured.simple_explanation) {
            return structured.simple_explanation +
                (structured.what_to_say ? ` You can say: ${structured.what_to_say}` : '')
        }

        if (structured.immediate_action) {
            return structured.immediate_action +
                (structured.management_strategy ? ` ${structured.management_strategy}` : '')
        }

        if (structured.learning_objectives) {
            return `Today's objectives are: ${structured.learning_objectives.join(', ')}`
        }

        return response?.content || ''
    }

    // Handle text submit
    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (textInput.trim() && !isProcessing) {
            processQuery(textInput)
            setTextInput('')
        }
    }

    // Toggle listening
    const toggleListening = useCallback(() => {
        console.log('Toggle listening, current state:', isListening)
        if (isListening) {
            stopListening()
        } else {
            resetTranscript()
            setCurrentQuery('')
            setAiResponse('')
            setLiveTranscript('')
            startListening()
        }
    }, [isListening, stopListening, resetTranscript, startListening])

    // Close handler
    const handleClose = useCallback(() => {
        stopListening()
        stopSpeaking()
        setAiResponse('')
        setCurrentQuery('')
        setLiveTranscript('')
        onClose()
    }, [stopListening, stopSpeaking, onClose])

    // ALL HOOKS MUST BE ABOVE THIS LINE - conditional render below
    if (!isOpen) return null

    const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0]

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between p-4 lg:p-6">
                <button
                    onClick={handleClose}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="hidden sm:inline">Back</span>
                </button>

                <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-300" />
                    <h1 className="text-xl font-bold text-white">AI Teaching Assistant</h1>
                </div>

                <div className="flex items-center gap-3">
                    {/* Language selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLanguages(!showLanguages)}
                            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                        >
                            <Globe className="w-4 h-4" />
                            <span className="text-sm">{currentLang.nativeName}</span>
                        </button>
                        {showLanguages && (
                            <div className="absolute right-0 top-full mt-2 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl py-2 min-w-[160px] border border-white/20">
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            changeLanguage(lang.code)
                                            setShowLanguages(false)
                                        }}
                                        className={`w-full px-4 py-2.5 text-left hover:bg-white/10 transition-colors flex items-center gap-2 ${i18n.language === lang.code
                                                ? 'text-purple-300 font-medium'
                                                : 'text-white/80'
                                            }`}
                                    >
                                        <span>{lang.flag}</span>
                                        <span>{lang.nativeName}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Auto-speak toggle */}
                    <button
                        onClick={() => setAutoSpeak(!autoSpeak)}
                        className={`p-2.5 rounded-full transition-all ${autoSpeak
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/10 text-white/50'
                            }`}
                        title={autoSpeak ? 'Voice on' : 'Voice off'}
                    >
                        {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
                {/* Avatar with animations */}
                <div className="relative mb-6">
                    {/* Outer ring animations when listening */}
                    {isListening && (
                        <>
                            <div className="absolute inset-0 -m-4 rounded-full border-4 border-red-400/50 animate-ping" />
                            <div className="absolute inset-0 -m-8 rounded-full border-2 border-red-400/30 animate-ping" style={{ animationDelay: '0.3s' }} />
                            <div className="absolute inset-0 -m-12 rounded-full border border-red-400/20 animate-ping" style={{ animationDelay: '0.6s' }} />
                        </>
                    )}

                    {/* Sound waves when speaking */}
                    {isSpeaking && (
                        <>
                            <div className="absolute inset-0 -m-4 rounded-full border-4 border-green-400/50 animate-ping" />
                            <div className="absolute inset-0 -m-8 rounded-full border-2 border-green-400/30 animate-ping" style={{ animationDelay: '0.3s' }} />
                        </>
                    )}

                    {/* Main avatar circle */}
                    <div className={`
                        relative w-36 h-36 lg:w-44 lg:h-44 rounded-full
                        bg-gradient-to-br from-purple-500 via-indigo-500 to-violet-600
                        flex items-center justify-center
                        shadow-2xl shadow-purple-500/50
                        transition-all duration-300
                        ${isListening ? 'scale-110 ring-4 ring-red-400/50' : ''}
                        ${isSpeaking ? 'ring-4 ring-green-400/50' : ''}
                    `}>
                        <div className="text-6xl lg:text-7xl">
                            {isProcessing ? '🤔' : isListening ? '👂' : isSpeaking ? '🗣️' : '👩‍🏫'}
                        </div>
                    </div>

                    {/* Status indicator */}
                    <div className={`
                        absolute -bottom-2 left-1/2 -translate-x-1/2
                        px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                        ${isListening ? 'bg-red-500 text-white animate-pulse' :
                            isSpeaking ? 'bg-green-500 text-white' :
                                isProcessing ? 'bg-yellow-500 text-black' :
                                    'bg-white/20 text-white/80'}
                    `}>
                        {isListening ? '🔴 Listening...' :
                            isSpeaking ? '🟢 Speaking...' :
                                isProcessing ? '🟡 Thinking...' :
                                    '● Ready'}
                    </div>
                </div>

                {/* CLOSED CAPTIONS - Live Transcript Display */}
                <div className="w-full max-w-2xl mb-6 min-h-[80px]">
                    {/* CC Box - Always visible when listening */}
                    {(isListening || liveTranscript || interimTranscript) && (
                        <div className="relative p-4 rounded-2xl bg-black/50 backdrop-blur-lg border border-white/10">
                            <div className="absolute top-2 left-3 text-xs text-white/50 font-medium tracking-wider">
                                CC
                            </div>
                            <p className="text-white text-xl lg:text-2xl text-center pt-2 min-h-[40px]">
                                {liveTranscript || interimTranscript || (isListening ?
                                    <span className="text-white/50 italic">Listening... speak now</span> :
                                    ''
                                )}
                            </p>
                        </div>
                    )}

                    {/* Error display */}
                    {voiceError && (
                        <div className="mt-2 p-3 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center gap-2 text-red-300">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{voiceError}</p>
                        </div>
                    )}
                </div>

                {/* User query display */}
                {currentQuery && !isListening && (
                    <div className="w-full max-w-2xl mb-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                        <p className="text-white/60 text-sm mb-1">You asked:</p>
                        <p className="text-white text-lg">"{currentQuery}"</p>
                    </div>
                )}

                {/* AI Response */}
                {aiResponse && (
                    <div className="w-full max-w-2xl p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
                        <p className="text-white text-lg leading-relaxed">
                            {aiResponse}
                        </p>
                        {isSpeaking && (
                            <button
                                onClick={stopSpeaking}
                                className="mt-4 px-4 py-2 rounded-full bg-white/20 text-white text-sm hover:bg-white/30 transition-colors"
                            >
                                Stop speaking
                            </button>
                        )}
                    </div>
                )}

                {/* Processing indicator */}
                {isProcessing && (
                    <div className="flex items-center justify-center gap-3 text-white mt-4">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Processing your question...</span>
                    </div>
                )}

                {/* Initial prompt - only if nothing else is showing */}
                {!currentQuery && !aiResponse && !isListening && !isProcessing && !liveTranscript && (
                    <div className="text-center">
                        <p className="text-2xl lg:text-3xl font-light text-white mb-2">
                            {i18n.language === 'hi' ? 'नमस्ते! मैं आपकी कैसे मदद करूं?' : 'Hello! How can I help you?'}
                        </p>
                        <p className="text-white/60">
                            {i18n.language === 'hi' ? 'माइक बटन दबाएं और अपना सवाल पूछें' : 'Press the mic button and ask your question'}
                        </p>
                    </div>
                )}
            </main>

            {/* Bottom input area */}
            <footer className="fixed bottom-0 left-0 right-0 z-20 p-4 lg:p-6 bg-gradient-to-t from-slate-900/80 to-transparent">
                <div className="max-w-2xl mx-auto">
                    {/* Quick suggestions */}
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {[
                            { en: 'How to explain fractions?', hi: 'भिन्न कैसे समझाएं?' },
                            { en: 'Handle noisy classroom', hi: 'शोर कक्षा संभालें' },
                            { en: 'Science lesson plan', hi: 'विज्ञान पाठ योजना' },
                        ].map((suggestion) => (
                            <button
                                key={suggestion.en}
                                onClick={() => processQuery(i18n.language === 'hi' ? suggestion.hi : suggestion.en)}
                                disabled={isProcessing || isListening}
                                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm hover:bg-white/20 transition-colors disabled:opacity-50"
                            >
                                {i18n.language === 'hi' ? suggestion.hi : suggestion.en}
                            </button>
                        ))}
                    </div>

                    {/* Input area */}
                    <div className="flex items-center gap-3 p-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                        {/* Voice button */}
                        <button
                            type="button"
                            onClick={toggleListening}
                            disabled={!voiceSupported || isProcessing}
                            className={`
                                p-4 rounded-full transition-all duration-300 flex-shrink-0
                                ${isListening
                                    ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/50 animate-pulse'
                                    : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:scale-105 hover:shadow-lg'}
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                            title={isListening ? 'Stop listening' : 'Start listening'}
                        >
                            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>

                        {/* Text input */}
                        <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder={i18n.language === 'hi' ? "अपना सवाल टाइप करें..." : "Type your question..."}
                                className="flex-1 bg-transparent text-white placeholder-white/50 outline-none px-4 py-3"
                                disabled={isProcessing || isListening}
                            />

                            <button
                                type="submit"
                                disabled={!textInput.trim() || isProcessing}
                                className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white disabled:opacity-50 hover:scale-105 transition-transform flex-shrink-0"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>

                    {/* Voice support notice */}
                    {!voiceSupported && (
                        <p className="text-center text-white/50 text-sm mt-2">
                            Voice input not supported. Please use Chrome browser for best experience.
                        </p>
                    )}
                </div>
            </footer>
        </div>
    )
}
