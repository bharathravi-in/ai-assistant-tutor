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
    Bot,
    Hand,
    BookOpen,
    Zap,
    Lightbulb,
    MessageSquare,
    Target
} from 'lucide-react'
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition'
import { useTextToSpeech } from '../../hooks/useTextToSpeech'
import { useChatStore } from '../../stores/chatStore'
import { aiApi } from '../../services/api'
import { useAppLanguages } from '../../hooks/useAppLanguages'

interface VoiceAssistantProps {
    isOpen: boolean
    onClose: () => void
}

export default function VoiceAssistant({ isOpen, onClose }: VoiceAssistantProps) {
    const { i18n } = useTranslation()
    const { mode, setLoading, setResponse, setError } = useChatStore()
    const { languages, changeLanguage } = useAppLanguages()

    const [textInput, setTextInput] = useState('')
    const [showLanguages, setShowLanguages] = useState(false)
    const [currentQuery, setCurrentQuery] = useState('')
    const [liveTranscript, setLiveTranscript] = useState('')
    const [aiResponse, setAiResponse] = useState('')
    const [structuredData, setStructuredData] = useState<any>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [autoSpeak, setAutoSpeak] = useState(true)
    const inputRef = useRef<HTMLInputElement>(null)

    // Load saved voice settings from localStorage
    const [voiceSettings, setVoiceSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('teacherSettings')
            if (saved) {
                const parsed = JSON.parse(saved)
                return {
                    rate: parsed.voiceRate || 1,
                    pitch: parsed.voicePitch || 1,
                    autoPlay: parsed.autoPlayResponse || true
                }
            }
        } catch (e) {
            console.error('Failed to load voice settings:', e)
        }
        return { rate: 1, pitch: 1, autoPlay: true }
    })

    // Reload settings on mount and when window regains focus
    useEffect(() => {
        const loadSettings = () => {
            try {
                const saved = localStorage.getItem('teacherSettings')
                if (saved) {
                    const parsed = JSON.parse(saved)
                    setVoiceSettings({
                        rate: parsed.voiceRate || 1,
                        pitch: parsed.voicePitch || 1,
                        autoPlay: parsed.autoPlayResponse !== false
                    })
                    setAutoSpeak(parsed.autoPlayResponse !== false)
                }
            } catch (e) {
                console.error('Failed to reload settings:', e)
            }
        }

        loadSettings()
        window.addEventListener('focus', loadSettings)
        return () => window.removeEventListener('focus', loadSettings)
    }, [])

    const {
        isListening,
        transcript,
        interimTranscript,
        isSupported: voiceSupported,
        startListening,
        stopListening,
        resetTranscript
    } = useVoiceRecognition({
        language: i18n.language,
        continuous: true,
        interimResults: true,
    })

    const {
        isSpeaking,
        speak,
        stop: stopSpeaking
    } = useTextToSpeech({
        language: i18n.language,
        rate: voiceSettings.rate,
        pitch: voiceSettings.pitch,
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

    const handleVoiceInput = useCallback(async (text: string) => {
        if (!text.trim()) return
        const languageCommand = detectLanguageCommand(text.toLowerCase())
        if (languageCommand) {
            handleLanguageChange(languageCommand)
            return
        }
        await processQuery(text)
    }, [])

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

    const handleLanguageChange = (lang: string) => {
        changeLanguage(lang)
        const langInfo = languages.find(l => l.code === lang)
        const langName = langInfo?.native_name || lang
        const message = lang === 'en'
            ? `Language changed to English`
            : `भाषा ${langName} में बदल गई`

        setAiResponse(message)
        setStructuredData(null)
        setCurrentQuery('')
        setLiveTranscript('')
        if (autoSpeak) {
            setTimeout(() => speak(message), 300)
        }
    }

    const processQuery = async (text: string) => {
        setCurrentQuery(text)
        setLiveTranscript('')
        setIsProcessing(true)
        setAiResponse('')
        setStructuredData(null)

        try {
            const response = await aiApi.ask({
                mode,
                input_text: text,
                language: i18n.language,
            })

            const contentToSpeak = extractTextForSpeech(response)
            setAiResponse(response.content)
            setStructuredData(response.structured)
            setResponse(response)

            if (autoSpeak && contentToSpeak) {
                setTimeout(() => speak(contentToSpeak), 100)
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

    // Defensive speech extraction
    const extractTextForSpeech = (response: any): string => {
        if (!response?.structured) return response?.content || ''

        const structured = response.structured

        // Priority order for speech - avoid speaking raw JSON
        if (structured.simple_explanation && typeof structured.simple_explanation === 'string')
            return structured.simple_explanation
        if (structured.conceptual_briefing && typeof structured.conceptual_briefing === 'string')
            return structured.conceptual_briefing
        if (structured.immediate_action && typeof structured.immediate_action === 'string')
            return structured.immediate_action
        if (structured.understanding && typeof structured.understanding === 'string')
            return structured.understanding

        // Handle case where content might be truncated JSON
        const content = response?.content || ''
        if (content.trim().startsWith('{') || content.trim().startsWith('```json') || content.trim().startsWith("'''json")) {
            return 'I have some teaching ideas ready for you. Please check the screen.'
        }

        return content
    }

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (textInput.trim() && !isProcessing) {
            processQuery(textInput)
            setTextInput('')
        }
    }

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening()
        } else {
            resetTranscript()
            setCurrentQuery('')
            setAiResponse('')
            setStructuredData(null)
            setLiveTranscript('')
            startListening()
        }
    }, [isListening, stopListening, resetTranscript, startListening])

    const handleClose = useCallback(() => {
        stopListening()
        stopSpeaking()
        setAiResponse('')
        setStructuredData(null)
        setCurrentQuery('')
        setLiveTranscript('')
        onClose()
    }, [stopListening, stopSpeaking, onClose])

    const RenderValue = ({ value }: { value: any }) => {
        if (value === null || value === undefined) return null

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return <>{value.toString()}</>
        }

        if (Array.isArray(value)) {
            return (
                <ul className="space-y-1">
                    {value.map((item, i) => (
                        <li key={i} className="text-sm text-white/70 flex gap-2">
                            <span className="text-blue-400">•</span>
                            <div className="flex-1"><RenderValue value={item} /></div>
                        </li>
                    ))}
                </ul>
            )
        }

        if (typeof value === 'object') {
            return (
                <div className="space-y-2">
                    {Object.entries(value).map(([key, val], i) => (
                        <div key={i} className="text-sm">
                            {key && !/^\d+$/.test(key) && (
                                <span className="font-bold text-white/40 uppercase text-[10px] block mb-0.5">
                                    {key.replace(/_/g, ' ')}
                                </span>
                            )}
                            <div className="text-white/70">
                                <RenderValue value={val} />
                            </div>
                        </div>
                    ))}
                </div>
            )
        }

        return null
    }

    if (!isOpen) return null

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0]

    // Helper to check if we have actual structured pedagogical data (any mode)
    const hasStructuredContent = structuredData && (
        // Explain mode fields
        structuredData.conceptual_briefing ||
        structuredData.simple_explanation ||
        structuredData.what_to_say ||
        structuredData.mnemonics_hooks ||
        // Assist mode fields
        structuredData.immediate_action ||
        structuredData.understanding ||
        structuredData.quick_activity ||
        structuredData.bridge_the_gap ||
        structuredData.check_progress ||
        // Math solution fields
        structuredData.problem_statement ||
        structuredData.solution_steps ||
        structuredData.final_answer ||
        // Plan mode fields
        structuredData.learning_objectives ||
        structuredData.activities ||
        structuredData.exit_questions
    );

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1c3070 0%, #264092 50%, #373434 100%)' }}>
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ background: 'rgba(239, 149, 30, 0.2)' }} />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ background: 'rgba(246, 153, 83, 0.15)', animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: 'rgba(38, 64, 146, 0.3)' }} />
            </div>

            <header className="relative z-10 flex items-center justify-between p-4 lg:p-6">
                <button onClick={handleClose} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="hidden sm:inline">Back</span>
                </button>
                <div className="flex items-center gap-2">
                    <Bot className="w-6 h-6 text-purple-300" />
                    <h1 className="text-xl font-bold text-white">AI Teaching Assistant</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button onClick={() => setShowLanguages(!showLanguages)} className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
                            <Globe className="w-4 h-4" />
                            <span className="text-sm">{currentLang?.native_name || 'English'}</span>
                        </button>
                        {showLanguages && (
                            <div className="absolute right-0 top-full mt-2 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl py-2 min-w-[160px] border border-white/20">
                                {languages.map((lang) => (
                                    <button key={lang.code} onClick={() => { handleLanguageChange(lang.code); setShowLanguages(false); }} className={`w-full px-4 py-2.5 text-left hover:bg-white/10 transition-colors flex items-center gap-2 ${i18n.language === lang.code ? 'text-purple-300 font-medium' : 'text-white/80'}`}>
                                        <span>🇮🇳</span>
                                        <span>{lang.native_name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={() => setAutoSpeak(!autoSpeak)} className={`p-2.5 rounded-full transition-all ${autoSpeak ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/50'}`} title={autoSpeak ? 'Voice on' : 'Voice off'}>
                        {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            <main className="relative z-10 flex flex-col items-center justify-start min-h-[calc(100vh-200px)] px-4 pt-10 overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar pb-24">
                <div className="flex flex-col items-center mb-10 shrink-0">
                    <div className="relative mb-6">
                        {isListening && (
                            <>
                                <div className="absolute inset-0 -m-4 rounded-full border-4 border-red-400/50 animate-ping" />
                                <div className="absolute inset-0 -m-8 rounded-full border-2 border-red-400/30 animate-ping" style={{ animationDelay: '0.3s' }} />
                                <div className="absolute inset-0 -m-12 rounded-full border border-red-400/20 animate-ping" style={{ animationDelay: '0.6s' }} />
                            </>
                        )}
                        {isSpeaking && (
                            <>
                                <div className="absolute inset-0 -m-4 rounded-full border-4 border-green-400/50 animate-ping" />
                                <div className="absolute inset-0 -m-8 rounded-full border-2 border-green-400/30 animate-ping" style={{ animationDelay: '0.3s' }} />
                            </>
                        )}

                        <div className={`
                            relative w-32 h-32 lg:w-40 lg:h-40 rounded-full
                            bg-gradient-to-br from-purple-500 via-indigo-500 to-violet-600
                            flex items-center justify-center
                            shadow-2xl shadow-purple-500/50
                            transition-all duration-300
                            ${isListening ? 'scale-110 ring-4 ring-red-400/50' : ''}
                            ${isSpeaking ? 'ring-4 ring-green-400/50' : ''}
                        `}>
                            <div className="text-5xl lg:text-6xl text-white">
                                {isProcessing ? (<Loader2 className="w-12 h-12 lg:w-16 lg:h-16 animate-spin" />) : isListening ? (<Mic className="w-12 h-12 lg:w-16 lg:h-16" />) : isSpeaking ? (<Volume2 className="w-12 h-12 lg:w-16 lg:h-16" />) : (<Bot className="w-12 h-12 lg:w-16 lg:h-16" />)}
                            </div>
                        </div>

                        <div className={`
                            absolute -bottom-2 left-1/2 -translate-x-1/2
                            px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                            ${isListening ? 'bg-red-500 text-white' : isSpeaking ? 'bg-green-500 text-white' : isProcessing ? 'bg-amber-500 text-black' : 'bg-white/20 text-white/80'}
                        `}>
                            {isListening ? 'Listening' : isSpeaking ? 'Speaking' : isProcessing ? 'Thinking' : 'Ready'}
                        </div>

                        {isSpeaking && (
                            <button onClick={() => { stopSpeaking(); setTimeout(() => { resetTranscript(); setCurrentQuery(''); setAiResponse(''); setStructuredData(null); setLiveTranscript(''); startListening(); }, 200); }} className="absolute -right-20 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group">
                                <div className="p-4 rounded-2xl bg-amber-500 text-white shadow-lg animate-bounce transform hover:scale-110 transition-transform">
                                    <Hand className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Raise Hand</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="w-full max-w-2xl space-y-6">
                    {(isListening || liveTranscript || interimTranscript) && (
                        <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 animate-slide-up">
                            <p className="text-white text-xl text-center italic opacity-80">
                                {liveTranscript || interimTranscript || (isListening ? 'Ask your question...' : '')}
                            </p>
                        </div>
                    )}

                    {aiResponse && (
                        <div className="animate-slide-up space-y-4">
                            {currentQuery && (
                                <div className="text-center mb-6">
                                    <span className="text-xs text-white/40 uppercase font-bold tracking-[0.2em] block mb-2">Question</span>
                                    <p className="text-white text-xl font-light">"{currentQuery}"</p>
                                </div>
                            )}

                            <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                                {hasStructuredContent ? (
                                    <div className="space-y-6">
                                        {structuredData.understanding && (
                                            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 italic text-purple-200 text-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <MessageSquare className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">AI Understanding</span>
                                                </div>
                                                <div className="leading-relaxed">
                                                    <RenderValue value={structuredData.understanding} />
                                                </div>
                                            </div>
                                        )}
                                        {structuredData.conceptual_briefing && (
                                            <div>
                                                <div className="flex items-center gap-2 text-indigo-300 mb-2">
                                                    <BookOpen className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">Lesson Insight</span>
                                                </div>
                                                <div className="text-white text-lg leading-relaxed">
                                                    <RenderValue value={structuredData.conceptual_briefing} />
                                                </div>
                                            </div>
                                        )}
                                        {structuredData.immediate_action && (
                                            <div className="p-4 bg-amber-500/20 rounded-2xl border border-amber-500/30">
                                                <div className="flex items-center gap-2 text-amber-300 mb-2">
                                                    <Zap className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">Do This Now</span>
                                                </div>
                                                <div className="text-white font-medium">
                                                    <RenderValue value={structuredData.immediate_action} />
                                                </div>
                                            </div>
                                        )}
                                        {(structuredData.simple_explanation || structuredData.mnemonics_hooks) && (
                                            <div className="pt-4 border-t border-white/10 space-y-4">
                                                {structuredData.simple_explanation && (
                                                    <div>
                                                        <div className="flex items-center gap-2 text-emerald-300 mb-2">
                                                            <Lightbulb className="w-4 h-4" />
                                                            <span className="text-xs font-bold uppercase tracking-widest">How to teach</span>
                                                        </div>
                                                        <div className="text-white/80 leading-relaxed">
                                                            <RenderValue value={structuredData.simple_explanation} />
                                                        </div>
                                                    </div>
                                                )}
                                                {structuredData.mnemonics_hooks && (
                                                    <div className="bg-white/5 rounded-xl p-3 space-y-2">
                                                        <div className="flex items-center gap-2 text-blue-300">
                                                            <Target className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Hooks & Mnemonics</span>
                                                        </div>
                                                        <RenderValue value={structuredData.mnemonics_hooks} />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {structuredData.what_to_say && (
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Teacher Talk</span>
                                                <div className="text-white/90 italic">
                                                    <RenderValue value={structuredData.what_to_say} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Assist mode - Additional fields */}
                                        {structuredData.quick_activity && (
                                            <div className="p-4 bg-green-500/20 rounded-2xl border border-green-500/30">
                                                <div className="flex items-center gap-2 text-green-300 mb-2">
                                                    <Zap className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">Quick Activity</span>
                                                </div>
                                                <div className="text-white">
                                                    <RenderValue value={structuredData.quick_activity} />
                                                </div>
                                            </div>
                                        )}
                                        {structuredData.bridge_the_gap && (
                                            <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                                                <div className="flex items-center gap-2 text-indigo-300 mb-2">
                                                    <Target className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">Bridge to Lesson</span>
                                                </div>
                                                <div className="text-white/90">
                                                    <RenderValue value={structuredData.bridge_the_gap} />
                                                </div>
                                            </div>
                                        )}
                                        {structuredData.check_progress && (
                                            <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                                                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest mb-1 block">Check Progress</span>
                                                <div className="text-white/80 text-sm">
                                                    <RenderValue value={structuredData.check_progress} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Math Solution fields */}
                                        {structuredData.problem_statement && (
                                            <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                                                <div className="flex items-center gap-2 text-blue-300 mb-2">
                                                    <BookOpen className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">Problem</span>
                                                </div>
                                                <div className="text-white">
                                                    <RenderValue value={structuredData.problem_statement} />
                                                </div>
                                            </div>
                                        )}
                                        {structuredData.solution_steps && (
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Solution Steps</span>
                                                <div className="text-white/90">
                                                    <RenderValue value={structuredData.solution_steps} />
                                                </div>
                                            </div>
                                        )}
                                        {structuredData.final_answer && (
                                            <div className="p-4 bg-green-500/20 rounded-2xl border border-green-500/30">
                                                <span className="text-xs font-bold text-green-300 uppercase tracking-widest mb-2 block">Final Answer</span>
                                                <div className="text-white text-lg font-medium">
                                                    <RenderValue value={structuredData.final_answer} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Plan Mode fields */}
                                        {structuredData.learning_objectives && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-blue-300">
                                                    <Target className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">Learning Objectives</span>
                                                </div>
                                                <div className="text-white/90">
                                                    <RenderValue value={structuredData.learning_objectives} />
                                                </div>
                                            </div>
                                        )}
                                        {structuredData.activities && Array.isArray(structuredData.activities) && (
                                            <div className="space-y-3">
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Activities</span>
                                                {structuredData.activities.map((activity: any, idx: number) => (
                                                    <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/10">
                                                        <div className="font-medium text-white mb-1">
                                                            {idx + 1}. {activity.activity_name || activity.name}
                                                            {activity.duration_minutes && (
                                                                <span className="text-white/50 text-sm ml-2">({activity.duration_minutes} min)</span>
                                                            )}
                                                        </div>
                                                        {activity.description && (
                                                            <div className="text-white/70 text-sm">{activity.description}</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {structuredData.exit_questions && (
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Exit Questions</span>
                                                <div className="text-white/80">
                                                    <RenderValue value={structuredData.exit_questions} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                                            {aiResponse.trim().startsWith('{') || aiResponse.trim().startsWith('```') || aiResponse.trim().startsWith("'''")
                                                ? 'I have detailed teaching aids ready for you. You can see the full breakdown in your teacher dashboard.'
                                                : aiResponse}
                                        </p>
                                        {(aiResponse.trim().startsWith('{') || aiResponse.trim().startsWith('```')) && (
                                            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-200 text-xs flex items-center gap-2">
                                                <Zap className="w-4 h-4" />
                                                <span>Showing raw analysis below:</span>
                                            </div>
                                        )}
                                        {(aiResponse.trim().startsWith('{') || aiResponse.trim().startsWith('```')) && (
                                            <pre className="text-[10px] text-white/40 overflow-hidden text-ellipsis whitespace-pre-wrap max-h-32">
                                                {aiResponse}
                                            </pre>
                                        )}
                                    </div>
                                )}

                                {isSpeaking && (
                                    <button onClick={stopSpeaking} className="mt-6 w-full py-3 rounded-2xl bg-white/20 text-white font-bold hover:bg-white/30 transition-all flex items-center justify-center gap-2">
                                        <VolumeX className="w-5 h-5" />
                                        Stop Speaking
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 z-20 pb-8 px-6">
                <div className="max-w-xl mx-auto">
                    <div className="flex items-center gap-3 p-2 pr-4 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl focus-within:bg-white/15 transition-all">
                        <button type="button" onClick={toggleListening} disabled={!voiceSupported || isProcessing} className={`p-4 rounded-full transition-all duration-500 flex-shrink-0 ${isListening ? 'bg-red-500 text-white scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'} disabled:opacity-50`}>
                            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>
                        <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-2">
                            <input ref={inputRef} type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder={isListening ? "Listening..." : "Type your question..."} className="flex-1 bg-transparent text-white placeholder-white/30 outline-none px-2 font-medium" disabled={isProcessing || isListening} />
                            <button type="submit" disabled={!textInput.trim() || isProcessing} className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-20 transition-all">
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </footer>
        </div>
    )
}
