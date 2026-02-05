import React, { useState, useEffect, useRef } from 'react'
import {
    MessageSquare,
    Send,
    Volume2,
    VolumeX,
    MessageCircle,
    Bot,
    ChevronDown,
    Camera,
    Mic,
    MoreHorizontal,
    History,
    RotateCcw,
    Languages,
    SkipForward
} from 'lucide-react'
import { useTTS } from '../../hooks/useTTS'
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition'
import { tutorApi } from '../../services/api'
import MarkdownRenderer from '../common/MarkdownRenderer'
import { useLessonStep } from '../../contexts/LessonStepContext'

interface AITutorPanelProps {
    contentId: number
}

// Utility to strip markdown formatting for TTS and clean display
const stripMarkdown = (text: string): string => {
    if (!text) return ''
    return text
        .replace(/<[^>]*>/g, '')             // HTML tags
        .replace(/[#*_~`]/g, '')             // Basic markdown 
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Links
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '')   // Images
        .replace(/^[>-]\s+/gm, '')           // Blockquotes/Lists
        .replace(/\n\s*\n/g, '\n')           // Extra newlines
        .trim()
}

// Utility to convert inline bullet points to proper markdown list format
const formatContent = (text: string): string => {
    if (!text) return ''
    // If text is very long and has few bullet points, try to break it up
    if (text.length > 300 && !text.includes('\n- ') && !text.includes('\n* ')) {
        return text.replace(/\. /g, '.\n\n')
    }
    const parts = text.split(/\s*[•●■▪]\s*/)
    if (parts.length > 1) {
        const items = parts.filter(p => p.trim().length > 0)
        return items.map(item => `- ${item.trim()}`).join('\n')
    }
    return text
}

// Sanitize AI response to handle errors and HTML content
const sanitizeResponse = (text: string): string => {
    if (!text) return 'No response received.'
    // Preserve detailed error messages from the backend
    if (text.startsWith('Error generating response:') || text.startsWith('Tutor chat error:') || text.includes('apologize, but I cannot answer that')) {
        return text
    }
    if (text.includes('<html') || text.includes('<!DOCTYPE') || text.includes('<head>')) {
        const titleMatch = text.match(/<title>([^<]+)<\/title>/i)
        const h1Match = text.match(/<h1>([^<]+)<\/h1>/i)
        const errorMsg = h1Match?.[1] || titleMatch?.[1] || 'Service unavailable'
        return `The AI service is temporarily unavailable (${errorMsg}). Please try again in a moment.`
    }
    const clean = text.replace(/```\w*\n?/g, '').trim()
    return clean
}

const AITutorPanel: React.FC<AITutorPanelProps> = ({ contentId }) => {
    const { state, actions, currentStep } = useLessonStep()
    const { steps, currentStepIndex, audioState } = state

    const [chatMessages, setChatMessages] = useState<any[]>([])
    const [userInput, setUserInput] = useState('')
    const [isThinking, setIsThinking] = useState(false)
    const [isChatOpen, setIsChatOpen] = useState(true)
    const [isMuted, setIsMuted] = useState(false)
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
    const [isUserCamera, setIsUserCamera] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [languageToast, setLanguageToast] = useState<string | null>(null)
    const [isPreparing, setIsPreparing] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const lastLanguage = useRef(state.language)

    const { speak, stop } = useTTS()

    const recognition = useVoiceRecognition({
        language: state.language,
        onResult: (text: string, isFinal: boolean) => {
            if (isFinal && text.trim()) {
                recognition.stopListening()
                actions.setAskAIActive(false)
                handleSendMessage(text)
            }
        },
        onEnd: () => {
            actions.setAskAIActive(false)
        }
    })

    const { isListening, stopListening } = recognition

    // Camera Handlers
    useEffect(() => {
        let currentStream: MediaStream | null = null;
        async function enableCamera() {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                setStream(s);
                currentStream = s;
                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                }
            } catch (err) {
                console.error("Camera access denied:", err);
                setIsUserCamera(false);
            }
        }
        if (isUserCamera) enableCamera();
        else if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        return () => {
            if (currentStream) currentStream.getTracks().forEach(track => track.stop());
        };
    }, [isUserCamera]);

    // Auto-scroll chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [chatMessages])

    // Auto-trigger voice recognition when Ask AI is activated from control bar
    useEffect(() => {
        if (state.isAskAIActive && !recognition.isListening) {
            recognition.startListening();
        } else if (!state.isAskAIActive && recognition.isListening) {
            recognition.stopListening();
        }
    }, [state.isAskAIActive, recognition.isListening, recognition.startListening, recognition.stopListening]);

    // Session Lifecycle Reset on Language Change
    useEffect(() => {
        if (state.language !== lastLanguage.current) {
            setChatMessages([]);
            setIsPreparing(true);
            lastLanguage.current = state.language;

            // Trigger localized welcome
            const timer = setTimeout(() => {
                const welcomeMessages: Record<string, string> = {
                    'hi': `नमस्ते! मैं आपका हिंदी सहायक हूँ। मैं "${currentStep?.title || 'इस भाग'}" समझाने में आपकी मदद करूँगा। क्या हम शुरू करें?`,
                    'en': `Hello! I'm your assistant for this section. I'll help you understand "${currentStep?.title || 'the content'}" simply. Shall we begin?`,
                    'kn': `ನಮಸ್ತೆ! ನಾನು ನಿಮ್ಮ ಕನ್ನಡ ಸಹಾಯಕ. "${currentStep?.title || 'ಈ ಭಾಗ'}"ವನ್ನು ಸರಳವಾಗಿ ವಿವರಿಸಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ. ಪ್ರಾರಂಭಿಸೋಣವೇ?`,
                    'te': `నమస్తే! నేను మీ తెలుగు సహాయకుడిని. "${currentStep?.title || 'ఈ విభాగం'}" అర్థం చేసుకోవడంలో నేను మీకు సహాయం చేస్తాను. ప్రారంభిద్దామా?`,
                    'ta': `வணக்கம்! நான் உங்கள் தமிழ் உதவியாளர். "${currentStep?.title || 'இந்தப் பகுதி'}" புரிந்துகொள்ள நான் உங்களுக்கு உதவுகிறேன். தொடங்கலாமா?`,
                    'mr': `नमस्ते! मी तुमचा मराठी सहाय्यक आहे. मी "${currentStep?.title || 'हा भाग'}" समजून घेण्यास मदत करेन. सुरू करायचे?`
                };

                setChatMessages([{
                    role: 'assistant',
                    content: welcomeMessages[state.language] || welcomeMessages['en']
                }]);
                setIsPreparing(false);
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [state.language, currentStep?.title]);

    const detectLanguageIntent = (message: string) => {
        const lower = message.toLowerCase()
        if (lower.includes('hindi') || lower.includes('हिंदी')) return 'hi'
        if (lower.includes('english')) return 'en'
        if (lower.includes('kannada') || lower.includes('ಕನ್ನಡ')) return 'kn'
        if (lower.includes('telugu') || lower.includes('తెలుగు')) return 'te'
        if (lower.includes('tamil') || lower.includes('தமிழ்')) return 'ta'
        if (lower.includes('marathi') || lower.includes('मराठी')) return 'mr'
        return null
    }

    const detectNavigationIntent = (message: string) => {
        const lower = message.toLowerCase()
        const nextKeywords = [
            'next', 'continue', 'move on', 'go forward', 'skip',
            'अगला', 'आगे', 'चलिए', 'अगले भाग',
            'அடுத்த', 'தொடரவும்',
            'తరువాత', 'కొనసాగించండి',
            'ಮುಂದಿನ', 'ಮುಂದುವರಿಸಿ',
            'पुढील', 'पुढे चला'
        ]
        if (nextKeywords.some(keyword => lower.includes(keyword))) return 'next'
        return null
    }

    const handleSendMessage = async (input?: string, silent = false) => {
        if (isPreparing) return
        const messageText = typeof input === 'string' ? input : userInput
        if (!messageText.trim()) return

        const langIntent = detectLanguageIntent(messageText)
        let effectiveLanguage = state.language;

        if (langIntent && langIntent !== state.language) {
            actions.setLanguage(langIntent)
            effectiveLanguage = langIntent; // Use immediately for this request
            const langName = {
                'en': 'English', 'hi': 'Hindi', 'kn': 'Kannada', 'te': 'Telugu', 'ta': 'Tamil', 'mr': 'Marathi'
            }[langIntent] || langIntent
            setLanguageToast(`Switched to ${langName}`)
            setTimeout(() => setLanguageToast(null), 3000)
        }

        if (!silent) {
            setChatMessages(prev => [...prev, { role: 'user', content: messageText }])
            setIsChatOpen(true)
        }
        setUserInput('')
        setIsThinking(true)
        stop()

        const navIntent = detectNavigationIntent(messageText)
        let targetSectionId = currentStep?.id || "unknown"
        let targetSectionContent = currentStep?.content || ""
        let targetSectionIndex = currentStepIndex

        // If user wants to go next, sync the player and use the NEXT section's context for the AI
        if (navIntent === 'next' && currentStepIndex < steps.length - 1) {
            console.log("🔄 [AI Sync] Navigation 'next' detected. Syncing player...")
            const nextIdx = currentStepIndex + 1
            const nextStep = steps[nextIdx]

            // 1. Advance the player (Left side)
            actions.nextStep()

            // 2. Prepare context for AI (using the section we just moved to)
            targetSectionId = nextStep.id
            targetSectionContent = nextStep.content
            targetSectionIndex = nextIdx
        }

        try {
            const response = await tutorApi.chat({
                content_id: contentId,
                active_section_id: targetSectionId,
                active_section_content: targetSectionContent,
                section_index: targetSectionIndex,
                total_sections: steps.length,
                user_message: messageText,
                history: chatMessages.slice(-5),
                language: effectiveLanguage
            })

            const sectionContent = sanitizeResponse(response.answer)
            const formattedContent = formatContent(sectionContent)

            setChatMessages(prev => [...prev, { role: 'assistant', content: formattedContent }])
            if (!isMuted) speak(stripMarkdown(formattedContent))
        } catch (error: any) {
            console.error('Tutor chat failed:', error)
            setChatMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now." }])
        } finally {
            setIsThinking(false)
        }
    }

    const guidanceStatus = audioState === 'PLAYING'
        ? "🔊 I'm explaining this section now. Follow along on the left."
        : audioState === 'PAUSED'
            ? "⏸️ Paused. Click Resume when you're ready to continue."
            : "👋 Ready to explain. Click Play to start the lesson."

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black text-zinc-900 dark:text-white border-l border-zinc-200 dark:border-white/5 shadow-2xl relative overflow-hidden font-sans transition-colors duration-300">
            {/* Language Switch Toast */}
            {languageToast && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-yellow-500 text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2">
                        <Languages className="w-3 h-3" />
                        {languageToast}
                    </div>
                </div>
            )}

            {/* Centered Raise Hand Overlay */}
            {state.isAskAIActive && isListening && (
                <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-yellow-500/30 max-w-md w-full mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 text-center space-y-6">
                        <div className="relative mx-auto w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                            <Mic className="w-10 h-10 text-white animate-pulse" />
                            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Listening...</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Ask your question clearly.</p>
                        </div>
                        <button onClick={() => { stopListening(); actions.setAskAIActive(false) }} className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl transition-all">Cancel</button>
                    </div>
                </div>
            )}

            {/* Progress indicator */}
            <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-900 flex shrink-0">
                {steps.map((_, i) => (
                    <div key={i} className={`flex-1 h-full transition-all duration-500 ${i <= currentStepIndex ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                ))}
            </div>

            {/* AI Avatar Section */}
            <div className="px-4 py-3 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 backdrop-blur-md border-b border-zinc-100 dark:border-white/5 relative shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-white/10 transition-all duration-500 relative z-10 bg-zinc-100 dark:bg-black flex items-center justify-center">
                        <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-black text-xl">BR</div>
                        {isThinking && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center backdrop-blur-[1px] z-20">
                                <span className="w-1 h-3 bg-yellow-500 animate-[wave_1s_ease-in-out_infinite]" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                            Bharath Ravi
                            <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        </h3>
                        <p className="text-[8px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-[0.2em]">Educator • LIVE</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsUserCamera(!isUserCamera)} className={`p-2 rounded-lg transition-all ${isUserCamera ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                        <Camera className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-zinc-50/50 dark:bg-black/20">
                {!isChatOpen ? (
                    currentStep ? (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-[0.15em] font-black px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-600 border border-yellow-500/30">
                                    {currentStep.type}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                                    Step {currentStepIndex + 1} / {steps.length}
                                </span>
                            </div>
                            <h4 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">{currentStep.title}</h4>
                            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/10 rounded-2xl p-4 border border-yellow-200/50 dark:border-yellow-500/20 flex items-start gap-3">
                                <Bot className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Synchronized</span>
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{isPreparing ? (
                                        state.language === 'hi' ? 'तैयार हो रहा है...' : 'Preparing...'
                                    ) : guidanceStatus}</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">"I am following the {currentStep.title} section with you."</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setIsChatOpen(true)}
                                    disabled={!currentStep?.content}
                                    title={!currentStep?.content ? "Loading section context..." : "Ask a question about this section"}
                                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-purple-600 transition-all disabled:opacity-50"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />Ask a question
                                </button>
                                <button
                                    onClick={() => handleSendMessage('Give me more examples')}
                                    disabled={!currentStep?.content}
                                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-blue-600 transition-all text-left disabled:opacity-50"
                                >
                                    More examples
                                </button>
                                {state.language !== 'hi' && (
                                    <button
                                        onClick={() => handleSendMessage('Explain this in Hindi')}
                                        disabled={!currentStep?.content}
                                        className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/20 rounded-xl text-xs font-bold text-yellow-700 dark:text-yellow-500 hover:bg-yellow-100 transition-all text-left disabled:opacity-50"
                                    >
                                        Explain in Hindi
                                    </button>
                                )}
                                {state.language !== 'en' && (
                                    <button
                                        onClick={() => handleSendMessage('Explain this in English')}
                                        disabled={!currentStep?.content}
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-500 hover:bg-blue-100 transition-all text-left disabled:opacity-50"
                                    >
                                        Explain in English
                                    </button>
                                )}
                                <button
                                    onClick={() => handleSendMessage('Explain this more simply')}
                                    disabled={!currentStep?.content || isPreparing}
                                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-green-600 transition-all text-left disabled:opacity-50"
                                >
                                    Simplify
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 text-zinc-400 space-y-4">
                            <Bot className="w-16 h-16 animate-pulse" />
                            <p className="text-sm font-bold uppercase tracking-widest">Ready to Begin</p>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col h-full space-y-4">
                        {/* Focus Breadcrumb */}
                        {currentStep && (
                            <div className="px-4 py-2 bg-zinc-100 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Asking about:</span>
                                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">{currentStep.title}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-500 tracking-tighter">Teaching Language: {
                                        state.language === 'hi' ? 'हिंदी' :
                                            state.language === 'en' ? 'English' :
                                                state.language === 'ta' ? 'தமிழ்' :
                                                    state.language === 'te' ? 'తెలుగు' :
                                                        state.language === 'kn' ? 'ಕನ್ನಡ' : state.language
                                    }</span>
                                </div>
                            </div>
                        )}

                        <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                                    {msg.role === 'tutor' && (
                                        <span className="text-[9px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-2 ml-4"> Guru Assistant {state.language === 'hi' ? '(Hindi)' : '(English)'}</span>
                                    )}
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-yellow-500 text-black font-bold' : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 text-zinc-700 dark:text-zinc-200 shadow-sm'}`}>
                                        <MarkdownRenderer content={msg.content} />
                                    </div>
                                </div>
                            ))}
                            {isThinking && (
                                <div className="flex flex-col items-start gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 animate-pulse ml-4">Guru is thinking...</span>
                                    <div className="flex gap-1.5 p-4 bg-white dark:bg-zinc-950 rounded-2xl w-fit">
                                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Interaction Area */}
            <div className="p-4 bg-white dark:bg-black border-t border-zinc-200 dark:border-white/5">
                {isChatOpen ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage() }} className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <button type="button" disabled={!currentStep} onClick={actions.nextStep} className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-black rounded-full font-bold text-[10px] whitespace-nowrap shadow-md disabled:opacity-30"><SkipForward className="w-3 h-3" />Next</button>
                            <button type="button" disabled={!currentStep} onClick={() => handleSendMessage("Repeat this section")} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-full font-bold text-[10px] whitespace-nowrap border dark:border-white/5 disabled:opacity-30"><RotateCcw className="w-3 h-3" />Repeat</button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setIsChatOpen(false)} className="p-2 text-zinc-400 bg-zinc-50 dark:bg-black rounded-lg border border-zinc-200 dark:border-white/5 shadow-sm"><ChevronDown className="w-5 h-5" /></button>
                            <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder={isPreparing ? "Initializing..." : "Type a question..."} disabled={isPreparing} className="flex-1 bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-yellow-500 disabled:opacity-50" />
                            <button type="submit" disabled={isThinking || isPreparing || !userInput.trim()} className="p-2 text-yellow-600 disabled:opacity-30"><Send className="w-5 h-5" /></button>
                        </div>
                    </form>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-lg ${isMuted ? 'text-red-500 bg-red-500/10' : 'text-zinc-400'}`}>
                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <button onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} className="p-2 text-zinc-400 relative">
                                <MoreHorizontal className="w-5 h-5" />
                                {isMoreMenuOpen && (
                                    <div className="absolute bottom-full left-0 mb-3 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-[100] ring-1 ring-black/5">
                                        <button onClick={() => { setChatMessages([]); setIsMoreMenuOpen(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl font-bold flex items-center gap-3 text-zinc-600 dark:text-zinc-400"><History className="w-4 h-4" />Clear Chat</button>
                                        <button onClick={() => { actions.goToStep(0); setIsMoreMenuOpen(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl font-bold flex items-center gap-3 text-zinc-600 dark:text-zinc-400"><RotateCcw className="w-4 h-4" />Restart Lesson</button>
                                    </div>
                                )}
                            </button>
                        </div>
                        <button onClick={() => setIsChatOpen(true)} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-purple"><MessageCircle className="w-4 h-4" />Open Chat</button>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.2); border-radius: 10px; }
                @keyframes wave { 0%, 100% { height: 20%; } 50% { height: 100%; } }
            `}} />
        </div>
    )
}

export default AITutorPanel
