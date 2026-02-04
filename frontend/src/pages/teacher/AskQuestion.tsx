import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    Send,
    Loader2,
    Bot,
    ChevronRight,
    Lightbulb,
    Clock,
    Users,
    X,
    Star,
    AlertCircle,
    Zap,
    Mic,
    MicOff,
    RefreshCw,
    FileQuestion,
    Palette,
    ShieldCheck,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Copy,
    FileDown,
    Printer,
    Languages,
    GraduationCap,
    UserCircle2,
    Presentation,
    BookPlus,
    Volume2,
    VolumeX
} from 'lucide-react'
import { aiApi, teacherApi } from '../../services/api'
import useTranslation from '../../hooks/useTranslation'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { useMasterData } from '../../hooks/useMasterData'

import StructuredAIResponse from '../../components/common/StructuredAIResponse'
import TLMRenderer from '../../components/common/TLMRenderer'
import ExportToolbar from '../../components/common/ExportToolbar'
import TeachNowMode from '../../components/teacher/TeachNowMode'
import SaveAsContentModal from '../../components/common/SaveAsContentModal'
import { FloatingVoiceAssistant } from '../../components/common/VoiceAssistant'

type QueryMode = 'explain' | 'assist' | 'plan'

interface AIResponseData {
    content?: string
    structured?: any
    query_type?: 'topic_based' | 'general'
    query_id?: number
    mode?: string
}

interface QuizQuestion {
    question: string
    type?: 'mcq' | 'fill_in_blank' | 'true_false'
    options?: string[]
    correct_answer?: string
    answer?: string
}

interface DisplayPrompt {
    icon: any
    text: string
    mode: QueryMode
}

const queryModes = [
    {
        id: 'explain' as QueryMode,
        icon: Lightbulb,
        label: 'Explain Topic',
        description: 'Get clear explanations',
        gradient: 'from-[#007AFF] to-[#00C6FF]',
        shadow: 'shadow-blue-500/20',
        color: '#007AFF'
    },
    {
        id: 'assist' as QueryMode,
        icon: Users,
        label: 'Classroom Help',
        description: 'Handle challenges',
        gradient: 'from-[#34C759] to-[#30D158]',
        shadow: 'shadow-green-500/20',
        color: '#34C759'
    },
    {
        id: 'plan' as QueryMode,
        icon: Clock,
        label: 'Plan Lesson',
        description: 'Create lesson plans',
        gradient: 'from-[#5856D6] to-[#AF52DE]',
        shadow: 'shadow-purple-500/20',
        color: '#5856D6'
    },
]

const defaultQuickPrompts: DisplayPrompt[] = [
    { icon: Lightbulb, text: 'Explain photosynthesis for Class 6', mode: 'explain' },
    { icon: Clock, text: 'Create a 40-min lesson plan for Fractions', mode: 'plan' },
    { icon: Users, text: 'How to handle a noisy classroom?', mode: 'assist' },
    { icon: Star, text: 'Make learning fun for Class 5', mode: 'explain' },
]

// Student persona options
const personaOptions = [
    { id: 'standard', label: 'Standard', description: 'Normal teaching approach' },
    { id: 'slow_learner', label: 'Slow Learner', description: 'More repetition, simpler words' },
    { id: 'visual_learner', label: 'Visual Learner', description: 'Focus on diagrams & examples' },
    { id: 'first_gen', label: 'First-Gen Learner', description: 'Extra context & patience' },
    { id: 'exam_focused', label: 'Exam-Focused', description: 'Key points & practice questions' },
]

// Language options for response
const languageOptions = [
    { id: 'en', label: 'English', flag: '🇬🇧' },
    { id: 'hi', label: 'Hindi', flag: '🇮🇳' },
    { id: 'kn', label: 'Kannada', flag: '🇮🇳' },
    { id: 'te', label: 'Telugu', flag: '🇮🇳' },
    { id: 'mixed', label: 'Mixed', flag: '🌐' },
]

const getStringContent = (content: any): string => {
    if (!content) return ''
    if (typeof content === 'string') return content
    if (typeof content === 'object') {
        return content.content || content.text || content.response || JSON.stringify(content, null, 2)
    }
    return String(content)
}

