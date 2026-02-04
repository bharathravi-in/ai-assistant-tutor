import React, { useState, useEffect, useRef } from 'react'
import {
    Play,
    Pause,
    SkipForward,
    SkipBack,
    MessageSquare,
    Send,
    Volume2,
    VolumeX,
    MessageCircle,
    Sparkles,
    ChevronDown,
    Camera,
    Mic,
    MoreHorizontal,
    Hand,
    History,
    RotateCcw,
    Settings,
    Languages,
    Square
} from 'lucide-react'
import { useTTS } from '../../hooks/useTTS'
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition'
import { tutorApi } from '../../services/api'
import MarkdownRenderer from '../common/MarkdownRenderer'

interface Section {
    id: string
    title: string
    type: string
    content: string
    narration: string
}

interface AITutorPanelProps {
    contentId: number
    sections: Section[]
    onSectionChange?: (sectionId: string) => void
    onLanguageChange?: (lang: string) => void
    language?: string
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
// Handles: "• item1 • item2 • item3" -> "- item1\n- item2\n- item3"
const formatContent = (text: string): string => {
    if (!text) return ''

    // Split by bullet character and filter empty strings
    const parts = text.split(/\s*[•●■▪]\s*/)

    // If there are multiple parts, it's an inline bullet list
    if (parts.length > 1) {
        const items = parts.filter(p => p.trim().length > 0)
        // Check if items are actual list items (short phrases)
        const averageLength = items.reduce((sum, item) => sum + item.length, 0) / items.length

        // Only convert if items are reasonably short (typically list items)
        if (averageLength < 200 && items.length > 1) {
            return items.map(item => `- ${item.trim()}`).join('\n')
        }
    }

    return text
}

// Sanitize AI response to handle errors and HTML content
const sanitizeResponse = (text: string): string => {
    if (!text) return 'No response received.'

    // Check for HTML error pages (502, 503, etc.)
    if (text.includes('<html') || text.includes('<!DOCTYPE') || text.includes('<head>')) {
        // Extract error message if possible
        const titleMatch = text.match(/<title>([^<]+)<\/title>/i)
        const h1Match = text.match(/<h1>([^<]+)<\/h1>/i)
        const errorMsg = h1Match?.[1] || titleMatch?.[1] || 'Service unavailable'
        return `The AI service is temporarily unavailable (${errorMsg}). Please try again in a moment.`
    }

    // Check for OpenAI exception messages
    if (text.includes('OpenAIException') || text.includes('Error generating response')) {
        return 'The AI service encountered an error. Please try again in a moment.'
    }

    return text
}

const AITutorPanel: React.FC<AITutorPanelProps> = ({ contentId, sections, onSectionChange, onLanguageChange, language = 'en' }) => {
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
    const [chatMessages, setChatMessages] = useState<any[]>([])
    const [userInput, setUserInput] = useState('')
    const [isThinking, setIsThinking] = useState(false)

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
    const [autoPlay] = useState(true)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isHandRaised, setIsHandRaised] = useState(false)
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
    const [isUserCamera, setIsUserCamera] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [languageToast, setLanguageToast] = useState<string | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    const { speak, stop, isSpeaking, isPaused, pause, resume } = useTTS()
    const {
        isListening,
        startListening,
        stopListening,
    } = useVoiceRecognition({
        language,
        onResult: (text, isFinal) => {
            if (isFinal) {
                handleSendMessage(text)
                setIsHandRaised(false)
            }
        },
        onEnd: () => {
            setIsHandRaised(false)
        }
    })
    const scrollRef = useRef<HTMLDivElement>(null)

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

