import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import {
    ArrowLeft,
    ThumbsUp,
    ThumbsDown,
    Bookmark,
    Share2,
    Copy,
    Check,
    Bot,
    ClipboardList,
    BookOpen,
    Volume2,
    VolumeX,
    Pause,
    Play,
    RefreshCw,
    MessageSquare,
    AlertCircle,
    CheckCircle,
    Lightbulb,
    ChevronRight,
    FileQuestion,
    Palette,
    ShieldCheck,
    Loader2
} from 'lucide-react'
import { aiApi } from '../../services/api'
import MarkdownRenderer from '../../components/common/MarkdownRenderer'
import { useTTS } from '../../hooks/useTTS'

interface ResponseState {
    response: {
        content?: string      // Main AI response field
        response?: string     // Legacy field
        answer?: string       // Legacy field
        summary?: string
        key_points?: string[]
        implementation_steps?: string[]
        resources?: { title: string; type: string }[]
        structured?: Record<string, any>
        query_type?: 'topic_based' | 'general'  // Query classification
    }
    originalQuery: string
    mode: string
    grade?: number
    subject?: string
    queryType?: 'topic_based' | 'general'  // Also at root level
}

export default function AIResponse() {
    const location = useLocation()
    const navigate = useNavigate()
    const state = location.state as ResponseState | null

    const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null)
    const [copied, setCopied] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    // TTS hook
    const { speak, stop, pause, resume, isSpeaking, isPaused, currentLanguage } = useTTS()

    // Action button states
    const [loadingQuiz, setLoadingQuiz] = useState(false)
    const [loadingTLM, setLoadingTLM] = useState(false)
    const [loadingAudit, setLoadingAudit] = useState(false)
    const [generatedQuiz, setGeneratedQuiz] = useState<any>(null)
    const [generatedTLM, setGeneratedTLM] = useState<any>(null)
    const [auditResult, setAuditResult] = useState<any>(null)
    const [actionError, setActionError] = useState<string | null>(null)

    if (!state?.response) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Response Found</h2>
                    <p className="text-gray-500 mb-4">Please submit a question first</p>
                    <Link
                        to="/teacher/ask-question"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Ask a Question
                    </Link>
                </div>
            </div>
        )
    }

    const { response, originalQuery, mode, grade, subject } = state
    // Check multiple possible fields for the main content
    const content = response.content || response.response || response.answer || ''
    const isError = content.toLowerCase().includes('error') || content.toLowerCase().includes('connection')
    const keyPoints = response.key_points || []
    const implementationSteps = response.implementation_steps || []
    const resources = response.resources || []

    // Determine query type - check response first, then root state
    const queryType = response.query_type || state.queryType || 'topic_based'
    const isTopicBased = queryType === 'topic_based'


    const handleCopy = () => {
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleFeedback = async (type: 'helpful' | 'not_helpful') => {
        setFeedback(type)
        // TODO: Send feedback to API
    }

    const handleSave = () => {
        setIsSaved(true)
        // TODO: Save to favorites API
    }

    const handleShare = () => {
        // TODO: Share with mentor functionality
    }

    const handleTTS = () => {
        if (isSpeaking && !isPaused) {
            stop()
        } else {
            // Strip markdown for cleaner speech
            const plainText = content
                .replace(/#+\s/g, '') // Remove headers
                .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
                .replace(/\*(.*?)\*/g, '$1') // Remove italic
                .replace(/`(.*?)`/g, '$1') // Remove code
                .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
                .replace(/^-\s/gm, '') // Remove list markers
                .trim()
            speak(plainText, { language: 'auto' })
        }
    }

    const handlePauseResume = () => {
        if (isPaused) {
            resume()
        } else {
            pause()
        }
    }

    const handleGenerateQuiz = async () => {
        setLoadingQuiz(true)
        setActionError(null)
        try {
            const quiz = await aiApi.generateQuiz({
                topic: originalQuery,
                content: content,
                language: 'en'
            })
            setGeneratedQuiz(quiz)
        } catch (err: any) {
            setActionError('Failed to generate quiz. Please try again.')
        } finally {
            setLoadingQuiz(false)
        }
    }

    const handleGenerateTLM = async () => {
        setLoadingTLM(true)
        setActionError(null)
        try {
            const tlm = await aiApi.generateTLM({
                topic: originalQuery,
                content: content,
                language: 'en'
            })
            setGeneratedTLM(tlm)
        } catch (err: any) {
            setActionError('Failed to generate TLM. Please try again.')
        } finally {
            setLoadingTLM(false)
        }
    }

    const handleAudit = async () => {
        setLoadingAudit(true)
        setActionError(null)
        try {
            const audit = await aiApi.auditContent({
                topic: originalQuery,
                content: content,
                grade: grade,
                subject: subject
            })
            setAuditResult(audit)
        } catch (err: any) {
            setActionError('Failed to audit content. Please try again.')
        } finally {
            setLoadingAudit(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Response</h1>
                        <p className="text-sm text-gray-500">
                            Mode: <span className="capitalize">{mode}</span>
                            {grade && ` • Class ${grade}`}
                            {subject && ` • ${subject}`}
                        </p>
                    </div>
                </div>

                {/* Original Question */}
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 mb-6 border border-primary-100 dark:border-primary-800">
                    <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">Your Question</p>
                    <p className="text-gray-900 dark:text-white">{originalQuery}</p>
                </div>

                {/* Main Response */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
                    {/* Response Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white">AI Assistant</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* TTS Controls */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleTTS}
                                    className={`p-2 rounded-lg transition-colors ${isSpeaking ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'}`}
                                    title={isSpeaking ? 'Stop' : 'Listen to response'}
                                >
                                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                                {isSpeaking && (
                                    <button
                                        onClick={handlePauseResume}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                                        title={isPaused ? 'Resume' : 'Pause'}
                                    >
                                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                    </button>
                                )}
                                {isSpeaking && currentLanguage && (
                                    <span className="text-xs text-gray-400 px-1">
                                        {currentLanguage === 'hi' ? '🇮🇳 Hindi' : '🇬🇧 English'}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Copy response"
                            >
                                {copied ? <Check className="w-4 h-4 text-secondary-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                            </button>
                        </div>
                    </div>

                    {/* Response Content - Using MarkdownRenderer */}
                    <div className="p-6">
                        {isError ? (
                            <div className="text-center py-4">
                                <AlertCircle className="w-12 h-12 text-accent-500 mx-auto mb-3" />
                                <p className="text-accent-600 dark:text-accent-400 font-medium mb-2">
                                    Connection Error
                                </p>
                                <p className="text-gray-500 text-sm mb-4">
                                    {content || 'Unable to connect to AI service. Please check your internet connection and try again.'}
                                </p>
                                <Link
                                    to="/teacher/ask-question"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Try Again
                                </Link>
                            </div>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                <MarkdownRenderer content={content || 'No response content available.'} />
                            </div>
                        )}
                    </div>

                    {/* Key Points */}
                    {keyPoints.length > 0 && (
                        <div className="px-6 pb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-warning-500" />
                                Key Points
                            </h3>
                            <div className="space-y-2">
                                {keyPoints.map((point, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <CheckCircle className="w-4 h-4 text-secondary-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{point}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Implementation Steps */}
                    {implementationSteps.length > 0 && (
                        <div className="px-6 pb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-primary-500" />
                                Implementation Guide
                            </h3>
                            <div className="space-y-3">
                                {implementationSteps.map((step, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                            {idx + 1}
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Related Resources */}
                    {resources.length > 0 && (
                        <div className="px-6 pb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-secondary-500" />
                                Related Resources
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {resources.map((resource, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-3 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg text-secondary-700 dark:text-secondary-400 text-sm cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-900/30 transition-colors">
                                        <BookOpen className="w-4 h-4" />
                                        <span>{resource.title}</span>
                                        <ChevronRight className="w-3 h-3 ml-auto" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Topic-Based Action Buttons - Only show for topic-based queries */}
                    {isTopicBased && !isError && (
                        <div className="px-6 pb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <Bot className="w-4 h-4 text-purple-500" />
                                Quick Actions
                            </h3>

                            {actionError && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                    {actionError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                    onClick={handleGenerateQuiz}
                                    disabled={loadingQuiz}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                                >
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        {loadingQuiz ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileQuestion className="w-5 h-5" />}
                                    </div>
                                    <div className="text-left">
                                        <span className="font-semibold text-sm">Generate Quiz</span>
                                        <p className="text-xs text-white/70">Create assessment</p>
                                    </div>
                                </button>

                                <button
                                    onClick={handleGenerateTLM}
                                    disabled={loadingTLM}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50"
                                >
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        {loadingTLM ? <Loader2 className="w-5 h-5 animate-spin" /> : <Palette className="w-5 h-5" />}
                                    </div>
                                    <div className="text-left">
                                        <span className="font-semibold text-sm">Design TLM</span>
                                        <p className="text-xs text-white/70">Visual aids</p>
                                    </div>
                                </button>

                                <button
                                    onClick={handleAudit}
                                    disabled={loadingAudit}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                                >
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        {loadingAudit ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                    </div>
                                    <div className="text-left">
                                        <span className="font-semibold text-sm">NCERT Audit</span>
                                        <p className="text-xs text-white/70">Check compliance</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Generated Quiz Display */}
                    {generatedQuiz && (
                        <div className="px-6 pb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <FileQuestion className="w-4 h-4 text-purple-500" />
                                Generated Quiz
                            </h3>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 space-y-4">
                                {generatedQuiz.questions?.map((q: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                        <p className="font-medium text-gray-900 dark:text-white mb-2">
                                            {idx + 1}. {q.question}
                                        </p>
                                        {q.options && (
                                            <ul className="space-y-1 ml-4">
                                                {q.options.map((opt: string, optIdx: number) => (
                                                    <li key={optIdx} className="text-sm text-gray-600 dark:text-gray-400">
                                                        {String.fromCharCode(65 + optIdx)}. {opt}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Generated TLM Display */}
                    {generatedTLM && (
                        <div className="px-6 pb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Palette className="w-4 h-4 text-pink-500" />
                                Teaching Learning Material
                            </h3>
                            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4">
                                <MarkdownRenderer content={generatedTLM.diy_workshop || generatedTLM.description || JSON.stringify(generatedTLM, null, 2)} />
                            </div>
                        </div>
                    )}

                    {/* Audit Result Display */}
                    {auditResult && (
                        <div className="px-6 pb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-green-500" />
                                NCERT Compliance Audit
                            </h3>
                            <div className={`rounded-xl p-4 ${auditResult.is_compliant ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-3 h-3 rounded-full ${auditResult.is_compliant ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                    <span className={`font-semibold ${auditResult.is_compliant ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                                        {auditResult.is_compliant ? 'NCERT Compliant' : 'Needs Review'}
                                    </span>
                                    {auditResult.compliance_score && (
                                        <span className="text-sm text-gray-500 ml-auto">
                                            Score: {auditResult.compliance_score}%
                                        </span>
                                    )}
                                </div>
                                {auditResult.feedback && (
                                    <MarkdownRenderer content={auditResult.feedback} />
                                )}
                                {auditResult.suggestions && auditResult.suggestions.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Suggestions:</p>
                                        <ul className="space-y-1">
                                            {auditResult.suggestions.map((s: string, idx: number) => (
                                                <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                                    <span className="text-yellow-500">•</span> {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Feedback Section */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Was this helpful?</span>
                                <button
                                    onClick={() => handleFeedback('helpful')}
                                    className={`p-2 rounded-lg transition-colors ${feedback === 'helpful'
                                        ? 'bg-secondary-100 text-secondary-600'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
                                        }`}
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleFeedback('not_helpful')}
                                    className={`p-2 rounded-lg transition-colors ${feedback === 'not_helpful'
                                        ? 'bg-accent-100 text-accent-600'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
                                        }`}
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSave}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${isSaved
                                        ? 'bg-warning-100 text-warning-600'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                                    {isSaved ? 'Saved' : 'Save'}
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share with Mentor
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        to="/teacher/ask-question"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Ask Another Question
                    </Link>
                    <Link
                        to="/teacher"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
