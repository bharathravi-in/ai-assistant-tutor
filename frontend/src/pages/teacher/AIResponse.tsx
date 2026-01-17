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
    Sparkles,
    ClipboardList,
    BookOpen,
    Volume2,
    RefreshCw,
    MessageSquare,
    AlertCircle,
    CheckCircle,
    Lightbulb,
    ChevronRight
} from 'lucide-react'

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
    }
    originalQuery: string
    mode: string
    grade?: number
    subject?: string
}

export default function AIResponse() {
    const location = useLocation()
    const navigate = useNavigate()
    const state = location.state as ResponseState | null

    const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null)
    const [copied, setCopied] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

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

    const speakResponse = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(content)
            utterance.lang = 'en-IN'
            window.speechSynthesis.speak(utterance)
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
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white">AI Assistant</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={speakResponse}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Listen to response"
                            >
                                <Volume2 className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                                onClick={handleCopy}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Copy response"
                            >
                                {copied ? <Check className="w-4 h-4 text-secondary-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                            </button>
                        </div>
                    </div>

                    {/* Response Content */}
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
                            <div className="prose prose-gray dark:prose-invert max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {content || 'No response content available.'}
                                </p>
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
