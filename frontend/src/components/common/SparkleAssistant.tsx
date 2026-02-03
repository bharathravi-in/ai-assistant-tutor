import { useState, useRef, useEffect, useCallback } from 'react'
import {
    Sparkles,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    X,
    Send,
    Loader2,
    MessageCircle,
    Minimize2,
    Pause
} from 'lucide-react'
import { useTTS } from '../../hooks/useTTS'

interface SparkleAssistantProps {
    resourceTitle?: string
    resourceContent?: string
    onAsk: (question: string) => Promise<string>
    isOpen: boolean
    onClose: () => void
}

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

// Animated avatar states
type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking'

export default function SparkleAssistant({
    resourceTitle,
    onAsk,
    isOpen,
    onClose,
}: SparkleAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [avatarState, setAvatarState] = useState<AvatarState>('idle')
    const [isListening, setIsListening] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [autoSpeak, setAutoSpeak] = useState(true)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const recognitionRef = useRef<any>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const { speak, stop, isSpeaking } = useTTS()

    // Sync avatar state with speaking status
    useEffect(() => {
        if (isSpeaking) {
            setAvatarState('speaking')
        } else if (avatarState === 'speaking') {
            setAvatarState('idle')
        }
    }, [isSpeaking])

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = false
            recognitionRef.current.interimResults = true
            recognitionRef.current.lang = 'en-IN'

            recognitionRef.current.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result: any) => result.transcript)
                    .join('')

                setInput(transcript)

                if (event.results[0].isFinal) {
                    setIsListening(false)
                    setAvatarState('idle')
                }
            }

            recognitionRef.current.onerror = () => {
                setIsListening(false)
                setAvatarState('idle')
            }

            recognitionRef.current.onend = () => {
                setIsListening(false)
                setAvatarState('idle')
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort()
            }
            stop()
        }
    }, [stop])

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Initial greeting when opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting = resourceTitle
                ? `Hi! I'm Sparkle, your AI learning assistant. I can help you understand "${resourceTitle}" better. Ask me anything about this resource, or I can explain specific concepts in detail!`
                : `Hi! I'm Sparkle, your AI teaching assistant. How can I help you today?`

            addMessage('assistant', greeting)
            if (autoSpeak) {
                speakText(greeting)
            }
        }
    }, [isOpen, resourceTitle])

    const addMessage = (role: 'user' | 'assistant', content: string) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role,
            content,
            timestamp: new Date()
        }])
    }

    const speakText = useCallback((text: string) => {
        if (!autoSpeak) return

        // Strip markdown before speaking
        const plainText = text
            .replace(/#+\s/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/^-\s/gm, '')
            .trim()

        speak(plainText, { language: 'auto' })
    }, [autoSpeak, speak])

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in your browser')
            return
        }

        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
            setAvatarState('idle')
        } else {
            stop()
            recognitionRef.current.start()
            setIsListening(true)
            setAvatarState('listening')
        }
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()

        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        setInput('')
        addMessage('user', userMessage)

        setIsLoading(true)
        setAvatarState('thinking')

        try {
            const response = await onAsk(userMessage)
            addMessage('assistant', response)

            if (autoSpeak) {
                speakText(response)
            } else {
                setAvatarState('idle')
            }
        } catch (error) {
            addMessage('assistant', "I'm sorry, I encountered an error. Please try again.")
            setAvatarState('idle')
        } finally {
            setIsLoading(false)
        }
    }

    const quickQuestions = resourceTitle ? [
        "Summarize this in simple terms",
        "What are the key concepts?",
        "How can I use this in class?",
        "Give me a practical example"
    ] : [
        "Help me plan a lesson",
        "How to handle classroom noise?",
        "Explain fractions simply",
        "Activity for slow learners"
    ]

    if (!isOpen) return null

    return (
        <div className={`fixed z-50 transition-all duration-300 ${isMinimized
            ? 'bottom-4 right-4 w-16 h-16'
            : 'bottom-4 right-4 w-[420px] h-[600px] max-h-[80vh]'
            }`}>
            {isMinimized ? (
                // Minimized floating button
                <button
                    onClick={() => setIsMinimized(false)}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-2xl flex items-center justify-center animate-pulse hover:scale-110 transition-transform"
                >
                    <Sparkles className="w-8 h-8 text-white" />
                </button>
            ) : (
                // Full assistant panel
                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Animated Avatar */}
                            <div className={`relative w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ${avatarState === 'speaking' ? 'animate-pulse' : ''
                                }`}>
                                <div className={`absolute inset-0 rounded-full ${avatarState === 'listening' ? 'animate-ping bg-white/30' : ''
                                    }`} />
                                <div className={`absolute inset-0 rounded-full ${avatarState === 'thinking' ? 'animate-spin border-2 border-white/30 border-t-white' : ''
                                    }`} style={{ animationDuration: '1s' }} />
                                <Sparkles className={`w-6 h-6 text-white relative z-10 ${avatarState === 'speaking' ? 'animate-bounce' : ''
                                    }`} />
                                {/* Speaking indicator waves */}
                                {avatarState === 'speaking' && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div
                                                key={i}
                                                className="w-1 bg-white rounded-full animate-pulse"
                                                style={{
                                                    height: `${Math.random() * 12 + 4}px`,
                                                    animationDelay: `${i * 0.1}s`
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-white font-semibold flex items-center gap-2">
                                    Sparkle
                                    <span className={`w-2 h-2 rounded-full ${avatarState === 'idle' ? 'bg-green-400' :
                                        avatarState === 'listening' ? 'bg-red-400 animate-pulse' :
                                            avatarState === 'thinking' ? 'bg-yellow-400 animate-pulse' :
                                                'bg-blue-400 animate-pulse'
                                        }`} />
                                </h3>
                                <p className="text-white/70 text-xs">
                                    {avatarState === 'idle' && 'Ready to help'}
                                    {avatarState === 'listening' && 'Listening...'}
                                    {avatarState === 'thinking' && 'Thinking...'}
                                    {avatarState === 'speaking' && 'Speaking...'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setAutoSpeak(!autoSpeak)}
                                className={`p-2 rounded-lg transition-colors ${autoSpeak ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                                    }`}
                                title={autoSpeak ? 'Disable voice' : 'Enable voice'}
                            >
                                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <Minimize2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-50/50 to-white dark:from-gray-900 dark:to-gray-900">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant'
                                    ? 'bg-gradient-to-br from-violet-500 to-purple-500'
                                    : 'bg-gray-200 dark:bg-gray-700'
                                    }`}>
                                    {msg.role === 'assistant'
                                        ? <Sparkles className="w-4 h-4 text-white" />
                                        : <MessageCircle className="w-4 h-4 text-gray-500" />
                                    }
                                </div>
                                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === 'assistant'
                                    ? 'bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                                    : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
                                    }`}>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    {msg.role === 'assistant' && (
                                        <button
                                            onClick={() => speakText(msg.content)}
                                            className="mt-2 flex items-center gap-1 text-xs text-purple-500 hover:text-purple-600"
                                        >
                                            <Volume2 className="w-3 h-3" />
                                            Listen
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                                </div>
                                <div className="bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 px-4 py-3 rounded-2xl">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map(i => (
                                                <div
                                                    key={i}
                                                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                                                    style={{ animationDelay: `${i * 0.15}s` }}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-400">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions */}
                    {messages.length <= 1 && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                            <div className="flex flex-wrap gap-2">
                                {quickQuestions.map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setInput(q)
                                            setTimeout(() => handleSubmit(), 100)
                                        }}
                                        className="px-3 py-1.5 text-xs bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-purple-400 hover:text-purple-600 transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={toggleListening}
                                className={`p-3 rounded-xl transition-all ${isListening
                                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-purple-100 hover:text-purple-500'
                                    }`}
                            >
                                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>

                            <div className="flex-1 relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isListening ? 'Listening...' : 'Type or speak your question...'}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                                    disabled={isLoading}
                                />
                            </div>

                            {isSpeaking ? (
                                <button
                                    type="button"
                                    onClick={stop}
                                    className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                                >
                                    <Pause className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="p-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
