import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
    Calendar
} from 'lucide-react'
import { feedbackApi } from '../../services/api'

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

export default function FeedbackInbox() {
    const [requests, setRequests] = useState<FeedbackRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedRequest, setSelectedRequest] = useState<FeedbackRequest | null>(null)
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [additionalNotes, setAdditionalNotes] = useState('')

    useEffect(() => {
        fetchFeedbackRequests()
    }, [])

    const fetchFeedbackRequests = async () => {
        try {
            const data = await feedbackApi.getInbox()
            setRequests(data)
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch feedback requests')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitFeedback = async () => {
        if (!selectedRequest) return

        // Validate required answers
        const unanswered = selectedRequest.questions.filter(
            (q, idx) => q.required && !answers[idx]
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
                answers: Object.entries(answers).map(([idx, answer]) => ({
                    question_index: parseInt(idx),
                    answer
                })),
                additional_notes: additionalNotes || undefined
            })

            // Remove from list and close modal
            setRequests(prev => prev.filter(r => r.id !== selectedRequest.id))
            setSelectedRequest(null)
            setAnswers({})
            setAdditionalNotes('')
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to submit feedback')
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
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
        return days
    }

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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Feedback Inbox
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Respond to feedback requests from your mentors
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium">
                            {requests.length} pending
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Request List */}
                {requests.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            All caught up!
                        </h3>
                        <p className="text-gray-500">
                            You have no pending feedback requests.
                        </p>
                        <Link
                            to="/teacher"
                            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            Back to Dashboard
                        </Link>
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

            {/* Feedback Response Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {selectedRequest.title}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    From: {selectedRequest.requester_name}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedRequest(null)
                                    setAnswers({})
                                    setAdditionalNotes('')
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto max-h-[60vh]">
                            {selectedRequest.description && (
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    {selectedRequest.description}
                                </p>
                            )}

                            <div className="space-y-6">
                                {selectedRequest.questions.map((question, idx) => (
                                    <div key={idx}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {question.text}
                                            {question.required && (
                                                <span className="text-red-500 ml-1">*</span>
                                            )}
                                        </label>

                                        {question.type === 'text' && (
                                            <textarea
                                                value={answers[idx] || ''}
                                                onChange={(e) => setAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
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
                                                        onClick={() => setAnswers(prev => ({ ...prev, [idx]: String(rating) }))}
                                                        className={`w-12 h-12 rounded-lg border-2 font-semibold transition-all ${answers[idx] === String(rating)
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
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${answers[idx] === option
                                                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-600'
                                                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`question-${idx}`}
                                                            value={option}
                                                            checked={answers[idx] === option}
                                                            onChange={() => setAnswers(prev => ({ ...prev, [idx]: option }))}
                                                            className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                                                        />
                                                        <span className="text-gray-700 dark:text-gray-300">{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Additional Notes */}
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

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <button
                                onClick={() => {
                                    setSelectedRequest(null)
                                    setAnswers({})
                                    setAdditionalNotes('')
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
        </div>
    )
}