        if (isUserCamera) {
            enableCamera();
        } else {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        }

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isUserCamera]);

    // Ensure we have a valid index if sections exist but index is out of bounds
    useEffect(() => {
        if (sections.length > 0 && currentSectionIndex >= sections.length) {
            setCurrentSectionIndex(0)
        }
    }, [sections, currentSectionIndex])

    const currentSection = sections.length > 0 ? sections[currentSectionIndex] : null

    // Narration effect
    useEffect(() => {
        if (autoPlay && currentSection && !isChatOpen && !isMuted) {
            const timer = setTimeout(() => {
                speak(currentSection.narration)
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [currentSectionIndex, autoPlay, isChatOpen, isMuted, speak, currentSection])

    // Auto-scroll chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [chatMessages])

    const handleNext = () => {
        if (currentSectionIndex < sections.length - 1) {
            const nextIdx = currentSectionIndex + 1
            setCurrentSectionIndex(nextIdx)
            onSectionChange?.(sections[nextIdx].id)
            stop()

            // Send command to AI to render content for the NEW section
            handleSendMessage(`Rendering Section: ${sections[nextIdx].title}`, true)
        }
    }

    const handleBack = () => {
        if (currentSectionIndex > 0) {
            const prevIdx = currentSectionIndex - 1
            setCurrentSectionIndex(prevIdx)
            onSectionChange?.(sections[prevIdx].id)
            stop()

            // Send command to AI to render content for the PREVIOUS section
            handleSendMessage(`Rendering Section: ${sections[prevIdx].title}`, true)
        }
    }


    const handleSendMessage = async (input?: string, silent = false) => {
        const messageText = typeof input === 'string' ? input : userInput
        if (!messageText.trim()) return

        const langIntent = detectLanguageIntent(messageText)
        if (langIntent && onLanguageChange && langIntent !== language) {
            onLanguageChange(langIntent)
            const langName = {
                'en': 'English',
                'hi': 'Hindi',
                'kn': 'Kannada',
                'te': 'Telugu',
                'ta': 'Tamil',
                'mr': 'Marathi'
            }[langIntent] || langIntent
            setLanguageToast(`Switched to ${langName}`)
            setTimeout(() => setLanguageToast(null), 3000)
        }

        if (!silent) {
            const userMsg = { role: 'user', content: messageText }
            setChatMessages(prev => [...prev, userMsg])
        }
        setUserInput('')
        setIsThinking(true)
        stop()

        try {
            const response = await tutorApi.chat({
                content_id: contentId,
                active_section_id: currentSection?.id || "unknown",
                section_index: currentSectionIndex,
                total_sections: sections.length,
                user_message: messageText,
                history: chatMessages.slice(-5),
                language: language
            })

            // Parse structured response with more resilience
            const rawResponse = response.answer
            let sectionId = ''
            let sectionContent = ''

            // Regex patterns for more robust extraction
            const idMatch = rawResponse.match(/SECTION_ID:\s*([^\n\r]+)/i)
            const contentMatch = rawResponse.match(/SECTION_CONTENT:([\s\S]+)/i)

            if (idMatch) sectionId = idMatch[1].trim()
            if (contentMatch) sectionContent = contentMatch[1].trim()

            // Fallback if structured parsing fails
            if (!sectionContent) {
                // If it doesn't follow the format at least we show the response to avoid "broken" experience
                sectionContent = rawResponse
            }

            // Validate Section ID (Strict SSOT) - only block if we have a mismatching ID
            // If ID is missing but content exists, we allow it (best effort)
            if (sectionId && currentSection?.id && sectionId !== currentSection.id) {
                console.warn(`[Sync Error] AI returned content for ${sectionId} but UI is on ${currentSection?.id}. Discarding mismatch.`)
                // In case of mismatch, we still want to show something so the user isn't stuck
                // But we'll label it as a sync warning in logs
                return
            }

            // Sanitize the response to handle HTML errors and format bullets
            const cleanedContent = sanitizeResponse(sectionContent)
            const formattedContent = formatContent(cleanedContent)

            // assistantMsg should be cleaned for speech but kept as markdown for chat
            const assistantMsg = { role: 'assistant', content: formattedContent }
            setChatMessages(prev => [...prev, assistantMsg])

            if (!isMuted) {
                speak(stripMarkdown(formattedContent))
            }
        } catch (error: any) {
            console.error('Tutor chat failed:', error)
            let errorMsg = "I'm sorry, I'm having trouble connecting right now."

            // Handle 502/HTML errors gracefully
            if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<html')) {
                errorMsg = "The AI service is temporarily unavailable (Bad Gateway). Please try again in a moment."
            } else if (error.message?.includes('502')) {
                errorMsg = "The AI service is temporarily unavailable (Bad Gateway). Please try again in a moment."
            }

            setChatMessages(prev => [...prev, { role: 'assistant', content: errorMsg }])
        } finally {
            setIsThinking(false)
        }
    }

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

            {/* Centered Raise Hand Question Overlay */}
            {isHandRaised && isListening && (
                <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-yellow-500/30 max-w-md w-full mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col items-center gap-6 text-center">
                            {/* Animated Mic Icon */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                                <div className="relative w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                                    <Mic className="w-10 h-10 text-white animate-pulse" />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Listening...</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Ask your question clearly. The AI will respond after you're done.</p>
                            </div>

                            <button
                                onClick={() => {
                                    stopListening()
                                    setIsHandRaised(false)
                                }}
                                className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Progress indicator */}
            <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-900 flex shrink-0">
                {sections.map((_, i) => (
                    <div
                        key={i}
                        className={`flex-1 h-full transition-all duration-500 ${i <= currentSectionIndex ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                    />
                ))}
            </div>

            {/* Floating User Camera Preview */}
            {isUserCamera && stream && (
                <div className="absolute bottom-32 right-4 z-50 animate-in slide-in-from-right-4 fade-in duration-500">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden">
                        <div className="p-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">You</span>
                            </div>
                            <button
                                onClick={() => setIsUserCamera(false)}
                                className="text-zinc-400 hover:text-red-500 transition-colors"
                                title="Close Camera"
                            >
                                <Square className="w-3 h-3 fill-current" />
                            </button>
                        </div>
                        <div className="w-32 h-24 relative">
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover scale-x-[-1]"
                            />
                            {isListening && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px] font-bold uppercase animate-pulse">
                                    Listening
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* User Avatar Fallback - when camera is off but listening */}
            {!isUserCamera && isListening && (
                <div className="absolute bottom-32 right-4 z-50 animate-in slide-in-from-right-4 fade-in duration-500">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden">
                        <div className="p-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-white/5 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Listening...</span>
                        </div>
                        <div className="w-32 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                            <div className="text-3xl font-black text-black">You</div>
                        </div>
                    </div>
                </div>
            )}


            {/* AI Avatar Section - Ultra Compact Premium */}
            <div className="px-4 py-3 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 backdrop-blur-md border-b border-zinc-100 dark:border-white/5 relative shrink-0">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        {isSpeaking && (
                            <div className="absolute inset-0 rounded-full bg-yellow-500/20 animate-pulse scale-110" />
                        )}
                        <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 ${isSpeaking ? 'border-yellow-500 shadow-gold' : 'border-zinc-200 dark:border-white/10'} transition-all duration-500 relative z-10 bg-zinc-100 dark:bg-black flex items-center justify-center`}>
                            {isUserCamera ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover scale-x-[-1]"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700 flex items-center justify-center text-black font-black text-xl">
                                    BR
                                </div>
                            )}
                            {isThinking && (
                                <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center backdrop-blur-[1px] z-20">
                                    <div className="flex gap-1 items-end h-3">
                                        <span className="w-1 bg-yellow-500 animate-[wave_1s_ease-in-out_infinite] h-full" />
                                        <span className="w-1 bg-yellow-500 animate-[wave_1s_ease-in-out_infinite_0.2s] h-1/2" />
                                        <span className="w-1 bg-yellow-500 animate-[wave_1s_ease-in-out_infinite_0.4s] h-3/4" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                            Bharath Ravi
                            <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'}`} />
                        </h3>
                        <p className="text-[8px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-[0.2em]">Educator • LIVE</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Stop Speaking Button - Shows only when AI is actively speaking (not paused) */}
                    {isSpeaking && !isPaused && (
                        <button
                            onClick={() => stop()}
                            className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-lg shadow-red-500/20 animate-in fade-in duration-300"
                            title="Stop Speaking"
                        >
                            <Square className="w-4 h-4 fill-current" />
                        </button>
                    )}

                    {/* Larger Mic & Camera Icons */}
                    <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/5 p-2 rounded-xl flex gap-3 shadow-sm">
                        <button
                            onClick={() => {
                                if (isListening) stopListening();
                                else startListening();
                            }}
                            className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                            title={isListening ? 'Stop Listening' : 'Start Listening'}
                        >
                            <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : 'text-zinc-500 dark:text-zinc-400'}`} />
                        </button>
                        <button
                            onClick={() => setIsUserCamera(!isUserCamera)}
                            className={`p-2 rounded-lg transition-all ${isUserCamera ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                            title={isUserCamera ? 'Disable Camera' : 'Enable Camera'}
                        >
                            <Camera className={`w-5 h-5 ${isUserCamera ? '' : 'text-zinc-500 dark:text-zinc-400'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-zinc-50/50 dark:bg-black/20">
                {!isChatOpen ? (
                    currentSection ? (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] uppercase tracking-[0.15em] font-black px-3 py-1 rounded-full ${currentSection?.type === 'activity' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                                    currentSection?.type === 'mnemonic' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30' :
                                        currentSection?.type === 'script' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 border border-yellow-500/30' :
                                            'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                                    }`}>
                                    {currentSection?.type}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                                    Step {currentSectionIndex + 1} / {sections.length}
                                </span>
                            </div>
                            <h4 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">
                                {currentSection?.title}
                            </h4>
                            <div className="prose dark:prose-invert prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-strong:text-yellow-600 dark:prose-strong:text-yellow-500 max-w-none text-base leading-relaxed transition-colors prose-ul:list-disc prose-li:my-1">
                                <MarkdownRenderer content={formatContent(currentSection?.content || '')} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-pulse">
                            <Sparkles className="w-16 h-16 text-zinc-200 dark:text-zinc-800 mb-6" />
                            <h4 className="text-xl font-black text-zinc-400 dark:text-white uppercase tracking-wider">Ready to begin</h4>
                            <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto mt-2 leading-relaxed">
                                Click the Play button below to start your personalized guided teaching session.
                            </p>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col h-full space-y-4">
                        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {chatMessages.length === 0 && (
                                <div className="text-center py-10 fade-in duration-500">
                                    <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-100 dark:border-white/5 shadow-xl transition-colors">
                                        <MessageCircle className="w-8 h-8 text-yellow-500" />
                                    </div>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Have a doubt? Ask me anything about this section.</p>
                                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                        {[
                                            "Explain this simply",
                                            "How to teach this?",
                                            "Give more examples"
                                        ].map(text => (
                                            <button
                                                key={text}
                                                type="button"
                                                onClick={() => { setUserInput(text); handleSendMessage(text) }}
                                                className="text-[11px] font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 hover:bg-yellow-500 hover:text-black text-zinc-500 dark:text-zinc-400 px-4 py-2 rounded-full transition-all duration-300 shadow-sm hover:shadow-gold"
                                            >
                                                "{text}"
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-yellow-500 text-black font-bold shadow-lg shadow-yellow-500/20 rounded-tr-none'
                                        : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 text-zinc-700 dark:text-zinc-200 shadow-md dark:shadow-xl rounded-tl-none prose-sm prose-p:my-1 prose-ul:list-disc dark:prose-invert'
                                        } transition-colors`}>
                                        <MarkdownRenderer content={msg.content} />
                                    </div>
                                </div>
                            ))}
                            {isThinking && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 p-4 rounded-2xl rounded-tl-none ring-1 ring-yellow-500/20 shadow-md dark:shadow-xl">
                                        <div className="flex gap-1.5">
                                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Interaction Bar - Floating Glassmorphic Premium */}
            <div className={`p-4 transition-all duration-500 relative ${isChatOpen ? 'bg-white dark:bg-zinc-900 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]' : 'bg-transparent'}`}>
                {/* Visual anchor for the floating bar in non-chat mode */}
                {!isChatOpen && (
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none" />
                )}
                {isChatOpen ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage() }} className="relative flex flex-col gap-3">
                        {/* Chat Context Controls */}
                        {!isListening && (
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                                <button
                                    type="button"
                                    onClick={() => handleNext()}
                                    disabled={currentSectionIndex === sections.length - 1}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-black rounded-full font-bold text-[10px] whitespace-nowrap hover:bg-yellow-400 disabled:opacity-30 transition-all shadow-md"
                                >
                                    <SkipForward className="w-3 h-3" />
                                    Next
                                </button>

                                <div className="w-[1px] h-3 bg-zinc-200 dark:bg-white/10 mx-0.5" />

                                {[
                                    { label: 'हिन्दी', code: 'hi' },
                                    { label: 'ಕನ್ನಡ', code: 'kn' },
                                    { label: 'English', code: 'en' }
                                ].map(lang => (
                                    <button
                                        key={lang.code}
                                        type="button"
                                        onClick={() => handleSendMessage(`Speak in ${lang.label}`)}
                                        className={`px-3 py-1.5 rounded-full font-bold text-[10px] whitespace-nowrap border transition-all ${language === lang.code ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-600 dark:text-yellow-500' : 'bg-white dark:bg-black border-zinc-100 dark:border-white/5 text-zinc-400 dark:text-zinc-500'}`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}

                                <div className="w-[1px] h-3 bg-zinc-200 dark:bg-white/10 mx-0.5" />

                                <button
                                    type="button"
                                    onClick={() => handleSendMessage("Repeat this section")}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-black text-zinc-500 dark:text-zinc-300 border border-zinc-200 dark:border-white/5 rounded-full font-bold text-[10px] whitespace-nowrap hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Repeat
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsChatOpen(false)}
                                className="p-2 text-zinc-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors bg-zinc-50 dark:bg-black rounded-lg border border-zinc-200 dark:border-white/5 shadow-sm active:scale-95 flex-shrink-0"
                            >
                                <ChevronDown className="w-5 h-5" />
                            </button>

                            {isListening ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        stopListening();
                                        setIsHandRaised(false);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest animate-pulse shadow-lg"
                                >
                                    <Mic className="w-4 h-4" />
                                    Stop Listening
                                </button>
                            ) : (
                                <>
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            placeholder="Type a question..."
                                            className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 shadow-inner"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isThinking || !userInput.trim()}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-yellow-600 dark:text-yellow-500 disabled:opacity-30 transition-all hover:scale-110"
                                        >
                                            <Send className="w-4 h-4 fill-current" />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                                        className={`p-2 transition-colors rounded-lg flex-shrink-0 ${isMoreMenuOpen ? 'text-yellow-600 dark:text-yellow-500 bg-yellow-500/10' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* More Menu Dropdown - Fixed Clipping with better positioning and z-index */}
                        {isMoreMenuOpen && (
                            <div className="absolute bottom-full right-4 mb-3 w-56 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[24px] shadow-2xl py-3 z-[100] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 ring-1 ring-black/5 dark:ring-white/5">
                                <div className="px-4 py-2 mb-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Lesson Controls</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setChatMessages([])
                                        setIsMoreMenuOpen(false)
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-yellow-500 hover:text-black transition-all flex items-center gap-3 font-bold"
                                >
                                    <div className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg group-hover:bg-black/10">
                                        <History className="w-4 h-4" />
                                    </div>
                                    Clear Conversation
                                </button>
                                <button
                                    onClick={() => {
                                        setCurrentSectionIndex(0)
                                        setIsMoreMenuOpen(false)
                                        setChatMessages([])
                                        stop()
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-yellow-500 hover:text-black transition-all flex items-center gap-3 font-bold"
                                >
                                    <div className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg group-hover:bg-black/10">
                                        <RotateCcw className="w-4 h-4" />
                                    </div>
                                    Restart Session
                                </button>
                                <div className="h-px bg-zinc-100 dark:bg-white/5 my-2 mx-3" />
                                <button
                                    onClick={() => {
                                        setIsMoreMenuOpen(false)
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all flex items-center gap-3 font-bold"
                                >
                                    <div className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg">
                                        <Settings className="w-4 h-4" />
                                    </div>
                                    Voice Preferences
                                </button>
                            </div>
                        )}
                    </form>
                ) : (
                    <div className="relative flex items-center justify-between w-full z-10">
                        {/* Navigation Group */}
                        <div className="flex items-center gap-1 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-2xl p-1.5 border border-zinc-200/50 dark:border-white/5 shadow-lg">
                            <button
                                onClick={handleBack}
                                disabled={currentSectionIndex === 0 || sections.length === 0}
                                className="p-2.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/10 rounded-xl disabled:opacity-5 transition-all active:scale-90"
                                title="Previous Section"
                            >
                                <SkipBack className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={currentSectionIndex === sections.length - 1 || sections.length === 0}
                                className="p-2.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/10 rounded-xl disabled:opacity-5 transition-all active:scale-90"
                                title="Next Section"
                            >
                                <SkipForward className="w-5 h-5" />
                            </button>
                        </div>

                        {/* AI Action Group (Center) */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    if (!currentSection) {
                                        if (sections.length > 0) {
                                            setCurrentSectionIndex(0)
                                            return;
                                        }
                                        return;
                                    }
                                    isPaused ? resume() : isSpeaking ? pause() : speak(currentSection.narration)
                                }}
                                disabled={sections.length === 0}
                                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-30 font-black text-[11px] uppercase tracking-wider ${isSpeaking && !isPaused ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-yellow-500 text-black shadow-gold'}`}
                            >
                                {isSpeaking && !isPaused ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                <span>{isSpeaking && !isPaused ? 'Pause' : isPaused ? 'Resume' : 'Play Lesson'}</span>
                            </button>

                            <button
                                onClick={() => {
                                    if (isListening) {
                                        stopListening()
                                        setIsHandRaised(false)
                                    } else {
                                        stop()
                                        setIsHandRaised(true)
                                        setIsChatOpen(true)
                                        startListening()
                                    }
                                }}
                                disabled={sections.length === 0}
                                className={`p-3.5 rounded-2xl transition-all shadow-lg border hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${isHandRaised || isListening
                                    ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20'
                                    : 'bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-zinc-200 dark:border-white/10 text-yellow-600 dark:text-yellow-500 hover:border-yellow-500/50 shadow-sm'
                                    }`}
                                title={isListening ? 'Listening...' : 'Raise Hand to Ask'}
                            >
                                <Hand className={`w-5 h-5 ${isHandRaised || isListening ? 'animate-pulse' : ''}`} />
                            </button>


                        </div>

                        {/* Utility Group (Right) */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`p-3.5 rounded-2xl transition-all border shadow-lg backdrop-blur-md ${isMuted ? 'text-red-500 bg-red-500/10 border-red-500/30' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white/80 dark:bg-black/20 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10'}`}
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => setIsChatOpen(true)}
                                className="p-3.5 bg-white/80 dark:bg-black/20 backdrop-blur-md border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:text-yellow-600 dark:hover:text-yellow-500 hover:border-yellow-500/30 rounded-2xl transition-all shadow-lg active:scale-95"
                                title="Open Chat"
                            >
                                <MessageSquare className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                                className={`p-3.5 rounded-2xl transition-all border shadow-lg backdrop-blur-md ${isMoreMenuOpen ? 'text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 border-yellow-500/30 shadow-gold/20' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white/80 dark:bg-black/20 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 shadow-sm'}`}
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Bottom Bar More Menu - Fixed Clipping */}
                        {isMoreMenuOpen && (
                            <div className="absolute bottom-full right-4 mb-3 w-56 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[24px] shadow-2xl py-3 z-[100] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                                <button
                                    onClick={() => {
                                        setIsChatOpen(true)
                                        setIsMoreMenuOpen(false)
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-yellow-500 hover:text-black transition-all font-bold flex items-center gap-3"
                                >
                                    <div className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg">
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    Open Chat
                                </button>
                                <button
                                    onClick={() => {
                                        setCurrentSectionIndex(0)
                                        setIsMoreMenuOpen(false)
                                        setChatMessages([])
                                        stop()
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-yellow-500 hover:text-black transition-all font-bold flex items-center gap-3"
                                >
                                    <div className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg">
                                        <RotateCcw className="w-4 h-4" />
                                    </div>
                                    Restart Session
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(128, 128, 128, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--color-primary);
                }
                @keyframes wave {
                    0%, 100% { height: 20%; }
                    50% { height: 100%; }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .fade-in {
                    animation: fade-in 0.5s ease-out;
                }
            `}} />
        </div >
    )
}

export default AITutorPanel
