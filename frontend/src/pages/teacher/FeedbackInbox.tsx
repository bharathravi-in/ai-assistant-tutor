import { useState, useEffect } from 'react'
import {
    MessageSquare,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    User,
    Send,
    Loader2,
    X,
    Calendar,
    ClipboardList,
    Inbox
} from 'lucide-react'
import { feedbackApi, surveyApi } from '../../services/api'

// Types
interface FeedbackQuestion {
    text: string
    type: string
    options?: string[]
    required: boolean
}

interface FeedbackRequest {
    id: number
    requester_id: number
    requester_name: string
    title: string
    description: string | null
    questions: FeedbackQuestion[]
    status: string
    due_date: string | null
    created_at: string
}

interface Survey {
    id: number
    title: string
    description: string | null
    questions: SurveyQuestion[]
    status: string
    created_at: string
}

interface SurveyQuestion {
    question: string
    type: 'text' | 'rating' | 'single_choice' | 'multi_choice'
    options?: string[]
    required: boolean
}

type TabType = 'feedback' | 'surveys'

export default function FeedbackInbox() {
    const [activeTab, setActiveTab] = useState<TabType>('feedback')

    // Feedback state
    const [requests, setRequests] = useState<FeedbackRequest[]>([])
    const [feedbackLoading, setFeedbackLoading] = useState(true)
    const [selectedRequest, setSelectedRequest] = useState<FeedbackRequest | null>(null)
    const [feedbackAnswers, setFeedbackAnswers] = useState<Record<number, string>>({})
    const [additionalNotes, setAdditionalNotes] = useState('')

    // Survey state
    const [surveys, setSurveys] = useState<Survey[]>([])
    const [surveyLoading, setSurveyLoading] = useState(true)
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
    const [surveyAnswers, setSurveyAnswers] = useState<Record<number, any>>({})

    // Common state
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    useEffect(() => {
        fetchFeedbackRequests()
        fetchSurveys()
    }, [])

    const fetchFeedbackRequests = async () => {
        try {
            const data = await feedbackApi.getInbox()
            setRequests(data)
        } catch (err: any) {
            console.error('Failed to fetch feedback:', err)
        } finally {
            setFeedbackLoading(false)
        }
    }

    const fetchSurveys = async () => {
        try {
            const data = await surveyApi.getAssigned()
            setSurveys(Array.isArray(data) ? data : (data.items || []))
        } catch (err: any) {
            console.error('Failed to fetch surveys:', err)
        } finally {
            setSurveyLoading(false)
        }
    }

    const handleSubmitFeedback = async () => {
        if (!selectedRequest) return

        // Validate required answers
        const unanswered = selectedRequest.questions.filter(
            (q, idx) => q.required && !feedbackAnswers[idx]
        )
        if (unanswered.length > 0) {
            setError('Please answer all required questions')
            return
        }

        setSubmitting(true)
        setError('')

        try {
            await feedbackApi.submitResponse({
                request_id: selectedRequest.id,
                answers: Object.entries(feedbackAnswers).map(([idx, answer]) => ({
                    question_index: parseInt(idx),
                    answer
                })),
                additional_notes: additionalNotes || undefined
            })

            setRequests(prev => prev.filter(r => r.id !== selectedRequest.id))
            setSelectedRequest(null)
            setFeedbackAnswers({})
            setAdditionalNotes('')
            setSuccessMessage('Feedback submitted successfully!')
            setTimeout(() => setSuccessMessage(''), 3000)
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to submit feedback')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSubmitSurvey = async () => {
        if (!selectedSurvey) return
        setSubmitting(true)
        setError('')

        try {
            const answersArray = Object.entries(surveyAnswers).map(([idx, answer]) => ({
                question_index: parseInt(idx),
                answer: typeof answer === 'object' ? JSON.stringify(answer) : String(answer)
            }))
            await surveyApi.submitResponse({
                survey_id: selectedSurvey.id,
                answers: answersArray
            })
            setSelectedSurvey(null)
            setSurveyAnswers({})
            fetchSurveys()
            setSuccessMessage('Survey submitted successfully!')
            setTimeout(() => setSuccessMessage(''), 3000)
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to submit survey')
        } finally {
            setSubmitting(false)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const getDaysUntilDue = (dueDate: string | null) => {
        if (!dueDate) return null
        const diff = new Date(dueDate).getTime() - Date.now()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    const loading = activeTab === 'feedback' ? feedbackLoading : surveyLoading
    const totalPending = requests.length + surveys.length

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                                <Inbox className="w-6 h-6" />
                            </div>
                            Feedback
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Respond to feedback requests and surveys from your mentors
                        </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium text-sm">
                        {totalPending} pending
                    </span>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('feedback')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${activeTab === 'feedback'
                            ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        CRP Feedback
                        {requests.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600">
                                {requests.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('surveys')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${activeTab === 'surveys'
                            ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                    >
                        <ClipboardList className="w-4 h-4" />
                        Surveys
                        {surveys.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-600">
                                {surveys.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* CRP Feedback Tab Content */}
                {activeTab === 'feedback' && (
                    <div>
                        {requests.length === 0 ? (
                            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    All caught up!
                                </h3>
                                <p className="text-gray-500">No pending feedback requests.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {requests.map((request) => {
                                    const daysUntilDue = getDaysUntilDue(request.due_date)
                                    const isUrgent = daysUntilDue !== null && daysUntilDue <= 2

                                    return (
                                        <button
                                            key={request.id}
                                            onClick={() => setSelectedRequest(request)}
                                            className="w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg transition-all duration-200 group"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                            <MessageSquare className="w-4 h-4" />
                                                        </div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {request.title}
                                                        </h3>
                                                        {isUrgent && (
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                                                                Urgent
                                                            </span>
                                                        )}
                                                    </div>
                                                    {request.description && (
                                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                                                            {request.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            From: {request.requester_name}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDate(request.created_at)}
                                                        </span>
                                                        {request.due_date && (
                                                            <span className={`flex items-center gap-1 ${isUrgent ? 'text-red-500 font-medium' : ''}`}>
                                                                <Calendar className="w-3 h-3" />
                                                                Due: {formatDate(request.due_date)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Surveys Tab Content */}
                {activeTab === 'surveys' && (
                    <div>
                        {surveys.length === 0 ? (
                            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    No pending surveys
                                </h3>
                                <p className="text-gray-500">Surveys assigned by your CRP/ARP will appear here.</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {surveys.map((survey) => (
                                        <div
                                            key={survey.id}
                                            onClick={() => setSelectedSurvey(survey)}
                                            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                                        <ClipboardList className="w-5 h-5 text-orange-600" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                            {survey.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>{formatDate(survey.created_at)}</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span>{survey.questions?.length || 0} questions</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                                        Pending
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Feedback Response Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {selectedRequest.title}
                                </h2>
                                <p className="text-sm text-gray-500">From: {selectedRequest.requester_name}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedRequest(null)
                                    setFeedbackAnswers({})
                                    setAdditionalNotes('')
                                    setError('')
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto max-h-[60vh]">
                            {selectedRequest.description && (
                                <p className="text-gray-600 dark:text-gray-400 mb-6">{selectedRequest.description}</p>
                            )}

                            <div className="space-y-6">
                                {selectedRequest.questions.map((question, idx) => (
                                    <div key={idx}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {question.text}
                                            {question.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>

                                        {question.type === 'text' && (
                                            <textarea
                                                value={feedbackAnswers[idx] || ''}
                                                onChange={(e) => setFeedbackAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                                                rows={3}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                placeholder="Type your response..."
                                            />
                                        )}

                                        {question.type === 'rating' && (
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((rating) => (
                                                    <button
                                                        key={rating}
                                                        type="button"
                                                        onClick={() => setFeedbackAnswers(prev => ({ ...prev, [idx]: String(rating) }))}
                                                        className={`w-12 h-12 rounded-lg border-2 font-semibold transition-all ${feedbackAnswers[idx] === String(rating)
                                                            ? 'bg-primary-500 border-primary-500 text-white'
                                                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary-300'
                                                            }`}
                                                    >
                                                        {rating}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {(question.type === 'single_choice' || question.type === 'choice') && question.options && (
                                            <div className="space-y-2">
                                                {question.options.map((option, optIdx) => (
                                                    <label
                                                        key={optIdx}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${feedbackAnswers[idx] === option
                                                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-600'
                                                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`question-${idx}`}
                                                            value={option}
                                                            checked={feedbackAnswers[idx] === option}
                                                            onChange={() => setFeedbackAnswers(prev => ({ ...prev, [idx]: option }))}
                                                            className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                                                        />
                                                        <span className="text-gray-700 dark:text-gray-300">{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Additional Notes (Optional)
                                    </label>
                                    <textarea
                                        value={additionalNotes}
                                        onChange={(e) => setAdditionalNotes(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Any additional comments..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <button
                                onClick={() => {
                                    setSelectedRequest(null)
                                    setFeedbackAnswers({})
                                    setAdditionalNotes('')
                                    setError('')
                                }}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitFeedback}
                                disabled={submitting}
                                className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Submit Feedback
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Survey Response Modal */}
            {selectedSurvey && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6">
                            <button
                                onClick={() => {
                                    setSelectedSurvey(null)
                                    setSurveyAnswers({})
                                    setError('')
                                }}
                                className="text-white/70 hover:text-white text-sm mb-2 flex items-center gap-1"
                            >
                                ← Back to surveys
                            </button>
                            <h1 className="text-2xl font-bold text-white">{selectedSurvey.title}</h1>
                            {selectedSurvey.description && (
                                <p className="text-white/70 mt-1">{selectedSurvey.description}</p>
                            )}
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto max-h-[50vh]">
                            {selectedSurvey.questions.map((q, idx) => (
                                <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                                            {idx + 1}
                                        </span>
                                        <p className="font-medium text-gray-800 dark:text-white">
                                            {q.question}
                                            {q.required && <span className="text-red-500 ml-1">*</span>}
                                        </p>
                                    </div>

                                    {q.type === 'text' && (
                                        <textarea
                                            value={surveyAnswers[idx] || ''}
                                            onChange={(e) => setSurveyAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none"
                                            placeholder="Type your answer..."
                                            rows={3}
                                        />
                                    )}

                                    {q.type === 'rating' && (
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => setSurveyAnswers(prev => ({ ...prev, [idx]: n }))}
                                                    className={`w-12 h-12 rounded-xl font-bold transition-all ${surveyAnswers[idx] === n
                                                        ? 'bg-primary-500 text-white'
                                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-300'
                                                        }`}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === 'single_choice' && q.options && (
                                        <div className="space-y-2">
                                            {q.options.map((opt, optIdx) => (
                                                <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-primary-300 transition-colors">
                                                    <input
                                                        type="radio"
                                                        name={`survey-question-${idx}`}
                                                        checked={surveyAnswers[idx] === opt}
                                                        onChange={() => setSurveyAnswers(prev => ({ ...prev, [idx]: opt }))}
                                                        className="w-4 h-4 text-primary-500"
                                                    />
                                                    <span className="text-gray-700 dark:text-gray-300">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === 'multi_choice' && q.options && (
                                        <div className="space-y-2">
                                            {q.options.map((opt, optIdx) => (
                                                <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-primary-300 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={(surveyAnswers[idx] || []).includes(opt)}
                                                        onChange={(e) => {
                                                            const current = surveyAnswers[idx] || []
                                                            if (e.target.checked) {
                                                                setSurveyAnswers(prev => ({ ...prev, [idx]: [...current, opt] }))
                                                            } else {
                                                                setSurveyAnswers(prev => ({ ...prev, [idx]: current.filter((v: string) => v !== opt) }))
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded text-primary-500"
                                                    />
                                                    <span className="text-gray-700 dark:text-gray-300">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={handleSubmitSurvey}
                                disabled={submitting}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Submit Survey
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