export default function AskQuestion() {
    const [searchParams] = useSearchParams()
    const [query, setQuery] = useState('')
    const [mode, setMode] = useState<QueryMode>('explain')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // AI Response state
    const [aiResponse, setAiResponse] = useState<AIResponseData | null>(null)
    const [originalQuery, setOriginalQuery] = useState('')

    // Reflection state
    const [reflectionRating, setReflectionRating] = useState<number | null>(null)
    const [reflectionSubmitted, setReflectionSubmitted] = useState(false)
    const [submittingReflection, setSubmittingReflection] = useState(false)

    // Slide panel state
    const [panelOpen, setPanelOpen] = useState(false)
    const [panelContent, setPanelContent] = useState<'quiz' | 'tlm' | 'audit' | null>(null)
    const [panelLoading, setPanelLoading] = useState(false)
    const [generatedContent, setGeneratedContent] = useState<any>(null)
    const [showAnswers, setShowAnswers] = useState(false)

    // Context fields
    const [grade, setGrade] = useState<number>(6) // Default to Class 6
    const [subject, setSubject] = useState('')
    const [shareWithCRP, setShareWithCRP] = useState(false)
    const [persona, setPersona] = useState('standard')
    const [responseLanguage, setResponseLanguage] = useState('en')
    const [showContext, setShowContext] = useState(false)

    // Teach Now Mode state
    const [showTeachNow, setShowTeachNow] = useState(false)

    // Follow-up responses state (appended below main response)
    const [followUpResponses, setFollowUpResponses] = useState<Array<{ label: string, content: string, structured?: any }>>([])
    const [followUpLoading, setFollowUpLoading] = useState(false)

    // Save as Content Modal state
    const [showSaveAsContent, setShowSaveAsContent] = useState(false)
    const [contentSaved, setContentSaved] = useState(false)

    // Voice Assistant state
    const [showVoiceAssistant, setShowVoiceAssistant] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)

    // CRP/ARP Response state
    const [crpResponses, setCrpResponses] = useState<Array<{
        id: number
        crp_id: number
        response_text: string
        voice_note_url?: string
        voice_note_transcript?: string
        tag?: string
        observation_notes?: string
        created_at?: string
    }>>([])

    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const responseRef = useRef<HTMLDivElement>(null)

    // Master data
    const { subjects: masterSubjects } = useMasterData()

    // Translation hook
    useTranslation() // Ensure translations are available

    // Voice input
    const {
        isListening,
        isSupported: voiceSupported,
        error: voiceError,
        startListening,
        stopListening,
    } = useVoiceInput({
        language: 'en-IN',
        onResult: (text) => setQuery(prev => prev + (prev ? ' ' : '') + text)
    })

    useEffect(() => {
        if (voiceError) setError(voiceError)
    }, [voiceError])

    useEffect(() => {
        if (aiResponse && responseRef.current) {
            responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [aiResponse])

    // Load history query from URL params
    useEffect(() => {
        const historyId = searchParams.get('historyId')

        if (historyId) {
            // Fetch the history query from API
            const loadHistoryQuery = async () => {
                try {
                    setLoading(true)
                    const response = await teacherApi.getQuery(parseInt(historyId))

                    if (response) {
                        // Set the mode
                        const queryMode = (response.mode?.toLowerCase() || 'explain') as QueryMode
                        if (['explain', 'assist', 'plan'].includes(queryMode)) {
                            setMode(queryMode)
                        }

                        // Set the original query
                        setOriginalQuery(response.input_text || '')
                        setQuery(response.input_text || '')

                        // Set the AI response
                        setAiResponse({
                            content: response.ai_response || '',
                            structured: (response as any).structured,
                            query_type: 'topic_based',
                            query_id: parseInt(historyId),
                            mode: queryMode
                        })

                        // Set CRP responses if any
                        if ((response as any).crp_responses && (response as any).crp_responses.length > 0) {
                            setCrpResponses((response as any).crp_responses)
                        }
                    }
                } catch (error) {
                    console.error('Failed to load history query:', error)
                    setError('Failed to load history query.')
                } finally {
                    setLoading(false)
                }
            }

            loadHistoryQuery()
        }
    }, [searchParams])


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim() || loading) return

        setLoading(true)
        setError('')
        setAiResponse(null)
        setOriginalQuery(query)
        setReflectionSubmitted(false)
        setReflectionRating(null)
        setPanelOpen(false)
        setGeneratedContent(null)

        try {
            const response = await aiApi.ask({
                input_text: query.trim(),
                mode,
                grade,
                subject: subject || undefined,
                language: responseLanguage || 'en',
                persona: persona || 'standard',
                share_with_crp: shareWithCRP,
            })

            setAiResponse({
                content: getStringContent(response.content || response),
                structured: response.structured,
                query_type: response.query_type,
                query_id: response.query_id,
                mode: response.mode
            })
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to get AI response.')
        } finally {
            setLoading(false)
        }
    }

    const handleQuickPrompt = (prompt: DisplayPrompt) => {
        setQuery(prompt.text)
        setMode(prompt.mode)
        textareaRef.current?.focus()
    }

    const handleNewQuery = () => {
        setAiResponse(null)
        setQuery('')
        setOriginalQuery('')
        setReflectionSubmitted(false)
        setReflectionRating(null)
        setPanelOpen(false)
        setGeneratedContent(null)
        setFollowUpResponses([])
        textareaRef.current?.focus()
    }

    // Text-to-Speech function
    const speakResponse = (text: string) => {
        window.speechSynthesis.cancel()

        // Clean up the text - remove markdown and extra formatting
        const cleanText = text
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/#{1,6}\s/g, '')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`/g, '')
            .substring(0, 3000) // Limit length

        const utterance = new SpeechSynthesisUtterance(cleanText)
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.lang = responseLanguage === 'hi' ? 'hi-IN' : 'en-IN'

        const voices = window.speechSynthesis.getVoices()
        const targetVoice = voices.find(v =>
            v.lang.startsWith(responseLanguage === 'hi' ? 'hi' : 'en')
        )
        if (targetVoice) utterance.voice = targetVoice

        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)

        window.speechSynthesis.speak(utterance)
    }

    const stopSpeaking = () => {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
    }

    // Voice Assistant handler
    const handleVoiceAsk = async (question: string): Promise<string> => {
        try {
            const response = await aiApi.ask({
                input_text: question,
                mode: mode,
                grade,
                subject: subject || undefined,
                language: responseLanguage || 'en',
                persona: persona || 'standard',
            })

            const content = getStringContent(response.content || response)

            // Clean for speaking
            return content
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/#{1,6}\s/g, '')
                .substring(0, 5000)
        } catch (err) {
            return "Sorry, I couldn't process that question. Please try again."
        }
    }

    // Handle follow-up prompt - appends response below main content
    const handleFollowUp = async (followUpLabel: string, followUpPrompt: string) => {
        if (followUpLoading) return

        setFollowUpLoading(true)
        setError('')

        try {
            // Always use "explain" mode for follow-ups to get better structured responses
            const response = await aiApi.ask({
                input_text: followUpPrompt.trim(),
                mode: 'explain',
                grade,
                subject: subject || undefined,
                language: responseLanguage || 'en',
                persona: persona || 'standard',
                share_with_crp: false, // Don't share follow-ups with CRP
            })

            // Append the follow-up response
            setFollowUpResponses(prev => [...prev, {
                label: followUpLabel,
                content: getStringContent(response.content || response),
                structured: response.structured
            }])
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to get AI response.')
        } finally {
            setFollowUpLoading(false)
        }
    }

    // Submit reflection to backend
    const handleReflectionSubmit = async () => {
        if (reflectionRating === null || !aiResponse?.query_id) return

        setSubmittingReflection(true)
        try {
            await teacherApi.submitReflection({
                query_id: aiResponse.query_id,
                tried: true,
                worked: reflectionRating >= 3,
                text_feedback: `Rating: ${reflectionRating}/5`
            })
            setReflectionSubmitted(true)
        } catch (err: any) {
            console.error('Failed to submit reflection:', err)
            // Still show success if it's a duplicate error
            if (err.response?.status === 400 && err.response?.data?.detail?.includes('already exists')) {
                setReflectionSubmitted(true)
            } else {
                setError('Failed to submit feedback. Please try again.')
            }
        } finally {
            setSubmittingReflection(false)
        }
    }

    const openPanel = async (type: 'quiz' | 'tlm' | 'audit') => {
        setPanelContent(type)
        setPanelOpen(true)
        setPanelLoading(true)
        setGeneratedContent(null)
        setShowAnswers(false)

        try {
            let result
            if (type === 'quiz') {
                result = await aiApi.generateQuiz({
                    topic: originalQuery,
                    content: getStringContent(aiResponse?.content),
                    language: responseLanguage || 'en'
                })
            } else if (type === 'tlm') {
                result = await aiApi.generateTLM({
                    topic: originalQuery,
                    content: getStringContent(aiResponse?.content),
                    language: responseLanguage || 'en'
                })
            } else {
                result = await aiApi.auditContent({
                    topic: originalQuery,
                    content: getStringContent(aiResponse?.content),
                    grade,
                    subject,
                    language: responseLanguage || 'en'
                })
            }
            setGeneratedContent(result)
        } catch (err) {
            setError(`Failed to generate ${type}.`)
        } finally {
            setPanelLoading(false)
        }
    }

    const copyQuizText = () => {
        if (!generatedContent?.questions) return
        const text = generatedContent.questions.map((q: QuizQuestion, idx: number) => {
            let str = `${idx + 1}. ${q.question}\n`
            if (q.options) {
                q.options.forEach((opt: string, optIdx: number) => {
                    str += `   ${String.fromCharCode(65 + optIdx)}) ${opt}\n`
                })
            }
            if (showAnswers && (q.correct_answer || q.answer)) {
                str += `   Answer: ${q.correct_answer || q.answer}\n`
            }
            return str
        }).join('\n')
        navigator.clipboard.writeText(text)
    }

    const exportQuizPDF = () => {
        // Create printable content
        const printWindow = window.open('', '_blank')
        if (!printWindow || !generatedContent?.questions) return

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Quiz - ${originalQuery}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                    h1 { color: #333; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
                    .question { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
                    .question-type { font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 5px; }
                    .question-text { font-weight: bold; margin-bottom: 10px; }
                    .options { margin-left: 20px; }
                    .option { margin: 5px 0; }
                    .answer { color: #22c55e; font-weight: bold; margin-top: 10px; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <h1>Assessment: ${originalQuery}</h1>
                ${generatedContent.questions.map((q: QuizQuestion, idx: number) => `
                    <div class="question">
                        <div class="question-type">${q.type || 'MCQ'}</div>
                        <div class="question-text">${idx + 1}. ${q.question}</div>
                        ${q.options ? `
                            <div class="options">
                                ${q.options.map((opt: string, optIdx: number) => `
                                    <div class="option">${String.fromCharCode(65 + optIdx)}) ${opt}</div>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${showAnswers && (q.correct_answer || q.answer) ? `
                            <div class="answer">Answer: ${q.correct_answer || q.answer}</div>
                        ` : ''}
                    </div>
                `).join('')}
                <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Print / Save as PDF
                </button>
            </body>
            </html>
        `
        printWindow.document.write(html)
        printWindow.document.close()
    }

    const regenerateContent = () => {
        if (panelContent) {
            openPanel(panelContent)
        }
    }

    const isTopicBased = aiResponse?.query_type === 'topic_based'
    const responseContent = getStringContent(aiResponse?.content)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            {/* Main Content */}
            <div className={`transition-all duration-300 ${panelOpen ? 'mr-[480px]' : ''}`}>
                <div className="max-w-7xl mx-auto px-4 py-6">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Ask AI Assistant</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Teaching • Planning • Problem Solving</p>
                            </div>
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-stretch">
                        {queryModes.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => !aiResponse && setMode(m.id)}
                                disabled={!!aiResponse}
                                className={`relative flex flex-col h-full p-5 rounded-2xl border transition-all duration-300 group ${mode === m.id
                                    ? 'bg-white dark:bg-gray-800 shadow-2xl border-transparent'
                                    : 'bg-white dark:bg-gray-800/40 border-gray-300 dark:border-gray-700 hover:bg-white hover:shadow-xl hover:border-blue-200'
                                    } ${aiResponse ? 'opacity-60 cursor-not-allowed' : ''}`}
                                style={mode === m.id ? {

                                    borderColor: m.color
                                } : {}}
                            >
                                <div className="flex-1">
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-500 ${mode === m.id
                                            ? 'text-white scale-110 rotate-[5deg] shadow-lg ' + m.shadow
                                            : 'text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm'
                                            }`}
                                        style={mode === m.id ? { background: `linear-gradient(135deg, ${m.color}, ${m.color}dd)` } : {}}
                                    >
                                        <m.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className={`font-bold text-base mb-1 transition-colors ${mode === m.id ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {m.label}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight">{m.description}</p>
                                </div>

                                {mode === m.id && (
                                    <>
                                        <div
                                            className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r opacity-20 blur-sm pointer-events-none transition-all duration-500 group-hover:opacity-30"
                                            style={{ background: `linear-gradient(to right, ${m.color}, transparent, ${m.color})` }}
                                        />
                                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse" style={{ background: m.color }} />
                                    </>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Query Input Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-l border-2 border-gray-200 dark:border-white/10 overflow-hidden mb-8 transition-all focus-within:border-blue-500/50 focus-within:ring-8 focus-within:ring-blue-500/5">
                        <form onSubmit={handleSubmit}>
                            <div className="p-6">
                                <textarea
                                    ref={textareaRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    maxLength={10000}
                                    placeholder="Type your question here... e.g., 'How do I explain the water cycle to Class 5 students?'"
                                    className="w-full min-h-[140px] resize-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-lg leading-relaxed"
                                    disabled={loading || !!aiResponse}
                                />
                            </div>

                            {/* Context Options */}
                            {!aiResponse && (
                                <div className="border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setShowContext(!showContext)}
                                        className="w-full px-6 py-3 flex items-center justify-between text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="font-medium">Context Options</span>
                                            <span className="text-xs text-gray-400">(Grade, Subject, etc.)</span>
                                        </span>
                                        {showContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>

                                    {showContext && (
                                        <div className="px-6 pb-4 pt-2 space-y-5 bg-gray-50/50 dark:bg-gray-800/50">
                                            {/* Grade Slider */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        <GraduationCap className="w-4 h-4" />
                                                        Grade Level
                                                    </label>
                                                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                                                        Class {grade}
                                                    </span>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="12"
                                                        value={grade}
                                                        onChange={(e) => setGrade(parseInt(e.target.value))}
                                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                    />
                                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                        <span>1</span>
                                                        <span>3</span>
                                                        <span>5</span>
                                                        <span>7</span>
                                                        <span>9</span>
                                                        <span>12</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Student Persona */}
                                            <div>
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    <UserCircle2 className="w-4 h-4" />
                                                    Student Learning Style
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {personaOptions.map((p) => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => setPersona(p.id)}
                                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${persona === p.id
                                                                ? 'bg-purple-500 text-white shadow-md'
                                                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-purple-300'
                                                                }`}
                                                            title={p.description}
                                                        >
                                                            {p.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Response Language */}
                                            <div>
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    <Languages className="w-4 h-4" />
                                                    Response Language
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {languageOptions.map((lang) => (
                                                        <button
                                                            key={lang.id}
                                                            type="button"
                                                            onClick={() => setResponseLanguage(lang.id)}
                                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${responseLanguage === lang.id
                                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                                                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-green-300'
                                                                }`}
                                                        >
                                                            <span>{lang.flag}</span>
                                                            {lang.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Subject & Share Options Row */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Subject</label>
                                                    <select
                                                        value={subject}
                                                        onChange={(e) => setSubject(e.target.value)}
                                                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select</option>
                                                        {masterSubjects.map(s => (
                                                            <option key={s.id} value={s.name}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center">
                                                    <label className="flex items-center gap-3 cursor-pointer">
                                                        <div className="relative">
                                                            <input
                                                                type="checkbox"
                                                                checked={shareWithCRP}
                                                                onChange={(e) => setShareWithCRP(e.target.checked)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 transition-colors" />
                                                            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Share with CRP</span>
                                                            <p className="text-xs text-gray-400">Your mentor can review</p>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900">
                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                        <AlertCircle className="w-4 h-4" />
                                        <p className="text-sm">{error}</p>
                                    </div>
                                </div>
                            )}

                            {!aiResponse && (
                                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={isListening ? stopListening : startListening}
                                            disabled={!voiceSupported}
                                            className={`p-3.5 rounded-2xl transition-all border shadow-sm ${isListening
                                                ? 'bg-red-500 text-white animate-pulse shadow-lg border-red-400'
                                                : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700'
                                                }`}
                                        >
                                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                        </button>
                                        {isListening && <span className="text-sm text-red-500 font-medium">Listening...</span>}
                                        <span className="text-xs text-gray-400">{query.length}/10000</span>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!query.trim() || loading}
                                        className="px-10 py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center gap-2 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:translate-y-0"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span>Analyzing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                                <span className="text-lg">Get Answer</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Quick Prompts */}
                    {!aiResponse && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                Quick Prompts
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {defaultQuickPrompts.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleQuickPrompt(prompt)}
                                        className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-200 transition-all text-left group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center text-blue-500">
                                            <prompt.icon className="w-5 h-5" />
                                        </div>
                                        <span className="flex-1 text-gray-700 dark:text-gray-300">{prompt.text}</span>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Response Section */}
                    {aiResponse && (
                        <div ref={responseRef} className="space-y-6">
                            {/* CRP/ARP Mentor Feedback Section */}
                            {crpResponses.length > 0 && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border-2 border-amber-200 dark:border-amber-700 p-6 shadow-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                            <Lightbulb className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-amber-900 dark:text-amber-100">Mentor Feedback</h3>
                                            <p className="text-xs text-amber-700 dark:text-amber-300">Response from your CRP/ARP</p>
                                        </div>
                                    </div>
                                    {crpResponses.map((crpRes) => (
                                        <div key={crpRes.id} className="space-y-3">
                                            {crpRes.response_text && (
                                                <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4">
                                                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{crpRes.response_text}</p>
                                                </div>
                                            )}
                                            {crpRes.observation_notes && (
                                                <div className="bg-amber-100/50 dark:bg-amber-800/30 rounded-xl p-4">
                                                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-2">Observation Notes:</p>
                                                    <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{crpRes.observation_notes}</p>
                                                </div>
                                            )}
                                            {crpRes.voice_note_url && (
                                                <div className="flex items-center gap-3 bg-white/60 dark:bg-gray-800/60 rounded-xl p-3">
                                                    <Volume2 className="w-4 h-4 text-amber-600" />
                                                    <audio controls src={crpRes.voice_note_url} className="h-8 flex-1" />
                                                </div>
                                            )}
                                            {crpRes.tag && (
                                                <span className="inline-block px-3 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full">
                                                    {crpRes.tag}
                                                </span>
                                            )}
                                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                                {crpRes.created_at && new Date(crpRes.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {/* Header */}
                                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                            <Bot className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">AI Response</h3>
                                            <p className="text-xs text-gray-500 capitalize">Mode: {mode}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Voice Controls */}
                                        <button
                                            onClick={() => isSpeaking ? stopSpeaking() : speakResponse(responseContent)}
                                            className={`p-2 rounded-xl transition-all ${isSpeaking
                                                ? 'bg-red-100 text-red-600 animate-pulse'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                                                }`}
                                            title={isSpeaking ? 'Stop Speaking' : 'Listen to Response'}
                                        >
                                            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        </button>
                                        {/* Save as Content Button - only show if not already saved */}
                                        {!contentSaved && (
                                            <button
                                                onClick={() => setShowSaveAsContent(true)}
                                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all"
                                                title="Save as Content for CRP Approval"
                                            >
                                                <BookPlus className="w-4 h-4" />
                                                Save as Content
                                            </button>
                                        )}
                                        <ExportToolbar
                                            topic={originalQuery}
                                            content={responseContent}
                                            structured={aiResponse?.structured}
                                            grade={grade}
                                        />
                                        <button
                                            onClick={handleNewQuery}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors text-sm font-medium"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            New Question
                                        </button>
                                    </div>
                                </div>

                                {/* Your Question */}
                                <div className="px-6 py-4 bg-blue-50/50 dark:bg-blue-900/10 border-b border-gray-100 dark:border-gray-700">
                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Your Question</p>
                                    <p className="text-gray-800 dark:text-white">{originalQuery}</p>
                                </div>

                                {/* Language Switch Bar */}
                                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-sm text-gray-500">
                                            <Languages className="w-4 h-4" />
                                            Response Language:
                                        </span>
                                        <div className="flex gap-1">
                                            {languageOptions.map((lang) => (
                                                <button
                                                    key={lang.id}
                                                    onClick={async () => {
                                                        if (lang.id !== responseLanguage) {
                                                            setResponseLanguage(lang.id)
                                                            // Re-generate with new language
                                                            setLoading(true)
                                                            try {
                                                                const response = await aiApi.ask({
                                                                    input_text: originalQuery,
                                                                    mode,
                                                                    grade,
                                                                    subject: subject || undefined,
                                                                    language: lang.id,
                                                                    persona: persona,
                                                                    share_with_crp: shareWithCRP,
                                                                })
                                                                setAiResponse({
                                                                    content: getStringContent(response.content || response),
                                                                    structured: response.structured,
                                                                    query_type: response.query_type,
                                                                    query_id: response.query_id,
                                                                    mode: response.mode
                                                                })
                                                            } catch (err) {
                                                                console.error('Failed to switch language:', err)
                                                            } finally {
                                                                setLoading(false)
                                                            }
                                                        }
                                                    }}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${responseLanguage === lang.id
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-100'
                                                        }`}
                                                >
                                                    {lang.flag} {lang.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Response Content */}
                                <div className="p-6 relative">
                                    {loading && (
                                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                        </div>
                                    )}
                                    <div className="overflow-y-auto custom-scrollbar">
                                        <StructuredAIResponse content={responseContent} structured={aiResponse?.structured} topic={originalQuery} grade={grade} language={responseLanguage} />
                                    </div>
                                </div>

                                {/* Appended Follow-up Responses */}
                                {followUpResponses.length > 0 && (
                                    <div className="px-6 space-y-4">
                                        {followUpResponses.map((followUp, idx) => (
                                            <div key={idx} className="border-t-2 border-blue-500 pt-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                                        {followUp.label}
                                                    </span>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                                                    <StructuredAIResponse content={followUp.content} structured={followUp.structured} topic={originalQuery} grade={grade} language={responseLanguage} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Follow-up Loading Indicator */}
                                {followUpLoading && (
                                    <div className="px-6 py-4 flex items-center gap-3 text-blue-600 dark:text-blue-400">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm font-medium">Generating follow-up content...</span>
                                    </div>
                                )}

                                {/* AI Follow-up Prompts */}
                                <div className="px-6 pb-4">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Continue with...</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: '✍️ Create 5 MCQs', prompt: `Create 5 multiple choice questions with 4 options each for: ${originalQuery}. Format as a quiz with questions, options A/B/C/D, and correct answers.` },
                                            { label: '🏠 Real-life activity', prompt: `Give a real-life hands-on activity that students can do at home or in class for: ${originalQuery}` },
                                            { label: '🎨 Drawing steps', prompt: `Explain ${originalQuery} with step-by-step drawing instructions that a teacher can draw on a blackboard` },
                                            { label: '📝 Convert to worksheet', prompt: `Create a printable student worksheet with fill-in-the-blanks, matching, and short answer questions for: ${originalQuery}` },
                                            { label: '🎯 Simplify more', prompt: `Explain ${originalQuery} in even simpler terms using everyday examples and simple words for struggling students` },
                                        ].map((followUp) => (
                                            <button
                                                key={followUp.label}
                                                onClick={() => handleFollowUp(followUp.label, followUp.prompt)}
                                                disabled={followUpLoading}
                                                className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 transition-colors border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {followUpLoading ? '...' : followUp.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                {isTopicBased && (
                                    <div className="px-6 pb-6">
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => openPanel('quiz')}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
                                            >
                                                <FileQuestion className="w-5 h-5" />
                                                Generate Quiz
                                            </button>
                                            <button
                                                onClick={() => openPanel('tlm')}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium hover:shadow-lg transition-all"
                                            >
                                                <Palette className="w-5 h-5" />
                                                Design TLM
                                            </button>
                                            <button
                                                onClick={() => openPanel('audit')}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium hover:shadow-lg transition-all"
                                            >
                                                <ShieldCheck className="w-5 h-5" />
                                                NCERT Audit
                                            </button>
                                        </div>
                                        {/* Teach Now Button */}
                                        <button
                                            onClick={() => setShowTeachNow(true)}
                                            className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold hover:shadow-xl hover:-translate-y-0.5 transition-all"
                                        >
                                            <Presentation className="w-5 h-5" />
                                            🎯 Teach This Now
                                        </button>
                                    </div>
                                )}

                                {/* Reflection */}
                                <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700 pt-6">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5">
                                        {!reflectionSubmitted ? (
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Rate this response</h4>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                onClick={() => setReflectionRating(star)}
                                                                className="p-1 transition-transform hover:scale-110"
                                                            >
                                                                <Star
                                                                    className={`w-7 h-7 transition-colors ${reflectionRating && reflectionRating >= star
                                                                        ? 'text-yellow-400 fill-yellow-400'
                                                                        : 'text-gray-300'
                                                                        }`}
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleReflectionSubmit}
                                                    disabled={reflectionRating === null || submittingReflection}
                                                    className="px-5 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                                >
                                                    {submittingReflection ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : null}
                                                    Submit
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                                                <CheckCircle className="w-6 h-6" />
                                                <span className="font-medium">Thank you for your feedback!</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Slide-out Panel - Enhanced Quiz/TLM/Audit */}
            <div
                className={`fixed top-0 right-0 h-full w-[480px] bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-out z-50 flex flex-col ${panelOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Panel Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${panelContent === 'quiz' ? 'bg-purple-100 text-purple-600' :
                            panelContent === 'tlm' ? 'bg-pink-100 text-pink-600' :
                                'bg-green-100 text-green-600'
                            }`}>
                            {panelContent === 'quiz' && <FileQuestion className="w-5 h-5" />}
                            {panelContent === 'tlm' && <Palette className="w-5 h-5" />}
                            {panelContent === 'audit' && <ShieldCheck className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {panelContent === 'quiz' && 'Assessment Genie'}
                                {panelContent === 'tlm' && 'TLM Designer'}
                                {panelContent === 'audit' && 'NCERT Audit'}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {panelContent === 'quiz' && 'Perfect quizzes in seconds'}
                                {panelContent === 'tlm' && 'Low-cost classroom aids'}
                                {panelContent === 'audit' && 'Curriculum compliance check'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {panelContent === 'quiz' && generatedContent?.questions && (
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <span className="text-gray-500">Show Answers</span>
                                <button
                                    onClick={() => setShowAnswers(!showAnswers)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${showAnswers ? 'bg-purple-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showAnswers ? 'left-5' : 'left-0.5'}`} />
                                </button>
                            </label>
                        )}
                        <button
                            onClick={() => setPanelOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {panelLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                            <p className="text-gray-500">Generating content...</p>
                        </div>
                    ) : generatedContent ? (
                        <div>
                            {/* Quiz Panel */}
                            {panelContent === 'quiz' && generatedContent.questions && (
                                <div className="space-y-4">
                                    {generatedContent.questions.map((q: QuizQuestion, idx: number) => (
                                        <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {q.type === 'fill_in_blank' ? 'FILL IN THE BLANK' :
                                                        q.type === 'true_false' ? 'TRUE/FALSE' : 'MCQ'}
                                                </span>
                                            </div>
                                            <div className="p-4">
                                                <p className="font-medium text-gray-900 dark:text-white mb-3">
                                                    <span className="text-purple-500 mr-2">{idx + 1}.</span>
                                                    {q.question}
                                                </p>
                                                {q.options && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {q.options.map((opt: string, optIdx: number) => (
                                                            <div
                                                                key={optIdx}
                                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${showAnswers && (q.correct_answer === opt || q.answer === opt || q.correct_answer === String.fromCharCode(65 + optIdx))
                                                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                                                                    }`}
                                                            >
                                                                <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                                                                    {String.fromCharCode(65 + optIdx)}
                                                                </span>
                                                                <span>{opt}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {showAnswers && (q.correct_answer || q.answer) && !q.options && (
                                                    <div className="mt-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                                                        <span className="font-medium">Answer:</span> {q.correct_answer || q.answer}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* TLM Panel */}
                            {panelContent === 'tlm' && (
                                <TLMRenderer content={generatedContent} />
                            )}

                            {/* Audit Panel */}
                            {panelContent === 'audit' && (
                                <div className="space-y-4">
                                    {/* Compliance Badge */}
                                    <div className="flex items-center justify-between">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${generatedContent.is_compliant
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            <div className={`w-2.5 h-2.5 rounded-full ${generatedContent.is_compliant ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                            {generatedContent.is_compliant ? 'NCERT Compliant' : 'Needs Review'}
                                        </div>
                                        {generatedContent.compliance_score !== undefined && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">Score:</span>
                                                <span className={`text-lg font-bold ${generatedContent.compliance_score >= 80 ? 'text-green-600' : generatedContent.compliance_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                    {generatedContent.compliance_score}%
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Strengths */}
                                    {generatedContent.strengths && generatedContent.strengths.length > 0 && (
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                                            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                                                ✅ Strengths
                                            </h4>
                                            <ul className="space-y-1.5">
                                                {generatedContent.strengths.map((s: string, i: number) => (
                                                    <li key={i} className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                                                        <span className="mt-1">•</span>
                                                        <span>{s}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Weaknesses */}
                                    {generatedContent.weaknesses && generatedContent.weaknesses.length > 0 && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                                            <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2 flex items-center gap-2">
                                                ⚠️ Areas for Improvement
                                            </h4>
                                            <ul className="space-y-1.5">
                                                {generatedContent.weaknesses.map((w: string, i: number) => (
                                                    <li key={i} className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                                                        <span className="mt-1">•</span>
                                                        <span>{w}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Improvement Suggestions */}
                                    {generatedContent.improvement_suggestions && generatedContent.improvement_suggestions.length > 0 && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                            <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                                                💡 Suggestions
                                            </h4>
                                            <ul className="space-y-1.5">
                                                {generatedContent.improvement_suggestions.map((s: string, i: number) => (
                                                    <li key={i} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                                        <span className="mt-1">{i + 1}.</span>
                                                        <span>{s}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* NCERT Reference */}
                                    {generatedContent.ncert_ref && (
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">📚 NCERT Reference</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{generatedContent.ncert_ref}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            No content generated yet
                        </div>
                    )}
                </div>

                {/* Panel Footer with Actions */}
                {generatedContent && (
                    <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                        {panelContent === 'quiz' && (
                            <>
                                <div className="flex gap-3 mb-3">
                                    <button
                                        onClick={copyQuizText}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy Text
                                    </button>
                                    <button
                                        onClick={exportQuizPDF}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
                                    >
                                        <FileDown className="w-4 h-4" />
                                        Export PDF
                                    </button>
                                </div>
                                <button
                                    onClick={regenerateContent}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Regenerate Assessment
                                </button>
                            </>
                        )}

                        {panelContent === 'tlm' && (
                            <>
                                <button
                                    onClick={() => window.print()}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium mb-3"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print Worksheet
                                </button>
                                <button
                                    onClick={regenerateContent}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium hover:shadow-lg transition-all"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Regenerate Design
                                </button>
                            </>
                        )}

                        {panelContent === 'audit' && (
                            <button
                                onClick={regenerateContent}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium hover:shadow-lg transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Re-audit Content
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Overlay */}
            {panelOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={() => setPanelOpen(false)}
                />
            )}

            {/* Teach Now Full Screen Mode */}
            {showTeachNow && aiResponse?.structured && (
                <TeachNowMode
                    topic={originalQuery}
                    structured={aiResponse.structured}
                    grade={grade}
                    onClose={() => setShowTeachNow(false)}
                />
            )}

            {/* Save as Content Modal */}
            {showSaveAsContent && aiResponse && (
                <SaveAsContentModal
                    isOpen={showSaveAsContent}
                    onClose={() => setShowSaveAsContent(false)}
                    onSuccess={() => setContentSaved(true)}
                    aiResponse={{
                        content: responseContent,
                        structured: aiResponse.structured,
                        mode: mode
                    }}
                    originalQuery={originalQuery}
                    grade={grade}
                    subject={subject}
                    topic={originalQuery}
                />
            )}

            {/* Floating Voice Assistant Button */}
            {/* {!showVoiceAssistant && !panelOpen && (
                <button
                    onClick={() => setShowVoiceAssistant(true)}
                    className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-2xl shadow-purple-500/30 flex items-center justify-center hover:scale-110 transition-all z-40 group"
                    title="Voice Assistant"
                >
                    <Bot className="w-7 h-7 text-white group-hover:animate-pulse" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Mic className="w-3 h-3 text-white" />
                    </span>
                </button>
            )} */}

            {/* Voice Assistant Modal */}
            <FloatingVoiceAssistant
                isOpen={showVoiceAssistant}
                onClose={() => setShowVoiceAssistant(false)}
                onAsk={handleVoiceAsk}
                title="AI Teaching Assistant"
            />
        </div>
    )
}
