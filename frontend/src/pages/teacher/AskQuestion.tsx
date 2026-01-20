import { useState, useRef, useEffect } from 'react'
import {
    Send,
    Loader2,
    Sparkles,
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
    Printer
} from 'lucide-react'
import { aiApi, teacherApi } from '../../services/api'
import useTranslation from '../../hooks/useTranslation'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { useMasterData } from '../../hooks/useMasterData'
import MarkdownRenderer from '../../components/common/MarkdownRenderer'
import StructuredAIResponse from '../../components/common/StructuredAIResponse'
import TLMRenderer from '../../components/common/TLMRenderer'

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
    { id: 'explain' as QueryMode, icon: Lightbulb, label: 'Explain Topic', description: 'Get clear explanations', color: '#2563EB' },
    { id: 'assist' as QueryMode, icon: Users, label: 'Classroom Help', description: 'Handle challenges', color: '#059669' },
    { id: 'plan' as QueryMode, icon: Clock, label: 'Plan Lesson', description: 'Create lesson plans', color: '#7c3aed' },
]

const defaultQuickPrompts: DisplayPrompt[] = [
    { icon: Lightbulb, text: 'Explain photosynthesis for Class 6', mode: 'explain' },
    { icon: Clock, text: 'Create a 40-min lesson plan for Fractions', mode: 'plan' },
    { icon: Users, text: 'How to handle a noisy classroom?', mode: 'assist' },
    { icon: Star, text: 'Make learning fun for Class 5', mode: 'explain' },
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
    const [grade, setGrade] = useState<number | undefined>()
    const [subject, setSubject] = useState('')
    const [shareWithCRP, setShareWithCRP] = useState(false)
    const [showContext, setShowContext] = useState(false)

    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const responseRef = useRef<HTMLDivElement>(null)

    // Master data
    const { grades: masterGrades, subjects: masterSubjects } = useMasterData()

    // Language from translation hook
    const { language: selectedLanguage } = useTranslation()

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
                language: selectedLanguage || 'en',
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
        textareaRef.current?.focus()
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
                    language: 'en'
                })
            } else if (type === 'tlm') {
                result = await aiApi.generateTLM({
                    topic: originalQuery,
                    content: getStringContent(aiResponse?.content),
                    language: 'en'
                })
            } else {
                result = await aiApi.auditContent({
                    topic: originalQuery,
                    content: getStringContent(aiResponse?.content),
                    grade,
                    subject
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
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Ask AI Assistant</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Teaching • Planning • Problem Solving</p>
                            </div>
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {queryModes.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => !aiResponse && setMode(m.id)}
                                disabled={!!aiResponse}
                                className={`relative p-5 rounded-2xl border-2 transition-all duration-300 group ${mode === m.id
                                    ? 'bg-white dark:bg-gray-800 shadow-xl border-transparent'
                                    : 'bg-white/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 hover:bg-white hover:shadow-lg'
                                    } ${aiResponse ? 'opacity-60 cursor-not-allowed' : ''}`}
                                style={mode === m.id ? { boxShadow: `0 8px 32px ${m.color}20` } : {}}
                            >
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all ${mode === m.id ? 'text-white scale-110' : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700'
                                        }`}
                                    style={mode === m.id ? { background: m.color } : {}}
                                >
                                    <m.icon className="w-6 h-6" />
                                </div>
                                <h3 className={`font-semibold text-lg mb-1 ${mode === m.id ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {m.label}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{m.description}</p>
                                {mode === m.id && (
                                    <div className="absolute top-3 right-3 w-3 h-3 rounded-full" style={{ background: m.color }} />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Query Input Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
                        <form onSubmit={handleSubmit}>
                            <div className="p-6">
                                <textarea
                                    ref={textareaRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
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
                                        <div className="px-6 pb-4 pt-2 space-y-4 bg-gray-50/50 dark:bg-gray-800/50">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Grade</label>
                                                    <select
                                                        value={grade || ''}
                                                        onChange={(e) => setGrade(e.target.value ? parseInt(e.target.value) : undefined)}
                                                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select</option>
                                                        {masterGrades.map(g => (
                                                            <option key={g.id} value={g.number}>Class {g.number}</option>
                                                        ))}
                                                    </select>
                                                </div>
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
                                                <div className="col-span-2 flex items-center">
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
                                            className={`p-3 rounded-xl transition-all ${isListening
                                                ? 'bg-red-500 text-white animate-pulse shadow-lg'
                                                : 'bg-white dark:bg-gray-700 text-gray-500 hover:text-blue-600 shadow-sm'
                                                }`}
                                        >
                                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                        </button>
                                        {isListening && <span className="text-sm text-red-500 font-medium">Listening...</span>}
                                        <span className="text-xs text-gray-400">{query.length}/1000</span>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!query.trim() || loading}
                                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold flex items-center gap-2 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Get Answer
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
                                        className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-blue-200 transition-all text-left group"
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
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {/* Header */}
                                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">AI Response</h3>
                                            <p className="text-xs text-gray-500 capitalize">Mode: {mode}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleNewQuery}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors text-sm font-medium"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        New Question
                                    </button>
                                </div>

                                {/* Your Question */}
                                <div className="px-6 py-4 bg-blue-50/50 dark:bg-blue-900/10 border-b border-gray-100 dark:border-gray-700">
                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Your Question</p>
                                    <p className="text-gray-800 dark:text-white">{originalQuery}</p>
                                </div>

                                {/* Response Content */}
                                <div className="p-6">
                                    <div className="overflow-y-auto custom-scrollbar">
                                        <StructuredAIResponse content={responseContent} structured={aiResponse?.structured} topic={originalQuery} grade={grade} language={selectedLanguage} />
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
                                <div>
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${generatedContent.is_compliant
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        <div className={`w-2.5 h-2.5 rounded-full ${generatedContent.is_compliant ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                        {generatedContent.is_compliant ? 'NCERT Compliant' : 'Needs Review'}
                                    </div>
                                    {generatedContent.feedback && (
                                        <MarkdownRenderer content={getStringContent(generatedContent.feedback)} />
                                    )}
                                    {generatedContent.suggestions && (
                                        <div className="mt-4">
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Suggestions</h4>
                                            <MarkdownRenderer content={getStringContent(generatedContent.suggestions)} />
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
        </div>
    )
}
